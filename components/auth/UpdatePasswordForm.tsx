"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
  updatePasswordSchema,
  type UpdatePasswordInput,
} from "@/lib/validations/auth";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

/**
 * Update password form component
 * Used in password reset flow (requires access token from email link)
 */
export function UpdatePasswordForm() {
  const { updatePassword, isLoading, error } = useAuth();
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  const form = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Check for access token in URL hash on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      setHasToken(!!accessToken);
    }
  }, []);

  const onSubmit = async (data: UpdatePasswordInput) => {
    await updatePassword(data.password);
  };

  // Loading state while checking for token
  if (hasToken === null) {
    return (
      <div className="w-full max-w-md space-y-6">
        <div className="text-center text-muted-foreground">Ładowanie...</div>
      </div>
    );
  }

  // No token found - show error
  if (!hasToken) {
    return (
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Błąd</h1>
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            Link do resetowania hasła jest nieprawidłowy lub wygasł.
          </div>
        </div>

        <div className="space-y-2 text-center text-sm">
          <Link
            href="/password-reset"
            className="font-medium hover:underline block"
          >
            Wyślij nowy link resetujący
          </Link>
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground underline block"
          >
            Wróć do logowania
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Ustaw nowe hasło</h1>
        <p className="text-muted-foreground">
          Wprowadź nowe hasło dla swojego konta
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nowe hasło</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Min. 8 znaków, wielka i mała litera, cyfra
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Potwierdź nowe hasło</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Ustawianie hasła..." : "Ustaw nowe hasło"}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        <Link
          href="/login"
          className="text-muted-foreground hover:text-foreground underline"
        >
          Wróć do logowania
        </Link>
      </div>
    </div>
  );
}
