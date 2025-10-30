import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ustaw nowe hasło | 10xCards",
  description: "Ustaw nowe hasło dla swojego konta 10xCards",
};

/**
 * Update password page (password reset flow)
 * Route: /update-password
 *
 * This page requires an access_token in the URL hash
 * (provided by Supabase password reset email)
 */
export default function UpdatePasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <UpdatePasswordForm />
    </div>
  );
}
