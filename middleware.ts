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

  // Get session from cookies
  // NOTE: In middleware we can't use getUser() because it requires external fetch
  // which is not available in Edge Runtime. getSession() reads from cookies only.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log("[MIDDLEWARE]", {
    pathname: request.nextUrl.pathname,
    hasSession: !!session,
    userId: session?.user?.id,
  });

  // Route protection logic
  const { pathname } = request.nextUrl;

  // Define route categories
  const isAuthPage = [
    "/login",
    "/register",
    "/password-reset",
    "/update-password",
  ].some((path) => pathname.startsWith(path));
  const isProtectedPage = ["/dashboard", "/study", "/settings"].some((path) =>
    pathname.startsWith(path)
  );
  const isProtectedApi =
    pathname.startsWith("/api") &&
    !pathname.startsWith("/api/auth") &&
    !pathname.startsWith("/api/health");

  // Redirect logic
  // 1. Unauthenticated user trying to access protected route → redirect to /login
  if (!session && (isProtectedPage || isProtectedApi)) {
    console.log("[MIDDLEWARE] Redirecting to login:", pathname);
    const loginUrl = new URL("/login", request.url);
    // Store original URL to redirect back after login (optional for MVP)
    if (isProtectedPage) {
      loginUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated user trying to access auth page → redirect to /dashboard
  if (session && isAuthPage) {
    console.log("[MIDDLEWARE] Redirecting to dashboard from:", pathname);
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

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
