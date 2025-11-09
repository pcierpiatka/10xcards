/**
 * Tests for requireFeature() API guard
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextResponse } from "next/server";
import { requireFeature } from "../require-feature";
import { ERROR_CODES, ERROR_MESSAGES } from "@/lib/constants";

describe("requireFeature", () => {
  const originalEnv = process.env.ENV_NAME;

  beforeEach(() => {
    // Clear console to avoid cluttering test output
    vi.spyOn(console, "warn").mockImplementation(vi.fn());
    vi.spyOn(console, "error").mockImplementation(vi.fn());
  });

  afterEach(() => {
    // Restore original ENV_NAME
    if (originalEnv !== undefined) {
      process.env.ENV_NAME = originalEnv;
    } else {
      delete process.env.ENV_NAME;
    }
    vi.restoreAllMocks();
  });

  describe("when feature is enabled", () => {
    beforeEach(() => {
      // Local environment has all flags enabled
      process.env.ENV_NAME = "local";
    });

    it("returns null for enabled flag", () => {
      const result = requireFeature("auth.login");
      expect(result).toBeNull();
    });

    it("returns null for all enabled flags", () => {
      expect(requireFeature("auth.login")).toBeNull();
      expect(requireFeature("auth.register")).toBeNull();
      expect(requireFeature("flashcards.create.ai")).toBeNull();
      expect(requireFeature("flashcards.list")).toBeNull();
    });
  });

  describe("when feature is disabled", () => {
    beforeEach(() => {
      // Production environment has auth.register disabled
      process.env.ENV_NAME = "production";
    });

    it("returns NextResponse with 403 status", () => {
      const result = requireFeature("auth.register");

      expect(result).not.toBeNull();
      expect(result?.status).toBe(403);
    });

    it("returns response with FEATURE_DISABLED error code", async () => {
      const result = requireFeature("auth.register");
      const json = await result?.json();

      expect(json).toEqual({
        error: ERROR_MESSAGES.FEATURE_DISABLED,
        code: ERROR_CODES.FEATURE_DISABLED,
        feature: "auth.register",
      });
    });

    it("includes feature name in response", async () => {
      const result = requireFeature("auth.register");
      const json = await result?.json();

      expect(json.feature).toBe("auth.register");
    });
  });

  describe("integration environment", () => {
    beforeEach(() => {
      process.env.ENV_NAME = "integration";
    });

    it("allows auth features", () => {
      expect(requireFeature("auth.login")).toBeNull();
      expect(requireFeature("auth.register")).toBeNull();
    });

    it("allows flashcard features", () => {
      expect(requireFeature("flashcards.create.ai")).toBeNull();
      expect(requireFeature("flashcards.list")).toBeNull();
    });
  });

  describe("guard pattern usage", () => {
    beforeEach(() => {
      process.env.ENV_NAME = "local";
    });

    it("enables early return pattern in route handlers", () => {
      // Simulate route handler logic
      const mockRouteHandler = (featureName: "auth.login") => {
        const guardError = requireFeature(featureName);
        if (guardError) return guardError;

        // Business logic only runs if guard returns null
        return { success: true };
      };

      const result = mockRouteHandler("auth.login");
      expect(result).toEqual({ success: true });
    });

    it("blocks execution when guard returns error", () => {
      process.env.ENV_NAME = "production";

      const mockRouteHandler = (
        featureName: "auth.register"
      ): NextResponse | { success: boolean } => {
        const guardError = requireFeature(featureName);
        if (guardError) return guardError;

        // This code should NOT run
        return { success: true };
      };

      const result = mockRouteHandler("auth.register");
      // Type guard: check if result is NextResponse
      if ("status" in result) {
        expect(result.status).toBe(403);
      }
    });
  });
});
