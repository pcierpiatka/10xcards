/**
 * Feature Flags - Public API
 *
 * Single entry point for all feature flag functionality.
 * Import everything from '@/lib/features' in your application.
 *
 * @example Basic imports
 * ```typescript
 * import { isFeatureEnabled, requireFeature, FeatureFlag, useFeature } from '@/lib/features';
 * ```
 *
 * @example Type imports
 * ```typescript
 * import type { FeatureName, Environment } from '@/lib/features';
 * ```
 */

// Core functionality (universal - works everywhere)
export { isFeatureEnabled } from "./core/is-feature-enabled";
export { getEnvironment } from "./core/get-environment";

// API guards (server-only)
export { requireFeature } from "./api/require-feature";

// React components and hooks
export { FeatureFlag } from "./react/FeatureFlag";
export type { FeatureFlagProps } from "./react/FeatureFlag";
export { useFeature } from "./react/use-feature";
export type { UseFeatureResult } from "./react/use-feature";

// Types
export type { FeatureName, Environment } from "./core/types";

/**
 * Usage examples by context:
 *
 * @example API Route
 * ```typescript
 * // app/api/auth/login/route.ts
 * import { requireFeature } from '@/lib/features';
 *
 * export async function POST(request: Request) {
 *   const guardError = requireFeature('auth.login');
 *   if (guardError) return guardError;
 *
 *   // ... login logic
 * }
 * ```
 *
 * @example Server Component
 * ```typescript
 * // app/dashboard/page.tsx
 * import { FeatureFlag, isFeatureEnabled } from '@/lib/features';
 *
 * export default function DashboardPage() {
 *   const canCreateCollections = isFeatureEnabled('collections.create');
 *
 *   return (
 *     <div>
 *       <h1>Dashboard</h1>
 *       <FeatureFlag name="collections.visibility">
 *         <CollectionsWidget />
 *       </FeatureFlag>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example Client Component
 * ```typescript
 * // components/Navigation.tsx
 * 'use client';
 * import { useFeature, FeatureFlag } from '@/lib/features';
 * import Link from 'next/link';
 *
 * export function Navigation() {
 *   const { isEnabled: showCollections } = useFeature('collections.visibility');
 *
 *   return (
 *     <nav>
 *       <Link href="/dashboard">Dashboard</Link>
 *       {showCollections && (
 *         <Link href="/collections">Collections</Link>
 *       )}
 *     </nav>
 *   );
 * }
 * ```
 *
 * @example Middleware (future use)
 * ```typescript
 * // middleware.ts
 * import { isFeatureEnabled } from '@/lib/features';
 *
 * export function middleware(request: Request) {
 *   if (!isFeatureEnabled('auth.login')) {
 *     return NextResponse.redirect('/maintenance');
 *   }
 * }
 * ```
 */
