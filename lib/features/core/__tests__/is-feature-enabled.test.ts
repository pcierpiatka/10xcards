/**
 * Tests for isFeatureEnabled() core function
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { isFeatureEnabled } from "../is-feature-enabled";
import testFlags from "../../__tests__/__fixtures__/test-flags.json";

describe("isFeatureEnabled", () => {
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

  describe("local environment", () => {
    beforeEach(() => {
      process.env.ENV_NAME = "local";
    });

    it("returns true for enabled flag (auth.login)", () => {
      expect(isFeatureEnabled("auth.login", testFlags)).toBe(true);
    });

    it("returns correct values for flags in local environment", () => {
      expect(isFeatureEnabled("auth.login", testFlags)).toBe(true);
      expect(isFeatureEnabled("auth.register", testFlags)).toBe(true);
      expect(isFeatureEnabled("flashcards.create.ai", testFlags)).toBe(true);
      expect(isFeatureEnabled("flashcards.list", testFlags)).toBe(true);
    });
  });

  describe("integration environment", () => {
    beforeEach(() => {
      process.env.ENV_NAME = "integration";
    });

    it("returns true for auth flags", () => {
      expect(isFeatureEnabled("auth.login", testFlags)).toBe(true);
      expect(isFeatureEnabled("auth.register", testFlags)).toBe(true);
    });

    it("returns true for flashcard flags", () => {
      expect(isFeatureEnabled("flashcards.create.ai", testFlags)).toBe(true);
      expect(isFeatureEnabled("flashcards.list", testFlags)).toBe(true);
    });
  });

  describe("production environment", () => {
    beforeEach(() => {
      process.env.ENV_NAME = "production";
    });

    it("returns correct values for flags in production environment", () => {
      expect(isFeatureEnabled("auth.login", testFlags)).toBe(true);
      expect(isFeatureEnabled("auth.register", testFlags)).toBe(false);
      expect(isFeatureEnabled("flashcards.create.ai", testFlags)).toBe(true);
      expect(isFeatureEnabled("flashcards.list", testFlags)).toBe(true);
    });
  });

  describe("default behavior (no ENV_NAME)", () => {
    beforeEach(() => {
      delete process.env.ENV_NAME;
    });

    it("falls back to 'local' environment", () => {
      expect(isFeatureEnabled("auth.login", testFlags)).toBe(true);
    });

    it("returns true for flashcard features in fallback mode", () => {
      expect(isFeatureEnabled("flashcards.create.ai", testFlags)).toBe(true);
      expect(isFeatureEnabled("flashcards.list", testFlags)).toBe(true);
    });
  });
});
