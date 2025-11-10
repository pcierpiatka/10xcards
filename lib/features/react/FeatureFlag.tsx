/**
 * React component for conditional rendering based on feature flags
 *
 * Works in both Server Components and Client Components
 */

import type { ReactNode } from "react";
import { isFeatureEnabled } from "../core/is-feature-enabled";
import type { FeatureName, FlagsConfig } from "../core/types";

export interface FeatureFlagProps {
  /**
   * Feature flag name to check
   */
  name: FeatureName;

  /**
   * Content to render when feature is enabled
   */
  children: ReactNode;

  /**
   * Optional fallback content to render when feature is disabled
   * If not provided, renders null (nothing)
   */
  fallback?: ReactNode;

  /**
   * Optional custom config (for testing). If not provided, loads from flags.json
   */
  config?: FlagsConfig;
}

/**
 * Conditionally render UI based on feature flag status
 *
 * Renders `children` if feature is enabled, `fallback` if disabled.
 * Uses Fragment wrapper to preserve semantics (no extra DOM nodes).
 *
 * @example Hide entire section when feature is disabled
 * ```tsx
 * <FeatureFlag name="collections.visibility">
 *   <CollectionsSection />
 * </FeatureFlag>
 * ```
 *
 * @example Show fallback message when feature is disabled
 * ```tsx
 * <FeatureFlag
 *   name="collections.create"
 *   fallback={<p>Collections coming soon!</p>}
 * >
 *   <CreateCollectionButton />
 * </FeatureFlag>
 * ```
 *
 * @example Conditional navigation link
 * ```tsx
 * <nav>
 *   <Link href="/dashboard">Dashboard</Link>
 *   <FeatureFlag name="collections.visibility">
 *     <Link href="/collections">Collections</Link>
 *   </FeatureFlag>
 * </nav>
 * ```
 *
 * @example In global header
 * ```tsx
 * function Header() {
 *   return (
 *     <header>
 *       <Logo />
 *       <nav>
 *         <Link href="/">Home</Link>
 *         <FeatureFlag name="collections.visibility">
 *           <Link href="/collections">Collections</Link>
 *         </FeatureFlag>
 *       </nav>
 *     </header>
 *   );
 * }
 * ```
 *
 * @example Server Component (default in Next.js App Router)
 * ```tsx
 * // app/dashboard/page.tsx
 * import { FeatureFlag } from '@/lib/features';
 *
 * export default function DashboardPage() {
 *   return (
 *     <div>
 *       <h1>Dashboard</h1>
 *       <FeatureFlag name="collections.create">
 *         <CreateCollectionForm />
 *       </FeatureFlag>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example Client Component
 * ```tsx
 * 'use client';
 * import { FeatureFlag } from '@/lib/features';
 *
 * export function Sidebar() {
 *   return (
 *     <aside>
 *       <FeatureFlag name="collections.visibility">
 *         <CollectionsWidget />
 *       </FeatureFlag>
 *     </aside>
 *   );
 * }
 * ```
 */
export function FeatureFlag({
  name,
  children,
  fallback = null,
  config,
}: FeatureFlagProps) {
  const isEnabled = isFeatureEnabled(name, config);

  if (!isEnabled) {
    return <>{fallback}</>;
  }

  // Wrap in Fragment to preserve semantics (no extra DOM nodes)
  return <>{children}</>;
}
