"use server";

import crypto from "node:crypto";
import { getDb, hasDatabase } from "@/lib/db";
import { RegistrationFormData, RegistrationActionResult } from "@/types";

function generateTicketId(): string {
  // Generates a readable 6-character hex code, e.g. "QFF-9A4F2C"
  const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `QFF-${randomHex}`;
}

function generateReferralCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const chars: string[] = [];

  for (let i = 0; i < 8; i += 1) {
    chars.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
  }

  return `QFF${chars.join("")}`;
}

async function generateUniqueReferralCode(sql: ReturnType<typeof getDb>): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const referralCode = generateReferralCode();
    const matches = await sql`
      SELECT 1
      FROM registrations
      WHERE referral_code = ${referralCode}
      LIMIT 1;
    `;

    if (matches.length === 0) {
      return referralCode;
    }
  }

  throw new Error("Unable to generate a unique referral code after several attempts.");
}

/**
 * Server Action: Validates and writes attendee registration directly into Neon PostgreSQL.
 */
export async function registerAttendee(
  payload: Partial<RegistrationFormData>
): Promise<RegistrationActionResult> {
  try {
    // Preview builds ship without a Neon connection string. Say so plainly
    // rather than surfacing a raw "DATABASE_URL is missing" to the visitor —
    // that reads as a crash, not as a deliberately unwired preview.
    if (!hasDatabase()) {
      return {
        success: false,
        error:
          "This is a preview build — registration isn't wired up to a database yet, so nothing was saved.",
        statusCode: 503,
      };
    }

    // 1. Validate required fields
    const fullName = payload.fullName?.trim();
    const email = payload.email?.trim().toLowerCase();
    const phone = payload.phone?.trim();
    const institution = payload.institution?.trim();
    const attendanceMode = payload.attendanceMode;
    const agreedToTerms = payload.agreedToTerms;

    if (!fullName) {
      return { success: false, error: "Full name is required.", statusCode: 400 };
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: "A valid email address is required.", statusCode: 400 };
    }

    if (!phone) {
      return { success: false, error: "Contact phone number is required.", statusCode: 400 };
    }

    if (!institution) {
      return { success: false, error: "Institution / university name is required.", statusCode: 400 };
    }

    if (!attendanceMode || !["offline", "online"].includes(attendanceMode)) {
      return {
        success: false,
        error: "Please select a valid attendance mode (offline or online).",
        statusCode: 400,
      };
    }

    if (!agreedToTerms) {
      return {
        success: false,
        error: "You must agree to the Code of Conduct to register.",
        statusCode: 400,
      };
    }

    // 2. Normalize optional fields (empty strings to SQL nulls)
    const studyLevel = payload.studyLevel?.trim() || null;
    const graduationYear = payload.graduationYear?.trim() || null;
    const quantumExperience = payload.quantumExperience?.trim() || "beginner";
    const interests = Array.isArray(payload.interests) ? payload.interests : [];
    const githubUrl = payload.githubUrl?.trim() || null;
    const linkedinUrl = payload.linkedinUrl?.trim() || null;
    const tshirtSize = payload.tshirtSize?.trim() || "M (38\")";
    const referredByCode = payload.referredByCode?.trim().toUpperCase() || null;

    const sql = getDb();

    if (referredByCode) {
      if (!/^[A-Z0-9]{6,20}$/.test(referredByCode)) {
        return {
          success: false,
          error: "Referral code must be 6-20 letters and numbers only.",
          statusCode: 400,
        };
      }

      const referrerMatch = await sql`
        SELECT id
        FROM registrations
        WHERE referral_code = ${referredByCode}
        LIMIT 1;
      `;

      if (referrerMatch.length === 0) {
        return {
          success: false,
          error: "That referral code is invalid or not yet registered.",
          statusCode: 400,
        };
      }
    }

    const ticketId = generateTicketId();

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const referralCode = await generateUniqueReferralCode(sql);

      try {
        // 3. Connect to Neon and insert record in a single transaction.
        const results = await sql.transaction((tx) => {
          const queries = [
            tx`
              INSERT INTO registrations (
                ticket_id,
                full_name,
                email,
                phone,
                institution,
                study_level,
                graduation_year,
                attendance_mode,
                quantum_experience,
                interests,
                github_url,
                linkedin_url,
                tshirt_size,
                referral_code,
                referred_by,
                agreed_to_terms
              ) VALUES (
                ${ticketId},
                ${fullName},
                ${email},
                ${phone},
                ${institution},
                ${studyLevel},
                ${graduationYear},
                ${attendanceMode},
                ${quantumExperience},
                ${interests},
                ${githubUrl},
                ${linkedinUrl},
                ${tshirtSize},
                ${referralCode},
                ${referredByCode},
                ${Boolean(agreedToTerms)}
              )
              RETURNING id, ticket_id, email, created_at;
            `,
          ];

          if (referredByCode) {
            queries.push(
              tx`
                UPDATE registrations
                SET referral_count = referral_count + 1
                WHERE referral_code = ${referredByCode};
              `
            );
          }

          return queries;
        });

        const inserted = results[0][0] as {
          ticket_id: string;
        };

        return {
          success: true,
          ticketId: inserted.ticket_id,
          referralCode,
          message: "Registration successfully recorded in database.",
          statusCode: 201,
        };
      } catch (err: unknown) {
        const pgError = err as { code?: string; constraint?: string; message?: string };

        // Only retry when the collision is specifically on the generated
        // referral code — a duplicate email/ticket ID is a real conflict
        // that should surface immediately, not be retried into a
        // misleading "referral code" error.
        if (pgError?.code === "23505" && pgError?.constraint?.includes("referral_code")) {
          continue;
        }

        throw err;
      }
    }

    throw new Error("Unable to generate and store a unique referral code after several attempts.");
  } catch (err: unknown) {
    const pgError = err as { code?: string; constraint?: string; message?: string };

    // PostgreSQL Unique Constraint Violation (duplicate email or ticketId)
    if (pgError?.code === "23505") {
      return {
        success: false,
        error: "This email address has already been registered for BITS Qiskit Fall Fest 2026.",
        statusCode: 409,
      };
    }

    console.error("Neon database registration error:", err);
    return {
      success: false,
      error: "Unable to store registration in database. Please check connection and try again.",
      statusCode: 500,
    };
  }
}
