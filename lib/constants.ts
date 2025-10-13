// Application constants

/**
 * Flashcard constraints
 */
export const FLASHCARD = {
  FRONT_MAX_LENGTH: 300,
  BACK_MAX_LENGTH: 600,
  MIN_TEXT_LENGTH: 1000,
  MAX_TEXT_LENGTH: 10000,
  MAX_GENERATION_COUNT: 10,
} as const;

/**
 * Rate limiting
 */
export const RATE_LIMITS = {
  AI_GENERATIONS_PER_HOUR: 10,
  API_REQUESTS_PER_MINUTE: 60,
} as const;

/**
 * API endpoints
 */
export const API_ROUTES = {
  HEALTH: "/api/health",
  FLASHCARDS: "/api/flashcards",
  GENERATE: "/api/generate",
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    LOGOUT: "/api/auth/logout",
  },
} as const;

/**
 * Application routes
 */
export const APP_ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  LEARN: "/learn",
  LOGIN: "/login",
  REGISTER: "/register",
} as const;

/**
 * OpenRouter configuration
 */
export const OPENROUTER = {
  DEFAULT_MODEL: "openai/gpt-4o-mini",
  API_URL: "https://openrouter.ai/api/v1",
} as const;

/**
 * Error codes
 */
export const ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  AI_GENERATION_FAILED: "AI_GENERATION_FAILED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  FLASHCARD_CREATED: "Flashcard created successfully",
  FLASHCARD_UPDATED: "Flashcard updated successfully",
  FLASHCARD_DELETED: "Flashcard deleted successfully",
  FLASHCARDS_GENERATED: "Flashcards generated successfully",
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  UNAUTHORIZED: "You must be logged in to perform this action",
  FORBIDDEN: "You don't have permission to perform this action",
  NOT_FOUND: "The requested resource was not found",
  VALIDATION_ERROR: "Please check your input and try again",
  RATE_LIMIT_EXCEEDED: "You've exceeded the rate limit. Please try again later",
  AI_GENERATION_FAILED: "Failed to generate flashcards. Please try again later",
  INTERNAL_ERROR: "An unexpected error occurred. Please try again later",
  TEXT_TOO_SHORT: `Text must be at least ${FLASHCARD.MIN_TEXT_LENGTH} characters`,
  TEXT_TOO_LONG: `Text must be no more than ${FLASHCARD.MAX_TEXT_LENGTH} characters`,
  FRONT_TOO_LONG: `Front of flashcard must be no more than ${FLASHCARD.FRONT_MAX_LENGTH} characters`,
  BACK_TOO_LONG: `Back of flashcard must be no more than ${FLASHCARD.BACK_MAX_LENGTH} characters`,
} as const;
