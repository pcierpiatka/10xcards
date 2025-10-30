import Link from "next/link";
import { createClient } from "@/lib/db/supabase.server";
import { UserMenu } from "./UserMenu";
import { Button } from "@/components/ui/button";

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
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold text-xl">10xCards</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-4">
          {session ? (
            // Authenticated state
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium hover:underline"
              >
                Dashboard
              </Link>
              <UserMenu email={session.user.email || "User"} />
            </>
          ) : (
            // Unauthenticated state
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Zaloguj się</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Zarejestruj się</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
