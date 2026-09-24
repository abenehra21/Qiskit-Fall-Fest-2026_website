"use server";

import crypto from "node:crypto";
import { getDb, hasDatabase } from "@/lib/db";
import { RegistrationFormData, RegistrationActionResult } from "@/types";
import { clientIp, rateLimit, sweepRateLimits } from "@/lib/rate-limit";
import { experienceLevels, studyLevels, tshirtSizes } from "@/data/registration";
import {
  LIMITS,
  takeInterests,
  takeOption,
  takeText,
  takeUrl,
  type FieldError,
} from "@/lib/validation";

/** The choices the form actually offers; anything else is rejected. */
const ALLOWED_STUDY_LEVELS = studyLevels;
const ALLOWED_TSHIRT_SIZES = tshirtSizes;
const ALLOWED_EXPERIENCE = experienceLevels.map((level) => level.id);

/** Ten attempts per IP per hour: generous for a person, useless for a script. */
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function generateTicketId(): string {
  // Generates a readable 6-character hex code, e.g. "QFF-9A4F2C"
  const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `QFF-${randomHex}`;
}

function generateReferralCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const chars: string[] = [];

  // crypto.randomInt, not Math.random: a referral code is looked up, counted
  // against, and shared as an identifier, so it should not be predictable from
  // other codes issued nearby. The ticket ID above already uses the CSPRNG.
  for (let i = 0; i < 8; i += 1) {
    chars.push(alphabet[crypto.randomInt(alphabet.length)]);
  }

  return `QBITS${chars.join("")}`;
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

    // 1. Rate limit before anything else touches the database. Both the form
    //    (which calls this action directly) and POST /api/register arrive
    //    here, so this is the single place that covers both.
    const ip = await clientIp();
    const limit = await rateLimit(`register:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
    if (!limit.ok) {
      return {
        success: false,
        error: "Too many registration attempts from this network. Please try again later.",
        statusCode: 429,
        retryAfterSeconds: limit.retryAfterSeconds,
      };
    }
    void sweepRateLimits();

    // 2. Validate required fields. Every string is length-capped: the schema
    //    bounds most columns, but github_url, linkedin_url and interests are
    //    unbounded TEXT, so without a cap here one request can store an
    //    arbitrarily large row.
    const errors: FieldError[] = [];
    const fullName = takeText(payload.fullName, "Full name", LIMITS.fullName, errors);
    const rawEmail = takeText(payload.email, "Email", LIMITS.email, errors);
    const email = rawEmail?.toLowerCase();
    const phone = takeText(payload.phone, "Phone", LIMITS.phone, errors);
    const institution = takeText(payload.institution, "Institution", LIMITS.institution, errors);
    const attendanceMode = payload.attendanceMode;
    const agreedToTerms = payload.agreedToTerms;

    if (errors.length > 0) {
      return { success: false, error: errors[0].message, statusCode: 400 };
    }

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

    // 3. Normalize optional fields. Anything the form offers as a fixed choice
    //    is checked against that list, so a hand-rolled POST cannot write a
    //    value the organisers will later have to clean out of a CSV.
    const studyLevel = takeOption(payload.studyLevel, "Study level", ALLOWED_STUDY_LEVELS, errors);
    const graduationYear = takeText(
      payload.graduationYear,
      "Graduation year",
      LIMITS.graduationYear,
      errors,
    );
    const quantumExperience =
      takeOption(payload.quantumExperience, "Experience", ALLOWED_EXPERIENCE, errors) ?? "beginner";
    const interests = takeInterests(payload.interests, errors);
    const githubUrl = takeUrl(payload.githubUrl, "GitHub URL", errors);
    const linkedinUrl = takeUrl(payload.linkedinUrl, "LinkedIn URL", errors);
    const tshirtSize =
      takeOption(payload.tshirtSize, "T-shirt size", ALLOWED_TSHIRT_SIZES, errors) ?? "M (38\")";
    const referredByCode = takeText(
      payload.referredByCode,
      "Referral code",
      LIMITS.referralCode,
      errors,
    )?.toUpperCase() ?? null;
    const willingToBePOC = Boolean(payload.willingToBePOC);

    if (errors.length > 0) {
      return { success: false, error: errors[0].message, statusCode: 400 };
    }

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
                agreed_to_terms,
                willing_to_be_poc
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
                ${Boolean(agreedToTerms)},
                ${willingToBePOC}
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

    // Log the shape of the failure, never the payload. Driver errors can echo
    // the failing statement back with its parameter values, which for this
    // table means a registrant's name, email and phone in the log stream.
    console.error("Neon database registration error:", {
      code: pgError?.code,
      constraint: pgError?.constraint,
    });
    return {
      success: false,
      error: "Unable to store registration in database. Please check connection and try again.",
      statusCode: 500,
    };
  }
}
