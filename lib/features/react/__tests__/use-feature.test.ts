/**
 * Tests for useFeature() hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFeature } from "../use-feature";

describe("useFeature", () => {
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

    it("returns object with isEnabled: true", () => {
      const { result } = renderHook(() => useFeature("auth.login"));

      expect(result.current).toEqual({ isEnabled: true });
    });

    it("returns correct values for flags in local environment", () => {
      const authLogin = renderHook(() => useFeature("auth.login"));
      const authRegister = renderHook(() => useFeature("auth.register"));
      const flashcardsCreate = renderHook(() =>
        useFeature("flashcards.create.ai")
      );
      const flashcardsList = renderHook(() => useFeature("flashcards.list"));

      expect(authLogin.result.current.isEnabled).toBe(true);
      expect(authRegister.result.current.isEnabled).toBe(true);
      expect(flashcardsCreate.result.current.isEnabled).toBe(true);
      expect(flashcardsList.result.current.isEnabled).toBe(true);
    });
  });

  describe("when feature is disabled", () => {
    beforeEach(() => {
      // Production environment has auth.register disabled
      process.env.ENV_NAME = "production";
    });

    it("returns object with isEnabled: false", () => {
      const { result } = renderHook(() => useFeature("auth.register"));

      expect(result.current).toEqual({ isEnabled: false });
    });

    it("returns false for disabled flag in production", () => {
      const authRegister = renderHook(() => useFeature("auth.register"));

      expect(authRegister.result.current.isEnabled).toBe(false);
    });
  });

  describe("integration environment", () => {
    beforeEach(() => {
      process.env.ENV_NAME = "integration";
    });

    it("returns true for auth features", () => {
      const authLogin = renderHook(() => useFeature("auth.login"));
      const authRegister = renderHook(() => useFeature("auth.register"));

      expect(authLogin.result.current.isEnabled).toBe(true);
      expect(authRegister.result.current.isEnabled).toBe(true);
    });

    it("returns true for flashcard features", () => {
      const flashcardsCreate = renderHook(() =>
        useFeature("flashcards.create.ai")
      );
      const flashcardsList = renderHook(() => useFeature("flashcards.list"));

      expect(flashcardsCreate.result.current.isEnabled).toBe(true);
      expect(flashcardsList.result.current.isEnabled).toBe(true);
    });
  });

  describe("return value structure", () => {
    beforeEach(() => {
      process.env.ENV_NAME = "local";
    });

    it("returns object (not boolean)", () => {
      const { result } = renderHook(() => useFeature("auth.login"));

      expect(typeof result.current).toBe("object");
      expect(result.current).not.toBeNull();
    });

    it("has isEnabled property", () => {
      const { result } = renderHook(() => useFeature("auth.login"));

      expect(result.current).toHaveProperty("isEnabled");
    });

    it("isEnabled is boolean", () => {
      const { result } = renderHook(() => useFeature("auth.login"));

      expect(typeof result.current.isEnabled).toBe("boolean");
    });

    it("object structure is extensible (future-proof)", () => {
      const { result } = renderHook(() => useFeature("auth.login"));

      // Current structure
      expect(result.current).toEqual({ isEnabled: true });

      // Future structure could be:
      // { isEnabled: true, isLoading: false, error: null }
      // This test validates we can add fields without breaking changes
      expect(Object.keys(result.current)).toContain("isEnabled");
    });
  });

  describe("real-world usage patterns", () => {
    beforeEach(() => {
      process.env.ENV_NAME = "local";
    });

    it("supports destructuring with renaming", () => {
      const { result } = renderHook(() => {
        const { isEnabled: canGenerateFlashcards } = useFeature(
          "flashcards.create.ai"
        );
        return canGenerateFlashcards;
      });

      expect(result.current).toBe(true);
    });

    it("supports multiple flags in one component", () => {
      const { result } = renderHook(() => {
        const auth = useFeature("auth.login");
        const flashcards = useFeature("flashcards.create.ai");
        return { auth, flashcards };
      });

      expect(result.current.auth.isEnabled).toBe(true);
      expect(result.current.flashcards.isEnabled).toBe(true);
    });

    it("can be used in conditional logic", () => {
      const { result } = renderHook(() => {
        const { isEnabled } = useFeature("auth.login");
        return isEnabled ? "enabled" : "disabled";
      });

      expect(result.current).toBe("enabled");
    });
  });
});
