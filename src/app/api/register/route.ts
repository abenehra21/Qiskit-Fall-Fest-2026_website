import { NextResponse } from "next/server";
import { registerAttendee } from "@/app/actions/register";
import { MAX_BODY_BYTES } from "@/lib/validation";
import { RegistrationFormData } from "@/types";

/** Registrant data is never cacheable, and this route is never prerendered. */
export const dynamic = "force-dynamic";

/**
 * Public REST API Route Handler for attendees/external clients:
 * POST /api/register
 *
 * Reuses the core registerAttendee Server Action logic, which is where
 * validation and rate limiting live — the form calls that action directly, so
 * putting them here instead would leave the form's path unguarded.
 *
 * This layer owns only what is specific to an HTTP request: the content type,
 * the body size, and the response shape.
 */
export async function POST(request: Request) {
  // Require a JSON content type. Without this check a cross-origin HTML form
  // can post here as text/plain, which browsers send with no CORS preflight.
  // Nothing authenticated is at stake, but it is free to close.
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return NextResponse.json(
      { error: "Content-Type must be application/json." },
      { status: 415 },
    );
  }

  // Reject an oversized body before it is parsed. The declared length is a
  // hint, so the actual bytes are measured too — a chunked request can omit
  // the header entirely.
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
  }

  let body: Partial<RegistrationFormData>;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
    }
    body = JSON.parse(raw) as Partial<RegistrationFormData>;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload or malformed request." },
      { status: 400 },
    );
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "Expected a JSON object." }, { status: 400 });
  }

  const result = await registerAttendee(body);

  if (!result.success) {
    const headers: Record<string, string> = {};
    if (result.statusCode === 429 && result.retryAfterSeconds) {
      headers["Retry-After"] = String(result.retryAfterSeconds);
    }
    return NextResponse.json(
      { error: result.error },
      { status: result.statusCode || 400, headers },
    );
  }

  return NextResponse.json(
    {
      success: true,
      ticketId: result.ticketId,
      referralCode: result.referralCode,
      message: result.message,
    },
    { status: result.statusCode || 201 },
  );
}
