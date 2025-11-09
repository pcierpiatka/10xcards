/**
 * Core feature flag evaluation logic
 *
 * Universal function that works in all contexts:
 * - API routes (Next.js route handlers)
 * - Server Components
 * - Client Components
 * - Middleware
 */

import type { FeatureName } from "./types";
import { getEnvironment } from "./get-environment";
import flagsConfig from "../config/flags.json";

/**
 * Check if a feature flag is enabled in current environment
 *
 * Returns boolean indicating whether the feature is enabled.
 * Default behavior: if flag is not defined, returns false (safe default)
 *
 * @param name - Feature flag name (e.g., 'auth.login', 'collections.create')
 * @returns true if feature is enabled, false otherwise
 *
 * @example API Route
 * ```typescript
 * // app/api/auth/login/route.ts
 * import { isFeatureEnabled } from '@/lib/features';
 *
 * export async function POST(request: Request) {
 *   if (!isFeatureEnabled('auth.login')) {
 *     return NextResponse.json(
 *       { error: 'Feature not available' },
 *       { status: 403 }
 *     );
 *   }
 *   // ... login logic
 * }
 * ```
 *
 * @example Server Component
 * ```typescript
 * // app/dashboard/page.tsx
 * import { isFeatureEnabled } from '@/lib/features';
 *
 * export default function DashboardPage() {
 *   const canCreateCollections = isFeatureEnabled('collections.create');
 *
 *   return (
 *     <div>
 *       {canCreateCollections && <CreateCollectionButton />}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example Client Component
 * ```typescript
 * 'use client';
 * import { isFeatureEnabled } from '@/lib/features';
 *
 * export function Navigation() {
 *   const showCollections = isFeatureEnabled('collections.visibility');
 *
 *   return (
 *     <nav>
 *       <Link href="/dashboard">Dashboard</Link>
 *       {showCollections && <Link href="/collections">Collections</Link>}
 *     </nav>
 *   );
 * }
 * ```
 */
export function isFeatureEnabled(name: FeatureName): boolean {
  try {
    const environment = getEnvironment();
    const envConfig = flagsConfig[environment];

    // Default OFF: if flag not defined in config, return false
    if (!(name in envConfig)) {
      return false;
    }

    return envConfig[name as keyof typeof envConfig] === true;
  } catch (error) {
    // If environment detection fails, fail safe: return false
    console.error(`Feature flag check failed for "${name}":`, error);
    return false;
  }
}
