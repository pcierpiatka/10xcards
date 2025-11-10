/**
 * API route guard for feature flags
 *
 * Server-only module for protecting API endpoints
 */

import { NextResponse } from "next/server";
import { isFeatureEnabled } from "../core/is-feature-enabled";
import { ERROR_CODES, ERROR_MESSAGES } from "@/lib/constants";
import type { FeatureName, FlagsConfig } from "../core/types";

/**
 * Guard function for API routes
 *
 * Checks if a feature flag is enabled and returns appropriate response.
 * Uses early return pattern: returns error response if disabled, null if enabled.
 *
 * **IMPORTANT: Call this BEFORE any business logic in your route handler**
 *
 * @param featureName - Feature flag to check (e.g., 'auth.login')
 * @param config - Optional custom config (for testing). If not provided, loads from flags.json
 * @returns NextResponse with 403 error if disabled, null if enabled
 *
 * @example Basic usage
 * ```typescript
 * // app/api/auth/login/route.ts
 * import { requireFeature } from '@/lib/features';
 *
 * export async function POST(request: Request) {
 *   // 🛡️ GUARD - Check flag BEFORE any logic
 *   const guardError = requireFeature('auth.login');
 *   if (guardError) return guardError;
 *
 *   // ✅ Feature enabled - execute business logic
 *   const { email, password } = await request.json();
 *   // ... login logic
 * }
 * ```
 *
 * @example With collections
 * ```typescript
 * // app/api/collections/route.ts
 * import { requireFeature } from '@/lib/features';
 *
 * export async function POST(request: Request) {
 *   const guardError = requireFeature('collections.create');
 *   if (guardError) return guardError;
 *
 *   // ... create collection logic
 * }
 *
 * export async function GET(request: Request) {
 *   const guardError = requireFeature('collections.list');
 *   if (guardError) return guardError;
 *
 *   // ... list collections logic
 * }
 * ```
 *
 * @example Early return pattern (recommended)
 * ```typescript
 * export async function POST(request: Request) {
 *   // Guard at the top - clear intent
 *   const guardError = requireFeature('auth.register');
 *   if (guardError) return guardError;
 *
 *   // All code below this line only runs if feature is enabled
 *   const body = await request.json();
 *   // ...
 * }
 * ```
 */
export function requireFeature(
  featureName: FeatureName,
  config?: FlagsConfig
): NextResponse | null {
  if (!isFeatureEnabled(featureName, config)) {
    return NextResponse.json(
      {
        error: ERROR_MESSAGES.FEATURE_DISABLED,
        code: ERROR_CODES.FEATURE_DISABLED,
        feature: featureName,
      },
      { status: 403 }
    );
  }

  // Feature enabled - return null to signal "continue"
  return null;
}
