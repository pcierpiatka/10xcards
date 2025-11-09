import { LoginForm } from "@/components/auth/LoginForm";
import { isFeatureEnabled } from "@/lib/features";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Logowanie | 10xCards",
  description: "Zaloguj się do swojego konta 10xCards",
};

/**
 * Login page
 * Route: /login
 *
 * Protected by feature flag: auth.login
 * Returns 404 if feature is disabled
 */
export default function LoginPage() {
  // Feature flag guard - return 404 if login is disabled
  if (!isFeatureEnabled("auth.login")) {
    notFound();
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <LoginForm />
    </div>
  );
}
