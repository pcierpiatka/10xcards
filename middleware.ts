/**
 * Next.js Middleware for Supabase Auth
 *
 * This middleware runs on every request and:
 * 1. Refreshes the auth session if the token is expired
 * 2. Updates cookies with the fresh session token
 * 3. Ensures seamless authentication across server and client
 *
 * The middleware is essential for proper auth flow in Next.js App Router.
 * Without it, users would need to manually refresh the page to get a new session.
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        // Update request cookies
        request.cookies.set({
          name,
          value,
          ...options,
        });
        // Create new response with updated cookies
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        // Set cookie in response
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: CookieOptions) {
        // Remove from request cookies
        request.cookies.set({
          name,
          value: "",
          ...options,
        });
        // Create new response with removed cookies
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        // Remove from response cookies
        response.cookies.set({
          name,
          value: "",
          ...options,
        });
      },
    },
  });

  // Refresh session if expired - this automatically updates the cookies
  await supabase.auth.getSession();

  return response;
}

// Configure which routes the middleware should run on
// Exclude static files, images, and Next.js internals
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Images and other static assets (svg, png, jpg, jpeg, gif, webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
