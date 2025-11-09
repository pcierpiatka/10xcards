# Feature Flags System

Universal feature flag system for Next.js 15 application. Enables deployment/release separation via environment-based feature toggles.

## Quick Start

```typescript
import {
  isFeatureEnabled,
  requireFeature,
  FeatureFlag,
  useFeature,
} from "@/lib/features";
```

## Installation Status

✅ **Installed** - Ready to use

## Features

- **Compile-time flags** - Static configuration via JSON
- **Type-safe** - Full TypeScript support with autocomplete
- **Universal** - Works in API routes, Server Components, Client Components
- **Default OFF** - Safe default behavior
- **3 environments** - `local`, `integration`, `production`

## Usage by Context

### API Routes (Server)

```typescript
// app/api/auth/login/route.ts
import { requireFeature } from "@/lib/features";

export async function POST(request: Request) {
  // 🛡️ Guard - check BEFORE business logic
  const guardError = requireFeature("auth.login");
  if (guardError) return guardError;

  // ✅ Feature enabled - execute logic
  const { email, password } = await request.json();
  // ... login logic
}
```

### Server Components

```typescript
// app/dashboard/page.tsx
import { FeatureFlag, isFeatureEnabled } from '@/lib/features';

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <FeatureFlag name="collections.visibility">
        <CollectionsWidget />
      </FeatureFlag>
    </div>
  );
}
```

### Client Components

```typescript
// components/Navigation.tsx
'use client';
import { useFeature } from '@/lib/features';

export function Navigation() {
  const { isEnabled: showCollections } = useFeature('collections.visibility');

  return (
    <nav>
      <Link href="/dashboard">Dashboard</Link>
      {showCollections && <Link href="/collections">Collections</Link>}
    </nav>
  );
}
```

## Available Flags

Current flags defined in `config/flags.json`:

- `auth.login` - Login functionality
- `auth.register` - User registration
- `collections.create` - Create collections
- `collections.list` - List collections
- `collections.visibility` - Show collections in UI

## Environment Configuration

Flags are configured per environment:

**Local** (development)

- All flags: `ON` ✅

**Integration** (staging)

- Auth flags: `ON` ✅
- Collections flags: `OFF` ❌

**Production**

- All flags: `OFF` ❌

Set `ENV_NAME` environment variable:

```bash
ENV_NAME=local        # Development
ENV_NAME=integration  # Staging
ENV_NAME=production   # Production
```

## API Reference

### `isFeatureEnabled(name: FeatureName): boolean`

Universal function - works everywhere (API, Server, Client).

```typescript
if (isFeatureEnabled("auth.login")) {
  // Feature enabled
}
```

### `requireFeature(name: FeatureName): NextResponse | null`

API route guard - returns error response if disabled.

```typescript
const guardError = requireFeature("auth.login");
if (guardError) return guardError;
```

### `<FeatureFlag name="..." fallback={...}>`

Component for conditional rendering.

```tsx
<FeatureFlag name="collections.create" fallback={<ComingSoon />}>
  <CreateForm />
</FeatureFlag>
```

### `useFeature(name: FeatureName): { isEnabled: boolean }`

Hook for conditional logic.

```typescript
const { isEnabled } = useFeature("collections.create");
```

## Adding New Flags

1. Add to `config/flags.json` for all environments
2. Add to `FeatureName` union type in `core/types.ts`
3. TypeScript autocomplete will work automatically

```typescript
// core/types.ts
export type FeatureName =
  | "auth.login"
  | "auth.register"
  | "my.new.feature";  // ← Add here

// config/flags.json
{
  "local": {
    "my.new.feature": true
  },
  "integration": {
    "my.new.feature": false
  },
  "production": {
    "my.new.feature": false
  }
}
```

## Testing

Run tests:

```bash
npm run test:unit -- lib/features/
```

Test coverage: **100%** (54 tests)

## Architecture

```
lib/features/
  ├── index.ts              # Public API (barrel export)
  ├── config/
  │   └── flags.json        # Configuration per environment
  ├── core/                 # Universal (works everywhere)
  │   ├── types.ts
  │   ├── get-environment.ts
  │   └── is-feature-enabled.ts
  ├── api/                  # Server-only
  │   └── require-feature.ts
  └── react/                # React components/hooks
      ├── FeatureFlag.tsx
      └── use-feature.ts
```

## Security

⚠️ **Important**:

- API guards are **required** for security-sensitive features
- Client-side flags are for **UX only** (can be bypassed)
- Always use `requireFeature()` in API routes

## Best Practices

✅ **DO**

- Use `requireFeature()` at the start of API routes
- Use hierarchical naming: `domain.action` (e.g., `auth.login`)
- Remove flags after full rollout
- Default OFF for new features

❌ **DON'T**

- Use flags for business validation (use proper authorization)
- Leave flags in code permanently
- Use flags for A/B testing (MVP doesn't support user-specific flags)
- Trust client-side flags for security

## Future Enhancements (Phase 2)

- Runtime toggles (no redeploy needed)
- User-specific flags (A/B testing)
- Percentage rollouts
- Feature flag analytics
- Admin dashboard
