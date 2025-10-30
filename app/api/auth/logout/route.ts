import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/supabase.server";
import { errorResponse } from "@/lib/api/error-responses";

/**
 * POST /api/auth/logout
 * Signs out the current user and clears session cookies
 *
 * Response:
 *   - 204 No Content: Successfully logged out (or no active session)
 *   - 500 Internal Server Error: Server error
 *
 * Note: This endpoint always returns success, even if there's no active session.
 * This is intentional for security and simplicity.
 */
export async function POST() {
  try {
    const supabase = await createClient();

    // Sign out - this clears the session and removes cookies
    await supabase.auth.signOut();

    // Return 204 No Content (success with no body)
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
