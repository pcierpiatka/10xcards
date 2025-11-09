/**
 * Tests for isFeatureEnabled() core function
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { isFeatureEnabled } from "../is-feature-enabled";

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
      expect(isFeatureEnabled("auth.login")).toBe(true);
    });

    it("returns correct values for flags in local environment", () => {
      expect(isFeatureEnabled("auth.login")).toBe(true);
      expect(isFeatureEnabled("auth.register")).toBe(true);
      expect(isFeatureEnabled("flashcards.create.ai")).toBe(true);
      expect(isFeatureEnabled("flashcards.list")).toBe(true);
    });
  });

  describe("integration environment", () => {
    beforeEach(() => {
      process.env.ENV_NAME = "integration";
    });

    it("returns true for auth flags", () => {
      expect(isFeatureEnabled("auth.login")).toBe(true);
      expect(isFeatureEnabled("auth.register")).toBe(true);
    });

    it("returns true for flashcard flags", () => {
      expect(isFeatureEnabled("flashcards.create.ai")).toBe(true);
      expect(isFeatureEnabled("flashcards.list")).toBe(true);
    });
  });

  describe("production environment", () => {
    beforeEach(() => {
      process.env.ENV_NAME = "production";
    });

    it("returns correct values for flags in production environment", () => {
      expect(isFeatureEnabled("auth.login")).toBe(true);
      expect(isFeatureEnabled("auth.register")).toBe(false);
      expect(isFeatureEnabled("flashcards.create.ai")).toBe(true);
      expect(isFeatureEnabled("flashcards.list")).toBe(true);
    });
  });

  describe("default behavior (no ENV_NAME)", () => {
    beforeEach(() => {
      delete process.env.ENV_NAME;
    });

    it("falls back to 'local' environment", () => {
      expect(isFeatureEnabled("auth.login")).toBe(true);
    });

    it("returns true for flashcard features in fallback mode", () => {
      expect(isFeatureEnabled("flashcards.create.ai")).toBe(true);
      expect(isFeatureEnabled("flashcards.list")).toBe(true);
    });
  });
});
