import Link from "next/link";
import { createClient } from "@/lib/db/supabase.server";
import { UserMenu } from "./UserMenu";
import { Button } from "@/components/ui/button";
import { FeatureFlag } from "@/lib/features";

/**
 * Global header component (Server Component)
 * Shows different content based on authentication state
 */
export async function GlobalHeader() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between">
        {/* Left side: Logo + Dashboard */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">10xCards</span>
          </Link>
          {session && (
            <Link
              href="/dashboard"
              className="text-sm font-medium hover:underline"
            >
              Dashboard
            </Link>
          )}
        </div>

        {/* Right side: User menu or Auth buttons */}
        <nav className="flex items-center gap-3">
          {session ? (
            // Authenticated state
            <>
              <span className="text-sm text-muted-foreground">
                {session.user.email}
              </span>
              <UserMenu email={session.user.email || "User"} />
            </>
          ) : (
            // Unauthenticated state
            <>
              <FeatureFlag name="auth.login">
                <Button variant="ghost" asChild>
                  <Link href="/login">Zaloguj się</Link>
                </Button>
              </FeatureFlag>
              <FeatureFlag name="auth.register">
                <Button asChild>
                  <Link href="/register">Zarejestruj się</Link>
                </Button>
              </FeatureFlag>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
