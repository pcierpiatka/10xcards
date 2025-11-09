/**
 * Environment detection logic
 *
 * Reads ENV_NAME from process.env and validates against allowed values
 */

import type { Environment } from "./types";
import { ENVIRONMENTS, ERROR_MESSAGES } from "./types";

/**
 * Get current application environment
 *
 * Reads ENV_NAME environment variable with fallback to 'local'
 * Validates against ENVIRONMENTS array
 *
 * @returns Current environment ('local' | 'integration' | 'production')
 * @throws Error if ENV_NAME contains unknown environment value
 *
 * @example
 * ```typescript
 * // ENV_NAME=production
 * const env = getEnvironment(); // 'production'
 *
 * // ENV_NAME not set
 * const env = getEnvironment(); // 'local' (fallback)
 *
 * // ENV_NAME=staging (unknown)
 * const env = getEnvironment(); // throws Error
 * ```
 */
export function getEnvironment(): Environment {
  const envName = process.env.ENV_NAME;

  // Fallback to 'local' if not set (developer-friendly default)
  if (!envName) {
    if (process.env.NODE_ENV !== "test") {
      console.warn(ERROR_MESSAGES.MISSING_ENV_NAME);
    }
    return "local";
  }

  // Validate against allowed environments
  if (!ENVIRONMENTS.includes(envName as Environment)) {
    throw new Error(ERROR_MESSAGES.UNKNOWN_ENVIRONMENT(envName));
  }

  return envName as Environment;
}
