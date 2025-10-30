import { PasswordResetForm } from "@/components/auth/PasswordResetForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset hasła | 10xCards",
  description: "Zresetuj hasło do swojego konta 10xCards",
};

/**
 * Password reset page
 * Route: /password-reset
 */
export default function PasswordResetPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <PasswordResetForm />
    </div>
  );
}
