/**
 * Feature flags configuration loader
 *
 * Provides centralized access to feature flags configuration.
 * Exported as a function to enable dependency injection in tests.
 */

import flagsConfig from "../config/flags.json";
import type { FlagsConfig } from "./types";

/**
 * Load feature flags configuration from JSON file
 *
 * This function is the single source of truth for feature flags configuration.
 * In production code, it loads from flags.json.
 * In tests, you can pass a custom config to feature flag functions instead.
 *
 * @returns Feature flags configuration object
 *
 * @example Production usage (automatic)
 * ```typescript
 * // No need to call directly - isFeatureEnabled() uses it internally
 * const enabled = isFeatureEnabled('auth.login');
 * ```
 *
 * @example Test usage (with custom config)
 * ```typescript
 * import testFlags from './__fixtures__/test-flags.json';
 *
 * // Pass custom config to override default
 * const enabled = isFeatureEnabled('auth.login', testFlags);
 * ```
 */
export function loadFlagsConfig(): FlagsConfig {
  return flagsConfig as FlagsConfig;
}
