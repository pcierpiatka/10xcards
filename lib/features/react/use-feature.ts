/**
 * React hook for feature flag conditional logic
 *
 * Use this hook when you need to make decisions based on feature flags
 * within your component logic (as opposed to conditional rendering).
 */

import { isFeatureEnabled } from "../core/is-feature-enabled";
import type { FeatureName, FlagsConfig } from "../core/types";

/**
 * Return type for useFeature hook
 *
 * Object structure allows for future expansion without breaking changes
 * (e.g., adding isLoading, error, metadata)
 */
export interface UseFeatureResult {
  /**
   * Whether the feature is enabled in current environment
   */
  isEnabled: boolean;
}

/**
 * Hook to check feature flag status in React components
 *
 * Returns an object with `isEnabled` boolean.
 * Use for conditional logic, event handlers, or computed values.
 *
 * For conditional rendering, prefer `<FeatureFlag>` component instead.
 *
 * @param name - Feature flag name to check
 * @param config - Optional custom config (for testing). If not provided, loads from flags.json
 * @returns Object with `isEnabled` boolean
 *
 * @example Conditional navigation links
 * ```tsx
 * 'use client';
 * import { useFeature } from '@/lib/features';
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
 * @example Conditional button behavior
 * ```tsx
 * 'use client';
 * import { useFeature } from '@/lib/features';
 *
 * export function ActionButton() {
 *   const { isEnabled: canCreate } = useFeature('collections.create');
 *
 *   const handleClick = () => {
 *     if (!canCreate) {
 *       alert('This feature is not available yet');
 *       return;
 *     }
 *     // ... create logic
 *   };
 *
 *   return (
 *     <button
 *       onClick={handleClick}
 *       disabled={!canCreate}
 *       className={!canCreate ? 'opacity-50 cursor-not-allowed' : ''}
 *     >
 *       Create Collection
 *     </button>
 *   );
 * }
 * ```
 *
 * @example Computed values
 * ```tsx
 * 'use client';
 * import { useFeature } from '@/lib/features';
 *
 * export function Dashboard() {
 *   const { isEnabled: authEnabled } = useFeature('auth.login');
 *   const { isEnabled: collectionsEnabled } = useFeature('collections.visibility');
 *
 *   const availableFeatures = [
 *     authEnabled && 'Authentication',
 *     collectionsEnabled && 'Collections',
 *   ].filter(Boolean);
 *
 *   return (
 *     <div>
 *       <h2>Available Features:</h2>
 *       <ul>
 *         {availableFeatures.map(feature => (
 *           <li key={feature}>{feature}</li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example Multiple flags
 * ```tsx
 * 'use client';
 * import { useFeature } from '@/lib/features';
 *
 * export function Settings() {
 *   const auth = useFeature('auth.login');
 *   const collections = useFeature('collections.create');
 *
 *   return (
 *     <div>
 *       <h1>Settings</h1>
 *       {auth.isEnabled && <AuthSettings />}
 *       {collections.isEnabled && <CollectionSettings />}
 *     </div>
 *   );
 * }
 * ```
 *
 * @see FeatureFlag - For conditional rendering (recommended when only showing/hiding UI)
 */
export function useFeature(
  name: FeatureName,
  config?: FlagsConfig
): UseFeatureResult {
  const isEnabled = isFeatureEnabled(name, config);

  return {
    isEnabled,
  };
}
