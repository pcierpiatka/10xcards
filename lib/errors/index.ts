/**
 * Custom error classes for API error handling
 *
 * These errors are caught in route handlers and mapped to appropriate HTTP status codes.
 * Each error includes a user-friendly message and optional context for logging.
 */

/**
 * Base application error
 * All custom errors extend this class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error (400 Bad Request)
 * Used when request data fails Zod schema validation
 *
 * @example
 * throw new ValidationError("Input text must be between 1000-10000 characters", {
 *   field: "input_text",
 *   received: 500
 * });
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

/**
 * Authentication error (401 Unauthorized)
 * Used when JWT is missing or invalid
 *
 * @example
 * throw new AuthenticationError("Invalid or expired token");
 */
export class AuthenticationError extends AppError {
  constructor(message = "Musisz być zalogowany") {
    super(message, 401, "AUTHENTICATION_ERROR");
  }
}

/**
 * Authorization error (404 Not Found)
 * Used when user tries to access resource they don't own
 *
 * Note: Returns 404 instead of 403 to avoid leaking resource existence
 *
 * @example
 * throw new AuthorizationError("Flashcard not found");
 */
export class AuthorizationError extends AppError {
  constructor(message = "Nie znaleziono zasobu") {
    super(message, 404, "AUTHORIZATION_ERROR");
  }
}

/**
 * Rate limit error (429 Too Many Requests)
 * Used when user exceeds generation or request limits
 *
 * @example
 * throw new RateLimitError("Too many generations", 1234567890);
 */
export class RateLimitError extends AppError {
  constructor(
    message = "Przekroczono limit requestów",
    public readonly retryAfter?: number
  ) {
    super(message, 429, "RATE_LIMIT_ERROR", { retry_after: retryAfter });
  }
}

/**
 * External service error (500 Internal Server Error)
 * Used when external API (OpenRouter) fails
 *
 * @example
 * throw new ExternalServiceError("OpenRouter API timeout", {
 *   service: "openrouter",
 *   timeout: 30000
 * });
 */
export class ExternalServiceError extends AppError {
  constructor(
    message = "Wystąpił problem z zewnętrznym serwisem",
    details?: unknown
  ) {
    super(message, 500, "EXTERNAL_SERVICE_ERROR", details);
  }
}

/**
 * Database error (500 Internal Server Error)
 * Used when Supabase operations fail unexpectedly
 *
 * @example
 * throw new DatabaseError("Failed to insert generation record", {
 *   table: "ai_generations",
 *   operation: "insert"
 * });
 */
export class DatabaseError extends AppError {
  constructor(message = "Wystąpił problem z bazą danych", details?: unknown) {
    super(message, 500, "DATABASE_ERROR", details);
  }
}

/**
 * Not found error (404 Not Found)
 * Used when requested resource doesn't exist
 *
 * @example
 * throw new NotFoundError("Flashcard not found");
 */
export class NotFoundError extends AppError {
  constructor(message = "Nie znaleziono zasobu") {
    super(message, 404, "NOT_FOUND_ERROR");
  }
}
