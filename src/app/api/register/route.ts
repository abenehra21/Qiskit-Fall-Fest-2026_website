import { NextResponse } from "next/server";
import { registerAttendee } from "@/app/actions/register";
import { RegistrationFormData } from "@/types";

/**
 * Public REST API Route Handler for attendees/external clients:
 * POST /api/register
 * 
 * Reuses the core registerAttendee Server Action logic.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<RegistrationFormData>;
    const result = await registerAttendee(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode || 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        ticketId: result.ticketId,
        referralCode: result.referralCode,
        message: result.message,
      },
      { status: result.statusCode || 201 }
    );
  } catch (err) {
    console.error("API /api/register error:", err);
    return NextResponse.json(
      { error: "Invalid JSON payload or malformed request." },
      { status: 400 }
    );
  }
}
