/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { createMockRequest, parseJsonResponse } from "@/lib/test-utils";

/**
 * Integration tests for POST /api/auth/login
 *
 * Tests the login API route handler with various scenarios.
 * Uses mocked Supabase server client to avoid real API calls.
 */

// Mock Supabase server client
vi.mock("@/lib/db/supabase.server");

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GIVEN valid credentials", () => {
    describe("WHEN login request is made", () => {
      it("THEN should return 200 with user and session data", async () => {
        // Arrange - Mock successful Supabase signInWithPassword
        const mockUser = {
          id: "test-user-id",
          email: "test@example.com",
        };
        const mockSession = {
          access_token: "mock-access-token",
          refresh_token: "mock-refresh-token",
          expires_at: Date.now() + 3600000,
        };

        const mockSignInWithPassword = vi.fn().mockResolvedValue({
          data: {
            user: mockUser as any,
            session: mockSession as any,
          },
          error: null,
        });

        const { createClient } = await import("@/lib/db/supabase.server");
        vi.mocked(createClient).mockResolvedValue({
          auth: {
            signInWithPassword: mockSignInWithPassword,
          },
        } as any);

        // Act - Call API route
        const request = createMockRequest("/api/auth/login", {
          method: "POST",
          body: {
            email: "test@example.com",
            password: "TestPassword123",
          },
        });

        const response = await POST(request);

        // Assert - Should return 200
        expect(response.status).toBe(200);

        // Assert - Should return user and session data
        const data = await parseJsonResponse<{
          user: { id: string; email: string };
          session: {
            access_token: string;
            refresh_token: string;
            expires_at: number;
          };
        }>(response);

        expect(data.user).toEqual({
          id: "test-user-id",
          email: "test@example.com",
        });

        expect(data.session).toEqual({
          access_token: "mock-access-token",
          refresh_token: "mock-refresh-token",
          expires_at: expect.any(Number),
        });

        // Assert - signInWithPassword was called with correct credentials
        expect(mockSignInWithPassword).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "TestPassword123",
        });
      });
    });
  });

  describe("GIVEN invalid credentials", () => {
    describe("WHEN login request is made", () => {
      it("THEN should return 401 with error message", async () => {
        // Arrange - Mock Supabase returning error for invalid credentials
        const mockSignInWithPassword = vi.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: { message: "Invalid login credentials" },
        });

        const { createClient } = await import("@/lib/db/supabase.server");
        vi.mocked(createClient).mockResolvedValue({
          auth: {
            signInWithPassword: mockSignInWithPassword,
          },
        } as any);

        // Act - Call API route with invalid credentials
        const request = createMockRequest("/api/auth/login", {
          method: "POST",
          body: {
            email: "test@example.com",
            password: "WrongPassword",
          },
        });

        const response = await POST(request);

        // Assert - Should return 401
        expect(response.status).toBe(401);

        // Assert - Should return error message
        const data = await parseJsonResponse<{ error: string }>(response);
        expect(data.error).toBe("Nieprawidłowy e-mail lub hasło");

        // Assert - signInWithPassword was called
        expect(mockSignInWithPassword).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "WrongPassword",
        });
      });
    });
  });

  describe("GIVEN invalid request body", () => {
    describe("WHEN email is missing", () => {
      it("THEN should return 400 with validation error", async () => {
        // Act - Call API route without email
        const request = createMockRequest("/api/auth/login", {
          method: "POST",
          body: {
            password: "TestPassword123",
          },
        });

        const response = await POST(request);

        // Assert - Should return 400
        expect(response.status).toBe(400);

        // Assert - Should return validation error
        const data = await parseJsonResponse<{ error: string }>(response);
        expect(data.error).toContain("expected string");
      });
    });

    describe("WHEN email format is invalid", () => {
      it("THEN should return 400 with validation error", async () => {
        // Act - Call API route with invalid email format
        const request = createMockRequest("/api/auth/login", {
          method: "POST",
          body: {
            email: "not-an-email",
            password: "TestPassword123",
          },
        });

        const response = await POST(request);

        // Assert - Should return 400
        expect(response.status).toBe(400);

        // Assert - Should return validation error
        const data = await parseJsonResponse<{ error: string }>(response);
        expect(data.error).toContain("e-mail");
      });
    });

    describe("WHEN password is missing", () => {
      it("THEN should return 400 with validation error", async () => {
        // Act - Call API route without password
        const request = createMockRequest("/api/auth/login", {
          method: "POST",
          body: {
            email: "test@example.com",
          },
        });

        const response = await POST(request);

        // Assert - Should return 400
        expect(response.status).toBe(400);

        // Assert - Should return validation error
        const data = await parseJsonResponse<{ error: string }>(response);
        expect(data.error).toContain("expected string");
      });
    });
  });

  describe("GIVEN Supabase error", () => {
    describe("WHEN unexpected error occurs", () => {
      it("THEN should return 500 with generic error message", async () => {
        // Arrange - Mock Supabase throwing error
        const mockSignInWithPassword = vi
          .fn()
          .mockRejectedValue(new Error("Network error"));

        const { createClient } = await import("@/lib/db/supabase.server");
        vi.mocked(createClient).mockResolvedValue({
          auth: {
            signInWithPassword: mockSignInWithPassword,
          },
        } as any);

        // Act - Call API route
        const request = createMockRequest("/api/auth/login", {
          method: "POST",
          body: {
            email: "test@example.com",
            password: "TestPassword123",
          },
        });

        const response = await POST(request);

        // Assert - Should return 500
        expect(response.status).toBe(500);

        // Assert - Should return generic error message (no leak of internal details)
        const data = await parseJsonResponse<{ error: string }>(response);
        expect(data.error).toBe("Wystąpił błąd serwera");
      });
    });
  });
});
