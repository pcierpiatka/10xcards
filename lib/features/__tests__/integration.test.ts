/**
 * Integration tests for Feature Flags system
 * Tests cross-layer functionality (core + API + React)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextResponse } from "next/server";
import { isFeatureEnabled } from "../core/is-feature-enabled";
import { requireFeature } from "../api/require-feature";
import { ERROR_CODES, ERROR_MESSAGES } from "@/lib/constants";

describe("Feature Flags Integration", () => {
  const originalEnv = process.env.ENV_NAME;

  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(vi.fn());
    vi.spyOn(console, "error").mockImplementation(vi.fn());
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.ENV_NAME = originalEnv;
    } else {
      delete process.env.ENV_NAME;
    }
    vi.restoreAllMocks();
  });

  describe("API Route Protection", () => {
    it("allows API request when feature is enabled (local)", () => {
      process.env.ENV_NAME = "local";
      const result = requireFeature("auth.login");
      expect(result).toBeNull();
    });

    it("blocks API request when feature is disabled (production)", async () => {
      process.env.ENV_NAME = "production";

      const mockRouteHandler = (
        featureName: "auth.register"
      ): NextResponse | { success: boolean } => {
        const guardError = requireFeature(featureName);
        if (guardError) return guardError;
        return { success: true };
      };

      const response = mockRouteHandler("auth.register");

      // Type guard: verify it's NextResponse
      if ("status" in response) {
        expect(response.status).toBe(403);
        const json = await response.json();
        expect(json.code).toBe(ERROR_CODES.FEATURE_DISABLED);
      } else {
        throw new Error("Expected NextResponse but got success object");
      }
    });
  });

  describe("Environment-based behavior", () => {
    it("local environment: all features enabled", () => {
      process.env.ENV_NAME = "local";
      expect(isFeatureEnabled("auth.login")).toBe(true);
      expect(isFeatureEnabled("auth.register")).toBe(true);
      expect(isFeatureEnabled("flashcards.create.ai")).toBe(true);
      expect(isFeatureEnabled("flashcards.list")).toBe(true);
    });

    it("integration environment: all features enabled", () => {
      process.env.ENV_NAME = "integration";
      expect(isFeatureEnabled("auth.login")).toBe(true);
      expect(isFeatureEnabled("auth.register")).toBe(true);
      expect(isFeatureEnabled("flashcards.create.ai")).toBe(true);
      expect(isFeatureEnabled("flashcards.list")).toBe(true);
    });

    it("production environment: register disabled", () => {
      process.env.ENV_NAME = "production";
      expect(isFeatureEnabled("auth.login")).toBe(true);
      expect(isFeatureEnabled("auth.register")).toBe(false);
      expect(isFeatureEnabled("flashcards.create.ai")).toBe(true);
      expect(isFeatureEnabled("flashcards.list")).toBe(true);
    });
  });

  describe("Core + API layer consistency", () => {
    it("requireFeature() matches isFeatureEnabled() behavior", () => {
      process.env.ENV_NAME = "local";

      // When feature is enabled
      expect(isFeatureEnabled("auth.login")).toBe(true);
      expect(requireFeature("auth.login")).toBeNull();

      // When feature is disabled (in production)
      process.env.ENV_NAME = "production";
      expect(isFeatureEnabled("auth.register")).toBe(false);
      expect(requireFeature("auth.register")).not.toBeNull();
    });
  });

  describe("Error response format", () => {
    it("returns consistent error format across all blocked features", async () => {
      process.env.ENV_NAME = "production";
      const response = requireFeature("auth.register");

      expect(response).not.toBeNull();
      if (!response) throw new Error("Expected response");
      const json = await response.json();

      expect(json).toHaveProperty("error");
      expect(json).toHaveProperty("code");
      expect(json).toHaveProperty("feature");
      expect(json.code).toBe(ERROR_CODES.FEATURE_DISABLED);
      expect(json.error).toBe(ERROR_MESSAGES.FEATURE_DISABLED);
    });
  });

  describe("Fail-safe behavior", () => {
    it("falls back to local when ENV_NAME not set", () => {
      delete process.env.ENV_NAME;
      expect(isFeatureEnabled("auth.login")).toBe(true);
      expect(isFeatureEnabled("flashcards.create.ai")).toBe(true);
    });
  });
});
