import { RegisterForm } from "@/components/auth/RegisterForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rejestracja | 10xCards",
  description: "Utwórz nowe konto 10xCards",
};

/**
 * Registration page
 * Route: /register
 */
export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <RegisterForm />
    </div>
  );
}
