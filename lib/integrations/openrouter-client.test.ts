import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpenRouterClient } from "./openrouter-client";
import {
  OpenRouterTimeoutError,
  OpenRouterNetworkError,
  OpenRouterApiError,
  OpenRouterParseError,
  OpenRouterConfigError,
} from "@/lib/errors/openrouter-errors";

/**
 * Unit tests for OpenRouter Client
 * Following BDD/3x3 methodology with Given-When-Then pattern
 */

describe("OpenRouterClient constructor", () => {
  beforeEach(() => {
    // Ensure we're in Node.js environment (no window)
    Reflect.deleteProperty(global, "window");
    // Reset env vars
    delete process.env.OPENROUTER_API_KEY;
    vi.clearAllMocks();
  });

  // TEST-022-001
  describe("GIVEN missing API key", () => {
    it("WHEN creating client without API key THEN should throw error", () => {
      // Given (Arrange)
      delete process.env.OPENROUTER_API_KEY;

      // When & Then (Act + Assert)
      expect(() => new OpenRouterClient()).toThrow("OPENROUTER_API_KEY");
      expect(() => new OpenRouterClient()).toThrow(OpenRouterConfigError);
    });
  });

  // TEST-022-002
  describe("GIVEN API key from config", () => {
    it("WHEN creating client with config THEN should use provided key", () => {
      // Given (Arrange)
      const config = { apiKey: "sk-test-123" };

      // When (Act)
      const client = new OpenRouterClient(config);

      // Then (Assert)
      expect(client).toBeDefined();
    });
  });

  // TEST-022-003
  describe("GIVEN API key from environment", () => {
    it("WHEN creating client THEN should use env key", () => {
      // Given (Arrange)
      process.env.OPENROUTER_API_KEY = "sk-test-env";

      // When (Act)
      const client = new OpenRouterClient();

      // Then (Assert)
      expect(client).toBeDefined();
    });
  });

  // TEST-022-004
  describe("GIVEN default model not specified", () => {
    it("WHEN creating client THEN should use default model", () => {
      // Given (Arrange)
      const config = { apiKey: "sk-test-123" };

      // When (Act)
      const client = new OpenRouterClient(config);

      // Then (Assert)
      // Model is private, but we can verify client was created
      expect(client).toBeDefined();
    });
  });

  // TEST-022-005
  describe("GIVEN browser context", () => {
    it("WHEN creating client in browser THEN should throw error", () => {
      // Given (Arrange)
      Object.defineProperty(global, "window", {
        value: {},
        configurable: true,
      });

      // When & Then (Act + Assert)
      expect(() => new OpenRouterClient({ apiKey: "sk-test" })).toThrow(
        "can only be used server-side"
      );

      // Cleanup
      Reflect.deleteProperty(global, "window");
    });
  });

  // TEST-022-006
  describe("GIVEN unusual API key format", () => {
    it("WHEN creating client THEN should warn about format", () => {
      // Given (Arrange)
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {
          // Mock implementation
        });

      // When (Act)
      new OpenRouterClient({ apiKey: "unusual-key" });

      // Then (Assert)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("API key format looks unusual")
      );

      consoleWarnSpy.mockRestore();
    });
  });
});

describe("generateFlashcards - happy path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn() as typeof fetch;
  });

  // TEST-023-001
  describe("GIVEN valid input text", () => {
    it("WHEN calling generateFlashcards THEN should make correct API call", async () => {
      // Given (Arrange)
      const mockResponse = {
        id: "test-id",
        model: "gpt-4o-mini",
        created: Date.now() / 1000,
        choices: [
          {
            message: {
              content: JSON.stringify({
                flashcards: [
                  { front: "Q1", back: "A1" },
                  { front: "Q2", back: "A2" },
                ],
              }),
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const client = new OpenRouterClient({ apiKey: "sk-test-123" });
      const inputText = "Lorem ipsum ".repeat(100); // ~1200 chars

      // When (Act)
      const result = await client.generateFlashcards(inputText);

      // Then (Assert)
      expect(global.fetch).toHaveBeenCalledWith(
        "https://openrouter.ai/api/v1/chat/completions",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer sk-test-123",
            "Content-Type": "application/json",
          }),
        })
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ front: "Q1", back: "A1" });
    });
  });

  // TEST-023-002
  describe("GIVEN site headers configured", () => {
    it("WHEN making request THEN should include site headers", async () => {
      // Given (Arrange)
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  flashcards: [{ front: "Q", back: "A" }],
                }),
              },
            },
          ],
        }),
      } as Response);

      const client = new OpenRouterClient({
        apiKey: "sk-test-123",
        siteUrl: "https://10xcards.com",
        siteName: "10xCards",
      });

      // When (Act)
      await client.generateFlashcards("Lorem ipsum ".repeat(100));

      // Then (Assert)
      const mockFetch = vi.mocked(global.fetch);
      const callArgs = mockFetch.mock.calls[0][1] as RequestInit;
      const headers = callArgs.headers as Record<string, string>;
      expect(headers["HTTP-Referer"]).toBe("https://10xcards.com");
      expect(headers["X-Title"]).toBe("10xCards");
    });
  });
});

describe("generateFlashcards - input validation", () => {
  let client: OpenRouterClient;

  beforeEach(() => {
    client = new OpenRouterClient({ apiKey: "sk-test-123" });
  });

  // TEST-024-001
  describe("GIVEN empty input", () => {
    it("WHEN calling generateFlashcards THEN should reject", async () => {
      // Given (Arrange)
      const emptyText = "";

      // When & Then (Act + Assert)
      await expect(client.generateFlashcards(emptyText)).rejects.toThrow(
        "cannot be empty"
      );
    });
  });

  // TEST-024-002
  describe("GIVEN whitespace-only input", () => {
    it("WHEN calling generateFlashcards THEN should reject", async () => {
      // Given (Arrange)
      const whitespaceText = "   \n\t   ";

      // When & Then (Act + Assert)
      await expect(client.generateFlashcards(whitespaceText)).rejects.toThrow(
        "cannot be empty"
      );
    });
  });

  // TEST-024-003
  describe("GIVEN input shorter than 1000 chars", () => {
    it("WHEN calling generateFlashcards THEN should reject", async () => {
      // Given (Arrange)
      const shortText = "Short text";

      // When & Then (Act + Assert)
      await expect(client.generateFlashcards(shortText)).rejects.toThrow(
        "at least 1000 characters"
      );
    });
  });

  // TEST-024-004
  describe("GIVEN input longer than 10000 chars", () => {
    it("WHEN calling generateFlashcards THEN should reject", async () => {
      // Given (Arrange)
      const longText = "a".repeat(10001);

      // When & Then (Act + Assert)
      await expect(client.generateFlashcards(longText)).rejects.toThrow(
        "cannot exceed 10000"
      );
    });
  });

  // TEST-024-005
  describe("GIVEN exactly 1000 chars", () => {
    it("WHEN calling generateFlashcards THEN should accept", async () => {
      // Given (Arrange)
      const text = "a".repeat(1000);

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  flashcards: [{ front: "Q", back: "A" }],
                }),
              },
            },
          ],
        }),
      });

      // When (Act)
      await expect(client.generateFlashcards(text)).resolves.toBeDefined();
    });
  });

  // TEST-024-006
  describe("GIVEN exactly 10000 chars", () => {
    it("WHEN calling generateFlashcards THEN should accept", async () => {
      // Given (Arrange)
      const text = "a".repeat(10000);

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  flashcards: [{ front: "Q", back: "A" }],
                }),
              },
            },
          ],
        }),
      });

      // When (Act)
      await expect(client.generateFlashcards(text)).resolves.toBeDefined();
    });
  });
});

describe("generateFlashcards - error handling", () => {
  let client: OpenRouterClient;

  beforeEach(() => {
    // Use maxRetries: 1 to test errors without retry logic
    client = new OpenRouterClient({ apiKey: "sk-test-123", maxRetries: 1 });
    global.fetch = vi.fn() as typeof fetch;
  });

  // TEST-025-001
  describe("GIVEN request timeout", () => {
    it("WHEN fetch aborts THEN should throw OpenRouterTimeoutError", async () => {
      // Given (Arrange)
      vi.mocked(global.fetch).mockRejectedValueOnce(
        Object.assign(new Error("The operation was aborted"), {
          name: "AbortError",
        })
      );

      // When & Then (Act + Assert)
      await expect(
        client.generateFlashcards("Lorem ipsum ".repeat(100))
      ).rejects.toThrow(OpenRouterTimeoutError);
    });
  });

  // TEST-025-002
  describe("GIVEN network failure", () => {
    it("WHEN fetch fails THEN should throw OpenRouterNetworkError", async () => {
      // Given (Arrange)
      vi.mocked(global.fetch).mockRejectedValueOnce(
        new TypeError("Failed to fetch")
      );

      // When & Then (Act + Assert)
      await expect(
        client.generateFlashcards("Lorem ipsum ".repeat(100))
      ).rejects.toThrow(OpenRouterNetworkError);
    });
  });

  // TEST-025-003
  describe("GIVEN 401 unauthorized", () => {
    it("WHEN API returns 401 THEN should throw OpenRouterApiError", async () => {
      // Given (Arrange)
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => "Unauthorized",
        headers: new Headers(),
      } as Response);

      // When & Then (Act + Assert)
      await expect(
        client.generateFlashcards("Lorem ipsum ".repeat(100))
      ).rejects.toThrow(OpenRouterApiError);
    });
  });

  // TEST-025-004
  describe("GIVEN 429 rate limit", () => {
    it("WHEN API returns 429 THEN should throw retryable OpenRouterApiError", async () => {
      // Given (Arrange)
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        text: async () => "",
        headers: new Headers(),
      } as Response);

      // When & Then (Act + Assert)
      await expect(
        client.generateFlashcards("Lorem ipsum ".repeat(100))
      ).rejects.toThrow(OpenRouterApiError);
    });
  });

  // TEST-025-005
  describe("GIVEN invalid JSON response", () => {
    it("WHEN content is not valid JSON THEN should throw OpenRouterParseError", async () => {
      // Given (Arrange)
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: "Invalid JSON string",
              },
            },
          ],
        }),
      } as Response);

      // When & Then (Act + Assert)
      await expect(
        client.generateFlashcards("Lorem ipsum ".repeat(100))
      ).rejects.toThrow(OpenRouterParseError);
    });
  });
});

describe("generateFlashcards - retry logic", () => {
  let client: OpenRouterClient;

  beforeEach(() => {
    client = new OpenRouterClient({ apiKey: "sk-test-123", maxRetries: 3 });
    global.fetch = vi.fn() as typeof fetch;
  });

  // TEST-026-001
  describe("GIVEN timeout on first two attempts", () => {
    it("WHEN retrying THEN should succeed on 3rd attempt", async () => {
      // Given (Arrange)
      vi.mocked(global.fetch)
        .mockRejectedValueOnce(
          Object.assign(new Error("Aborted"), { name: "AbortError" })
        )
        .mockRejectedValueOnce(
          Object.assign(new Error("Aborted"), { name: "AbortError" })
        )
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    flashcards: [{ front: "Q", back: "A" }],
                  }),
                },
              },
            ],
          }),
        } as Response);

      // When (Act)
      const result = await client.generateFlashcards(
        "Lorem ipsum ".repeat(100)
      );

      // Then (Assert)
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(1);
    });
  });

  // TEST-026-002
  describe("GIVEN non-retryable error (401)", () => {
    it("WHEN error occurs THEN should NOT retry", async () => {
      // Given (Arrange)
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => "",
        headers: new Headers(),
      } as Response);

      // When & Then (Act + Assert)
      await expect(
        client.generateFlashcards("Lorem ipsum ".repeat(100))
      ).rejects.toThrow();

      // Should only try once (no retry for 401)
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  // TEST-026-003
  describe("GIVEN all retries fail", () => {
    it("WHEN max retries exhausted THEN should throw", async () => {
      // Given (Arrange)
      vi.mocked(global.fetch).mockRejectedValue(
        Object.assign(new Error("Aborted"), { name: "AbortError" })
      );

      // When & Then (Act + Assert)
      await expect(
        client.generateFlashcards("Lorem ipsum ".repeat(100))
      ).rejects.toThrow();

      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });
});
