/**
 * OpenRouter API client for AI flashcard generation
 *
 * Features:
 * - Real OpenRouter API integration (replaces mock)
 * - Retry logic for transient failures (3 attempts, exponential backoff)
 * - JSON Schema for structured outputs
 * - Full response logging in development mode
 * - Timeout handling (30s per request)
 *
 * @example
 * ```typescript
 * const client = new OpenRouterClient();
 * const flashcards = await client.generateFlashcards(inputText);
 * ```
 */

import type { AiProposalDto } from "@/lib/dto/types";
import type {
  OpenRouterClientConfig,
  OpenRouterRequestBody,
  OpenRouterResponse,
  OpenRouterMessage,
  ResponseFormat,
  JsonSchema,
} from "@/lib/types/openrouter";
import {
  OpenRouterConfigError,
  OpenRouterNetworkError,
  OpenRouterApiError,
  OpenRouterParseError,
  OpenRouterTimeoutError,
  OpenRouterError,
} from "@/lib/errors/openrouter-errors";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_MODEL = "openai/gpt-4o-mini";

/**
 * OpenRouter API client
 *
 * Server-side only - never import in browser code
 */
export class OpenRouterClient {
  // Private fields using JavaScript private field syntax
  readonly #apiKey: string;
  readonly #model: string;
  readonly #siteUrl?: string;
  readonly #siteName?: string;
  readonly #timeout: number;
  readonly #maxRetries: number;
  readonly #endpoint = OPENROUTER_ENDPOINT;

  /**
   * Creates a new OpenRouter client instance
   *
   * @param config - Optional configuration (overrides env vars)
   * @throws {OpenRouterConfigError} If API key is missing
   * @throws {OpenRouterConfigError} If used in browser context
   *
   * @example
   * ```typescript
   * // Default (from env vars)
   * const client = new OpenRouterClient();
   *
   * // With custom config
   * const client = new OpenRouterClient({
   *   apiKey: 'sk-or-...',
   *   model: 'openai/gpt-4o-mini',
   *   timeout: 60000
   * });
   * ```
   */
  constructor(config?: OpenRouterClientConfig) {
    // Prevent browser usage (server-side only)
    if (typeof window !== "undefined") {
      throw new OpenRouterConfigError(
        "OpenRouterClient can only be used server-side. DO NOT import in client components."
      );
    }

    // Load configuration from environment variables with config overrides
    this.#apiKey = config?.apiKey ?? process.env.OPENROUTER_API_KEY ?? "";
    this.#model =
      config?.model ?? process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL;
    this.#siteUrl = config?.siteUrl ?? process.env.OPENROUTER_SITE_URL;
    this.#siteName = config?.siteName ?? process.env.OPENROUTER_SITE_NAME;
    this.#timeout = config?.timeout ?? DEFAULT_TIMEOUT_MS;
    this.#maxRetries = config?.maxRetries ?? DEFAULT_MAX_RETRIES;

    // Validate required configuration
    if (!this.#apiKey) {
      throw new OpenRouterConfigError(
        "OPENROUTER_API_KEY is not configured. Please set it in your .env.local file."
      );
    }

    // Warn about unusual API key format (expected: sk-or-...)
    if (!this.#apiKey.startsWith("sk-")) {
      console.warn(
        '[OpenRouterClient] API key format looks unusual (expected "sk-..." prefix)'
      );
    }
  }

  /**
   * Generates flashcard proposals from input text using OpenRouter API
   *
   * Implements retry logic for transient failures:
   * - Max 3 attempts (initial + 2 retries)
   * - Exponential backoff (1s, 2s, 4s)
   * - Retries on: timeout, 503, 429
   *
   * @param inputText - User-provided text to generate flashcards from (1000-10000 chars)
   * @returns Array of flashcard proposals (4-10 items)
   * @throws {Error} If input validation fails
   * @throws {OpenRouterError} If generation fails after all retries
   *
   * @example
   * ```typescript
   * const client = new OpenRouterClient();
   * const flashcards = await client.generateFlashcards(
   *   "React Hooks to funkcje wprowadzone w React 16.8..."
   * );
   * // Returns: [{ front: "Co to jest useState?", back: "..." }, ...]
   * ```
   */
  async generateFlashcards(inputText: string): Promise<AiProposalDto[]> {
    // Input validation
    this.#validateInput(inputText);

    // Retry loop
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.#maxRetries; attempt++) {
      try {
        // Make request to OpenRouter
        const response = await this.#executeRequest(inputText);

        // Parse and validate response
        const flashcards = this.#parseFlashcardsFromResponse(response);

        // Success - return flashcards
        return flashcards;
      } catch (error) {
        lastError = error as Error;

        // Check if error is retryable
        const isRetryable = this.#isRetryableError(error);
        const isLastAttempt = attempt === this.#maxRetries;

        // If non-retryable or last attempt, throw immediately
        if (!isRetryable || isLastAttempt) {
          throw error;
        }

        // Calculate backoff delay
        const delay = this.#calculateBackoffDelay(attempt);

        // Log retry attempt
        console.warn(
          `[OpenRouterClient] Request failed (attempt ${attempt}/${this.#maxRetries}), retrying in ${delay}ms`,
          {
            error: error instanceof Error ? error.message : String(error),
          }
        );

        // Wait before retry
        await this.#sleep(delay);
      }
    }

    // This should never happen (safety fallback)
    throw (
      lastError ||
      new OpenRouterError("Failed after retries", "RETRY_EXHAUSTED", false)
    );
  }

  /**
   * Validates input text before sending to API
   *
   * Checks length constraints (1000-10000 chars per PRD)
   *
   * @param inputText - User input text
   * @throws {Error} If validation fails
   * @private
   */
  #validateInput(inputText: string): void {
    // Check if not empty
    if (!inputText || inputText.trim().length === 0) {
      throw new Error("Input text cannot be empty");
    }

    // Check minimum length (1000 chars per PRD requirement F-04)
    if (inputText.length < 1000) {
      throw new Error("Input text must be at least 1000 characters");
    }

    // Check maximum length (10000 chars per PRD requirement F-04)
    if (inputText.length > 10000) {
      throw new Error("Input text cannot exceed 10000 characters");
    }
  }

  /**
   * Checks if error is retryable
   *
   * Uses retryable flag from OpenRouterError instances
   *
   * @param error - Caught error
   * @returns True if error should be retried, false otherwise
   * @private
   */
  #isRetryableError(error: unknown): boolean {
    // Check if it's an OpenRouterError with retryable flag
    if (error instanceof OpenRouterError) {
      return error.retryable;
    }

    // Unknown errors are not retryable (conservative approach)
    return false;
  }

  /**
   * Calculates backoff delay for retry attempts
   *
   * Uses exponential backoff: 1s, 2s, 4s
   *
   * @param attempt - Current attempt number (1, 2, 3)
   * @returns Delay in milliseconds
   * @private
   */
  #calculateBackoffDelay(attempt: number): number {
    const baseDelay = 1000; // 1 second

    // Exponential backoff: 1s, 2s, 4s, 8s, ...
    return baseDelay * Math.pow(2, attempt - 1);
  }

  /**
   * Creates system prompt for flashcard generation
   *
   * Hardcoded Polish prompt with instructions for AI model
   *
   * @private
   */
  #createSystemPrompt(): string {
    return `Jesteś ekspertem w tworzeniu fiszek edukacyjnych.

ZADANIE: Na podstawie dostarczonego tekstu wygeneruj 4-10 fiszek do nauki.

WYMAGANIA:
- Każda fiszka: pytanie (front) + odpowiedź (back)
- Pytania: zwięzłe, konkretne, testujące zrozumienie kluczowych informacji (max 300 znaków)
- Odpowiedzi: pełne, treściwe (max 600 znaków)
- Język: polski
- Format: Odpowiedz TYLKO w formacie JSON zgodnym ze schematem

ZASADY TWORZENIA FISZEK:
- Unikaj trywialnych pytań typu "Co to jest X?" jeśli odpowiedź to tylko definicja
- Pytaj o kluczowe koncepcje, związki przyczynowo-skutkowe, zastosowania
- Odpowiedzi powinny być samowystarczające (zrozumiałe bez kontekstu pytania)
- Generuj tyle fiszek, ile wymaga materiał (4-10)

PRZYKŁAD DOBREJ FISZKI:
{
  "front": "Jakie są główne zalety React Hooks w porównaniu z class components?",
  "back": "Hooks eliminują potrzebę używania klas, pozwalają na łatwiejsze współdzielenie logiki między komponentami (custom hooks), redukują boilerplate code i poprawiają czytelność poprzez grupowanie powiązanej logiki."
}

WAŻNE:
- Zwróć TYLKO obiekt JSON, bez dodatkowego tekstu ani markdown
- Nie przekraczaj limitów znaków (front: 300, back: 600)
- Wszystkie fiszki muszą być w języku polskim`;
  }

  /**
   * Creates user prompt from input text
   *
   * @param inputText - Text to generate flashcards from
   * @private
   */
  #createUserPrompt(inputText: string): string {
    const cleanedText = inputText.trim();
    return `Wygeneruj fiszki na podstawie poniższego tekstu:\n\n${cleanedText}`;
  }

  /**
   * Creates JSON Schema for structured response format
   *
   * Enforces response structure: { flashcards: Array<{front, back}> }
   *
   * @private
   */
  #createResponseFormat(): ResponseFormat {
    const schema: JsonSchema = {
      type: "object",
      properties: {
        flashcards: {
          type: "array",
          description: "Tablica 4-10 propozycji fiszek",
          items: {
            type: "object",
            properties: {
              front: {
                type: "string",
                description:
                  "Pytanie na przedniej stronie fiszki (max 300 znaków)",
                maxLength: 300,
              },
              back: {
                type: "string",
                description:
                  "Odpowiedź na tylnej stronie fiszki (max 600 znaków)",
                maxLength: 600,
              },
            },
            required: ["front", "back"],
            additionalProperties: false,
          },
          minItems: 4,
          maxItems: 10,
        },
      },
      required: ["flashcards"],
      additionalProperties: false,
    };

    return {
      type: "json_schema",
      json_schema: {
        name: "flashcard_proposals",
        strict: true,
        schema,
      },
    };
  }

  /**
   * Builds request body for OpenRouter API
   *
   * @param inputText - User input text
   * @private
   */
  #buildRequestBody(inputText: string): OpenRouterRequestBody {
    const messages: OpenRouterMessage[] = [
      {
        role: "system",
        content: this.#createSystemPrompt(),
      },
      {
        role: "user",
        content: this.#createUserPrompt(inputText),
      },
    ];

    return {
      model: this.#model,
      messages,
      response_format: this.#createResponseFormat(),
      temperature: 0.7,
      max_tokens: 2000,
    };
  }

  /**
   * Builds HTTP headers for OpenRouter request
   *
   * @private
   */
  #buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.#apiKey}`,
      "Content-Type": "application/json",
    };

    // Optional: OpenRouter leaderboard headers
    if (this.#siteUrl) {
      headers["HTTP-Referer"] = this.#siteUrl;
    }

    if (this.#siteName) {
      headers["X-Title"] = this.#siteName;
    }

    return headers;
  }

  /**
   * Executes HTTP request to OpenRouter API
   *
   * @param inputText - User input text
   * @returns OpenRouter API response
   * @throws {OpenRouterTimeoutError} If request exceeds timeout
   * @throws {OpenRouterNetworkError} If network/fetch fails
   * @throws {OpenRouterApiError} If HTTP error response (4xx, 5xx)
   * @private
   */
  async #executeRequest(inputText: string): Promise<OpenRouterResponse> {
    const requestBody = this.#buildRequestBody(inputText);
    const headers = this.#buildHeaders();

    // Setup timeout with AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.#timeout);

    try {
      const response = await fetch(this.#endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle HTTP error responses
      if (!response.ok) {
        await this.#handleHttpError(response);
      }

      // Parse JSON response
      const data: OpenRouterResponse = await response.json();

      // Log in development mode
      if (process.env.NODE_ENV === "development") {
        this.#logResponse(data);
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      this.#handleRequestError(error);
    }
  }

  /**
   * Handles errors from fetch request
   *
   * Maps different error types to appropriate OpenRouter errors
   *
   * @param error - Caught error from fetch
   * @throws {OpenRouterTimeoutError} If AbortError (timeout)
   * @throws {OpenRouterNetworkError} If network/fetch error
   * @throws {OpenRouterError} If unknown error
   * @private
   */
  #handleRequestError(error: unknown): never {
    // Handle timeout (AbortError)
    if (error instanceof Error && error.name === "AbortError") {
      throw new OpenRouterTimeoutError(this.#timeout);
    }

    // Handle network errors (TypeError from fetch)
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new OpenRouterNetworkError(
        "Nie można połączyć się z usługą AI. Sprawdź połączenie internetowe.",
        { originalError: error.message }
      );
    }

    // Re-throw OpenRouter errors
    if (error instanceof OpenRouterError) {
      throw error;
    }

    // Unknown errors
    throw new OpenRouterError(
      "Nieoczekiwany błąd podczas komunikacji z AI",
      "OPENROUTER_UNKNOWN_ERROR",
      false,
      { originalError: error }
    );
  }

  /**
   * Handles HTTP error responses from OpenRouter API
   *
   * Maps status codes to appropriate error classes with retryability info
   *
   * @param response - Fetch Response object with error status
   * @throws {OpenRouterApiError} Always throws with appropriate error details
   * @private
   */
  async #handleHttpError(response: Response): Promise<never> {
    const errorBody = await response.text();

    // Log full error details in development
    if (process.env.NODE_ENV === "development") {
      console.error("[OpenRouterClient] API Error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
        headers: Object.fromEntries(response.headers.entries()),
      });
    }

    // Map status codes to errors with retryability
    switch (response.status) {
      case 400:
        throw new OpenRouterApiError(
          "Nieprawidłowe dane wysłane do API. Skontaktuj się z administratorem.",
          400,
          false // non-retryable
        );

      case 401:
        throw new OpenRouterApiError(
          "Błąd autoryzacji API. Sprawdź klucz API w konfiguracji.",
          401,
          false // non-retryable
        );

      case 429: {
        // Check for Retry-After header
        const retryAfter = response.headers.get("Retry-After");
        const retryMessage = retryAfter
          ? `Spróbuj ponownie za ${retryAfter} sekund.`
          : "Spróbuj ponownie za moment.";

        throw new OpenRouterApiError(
          `Usługa AI jest chwilowo przeciążona. ${retryMessage}`,
          429,
          true // retryable
        );
      }

      case 500:
        throw new OpenRouterApiError(
          "Wewnętrzny błąd usługi AI. Spróbuj ponownie później.",
          500,
          false // non-retryable (likely persistent)
        );

      case 503:
        throw new OpenRouterApiError(
          "Usługa AI jest chwilowo niedostępna. Spróbuj ponownie za moment.",
          503,
          true // retryable
        );

      default:
        throw new OpenRouterApiError(
          `Błąd API (${response.status}): ${response.statusText}`,
          response.status,
          false // non-retryable by default
        );
    }
  }

  /**
   * Logs OpenRouter response details (development only)
   *
   * Includes token usage, cost estimation, and response metadata
   *
   * @param response - OpenRouter API response
   * @private
   */
  #logResponse(response: OpenRouterResponse): void {
    console.log("[OpenRouterClient] OpenRouter API Response:", {
      id: response.id,
      model: response.model,
      created: new Date(response.created * 1000).toISOString(),
      choices: response.choices.length,
      finishReason: response.choices[0]?.finish_reason,
      contentPreview:
        response.choices[0]?.message?.content?.substring(0, 200) + "...",
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
            estimatedCost: this.#estimateCost(response.usage.total_tokens),
          }
        : null,
    });
  }

  /**
   * Estimates cost for token usage (gpt-4o-mini pricing)
   *
   * Pricing (as of 2024):
   * - Input: $0.15 per 1M tokens
   * - Output: $0.60 per 1M tokens
   * - Average: $0.375 per 1M tokens (assuming 50/50 split)
   *
   * @param totalTokens - Total tokens used
   * @returns Formatted cost estimate string
   * @private
   */
  #estimateCost(totalTokens: number): string {
    const costPer1MTokens = 0.375; // Average of input/output
    const cost = (totalTokens / 1_000_000) * costPer1MTokens;
    return `~$${cost.toFixed(6)}`;
  }

  /**
   * Extracts and parses JSON from OpenRouter response content
   *
   * Handles markdown code blocks that may wrap the JSON response
   *
   * @param content - Raw content string from OpenRouter
   * @returns Parsed JSON object
   * @throws {OpenRouterParseError} If JSON parsing fails
   * @private
   */
  #extractAndParseJSON(content: string): unknown {
    let jsonContent = content.trim();

    // Remove markdown code blocks if present (```json ... ``` or ``` ... ```)
    if (jsonContent.includes("```")) {
      jsonContent = jsonContent
        .replace(/^```json?\s*\n?/i, "") // Remove opening ```json or ```
        .replace(/\n?```\s*$/i, "") // Remove closing ```
        .trim();
    }

    try {
      return JSON.parse(jsonContent);
    } catch (error) {
      console.error("[OpenRouterClient] JSON parse error:", {
        content: jsonContent.substring(0, 500),
        error: error instanceof Error ? error.message : String(error),
      });
      throw new OpenRouterParseError(
        "Nie udało się przetworzyć odpowiedzi AI (nieprawidłowy format JSON)",
        { rawContent: jsonContent.substring(0, 200) }
      );
    }
  }

  /**
   * Type guard to validate flashcard structure
   *
   * Checks if object matches { front: string, back: string } with length constraints
   *
   * @param card - Object to validate
   * @returns True if valid flashcard, false otherwise
   * @private
   */
  #isValidFlashcard(card: unknown): card is { front: string; back: string } {
    if (typeof card !== "object" || card === null) return false;
    if (!("front" in card) || !("back" in card)) return false;

    const record = card as Record<string, unknown>;
    return (
      typeof record.front === "string" &&
      typeof record.back === "string" &&
      record.front.length > 0 &&
      record.back.length > 0 &&
      record.front.length <= 300 &&
      record.back.length <= 600
    );
  }

  /**
   * Parses flashcards from OpenRouter API response
   *
   * Extracts content, validates structure, filters invalid cards
   *
   * @param response - OpenRouter API response
   * @returns Array of validated flashcard proposals
   * @throws {OpenRouterParseError} If response missing content or no valid flashcards
   * @private
   */
  #parseFlashcardsFromResponse(response: OpenRouterResponse): AiProposalDto[] {
    // Extract content from first choice
    const content = response.choices?.[0]?.message?.content;

    if (!content) {
      throw new OpenRouterParseError("OpenRouter response missing content", {
        responseId: response.id,
        choices: response.choices?.length ?? 0,
      });
    }

    // Log raw content in development
    if (process.env.NODE_ENV === "development") {
      console.log(
        "[OpenRouterClient] Raw AI response:",
        content.substring(0, 200) + "..."
      );
    }

    // Parse JSON from content
    const parsedData = this.#extractAndParseJSON(content);

    // Validate structure (must have flashcards array)
    if (
      typeof parsedData !== "object" ||
      parsedData === null ||
      !("flashcards" in parsedData)
    ) {
      throw new OpenRouterParseError(
        "Odpowiedź AI ma nieprawidłowy format (brak tablicy flashcards)",
        { parsedData }
      );
    }

    const data = parsedData as { flashcards: unknown };

    if (!Array.isArray(data.flashcards)) {
      throw new OpenRouterParseError(
        "Odpowiedź AI ma nieprawidłowy format (flashcards nie jest tablicą)",
        { parsedData }
      );
    }

    // Filter and validate each flashcard
    const validated: AiProposalDto[] = [];

    for (const card of data.flashcards) {
      if (this.#isValidFlashcard(card)) {
        validated.push({
          front: card.front.trim(),
          back: card.back.trim(),
        });
      } else {
        console.warn("[OpenRouterClient] Skipping invalid flashcard:", card);
      }
    }

    // Ensure we have at least some valid flashcards
    if (validated.length === 0) {
      throw new OpenRouterParseError(
        "AI nie wygenerowało żadnych prawidłowych fiszek. Spróbuj ponownie.",
        {
          totalProposals: data.flashcards.length,
          validProposals: 0,
        }
      );
    }

    return validated;
  }

  /**
   * Sleep utility for retry delays
   *
   * @param ms - Milliseconds to sleep
   * @private
   */
  #sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
