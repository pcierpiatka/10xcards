/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAuth } from "./useAuth";
import { server } from "@/lib/test-utils";
import { http, HttpResponse } from "msw";
import { createClient } from "@/lib/db/supabase.client";

/**
 * Integration tests for useAuth hook
 *
 * Tests the collaboration between hook state management and API calls.
 * Uses MSW to mock API responses and tests async flows.
 */

// Mock Supabase client
vi.mock("@/lib/db/supabase.client", () => ({
  createClient: vi.fn(() => ({
    auth: {
      setSession: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  })),
}));

// Mock window.location with proper base URL
const originalLocation = window.location;
delete (window as any).location;
window.location = {
  href: "http://localhost",
  origin: "http://localhost",
  protocol: "http:",
  host: "localhost",
  hostname: "localhost",
  port: "",
  pathname: "/",
  search: "",
  hash: "",
} as any;

describe("useAuth hook", () => {
  beforeEach(() => {
    window.location.href = "http://localhost";
    vi.clearAllMocks();
  });

  afterAll(() => {
    // @ts-expect-error - restoring original location type
    window.location = originalLocation;
  });

  describe("GIVEN login function", () => {
    describe("WHEN login with valid credentials", () => {
      it("THEN should set session and redirect to dashboard", async () => {
        // Arrange - Override MSW handler for this test
        server.use(
          http.post("http://localhost/api/auth/login", () => {
            return HttpResponse.json(
              {
                user: { id: "test-id", email: "test@example.com" },
                session: {
                  access_token: "mock-token",
                  refresh_token: "mock-refresh",
                },
              },
              { status: 200 }
            );
          })
        );

        const { result } = renderHook(() => useAuth());

        // Act - Call login
        const success = await result.current.login(
          "test@example.com",
          "TestPassword123"
        );

        // Assert - Login should succeed
        expect(success).toBe(true);

        // Assert - Should redirect to dashboard
        expect(window.location.href).toBe("/dashboard");

        // Assert - Should clear error
        expect(result.current.error).toBeNull();

        // Assert - Should stop loading
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });
      });
    });

    describe("WHEN login with invalid credentials", () => {
      it("THEN should return false and set error message", async () => {
        // Arrange - Override handler to return 401
        server.use(
          http.post("http://localhost/api/auth/login", () => {
            return HttpResponse.json(
              { error: "Nieprawidłowy e-mail lub hasło" },
              { status: 401 }
            );
          })
        );

        const { result } = renderHook(() => useAuth());

        // Act - Call login with invalid credentials
        const success = await result.current.login(
          "test@example.com",
          "WrongPassword"
        );

        // Assert - Login should fail
        expect(success).toBe(false);

        // Assert - Should display error message
        await waitFor(() => {
          expect(result.current.error).toBe("Nieprawidłowy e-mail lub hasło");
        });

        // Assert - Should not redirect
        expect(window.location.href).toBe("http://localhost");

        // Assert - Should stop loading
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });
      });
    });

    describe("WHEN network error occurs", () => {
      it("THEN should return false and set network error message", async () => {
        // Arrange - Override handler to throw network error
        server.use(
          http.post("http://localhost/api/auth/login", () => {
            return HttpResponse.error();
          })
        );

        const { result } = renderHook(() => useAuth());

        // Act - Call login
        const success = await result.current.login(
          "test@example.com",
          "TestPassword123"
        );

        // Assert - Login should fail
        expect(success).toBe(false);

        // Assert - Should display network error message
        await waitFor(() => {
          expect(result.current.error).toBe(
            "Wystąpił błąd sieci. Sprawdź połączenie."
          );
        });

        // Assert - Should not redirect
        expect(window.location.href).toBe("http://localhost");

        // Assert - Should stop loading
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });
      });
    });
  });

  describe("GIVEN register function", () => {
    describe("WHEN register with valid credentials", () => {
      it("THEN should set session and redirect to dashboard", async () => {
        // Arrange - Use default MSW handler (success case)
        const { result } = renderHook(() => useAuth());

        // Act - Call register
        const success = await result.current.register(
          "newuser@example.com",
          "TestPassword123",
          "TestPassword123"
        );

        // Assert - Register should succeed
        expect(success).toBe(true);

        // Assert - Should redirect to dashboard
        expect(window.location.href).toBe("/dashboard");

        // Assert - Should clear error
        expect(result.current.error).toBeNull();

        // Assert - Should stop loading
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });
      });
    });

    describe("WHEN register with existing email", () => {
      it("THEN should return false and set error message", async () => {
        // Arrange - Override handler to return existing email error
        server.use(
          http.post("http://localhost/api/auth/register", () => {
            return HttpResponse.json(
              { error: "Ten adres e-mail jest już zajęty" },
              { status: 400 }
            );
          })
        );

        const { result } = renderHook(() => useAuth());

        // Act - Call register with existing email
        const success = await result.current.register(
          "existing@example.com",
          "TestPassword123",
          "TestPassword123"
        );

        // Assert - Register should fail
        expect(success).toBe(false);

        // Assert - Should display error message
        await waitFor(() => {
          expect(result.current.error).toBe("Ten adres e-mail jest już zajęty");
        });

        // Assert - Should not redirect
        expect(window.location.href).toBe("http://localhost");

        // Assert - Should stop loading
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });
      });
    });
  });

  describe("GIVEN state management", () => {
    describe("WHEN calling login", () => {
      it("THEN should set isLoading to true during request", async () => {
        // Arrange - Create a delayed handler to catch loading state
        server.use(
          http.post("http://localhost/api/auth/login", async () => {
            // Add small delay to catch loading state
            await new Promise((resolve) => setTimeout(resolve, 100));
            return HttpResponse.json(
              {
                user: { id: "test-id", email: "test@example.com" },
                session: { access_token: "token", refresh_token: "refresh" },
              },
              { status: 200 }
            );
          })
        );

        const { result } = renderHook(() => useAuth());

        // Assert - Initially not loading
        expect(result.current.isLoading).toBe(false);

        // Act - Start login (don't await)
        const loginPromise = result.current.login(
          "test@example.com",
          "TestPassword123"
        );

        // Assert - Should be loading immediately after call
        await waitFor(() => {
          expect(result.current.isLoading).toBe(true);
        });

        // Wait for completion
        await loginPromise;

        // Assert - Should stop loading after completion
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });
      });
    });

    describe("WHEN calling login after previous error", () => {
      it("THEN should clear previous error", async () => {
        const { result } = renderHook(() => useAuth());

        // Arrange - First login fails
        server.use(
          http.post("http://localhost/api/auth/login", () => {
            return HttpResponse.json(
              { error: "Nieprawidłowy e-mail lub hasło" },
              { status: 401 }
            );
          })
        );

        await result.current.login("test@example.com", "WrongPassword");

        // Assert - Error is set
        await waitFor(() => {
          expect(result.current.error).toBe("Nieprawidłowy e-mail lub hasło");
        });

        // Act - Second login attempt with success handler
        server.use(
          http.post("http://localhost/api/auth/login", () => {
            return HttpResponse.json(
              {
                user: { id: "test-id", email: "test@example.com" },
                session: { access_token: "token", refresh_token: "refresh" },
              },
              { status: 200 }
            );
          })
        );

        await result.current.login("test@example.com", "TestPassword123");

        // Assert - Error should be cleared (null)
        await waitFor(() => {
          expect(result.current.error).toBeNull();
        });
      });
    });
  });

  describe("GIVEN logout function", () => {
    describe("WHEN logout succeeds", () => {
      it("THEN should sign out and redirect to login", async () => {
        // Arrange - Use default MSW handler (success case)
        const { result } = renderHook(() => useAuth());

        // Act - Call logout
        const success = await result.current.logout();

        // Assert - Logout should succeed
        expect(success).toBe(true);

        // Assert - Should redirect to login
        expect(window.location.href).toBe("/login");

        // Assert - Should clear error
        expect(result.current.error).toBeNull();

        // Assert - Should stop loading
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });
      });
    });

    describe("WHEN logout fails", () => {
      it("THEN should return false and set error message", async () => {
        // Arrange - Override Supabase mock to return error
        vi.mocked(createClient).mockReturnValueOnce({
          auth: {
            signOut: vi.fn().mockResolvedValue({
              error: { message: "Session expired" },
            }),
            setSession: vi.fn().mockResolvedValue({ error: null }),
          },
        } as any);

        const { result } = renderHook(() => useAuth());

        // Act - Call logout
        const success = await result.current.logout();

        // Assert - Logout should fail
        expect(success).toBe(false);

        // Assert - Should display error message
        await waitFor(() => {
          expect(result.current.error).toBe("Błąd wylogowania");
        });

        // Assert - Should not redirect
        expect(window.location.href).toBe("http://localhost");

        // Assert - Should stop loading
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });
      });
    });
  });
});
