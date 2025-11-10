# Feature Flags Testing Refactor - Dependency Injection

**Status:** Planning
**Created:** 2025-11-10
**Priority:** High (blocking 13 failing tests)

## Problem

Testy feature flags są kruche i zależą od rzeczywistego pliku `lib/features/config/flags.json`:

- `FeatureFlag.test.tsx` (3 failures) - oczekuje `auth.register: false` w production
- `use-feature.test.ts` (2 failures) - oczekuje `isEnabled: false` dla `auth.register`
- `is-feature-enabled.test.ts` (1 failure) - oczekuje `false` dla `auth.register`
- `require-feature.test.ts` (3 failures) - oczekuje 403 error dla `auth.register`
- `integration.test.ts` (4 failures) - oczekuje spójnego zachowania

**Root cause:** Testy importują `isFeatureEnabled()` → importuje `flags.json` → używa rzeczywistej konfiguracji

## Solution: Dependency Injection

Refactor systemu feature flags aby akceptował opcjonalny config parameter. Umożliwi to:

- ✅ Testy używają mock config bez side effects
- ✅ Kod produkcyjny nadal używa prawdziwego `flags.json`
- ✅ Backward compatibility (parametr opcjonalny)
- ✅ Łatwe testowanie edge cases

## Architecture Changes

### 1. New Files

```
lib/features/
  ├── core/
  │   ├── config-loader.ts           [NEW] - funkcja loadFlagsConfig()
  │   └── types.ts                    [UPDATE] - dodać FlagsConfig type
  └── __tests__/
      └── __fixtures__/
          └── test-flags.json          [NEW] - mock config dla testów
```

### 2. Modified Files

**Core layer:**

- `lib/features/core/is-feature-enabled.ts` - dodać parametr `config?: FlagsConfig`
- `lib/features/core/types.ts` - dodać `FlagsConfig` type export

**API layer:**

- `lib/features/api/require-feature.ts` - dodać parametr `config?: FlagsConfig`

**React layer:**

- `lib/features/react/use-feature.ts` - dodać parametr `config?: FlagsConfig`
- `lib/features/react/FeatureFlag.tsx` - dodać prop `config?: FlagsConfig`

**Tests (5 files):**

- `lib/features/react/__tests__/FeatureFlag.test.tsx`
- `lib/features/react/__tests__/use-feature.test.ts`
- `lib/features/core/__tests__/is-feature-enabled.test.ts`
- `lib/features/api/__tests__/require-feature.test.ts`
- `lib/features/__tests__/integration.test.ts`

## Implementation Plan

### Task 1: Create config loader and types

**File:** `lib/features/core/config-loader.ts`

```typescript
import flagsConfig from "../config/flags.json";
import type { FlagsConfig } from "./types";

/**
 * Load feature flags configuration
 * Exported for testing purposes (dependency injection)
 */
export function loadFlagsConfig(): FlagsConfig {
  return flagsConfig as FlagsConfig;
}
```

**File:** `lib/features/core/types.ts` (UPDATE)

```typescript
// Add new type export
export type FlagsConfig = {
  [env in Environment]: {
    [key in FeatureName]: boolean;
  };
};
```

### Task 2: Create test fixtures

**File:** `lib/features/__tests__/__fixtures__/test-flags.json`

```json
{
  "local": {
    "auth.login": true,
    "auth.register": true,
    "flashcards.create.ai": true,
    "flashcards.list": true,
    "flashcards.edit": false,
    "flashcards.delete": true
  },
  "integration": {
    "auth.login": true,
    "auth.register": true,
    "flashcards.create.ai": true,
    "flashcards.list": true,
    "flashcards.edit": true,
    "flashcards.delete": true
  },
  "production": {
    "auth.login": true,
    "auth.register": false,
    "flashcards.create.ai": true,
    "flashcards.list": true,
    "flashcards.edit": true,
    "flashcards.delete": true
  }
}
```

**Kluczowa różnica:** `production.auth.register: false` (testy tego oczekują)

### Task 3: Refactor `isFeatureEnabled()`

**File:** `lib/features/core/is-feature-enabled.ts`

**Przed:**

```typescript
export function isFeatureEnabled(name: FeatureName): boolean {
  const environment = getEnvironment();
  const envConfig = flagsConfig[environment];
  // ...
}
```

**Po:**

```typescript
import { loadFlagsConfig } from "./config-loader";
import type { FlagsConfig } from "./types";

export function isFeatureEnabled(
  name: FeatureName,
  config?: FlagsConfig
): boolean {
  try {
    const environment = getEnvironment();
    const flagsConfig = config || loadFlagsConfig();
    const envConfig = flagsConfig[environment];

    if (!(name in envConfig)) {
      return false;
    }

    return envConfig[name as keyof typeof envConfig] === true;
  } catch (error) {
    console.error(`Feature flag check failed for "${name}":`, error);
    return false;
  }
}
```

### Task 4: Refactor `requireFeature()`

**File:** `lib/features/api/require-feature.ts`

```typescript
import type { FlagsConfig } from "../core/types";

export function requireFeature(
  name: FeatureName,
  config?: FlagsConfig
): NextResponse | null {
  if (!isFeatureEnabled(name, config)) {
    return NextResponse.json(
      {
        error: ERROR_MESSAGES.FEATURE_DISABLED,
        code: ERROR_CODES.FEATURE_DISABLED,
        feature: name,
      },
      { status: 403 }
    );
  }

  return null;
}
```

### Task 5: Refactor `useFeature()` hook

**File:** `lib/features/react/use-feature.ts`

```typescript
import type { FlagsConfig } from "../core/types";

export function useFeature(
  name: FeatureName,
  config?: FlagsConfig
): { isEnabled: boolean } {
  const isEnabled = isFeatureEnabled(name, config);
  return { isEnabled };
}
```

### Task 6: Refactor `<FeatureFlag>` component

**File:** `lib/features/react/FeatureFlag.tsx`

```typescript
import type { FlagsConfig } from '../core/types';

interface FeatureFlagProps {
  name: FeatureName;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  config?: FlagsConfig; // NEW
}

export function FeatureFlag({
  name,
  children,
  fallback = null,
  config,
}: FeatureFlagProps) {
  const { isEnabled } = useFeature(name, config);

  if (!isEnabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
```

### Task 7: Update all tests

**Pattern dla wszystkich 5 plików testowych:**

```typescript
import testFlags from '../__fixtures__/test-flags.json';

describe("FeatureFlag", () => {
  it("does not render children when feature is disabled", () => {
    process.env.ENV_NAME = "production";

    render(
      <FeatureFlag name="auth.register" config={testFlags}>
        <div>Register Form</div>
      </FeatureFlag>
    );

    expect(screen.queryByText("Register Form")).not.toBeInTheDocument();
  });
});
```

**Apply to:**

1. `FeatureFlag.test.tsx` - dodać prop `config={testFlags}`
2. `use-feature.test.ts` - przekazać `config: testFlags` do `useFeature()`
3. `is-feature-enabled.test.ts` - przekazać `testFlags` jako 2nd argument
4. `require-feature.test.ts` - przekazać `testFlags` jako 2nd argument
5. `integration.test.ts` - przekazać `testFlags` we wszystkich case'ach

### Task 8: Run tests and verify

```bash
npm run test:unit
```

**Expected result:**

- All 227 tests pass ✅
- No more failures in feature flag tests

## Implementation Order

1. ✅ Create plan (this file)
2. ⏳ Create `config-loader.ts` + update `types.ts`
3. ⏳ Create `__fixtures__/test-flags.json`
4. ⏳ Refactor `isFeatureEnabled()` (core)
5. ⏳ Refactor `requireFeature()` (API layer)
6. ⏳ Refactor `useFeature()` (React layer)
7. ⏳ Refactor `<FeatureFlag>` (React layer)
8. ⏳ Update all 5 test files
9. ⏳ Run tests and verify

## Testing Strategy

### Unit tests should verify:

- ✅ Default behavior (bez config) używa `loadFlagsConfig()`
- ✅ Custom config override działa poprawnie
- ✅ Production environment z `auth.register: false` blokuje dostęp
- ✅ Wszystkie warstwy (core, API, React) akceptują custom config

### Integration test should verify:

- ✅ Spójność między `isFeatureEnabled()` i `requireFeature()`
- ✅ Error response format dla zablokowanych features

## Backward Compatibility

**Istniejący kod produkcyjny NIE wymaga zmian:**

```typescript
// Nadal działa (używa domyślnego flags.json)
if (isFeatureEnabled('auth.login')) {
  // ...
}

// Nadal działa
const guardError = requireFeature('auth.login');
if (guardError) return guardError;

// Nadal działa
const { isEnabled } = useFeature('auth.login');

// Nadal działa
<FeatureFlag name="auth.login">
  <LoginForm />
</FeatureFlag>
```

**Tylko testy używają nowego parametru:**

```typescript
isFeatureEnabled("auth.login", testFlags);
```

## Success Criteria

- [ ] All 13 failing tests pass
- [ ] No changes required to production code (outside of feature flags system)
- [ ] Test fixtures isolated in `__fixtures__/` directory
- [ ] Backward compatible API (optional parameter)
- [ ] Type safety maintained (TypeScript strict mode)
- [ ] Documentation updated (JSDoc comments)

## Non-Goals (Out of Scope)

- ❌ Changing production `flags.json` configuration
- ❌ Modifying feature flag behavior in production
- ❌ Adding new feature flags
- ❌ Changing feature flag naming convention

## Notes

- Mock config `test-flags.json` ma `auth.register: false` w production - to zgadza się z testami
- Prawdziwy `flags.json` może mieć `auth.register: true` w production - nie zmieniamy go
- Testy nie powinny zależeć od rzeczywistej konfiguracji produkcyjnej
- Dependency injection to czyste rozwiązanie bez magii mocków Vitest

## Risks & Mitigations

**Risk:** Zapomnienie przekazać `config` w nowym teście
**Mitigation:** Dodać helper function `createTestFeatureFlag()` w test utils

**Risk:** Desynchronizacja między `test-flags.json` a `flags.json`
**Mitigation:** To OK - to właśnie chcemy. Testy testują zachowanie, nie konkretną konfigurację.

**Risk:** Zwiększona złożoność API
**Mitigation:** Parametr opcjonalny, domyślne zachowanie nie zmienione, dokumentacja JSDoc
