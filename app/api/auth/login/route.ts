import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase.server";
import { loginSchema } from "@/lib/validations/auth";
import { errorResponse, ApiErrors, ApiError } from "@/lib/api/error-responses";
import { requireFeature } from "@/lib/features";

/**
 * POST /api/auth/login
 * Authenticates a user with email and password
 *
 * Request body:
 *   - email: string
 *   - password: string
 *
 * Response:
 *   - 200 OK: User authenticated, session cookie set
 *   - 401 Unauthorized: Invalid credentials
 *   - 400 Bad Request: Validation error
 *   - 500 Internal Server Error: Server error
 */
export async function POST(request: NextRequest) {
  try {
    // 🛡️ Feature flag guard - check BEFORE any business logic
    const guardError = requireFeature("auth.login");
    if (guardError) return guardError;

    // Parse and validate request body
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      throw ApiErrors.BadRequest(firstError.message);
    }

    const { email, password } = validation.data;

    // Create Supabase client
    const supabase = await createClient();

    // Sign in with password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Generic error message for security (don't reveal if email exists)
      throw new ApiError(401, "Nieprawidłowy e-mail lub hasło");
    }

    if (!data.user || !data.session) {
      throw new ApiError(401, "Nieprawidłowy e-mail lub hasło");
    }

    // Return success response with session tokens
    // Client will set the session using setSession()
    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
