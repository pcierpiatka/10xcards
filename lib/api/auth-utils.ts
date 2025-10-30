import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/database.types";
import { ApiErrors } from "./error-responses";

/**
 * Creates a Supabase client for API route handlers
 * Note: We need to create a client here instead of using lib/db/supabase.server.ts
 * because API routes need synchronous access to cookies (not async)
 */
async function createSupabaseClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set(name, value, options);
        } catch {
          // Server Component can't set cookies
          // This is expected and handled by middleware
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set(name, "", options);
        } catch {
          // Server Component can't remove cookies
        }
      },
    },
  });
}

/**
 * Gets the currently authenticated user from the session
 * Returns null if no valid session exists
 *
 * @example
 * const user = await getAuthenticatedUser();
 * if (!user) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  const supabase = await createSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.user ?? null;
}

/**
 * Requires authentication - throws ApiError if user is not logged in
 * Use this at the beginning of protected API routes
 *
 * @throws {ApiError} 401 Unauthorized if no valid session
 *
 * @example
 * export async function GET(request: NextRequest) {
 *   const user = await requireAuth();
 *   // user is guaranteed to exist here
 *   const flashcards = await getFlashcardsForUser(user.id);
 *   return NextResponse.json({ flashcards });
 * }
 */
export async function requireAuth(): Promise<User> {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw ApiErrors.Unauthorized;
  }

  return user;
}
