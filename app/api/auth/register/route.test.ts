/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { createMockRequest, parseJsonResponse } from "@/lib/test-utils";

/**
 * Integration tests for POST /api/auth/register
 *
 * Tests the register API route handler with various scenarios.
 * Uses mocked Supabase server client to avoid real API calls.
 */

// Mock Supabase server client
vi.mock("@/lib/db/supabase.server");

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GIVEN valid registration data", () => {
    describe("WHEN register request is made", () => {
      it("THEN should return 201 with user and session data", async () => {
        // Arrange - Mock successful Supabase signUp
        const mockUser = {
          id: "new-user-id",
          email: "newuser@example.com",
        };
        const mockSession = {
          access_token: "mock-access-token",
          refresh_token: "mock-refresh-token",
          expires_at: Date.now() + 3600000,
        };

        const mockSignUp = vi.fn().mockResolvedValue({
          data: {
            user: mockUser as any,
            session: mockSession as any,
          },
          error: null,
        });

        const { createClient } = await import("@/lib/db/supabase.server");
        vi.mocked(createClient).mockResolvedValue({
          auth: {
            signUp: mockSignUp,
          },
        } as any);

        // Act - Call API route
        const request = createMockRequest("/api/auth/register", {
          method: "POST",
          body: {
            email: "newuser@example.com",
            password: "TestPassword123",
            confirmPassword: "TestPassword123",
          },
        });

        const response = await POST(request);

        // Assert - Should return 201
        expect(response.status).toBe(201);

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
          id: "new-user-id",
          email: "newuser@example.com",
        });

        expect(data.session).toEqual({
          access_token: "mock-access-token",
          refresh_token: "mock-refresh-token",
          expires_at: expect.any(Number),
        });

        // Assert - signUp was called with correct data
        expect(mockSignUp).toHaveBeenCalledWith({
          email: "newuser@example.com",
          password: "TestPassword123",
          options: {
            emailRedirectTo: undefined,
          },
        });
      });
    });
  });

  describe("GIVEN weak password", () => {
    describe("WHEN password does not meet requirements", () => {
      it("THEN should return 400 with validation error", async () => {
        // Act - Call API route with weak password (no uppercase)
        const request = createMockRequest("/api/auth/register", {
          method: "POST",
          body: {
            email: "test@example.com",
            password: "weakpassword",
            confirmPassword: "weakpassword",
          },
        });

        const response = await POST(request);

        // Assert - Should return 400
        expect(response.status).toBe(400);

        // Assert - Should return validation error about uppercase
        const data = await parseJsonResponse<{ error: string }>(response);
        expect(data.error).toContain("wielką literę");
      });
    });
  });

  describe("GIVEN duplicate email", () => {
    describe("WHEN email already exists", () => {
      it("THEN should return 400 with error message", async () => {
        // Arrange - Mock Supabase returning duplicate email error
        const mockSignUp = vi.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: { message: "User already registered" },
        });

        const { createClient } = await import("@/lib/db/supabase.server");
        vi.mocked(createClient).mockResolvedValue({
          auth: {
            signUp: mockSignUp,
          },
        } as any);

        // Act - Call API route
        const request = createMockRequest("/api/auth/register", {
          method: "POST",
          body: {
            email: "existing@example.com",
            password: "TestPassword123",
            confirmPassword: "TestPassword123",
          },
        });

        const response = await POST(request);

        // Assert - Should return 400
        expect(response.status).toBe(400);

        // Assert - Should return duplicate email error
        const data = await parseJsonResponse<{ error: string }>(response);
        expect(data.error).toBe("Ten adres e-mail jest już zajęty");
      });
    });
  });

  describe("GIVEN invalid request body", () => {
    describe("WHEN passwords do not match", () => {
      it("THEN should return 400 with validation error", async () => {
        // Act - Call API route with mismatched passwords
        const request = createMockRequest("/api/auth/register", {
          method: "POST",
          body: {
            email: "test@example.com",
            password: "TestPassword123",
            confirmPassword: "DifferentPassword123",
          },
        });

        const response = await POST(request);

        // Assert - Should return 400
        expect(response.status).toBe(400);

        // Assert - Should return validation error
        const data = await parseJsonResponse<{ error: string }>(response);
        expect(data.error).toContain("identyczne");
      });
    });

    describe("WHEN email is invalid", () => {
      it("THEN should return 400 with validation error", async () => {
        // Act - Call API route with invalid email
        const request = createMockRequest("/api/auth/register", {
          method: "POST",
          body: {
            email: "not-an-email",
            password: "TestPassword123",
            confirmPassword: "TestPassword123",
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
  });

  describe("GIVEN Supabase error", () => {
    describe("WHEN unexpected error occurs", () => {
      it("THEN should return 500 with generic error message", async () => {
        // Arrange - Mock Supabase throwing error
        const mockSignUp = vi
          .fn()
          .mockRejectedValue(new Error("Database connection error"));

        const { createClient } = await import("@/lib/db/supabase.server");
        vi.mocked(createClient).mockResolvedValue({
          auth: {
            signUp: mockSignUp,
          },
        } as any);

        // Act - Call API route
        const request = createMockRequest("/api/auth/register", {
          method: "POST",
          body: {
            email: "test@example.com",
            password: "TestPassword123",
            confirmPassword: "TestPassword123",
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
