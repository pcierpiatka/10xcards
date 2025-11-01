import { describe, it, expect } from "vitest";
import {
  OpenRouterError,
  OpenRouterConfigError,
  OpenRouterNetworkError,
  OpenRouterApiError,
  OpenRouterParseError,
  OpenRouterTimeoutError,
} from "./openrouter-errors";

/**
 * Unit tests for OpenRouter error classes
 * Following BDD/3x3 methodology with Given-When-Then pattern
 */

describe("OpenRouterError (base class)", () => {
  // TEST-020-001
  describe("GIVEN error parameters", () => {
    it("WHEN creating OpenRouterError THEN should set all properties correctly", () => {
      // Given (Arrange)
      const message = "Test error";
      const code = "TEST_CODE";
      const retryable = true;
      const details = { detail: "info" };

      // When (Act)
      const error = new OpenRouterError(message, code, retryable, details);

      // Then (Assert)
      expect(error.message).toBe("Test error");
      expect(error.code).toBe("TEST_CODE");
      expect(error.retryable).toBe(true);
      expect(error.details).toEqual({ detail: "info" });
      expect(error.name).toBe("OpenRouterError");
    });
  });
});

describe("OpenRouterConfigError", () => {
  // TEST-020-002
  describe("GIVEN missing API key message", () => {
    it("WHEN creating OpenRouterConfigError THEN should be non-retryable", () => {
      // Given (Arrange)
      const message = "Missing API key";

      // When (Act)
      const error = new OpenRouterConfigError(message);

      // Then (Assert)
      expect(error.message).toBe("Missing API key");
      expect(error.code).toBe("OPENROUTER_CONFIG_ERROR");
      expect(error.retryable).toBe(false);
      expect(error.name).toBe("OpenRouterConfigError");
    });
  });
});

describe("OpenRouterNetworkError", () => {
  // TEST-020-003
  describe("GIVEN network failure message", () => {
    it("WHEN creating OpenRouterNetworkError THEN should be retryable", () => {
      // Given (Arrange)
      const message = "Network failure";
      const details = { url: "https://..." };

      // When (Act)
      const error = new OpenRouterNetworkError(message, details);

      // Then (Assert)
      expect(error.retryable).toBe(true);
      expect(error.code).toBe("OPENROUTER_NETWORK_ERROR");
      expect(error.details).toEqual({ url: "https://..." });
    });
  });
});

describe("OpenRouterApiError", () => {
  // TEST-020-004
  describe("GIVEN API error with status code", () => {
    it("WHEN creating OpenRouterApiError THEN should set statusCode and code", () => {
      // Given (Arrange)
      const message = "Rate limited";
      const statusCode = 429;
      const retryable = true;

      // When (Act)
      const error = new OpenRouterApiError(message, statusCode, retryable);

      // Then (Assert)
      expect(error.statusCode).toBe(429);
      expect(error.retryable).toBe(true);
      expect(error.code).toBe("OPENROUTER_API_429");
    });
  });
});

describe("OpenRouterParseError", () => {
  // TEST-020-005
  describe("GIVEN invalid JSON response", () => {
    it("WHEN creating OpenRouterParseError THEN should be non-retryable", () => {
      // Given (Arrange)
      const message = "Invalid JSON";
      const details = { content: "..." };

      // When (Act)
      const error = new OpenRouterParseError(message, details);

      // Then (Assert)
      expect(error.retryable).toBe(false);
      expect(error.details).toEqual({ content: "..." });
    });
  });
});

describe("OpenRouterTimeoutError", () => {
  // TEST-020-006
  describe("GIVEN timeout duration", () => {
    it("WHEN creating OpenRouterTimeoutError THEN should be retryable and format message", () => {
      // Given (Arrange)
      const timeoutMs = 30000;

      // When (Act)
      const error = new OpenRouterTimeoutError(timeoutMs);

      // Then (Assert)
      expect(error.retryable).toBe(true);
      expect(error.message).toContain("30s");
    });
  });
});
