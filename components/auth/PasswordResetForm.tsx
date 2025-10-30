"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
  passwordResetSchema,
  type PasswordResetInput,
} from "@/lib/validations/auth";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

/**
 * Password reset form component
 * Sends password reset email to user
 */
export function PasswordResetForm() {
  const { resetPassword, isLoading, error } = useAuth();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<PasswordResetInput>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: PasswordResetInput) => {
    const success = await resetPassword(data.email);
    if (success) {
      setIsSuccess(true);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">E-mail wysłany</h1>
          <div className="rounded-md bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
            Jeśli konto istnieje, wysłaliśmy e-mail z linkiem do resetowania
            hasła. Sprawdź swoją skrzynkę odbiorczą.
          </div>
        </div>

        <div className="text-center text-sm">
          <Link href="/login" className="font-medium hover:underline">
            Wróć do logowania
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Resetuj hasło</h1>
        <p className="text-muted-foreground">
          Podaj swój adres e-mail, a wyślemy Ci link do zresetowania hasła
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="twoj@email.com"
                    autoComplete="email"
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
            {isLoading ? "Wysyłanie..." : "Wyślij link resetujący"}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Pamiętasz hasło? </span>
        <Link href="/login" className="font-medium hover:underline">
          Zaloguj się
        </Link>
      </div>
    </div>
  );
}
