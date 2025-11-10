/**
 * Feature Flags - Core Types
 *
 * Type-safe definitions for the feature flag system.
 */

/**
 * Application environment types
 * Maps to ENV_NAME environment variable
 */
export type Environment = "local" | "integration" | "production";

/**
 * All available feature flags in the system
 *
 * Update this union type when adding new flags to flags.json
 * This ensures TypeScript autocomplete and compile-time validation
 *
 * Naming convention: domain.action (e.g., auth.login, flashcards.create.ai)
 */
export type FeatureName =
  | "auth.login"
  | "auth.register"
  | "flashcards.create.ai"
  | "flashcards.list"
  | "flashcards.edit"
  | "flashcards.delete";

/**
 * Valid environment values for validation
 */
export const ENVIRONMENTS: readonly Environment[] = [
  "local",
  "integration",
  "production",
] as const;

/**
 * Error messages for feature flag system
 */
export const ERROR_MESSAGES = {
  UNKNOWN_ENVIRONMENT: (env: string) =>
    `Unknown environment: "${env}". Expected one of: ${ENVIRONMENTS.join(", ")}`,
  MISSING_ENV_NAME:
    'ENV_NAME environment variable not set. Falling back to "local".',
} as const;
