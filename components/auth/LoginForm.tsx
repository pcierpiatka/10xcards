"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
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
 * Login form component
 * Handles user authentication with email and password
 */
export function LoginForm() {
  const { login, isLoading, error } = useAuth();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    await login(data.email, data.password);
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Zaloguj się</h1>
        <p className="text-muted-foreground">
          Wprowadź swój e-mail i hasło aby się zalogować
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
                    data-testid="login-email"
                    {...field}
                  />
                </FormControl>
                <FormMessage data-testid="login-email-error" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hasło</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    data-testid="login-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage data-testid="login-password-error" />
              </FormItem>
            )}
          />

          {error && (
            <div
              className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
              data-testid="login-error"
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            data-testid="login-submit"
          >
            {isLoading ? "Logowanie..." : "Zaloguj się"}
          </Button>
        </form>
      </Form>

      <div className="space-y-2 text-center text-sm">
        <Link
          href="/password-reset"
          className="text-muted-foreground hover:text-foreground underline"
          data-testid="login-reset-link"
        >
          Zapomniałeś hasła?
        </Link>
        <div>
          <span className="text-muted-foreground">Nie masz konta? </span>
          <Link
            href="/register"
            className="font-medium hover:underline"
            data-testid="login-register-link"
          >
            Zarejestruj się
          </Link>
        </div>
      </div>
    </div>
  );
}
