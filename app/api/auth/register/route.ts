import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase.server";
import { registerSchema } from "@/lib/validations/auth";
import { errorResponse, ApiErrors } from "@/lib/api/error-responses";

/**
 * POST /api/auth/register
 * Registers a new user with email and password
 *
 * Request body:
 *   - email: string (valid email format)
 *   - password: string (min 8 chars, must contain uppercase, lowercase, and digit)
 *   - confirmPassword: string (must match password)
 *
 * Response:
 *   - 201 Created: User registered and automatically logged in
 *   - 400 Bad Request: Validation error or email already taken
 *   - 500 Internal Server Error: Server error
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      throw ApiErrors.BadRequest(firstError.message);
    }

    const { email, password } = validation.data;

    // Create Supabase client
    const supabase = await createClient();

    // Sign up user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // In MVP, we don't require email confirmation
        // User is immediately logged in after registration
        emailRedirectTo: undefined,
      },
    });

    if (error) {
      // Handle specific Supabase errors
      if (
        error.message.includes("already registered") ||
        error.message.includes("already exists")
      ) {
        throw ApiErrors.BadRequest("Ten adres e-mail jest już zajęty");
      }
      throw ApiErrors.BadRequest(error.message);
    }

    if (!data.user || !data.session) {
      throw ApiErrors.InternalServerError;
    }

    // Return success response with session data
    return NextResponse.json(
      {
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}
