import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase.server";
import { passwordResetSchema } from "@/lib/validations/auth";
import { errorResponse, ApiErrors } from "@/lib/api/error-responses";

/**
 * POST /api/auth/password-reset
 * Initiates password reset flow by sending a reset email
 *
 * Request body:
 *   - email: string (valid email format)
 *
 * Response:
 *   - 200 OK: Email sent (or would have been sent if email exists)
 *   - 400 Bad Request: Validation error
 *   - 500 Internal Server Error: Server error
 *
 * Note: For security reasons, this endpoint always returns success,
 * even if the email doesn't exist in the database.
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = passwordResetSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      throw ApiErrors.BadRequest(firstError.message);
    }

    const { email } = validation.data;

    // Create Supabase client
    const supabase = await createClient();

    // Get app URL from environment
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/update-password`,
    });

    // For security, we don't expose if the email exists or not
    // Always return success message
    if (error) {
      console.error("Password reset error:", error);
      // Still return success to user
    }

    return NextResponse.json({
      message:
        "Jeśli konto istnieje, e-mail z linkiem do resetowania hasła został wysłany",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
