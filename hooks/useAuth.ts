"use client";

import { useState } from "react";
import { createClient } from "@/lib/db/supabase.client";

/**
 * Custom hook for authentication operations
 * Provides client-side auth functions with loading and error states
 */
export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Login with email and password
   * On success, redirects to /dashboard
   */
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Błąd logowania");
        return false;
      }

      const data = await response.json();

      // Set session on client side using browser Supabase client
      const supabase = createClient();
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token || data.session.access_token,
      });

      if (sessionError) {
        console.error("Failed to set session:", sessionError);
        setError("Błąd ustawiania sesji");
        return false;
      }

      // Success - cookies are already written by setSession()
      // Use full page reload to ensure layout/server components get the new session
      window.location.href = "/dashboard";
      return true;
    } catch {
      setError("Wystąpił błąd sieci. Sprawdź połączenie.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Register new user with email and password
   * On success, automatically logs in and redirects to /dashboard
   */
  const register = async (
    email: string,
    password: string,
    confirmPassword: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, confirmPassword }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Błąd rejestracji");
        return false;
      }

      const data = await response.json();

      // Set session on client side
      const supabase = createClient();
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      if (sessionError) {
        console.error("Failed to set session:", sessionError);
        setError("Błąd ustawiania sesji");
        return false;
      }

      // Success - cookies are already written by setSession()
      // Full page reload to ensure layout is refreshed with new session
      window.location.href = "/dashboard";
      return true;
    } catch {
      setError("Wystąpił błąd sieci. Sprawdź połączenie.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout current user
   * On success, redirects to /login
   */
  const logout = async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Sign out on client side to clear cookies
      const supabase = createClient();
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        setError("Błąd wylogowania");
        return false;
      }

      // Also call server endpoint (optional, for consistency)
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      // Success - redirect to login
      // Full page reload to ensure layout is refreshed (session cleared)
      window.location.href = "/login";
      return true;
    } catch {
      setError("Wystąpił błąd sieci. Sprawdź połączenie.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Request password reset email
   * Always returns success for security (even if email doesn't exist)
   */
  const resetPassword = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Błąd wysyłania e-maila");
        return false;
      }

      // Success
      return true;
    } catch {
      setError("Wystąpił błąd sieci. Sprawdź połączenie.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update user password (used in password reset flow)
   * Requires access token from reset email link
   * On success, redirects to /dashboard
   */
  const updatePassword = async (password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        return false;
      }

      // Success - redirect to dashboard
      // Full page reload to ensure layout is refreshed with new session
      window.location.href = "/dashboard";
      return true;
    } catch {
      setError("Wystąpił błąd podczas ustawiania hasła.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    register,
    logout,
    resetPassword,
    updatePassword,
    isLoading,
    error,
  };
}
