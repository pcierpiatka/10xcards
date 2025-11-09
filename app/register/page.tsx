import { RegisterForm } from "@/components/auth/RegisterForm";
import { isFeatureEnabled } from "@/lib/features";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rejestracja | 10xCards",
  description: "Utwórz nowe konto 10xCards",
};

/**
 * Registration page
 * Route: /register
 *
 * Protected by feature flag: auth.register
 * Returns 404 if feature is disabled
 */
export default function RegisterPage() {
  // Feature flag guard - return 404 if registration is disabled
  if (!isFeatureEnabled("auth.register")) {
    notFound();
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <RegisterForm />
    </div>
  );
}
