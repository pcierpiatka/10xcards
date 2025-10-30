import { LoginForm } from "@/components/auth/LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Logowanie | 10xCards",
  description: "Zaloguj się do swojego konta 10xCards",
};

/**
 * Login page
 * Route: /login
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <LoginForm />
    </div>
  );
}
