/**
 * Custom error classes for OpenRouter API integration
 *
 * Hierarchy:
 * - OpenRouterError (base)
 *   - OpenRouterConfigError (configuration issues)
 *   - OpenRouterNetworkError (network/timeout failures)
 *   - OpenRouterApiError (HTTP error responses)
 *   - OpenRouterParseError (JSON parsing failures)
 */

/**
 * Base error class for all OpenRouter-related errors
 */
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable = false,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "OpenRouterError";

    // Maintain proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Configuration error (missing or invalid API key)
 *
 * Non-retryable - indicates setup issue that must be fixed
 *
 * @example
 * throw new OpenRouterConfigError('OPENROUTER_API_KEY is not configured')
 */
export class OpenRouterConfigError extends OpenRouterError {
  constructor(message: string) {
    super(message, "OPENROUTER_CONFIG_ERROR", false);
    this.name = "OpenRouterConfigError";
  }
}

/**
 * Network error (timeout, connection failure)
 *
 * Retryable - may succeed on retry
 *
 * @example
 * throw new OpenRouterNetworkError('Request timeout after 30s')
 */
export class OpenRouterNetworkError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, "OPENROUTER_NETWORK_ERROR", true, details);
    this.name = "OpenRouterNetworkError";
  }
}

/**
 * HTTP API error (4xx or 5xx status codes)
 *
 * Retryability depends on status code:
 * - 429 (Rate Limit): Retryable
 * - 503 (Service Unavailable): Retryable
 * - 400, 401, 404, 500: Non-retryable
 *
 * @example
 * throw new OpenRouterApiError('Unauthorized', 401, false)
 */
export class OpenRouterApiError extends OpenRouterError {
  constructor(
    message: string,
    public readonly statusCode: number,
    retryable = false
  ) {
    super(message, `OPENROUTER_API_${statusCode}`, retryable);
    this.name = "OpenRouterApiError";
  }
}

/**
 * JSON parsing error (malformed response)
 *
 * Non-retryable - indicates issue with AI response format
 *
 * @example
 * throw new OpenRouterParseError('Invalid JSON in response', { content: '...' })
 */
export class OpenRouterParseError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, "OPENROUTER_PARSE_ERROR", false, details);
    this.name = "OpenRouterParseError";
  }
}

/**
 * Timeout error (request exceeded time limit)
 *
 * Retryable - may succeed with longer timeout or on retry
 *
 * @example
 * throw new OpenRouterTimeoutError(30000)
 */
export class OpenRouterTimeoutError extends OpenRouterError {
  constructor(timeoutMs: number) {
    super(
      `Przekroczono limit czasu oczekiwania na odpowiedź AI (${timeoutMs / 1000}s)`,
      "OPENROUTER_TIMEOUT",
      true
    );
    this.name = "OpenRouterTimeoutError";
  }
}
