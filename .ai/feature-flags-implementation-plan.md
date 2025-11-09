# Plan implementacji systemu Feature Flags

## 1. Przegląd

System Feature Flags umożliwia rozdzielenie deploymentów od releasów poprzez warunkowe włączanie i wyłączanie funkcjonalności aplikacji w zależności od środowiska (local, integration, production). Rozwiązanie jest uniwersalne - działa zarówno po stronie serwera (API routes, Server Components, middleware) jak i klienta (Client Components), zapewniając spójny interfejs we wszystkich kontekstach.

### Cele biznesowe

- **Bezpieczne wdrożenia**: Deploy kodu na produkcję z wyłączonymi funkcjami, włączenie po weryfikacji
- **Testowanie na produkcji**: Możliwość testowania nowych funkcji na środowisku integration przed pełnym włączeniem
- **Szybkie rollback**: Wyłączenie problematycznej funkcjonalności bez redeployu
- **Izolacja rozwoju**: Programiści mogą pracować nad różnymi funkcjami równolegle bez konfliktów

### Zakres MVP

- **Compile-time flags**: Statyczna konfiguracja w pliku JSON, ewaluowana przy buildzie/starcie aplikacji
- **Boolean flags**: Tylko wartości `true`/`false`
- **Default OFF**: Brak definicji flagi = feature wyłączone
- **3 środowiska**: `local`, `integration`, `production`
- **Type-safe API**: TypeScript autocomplete i walidacja nazw flag

### Funkcjonalności poza zakresem MVP

- Runtime toggles (zmiana bez redeployu)
- User-specific flags (A/B testing, gradual rollout)
- Percentage-based rollouts
- Feature flag analytics
- Feature flag dashboard UI
- Złożone wartości flag (string, number, objects)

## 2. Architektura rozwiązania

System składa się z trzech warstw:

```
src/features/
  ├── config/
  │   └── flags.json              # Konfiguracja per środowisko
  │
  ├── core/
  │   ├── is-feature-enabled.ts   # Główna funkcja (universal)
  │   ├── get-environment.ts      # Helper do odczytu ENV_NAME
  │   └── types.ts                # TypeScript types & constants
  │
  ├── api/
  │   └── require-feature.ts      # Guard dla API routes
  │
  ├── react/
  │   ├── FeatureFlag.tsx         # Wrapper component (conditional render)
  │   └── use-feature.ts          # Hook (conditional logic)
  │
  └── index.ts                    # Public exports
```

### Warstwa Core (Universal)

**Funkcja `isFeatureEnabled(name: FeatureName): boolean`**

- Działa wszędzie: API routes, Server Components, Client Components, middleware
- Odpowiedzialność: odczyt ENV_NAME → load config → lookup flag → return boolean
- Zero dependencies (poza Node.js `process.env`)
- Pure function (łatwe testowanie, możliwość cache'owania)

### Warstwa API (Server-only)

**Funkcja `requireFeature(name: FeatureName): NextResponse | null`**

- Guard pattern dla API routes
- Zwraca `NextResponse` z `403 Forbidden` jeśli feature OFF, `null` jeśli ON
- Używana na początku route handlera, **przed** jakąkolwiek logiką biznesową

### Warstwa React (Client & Server Components)

**Component `<FeatureFlag name="..." fallback={...}>`**

- Conditional rendering: renderuje `children` jeśli ON, `fallback` jeśli OFF
- Działa w Server i Client Components
- Accessibility: zachowuje semantykę HTML (fragment wrapper)

**Hook `useFeature(name: FeatureName)`**

- Zwraca `{ isEnabled: boolean }`
- Używany do warunkowej logiki w komponentach (np. conditional links w nawigacji)
- Gotowy na rozbudowę (w przyszłości: `{ isEnabled, isLoading, error }`)

## 3. Szczegóły modułów

### 3.1. `src/features/core/types.ts`

**Opis:** Definicje typów TypeScript dla całego systemu. Zapewnia type-safety i autocomplete.

**Typy:**

```typescript
// Typ środowiska - dozwolone wartości ENV_NAME
export type Environment = "local" | "integration" | "production";

// Typ nazwy flagi - wszystkie zdefiniowane flagi
// Aktualizowany ręcznie przy dodawaniu nowych flag do flags.json
export type FeatureName =
  | "auth.login"
  | "auth.register"
  | "auth.logout"
  | "auth.password-reset"
  | "collections.list"
  | "collections.create"
  | "collections.edit"
  | "collections.delete";

// Struktura konfiguracji flag dla jednego środowiska
export type FeatureFlags = Record<FeatureName, boolean>;

// Struktura całego pliku flags.json
export type FeatureFlagsConfig = Record<Environment, FeatureFlags>;
```

**Eksportowane stałe:**

```typescript
// Wartość domyślna dla ENV_NAME jeśli nie ustawiona
export const DEFAULT_ENVIRONMENT: Environment = "local";

// Lista wszystkich środowisk (do walidacji)
export const ENVIRONMENTS: Environment[] = [
  "local",
  "integration",
  "production",
];
```

**Uzasadnienie:**

- `FeatureName` jako union type zapewnia autocomplete w IDE
- Strict typing zapobiega błędom literówek w nazwach flag
- Centralizacja typów ułatwia późniejsze rozszerzenie (np. dodanie wartości non-boolean)

### 3.2. `src/features/core/get-environment.ts`

**Opis:** Helper do odczytu i walidacji zmiennej środowiskowej `ENV_NAME`.

**Interfejs:**

```typescript
export function getEnvironment(): Environment;
```

**Implementacja:**

```typescript
import { DEFAULT_ENVIRONMENT, ENVIRONMENTS, type Environment } from "./types";

export function getEnvironment(): Environment {
  const envName = process.env.ENV_NAME;

  if (!envName) {
    console.warn(
      `[FeatureFlags] ENV_NAME not set, defaulting to "${DEFAULT_ENVIRONMENT}"`
    );
    return DEFAULT_ENVIRONMENT;
  }

  if (!ENVIRONMENTS.includes(envName as Environment)) {
    console.error(
      `[FeatureFlags] Invalid ENV_NAME="${envName}". Must be one of: ${ENVIRONMENTS.join(", ")}. Defaulting to "${DEFAULT_ENVIRONMENT}"`
    );
    return DEFAULT_ENVIRONMENT;
  }

  return envName as Environment;
}
```

**Obsługa błędów:**

- Brak `ENV_NAME`: zwraca `local`, loguje warning
- Nieprawidłowa wartość: zwraca `local`, loguje error
- Walidacja przy starcie aplikacji = fail-fast

**Uzasadnienie:**

- Dedykowana funkcja ułatwia testowanie i mockowanie
- Walidacja zapobiega runtime errors przy nieprawidłowej konfiguracji
- Console logging pomaga w debugowaniu problemów z konfiguracją środowiska

### 3.3. `src/features/core/is-feature-enabled.ts`

**Opis:** Główna funkcja systemu. Sprawdza czy dana flaga jest włączona dla aktualnego środowiska.

**Interfejs:**

```typescript
export function isFeatureEnabled(featureName: FeatureName): boolean;
```

**Implementacja:**

```typescript
import flagsConfig from "../config/flags.json";
import { getEnvironment } from "./get-environment";
import type { FeatureName, FeatureFlagsConfig } from "./types";

// Type assertion dla importu JSON
const config = flagsConfig as FeatureFlagsConfig;

export function isFeatureEnabled(featureName: FeatureName): boolean {
  const env = getEnvironment();
  const envFlags = config[env];

  if (!envFlags) {
    console.error(
      `[FeatureFlags] No configuration found for environment "${env}"`
    );
    return false;
  }

  // Default OFF: jeśli flagi nie ma w config, zwróć false
  const isEnabled = envFlags[featureName] ?? false;

  return isEnabled;
}
```

**Logika domyślna:**

- Brak konfiguracji dla środowiska: `false` + error log
- Brak flagi w konfiguracji: `false` (bez logu - to normalne dla nowych flag)
- Wartość `null`/`undefined`: `false` (dzięki `??`)

**Optymalizacja (opcjonalna dla przyszłości):**

```typescript
// Cache dla getEnvironment() - środowisko nie zmienia się w runtime
let cachedEnv: Environment | null = null;

function getCachedEnvironment(): Environment {
  if (!cachedEnv) {
    cachedEnv = getEnvironment();
  }
  return cachedEnv;
}
```

**Uzasadnienie:**

- Pure function = łatwe testowanie, zero side effects
- Fail-safe: zawsze zwraca boolean (nigdy undefined/null)
- Brak wyjątków = nie crashuje aplikacji przy błędnej konfiguracji

### 3.4. `src/features/config/flags.json`

**Opis:** Statyczna konfiguracja flag per środowisko. Źródło prawdy dla wszystkich flag.

**Struktura:**

```json
{
  "local": {
    "auth.login": true,
    "auth.register": true,
    "auth.logout": true,
    "auth.password-reset": false,
    "collections.list": true,
    "collections.create": true,
    "collections.edit": false,
    "collections.delete": false
  },
  "integration": {
    "auth.login": true,
    "auth.register": true,
    "auth.logout": true,
    "auth.password-reset": false,
    "collections.list": false,
    "collections.create": false,
    "collections.edit": false,
    "collections.delete": false
  },
  "production": {
    "auth.login": false,
    "auth.register": false,
    "auth.logout": false,
    "auth.password-reset": false,
    "collections.list": false,
    "collections.create": false,
    "collections.edit": false,
    "collections.delete": false
  }
}
```

**Konwencje nazewnictwa:**

- Format: `{domain}.{action}` (np. `auth.login`, `collections.create`)
- Lowercase, kebab-case dla action (wielowyrazowe: `password-reset`)
- Grupowanie logiczne po domenie (wszystkie `auth.*` razem)

**Proces aktualizacji:**

1. Dodaj flagę do `flags.json` dla wszystkich 3 środowisk
2. Zaktualizuj typ `FeatureName` w `types.ts`
3. Commit obu plików razem (atomiczna zmiana)

**Uzasadnienie:**

- JSON = łatwa edycja, czytelność, możliwość walidacji schematem
- Explicitna konfiguracja dla każdego środowiska = brak niespodzianek
- Nazewnictwo hierarchiczne ułatwia organizację przy skalowaniu (np. 50+ flag)

### 3.5. `src/features/api/require-feature.ts`

**Opis:** Guard dla API routes. Chroni endpointy przed wykonaniem logiki jeśli feature jest wyłączone.

**Interfejs:**

```typescript
export function requireFeature(featureName: FeatureName): NextResponse | null;
```

**Implementacja:**

```typescript
import { NextResponse } from "next/server";
import { isFeatureEnabled } from "../core/is-feature-enabled";
import type { FeatureName } from "../core/types";

export function requireFeature(featureName: FeatureName): NextResponse | null {
  if (!isFeatureEnabled(featureName)) {
    return NextResponse.json(
      {
        error: "Feature not available",
        code: "FEATURE_DISABLED",
      },
      { status: 403 }
    );
  }

  return null; // Feature enabled, continue
}
```

**Użycie w API route:**

```typescript
// app/api/auth/login/route.ts
import { requireFeature } from "@/features";

export async function POST(request: Request) {
  // 🛡️ GUARD - sprawdź flagę PRZED jakąkolwiek logiką
  const guardError = requireFeature("auth.login");
  if (guardError) return guardError;

  // ✅ Feature enabled - wykonaj logikę
  const { email, password } = await request.json();
  // ... login logic
}
```

**Dlaczego NextResponse zamiast throw Error:**

- Jawność: guard zwraca response, nie rzuca wyjątku (łatwiejsze do zrozumienia flow)
- Kontrola: możliwość customizacji response per endpoint jeśli potrzeba
- TypeScript: pattern `if (error) return error` jest type-safe bez try/catch

**Warianty rozbudowy (poza MVP):**

```typescript
// Custom error message
requireFeature("auth.login", "Login is temporarily unavailable");

// Custom status code
requireFeature("auth.login", { status: 404 }); // Ukrycie istnienia feature

// Logging
requireFeature("auth.login", { logAttempt: true });
```

**Uzasadnienie:**

- Pattern guard clause = early return, czytelniejszy kod
- Status 403 Forbidden = semantycznie poprawny ("znasz endpoint, ale nie masz dostępu")
- Kod błędu `FEATURE_DISABLED` = łatwe filtrowanie w logach/monitoringu

### 3.6. `src/features/react/FeatureFlag.tsx`

**Opis:** Komponent do warunkowego renderowania UI. Ukrywa elementy jeśli feature jest wyłączone.

**Interfejs:**

```typescript
interface FeatureFlagProps {
  name: FeatureName;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureFlag(props: FeatureFlagProps): React.ReactElement;
```

**Implementacja:**

```typescript
import { isFeatureEnabled } from '../core/is-feature-enabled';
import type { FeatureName } from '../core/types';

interface FeatureFlagProps {
  name: FeatureName;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureFlag({
  name,
  children,
  fallback = null,
}: FeatureFlagProps) {
  if (!isFeatureEnabled(name)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
```

**Użycie - ukrywanie elementów:**

```tsx
// app/dashboard/page.tsx
<FeatureFlag name="collections.create">
  <CreateCollectionButton />
</FeatureFlag>
```

**Użycie - fallback content:**

```tsx
<FeatureFlag name="collections.create" fallback={<ComingSoonBadge />}>
  <CreateCollectionButton />
</FeatureFlag>
```

**Dlaczego fragment `<>` zamiast `null` bezpośrednio:**

- Spójność API: zawsze zwraca `ReactElement` (lepsze dla TypeScript)
- Kompozycja: fragment nie wpływa na strukturę DOM
- Przyszłość: łatwe dodanie wrappera z transition/animation

**Server vs Client Components:**

- Komponent działa w obu kontekstach
- W Server Components: conditional render na serwerze = wysłane mniej HTML
- W Client Components: conditional render na kliencie = interaktywne toggle (przyszłość)

**Accessibility:**

- Fragment nie tworzy dodatkowych node'ów w DOM
- Semantyka HTML zachowana (np. `<FeatureFlag><button></button></FeatureFlag>` → `<button>` w DOM)

**Uzasadnienie:**

- Deklaratywne API = czytelniejsze niż `if/else` w JSX
- Fallback prop = elastyczność (ukryj vs zamień na coś innego)
- Zero dependencies = działa w każdym React setup

### 3.7. `src/features/react/use-feature.ts`

**Opis:** Hook do warunkowej logiki w komponentach React. Używany gdy potrzeba `if/else` logic, a nie tylko conditional render.

**Interfejs:**

```typescript
interface UseFeatureResult {
  isEnabled: boolean;
}

export function useFeature(featureName: FeatureName): UseFeatureResult;
```

**Implementacja:**

```typescript
import { isFeatureEnabled } from "../core/is-feature-enabled";
import type { FeatureName } from "../core/types";

interface UseFeatureResult {
  isEnabled: boolean;
}

export function useFeature(featureName: FeatureName): UseFeatureResult {
  const isEnabled = isFeatureEnabled(featureName);

  return { isEnabled };
}
```

**Użycie - conditional links:**

```tsx
function Header() {
  const { isEnabled: showCollections } = useFeature("collections.list");

  return (
    <nav>
      <Link href="/">Home</Link>
      {showCollections && <Link href="/collections">Collections</Link>}
    </nav>
  );
}
```

**Użycie - conditional logic:**

```tsx
function Dashboard() {
  const { isEnabled: canCreate } = useFeature("collections.create");

  const handleClick = () => {
    if (!canCreate) {
      toast.error("This feature is coming soon!");
      return;
    }

    // ... create logic
  };

  return <Button onClick={handleClick}>Create</Button>;
}
```

**Dlaczego obiekt `{ isEnabled }` zamiast `boolean` bezpośrednio:**

- Extensibility: gotowe na dodanie `isLoading`, `error` w przyszłości (runtime flags)
- Destructuring: `const { isEnabled } = useFeature(...)` = self-documenting code
- Backward compatibility: dodanie pól nie breakuje istniejącego kodu

**Przyszłe rozszerzenia (poza MVP):**

```typescript
interface UseFeatureResult {
  isEnabled: boolean;
  isLoading?: boolean; // Runtime flags z API
  error?: Error; // Błąd podczas fetch flag
  refresh?: () => void; // Re-fetch flags
}
```

**Uwaga - brak `useMemo`/`useCallback`:**

- `isFeatureEnabled()` to cheap operation (lookup w obiekcie)
- Premature optimization = complexity bez benefit
- Dodać tylko jeśli profiling pokaże bottleneck

**Uzasadnienie:**

- Hook pattern = natural w React components
- Minimal API = łatwe do zrozumienia i użycia
- Future-proof design = gotowe na runtime flags bez breaking changes

### 3.8. `src/features/index.ts`

**Opis:** Public API modułu. Eksportuje tylko to, co powinno być używane poza `src/features/`.

**Implementacja:**

```typescript
// Core (universal)
export { isFeatureEnabled } from "./core/is-feature-enabled";
export type { FeatureName, Environment } from "./core/types";

// API guards (server-only)
export { requireFeature } from "./api/require-feature";

// React (client + server components)
export { FeatureFlag } from "./react/FeatureFlag";
export { useFeature } from "./react/use-feature";
```

**Co NIE jest eksportowane (internal API):**

- `getEnvironment()` - implementacja detail
- `FeatureFlags`, `FeatureFlagsConfig` - internal types
- `flags.json` - nie powinien być importowany bezpośrednio

**Import w aplikacji:**

```typescript
// ✅ Dobrze - przez public API
import {
  isFeatureEnabled,
  requireFeature,
  FeatureFlag,
  useFeature,
} from "@/features";

// ❌ Źle - bezpośrednio z modułów wewnętrznych
import { isFeatureEnabled } from "@/features/core/is-feature-enabled";
```

**Uzasadnienie:**

- Kontrola API surface = łatwiejsze refactoring wewnętrznej struktury
- Single import source = mniej boilerplate w aplikacji
- Type exports = TypeScript autocomplete działa out-of-the-box

## 4. Przypadki użycia

### 4.1. API Route Protection

**Scenariusz:** Endpoint logowania powinien być dostępny tylko gdy `auth.login` jest włączone.

**Implementacja:**

```typescript
// app/api/auth/login/route.ts
import { requireFeature } from "@/features";

export async function POST(request: Request) {
  // 🛡️ GUARD - pierwszy check w funkcji
  const guardError = requireFeature("auth.login");
  if (guardError) return guardError;

  // ✅ Feature enabled - pełna logika
  try {
    const { email, password } = await request.json();

    // Walidacja
    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing credentials" },
        { status: 400 }
      );
    }

    // Wywołanie Supabase Auth
    const supabase = createRouteHandlerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    return NextResponse.json({ user: data.user }, { status: 200 });
  } catch (error) {
    console.error("[Login API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Kluczowe punkty:**

- Guard na początku funkcji = zero execution jeśli OFF
- Early return pattern = flat code, łatwy do czytania
- Osobny error handling dla guard vs business logic

### 4.2. Server Component Conditional Render

**Scenariusz:** Dashboard wyświetla sekcję "Collections" tylko gdy `collections.list` jest włączone.

**Implementacja:**

```tsx
// app/dashboard/page.tsx (Server Component)
import { FeatureFlag } from "@/features";
import { CollectionsList } from "@/components/dashboard/CollectionsList";

export default async function DashboardPage() {
  return (
    <div className="space-y-8">
      <h1>Dashboard</h1>

      {/* Zawsze widoczne */}
      <section>
        <h2>Your Flashcards</h2>
        <FlashcardList />
      </section>

      {/* Warunkowe - tylko jeśli flaga ON */}
      <FeatureFlag name="collections.list">
        <section>
          <h2>Your Collections</h2>
          <CollectionsList />
        </section>
      </FeatureFlag>
    </div>
  );
}
```

**Korzyści w Server Components:**

- HTML dla wyłączonej sekcji nigdy nie jest generowany
- Mniejszy response size = szybsze ładowanie
- Security: kod komponentu wewnątrz `<FeatureFlag>` może nie być wysłany do klienta

### 4.3. Client Component Conditional Logic

**Scenariusz:** Nawigacja global header pokazuje link "Collections" tylko gdy `collections.list` jest włączone.

**Implementacja:**

```tsx
// components/layout/Header.tsx
"use client";

import Link from "next/link";
import { useFeature } from "@/features";

export function Header() {
  const { isEnabled: showCollections } = useFeature("collections.list");
  const { isEnabled: canCreateCollection } = useFeature("collections.create");

  return (
    <header className="border-b">
      <nav className="container flex items-center gap-6 py-4">
        <Link href="/dashboard">Dashboard</Link>

        {showCollections && <Link href="/collections">Collections</Link>}

        {canCreateCollection && (
          <Link href="/collections/new">
            <Button>New Collection</Button>
          </Link>
        )}

        <UserMenu />
      </nav>
    </header>
  );
}
```

**Alternatywa z `<FeatureFlag>`:**

```tsx
export function Header() {
  return (
    <header className="border-b">
      <nav className="container flex items-center gap-6 py-4">
        <Link href="/dashboard">Dashboard</Link>

        <FeatureFlag name="collections.list">
          <Link href="/collections">Collections</Link>
        </FeatureFlag>

        <FeatureFlag name="collections.create">
          <Link href="/collections/new">
            <Button>New Collection</Button>
          </Link>
        </FeatureFlag>

        <UserMenu />
      </nav>
    </header>
  );
}
```

**Kiedy użyć `useFeature` vs `<FeatureFlag>`:**

- `useFeature`: gdy potrzeba logiki (`if/else`, wiele flag, derived state)
- `<FeatureFlag>`: gdy potrzeba tylko conditional render (czytelniejsze)

### 4.4. Middleware Protection (opcjonalne)

**Scenariusz:** Przekieruj użytkownika z `/collections` jeśli `collections.list` jest wyłączone.

**Implementacja:**

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isFeatureEnabled } from "@/features";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Sprawdź czy user próbuje wejść na /collections
  if (pathname.startsWith("/collections")) {
    if (!isFeatureEnabled("collections.list")) {
      // Feature wyłączone - redirect na dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Feature włączone lub inna ścieżka - kontynuuj
  return NextResponse.next();
}

export const config = {
  matcher: ["/collections/:path*"],
};
```

**Uwaga:**

- Middleware runs on edge runtime = może nie mieć dostępu do pełnego Node.js API
- Sprawdź czy `process.env` działa w edge runtime w Next.js 15
- Alternatywa: Server Component redirect

### 4.5. Fallback Content

**Scenariusz:** Pokaż "Coming Soon" badge jeśli feature jest wyłączone.

**Implementacja:**

```tsx
// app/dashboard/page.tsx
import { FeatureFlag } from "@/features";

function ComingSoonBadge() {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <p className="text-muted-foreground">Collections - Coming Soon!</p>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <h1>Dashboard</h1>

      <FeatureFlag name="collections.list" fallback={<ComingSoonBadge />}>
        <CollectionsList />
      </FeatureFlag>
    </div>
  );
}
```

**Korzyści:**

- User awareness: użytkownik wie że feature istnieje, ale jeszcze nie jest dostępne
- Soft launch: budowanie oczekiwania przed włączeniem feature
- A/B testing: różne fallback dla różnych grup (przyszłość)

## 5. Względy bezpieczeńności

### 5.1. Server-side enforcement (Security layer)

**Zasada:** Server-side check w API route to jedyna prawdziwa ochrona. Client-side check to tylko UX.

**Warstwa obrony:**

```
1. API Route Guard (requireFeature)     ← 🛡️ SECURITY (nie ufaj klientowi)
2. Server Component (FeatureFlag)       ← 🛡️ SECURITY (HTML nie wysłany)
3. Client Component (FeatureFlag)       ← 🎨 UX ONLY (code w bundle)
```

**Dlaczego każda warstwa jest ważna:**

| Warstwa          | Cel                          | Co chroni                   | Co NIE chroni      |
| ---------------- | ---------------------------- | --------------------------- | ------------------ |
| API Guard        | Bezpieczeństwo               | Wykonanie logiki biznesowej | -                  |
| Server Component | Bezpieczeństwo + Performance | Wysłanie HTML, fetch danych | -                  |
| Client Component | UX                           | -                           | Nic (kod w bundle) |

**Przykład ataku bez API Guard:**

```typescript
// ❌ ŹLE - tylko Client Component check
// app/api/collections/route.ts
export async function POST(request: Request) {
  // Brak guard - zakładamy że frontend zablokował UI

  const { name } = await request.json();
  const collection = await db.collections.create({ name });
  return NextResponse.json(collection);
}

// Atak: curl -X POST /api/collections -d '{"name":"hack"}' -H "Authorization: Bearer TOKEN"
// ✅ Sukces - bo API nie sprawdza flagi!
```

```typescript
// ✅ DOBRZE - API Guard
export async function POST(request: Request) {
  const guardError = requireFeature("collections.create");
  if (guardError) return guardError; // 🛡️ Blocked

  const { name } = await request.json();
  const collection = await db.collections.create({ name });
  return NextResponse.json(collection);
}

// Atak: curl -X POST /api/collections ...
// ❌ Fail - 403 Forbidden
```

### 5.2. Configuration security

**Flagi w bundle:**

- `flags.json` jest importowany do client bundle
- **Wszystkie flagi są publiczne** - użytkownik może zobaczyć co jest OFF/ON
- To jest OK - flagi to konfiguracja, nie sekrety

**Co NIE powinno być w flagach:**

- ❌ API keys, secrets, credentials
- ❌ Internal endpoints URLs
- ❌ Database connection strings
- ❌ Wrażliwe business logic details

**Co MOŻE być w flagach:**

- ✅ Feature names (`auth.login`, `collections.create`)
- ✅ Boolean states (`true`/`false`)
- ✅ Environment names (`local`, `production`)

**Przykład secure vs insecure flag:**

```json
{
  "local": {
    "collections.create": true, // ✅ OK - public info
    "api.endpoint": "https://internal.api.example.com/secret" // ❌ ŹLE
  }
}
```

### 5.3. Environment variable security

**ENV_NAME visibility:**

- `process.env.ENV_NAME` w Server Components = secure (server-only)
- `process.env.ENV_NAME` w Client Components = exposed (w bundle)

**Next.js environment variables:**

- Zmienne bez `NEXT_PUBLIC_` = server-only
- Zmienne z `NEXT_PUBLIC_` = exposed do client

**Dla feature flags:**

```bash
# .env
ENV_NAME=production  # ✅ Server-only (brak NEXT_PUBLIC_)

# .env.local
ENV_NAME=local  # ✅ Git-ignored, developer-specific
```

**Uzasadnienie:**

- ENV_NAME nie jest secret, ale nie ma potrzeby go exposować
- Server-side evaluation wystarczy (compile-time MVP)
- Przyszłość (runtime flags): fetch z API, nie z env vars

### 5.4. Type safety jako security

**TypeScript `FeatureName` type:**

```typescript
// ✅ Type-safe - autocomplete, compile error jeśli typo
requireFeature("auth.login");

// ❌ Compile error - flaga nie istnieje
requireFeature("auth.logni"); // Error: Type '"auth.logni"' is not assignable to type 'FeatureName'

// ❌ Compile error - nie można przekazać user input
const flagName = userInput.featureName;
requireFeature(flagName); // Error: Type 'string' is not assignable to type 'FeatureName'
```

**Dlaczego to jest security feature:**

- Zapobiega injection attack (user nie może podać dowolnej nazwy flagi)
- Fail-fast: błędy wykryte na etapie kompilacji, nie runtime
- Safe refactoring: zmiana nazwy flagi = TypeScript znajdzie wszystkie użycia

## 6. Testowanie

### 6.1. Testy jednostkowe - `isFeatureEnabled()`

**Plik:** `src/features/core/__tests__/is-feature-enabled.test.ts`

**Scenariusze:**

```typescript
import { isFeatureEnabled } from "../is-feature-enabled";

describe("isFeatureEnabled", () => {
  const originalEnv = process.env.ENV_NAME;

  afterEach(() => {
    process.env.ENV_NAME = originalEnv;
  });

  it("returns true for enabled flag in local environment", () => {
    process.env.ENV_NAME = "local";
    expect(isFeatureEnabled("auth.login")).toBe(true);
  });

  it("returns false for disabled flag in production environment", () => {
    process.env.ENV_NAME = "production";
    expect(isFeatureEnabled("auth.login")).toBe(false);
  });

  it("returns false for non-existent flag (default OFF)", () => {
    process.env.ENV_NAME = "local";
    // @ts-expect-error - testing runtime behavior
    expect(isFeatureEnabled("nonexistent.flag")).toBe(false);
  });

  it("defaults to local environment when ENV_NAME not set", () => {
    delete process.env.ENV_NAME;
    expect(isFeatureEnabled("auth.login")).toBe(true); // local=true
  });

  it("defaults to local environment when ENV_NAME is invalid", () => {
    process.env.ENV_NAME = "invalid-env";
    expect(isFeatureEnabled("auth.login")).toBe(true); // fallback to local
  });
});
```

### 6.2. Testy jednostkowe - `requireFeature()`

**Plik:** `src/features/api/__tests__/require-feature.test.ts`

**Scenariusze:**

```typescript
import { requireFeature } from "../require-feature";

describe("requireFeature", () => {
  it("returns null when feature is enabled", () => {
    process.env.ENV_NAME = "local";
    const result = requireFeature("auth.login");
    expect(result).toBeNull();
  });

  it("returns 403 response when feature is disabled", () => {
    process.env.ENV_NAME = "production";
    const result = requireFeature("auth.login");

    expect(result).not.toBeNull();
    expect(result?.status).toBe(403);
  });

  it("includes error details in response body", async () => {
    process.env.ENV_NAME = "production";
    const result = requireFeature("auth.login");

    const body = await result?.json();
    expect(body).toEqual({
      error: "Feature not available",
      code: "FEATURE_DISABLED",
    });
  });
});
```

### 6.3. Testy komponentów - `<FeatureFlag>`

**Plik:** `src/features/react/__tests__/FeatureFlag.test.tsx`

**Scenariusze:**

```typescript
import { render, screen } from '@testing-library/react';
import { FeatureFlag } from '../FeatureFlag';

describe('FeatureFlag', () => {
  it('renders children when feature is enabled', () => {
    process.env.ENV_NAME = 'local';

    render(
      <FeatureFlag name="auth.login">
        <button>Login</button>
      </FeatureFlag>
    );

    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('does not render children when feature is disabled', () => {
    process.env.ENV_NAME = 'production';

    render(
      <FeatureFlag name="auth.login">
        <button>Login</button>
      </FeatureFlag>
    );

    expect(screen.queryByRole('button', { name: 'Login' })).not.toBeInTheDocument();
  });

  it('renders fallback when feature is disabled', () => {
    process.env.ENV_NAME = 'production';

    render(
      <FeatureFlag name="auth.login" fallback={<div>Coming Soon</div>}>
        <button>Login</button>
      </FeatureFlag>
    );

    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Login' })).not.toBeInTheDocument();
  });
});
```

### 6.4. Testy integracyjne - API Route

**Plik:** `app/api/auth/login/__tests__/route.test.ts`

**Scenariusze:**

```typescript
import { POST } from "../route";

describe("POST /api/auth/login", () => {
  it("returns 403 when auth.login is disabled", async () => {
    process.env.ENV_NAME = "production"; // auth.login = false

    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com", password: "pass" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.code).toBe("FEATURE_DISABLED");
  });

  it("processes login when auth.login is enabled", async () => {
    process.env.ENV_NAME = "local"; // auth.login = true

    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "correctpassword",
      }),
    });

    const response = await POST(request);

    // Zakładając success login
    expect(response.status).toBe(200);
  });
});
```

### 6.5. Testy E2E (opcjonalne)

**Scenariusz:** User nie widzi przycisku "Create Collection" gdy flaga wyłączona.

```typescript
// e2e/feature-flags.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Feature Flags - Collections", () => {
  test("hides create button when collections.create is disabled", async ({
    page,
  }) => {
    // Set ENV_NAME=production przed uruchomieniem testu
    await page.goto("/dashboard");

    // Button nie powinien istnieć w DOM
    await expect(
      page.getByRole("button", { name: /create collection/i })
    ).not.toBeVisible();
  });

  test("shows create button when collections.create is enabled", async ({
    page,
  }) => {
    // Set ENV_NAME=local
    await page.goto("/dashboard");

    await expect(
      page.getByRole("button", { name: /create collection/i })
    ).toBeVisible();
  });

  test("blocks API call when feature is disabled", async ({ page }) => {
    // Set ENV_NAME=production
    await page.goto("/dashboard");

    // Symuluj manual API call (developer console attack)
    const response = await page.evaluate(async () => {
      return fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test Collection" }),
      }).then((r) => r.json());
    });

    expect(response.code).toBe("FEATURE_DISABLED");
  });
});
```

## 7. Etapy wdrożenia

### Krok 1: Struktura i typy (Foundation)

**Pliki do utworzenia:**

1. `src/features/core/types.ts`
   - Typy: `Environment`, `FeatureName`, `FeatureFlags`, `FeatureFlagsConfig`
   - Stałe: `DEFAULT_ENVIRONMENT`, `ENVIRONMENTS`

2. `src/features/config/flags.json`
   - Inicjalna konfiguracja dla `auth.*` i `collections.*`
   - 3 środowiska: local, integration, production

**Akceptacja:**

- [ ] TypeScript kompiluje się bez błędów
- [ ] Import JSON działa poprawnie
- [ ] Type `FeatureName` pokazuje autocomplete w IDE

**Czas:** 30 min

### Krok 2: Core logic (Universal function)

**Pliki do utworzenia:**

1. `src/features/core/get-environment.ts`
   - Funkcja `getEnvironment()` z walidacją i fallback

2. `src/features/core/is-feature-enabled.ts`
   - Funkcja `isFeatureEnabled()` z logiką lookup

**Akceptacja:**

- [ ] `isFeatureEnabled('auth.login')` zwraca `true` w local
- [ ] `isFeatureEnabled('auth.login')` zwraca `false` w production
- [ ] Brak ENV_NAME = default to local + console warning
- [ ] Nieprawidłowy ENV_NAME = default to local + console error

**Czas:** 45 min

### Krok 3: API layer (Server guards)

**Pliki do utworzenia:**

1. `src/features/api/require-feature.ts`
   - Funkcja `requireFeature()` zwracająca `NextResponse` lub `null`

**Akceptacja:**

- [ ] `requireFeature('auth.login')` zwraca `null` gdy enabled
- [ ] `requireFeature('auth.login')` zwraca `NextResponse(403)` gdy disabled
- [ ] Response body zawiera `{ error: '...', code: 'FEATURE_DISABLED' }`

**Czas:** 30 min

### Krok 4: React layer (UI components)

**Pliki do utworzenia:**

1. `src/features/react/FeatureFlag.tsx`
   - Komponent z `name`, `children`, `fallback` props

2. `src/features/react/use-feature.ts`
   - Hook zwracający `{ isEnabled: boolean }`

**Akceptacja:**

- [ ] `<FeatureFlag name="auth.login"><div>Test</div></FeatureFlag>` renderuje content gdy ON
- [ ] `<FeatureFlag>` nie renderuje children gdy OFF
- [ ] `<FeatureFlag fallback={<div>Soon</div>}>` renderuje fallback gdy OFF
- [ ] `useFeature('auth.login')` zwraca `{ isEnabled: true/false }`

**Czas:** 45 min

### Krok 5: Public API (Barrel export)

**Pliki do utworzenia:**

1. `src/features/index.ts`
   - Eksport wszystkich public functions i types

**Akceptacja:**

- [ ] Import `import { isFeatureEnabled } from '@/features'` działa
- [ ] Import `import { requireFeature, FeatureFlag, useFeature } from '@/features'` działa
- [ ] TypeScript autocomplete dla `FeatureName` type działa

**Czas:** 15 min

### Krok 6: Dokumentacja

**Pliki do zaktualizowania:**

1. `README.md` lub `docs/feature-flags.md`
   - Krótka instrukcja jak dodać nową flagę
   - Przykłady użycia dla każdego API

2. `.env.example`
   - Dodać `ENV_NAME=local`

**Akceptacja:**

- [ ] Developer wie jak dodać nową flagę (3 kroki)
- [ ] Developer wie jak użyć flagi w API route
- [ ] Developer wie jak użyć flagi w komponencie

**Czas:** 30 min

### Krok 7: Integracja z istniejącym kodem (Przykłady)

**Pliki do zmodyfikowania:**

1. `app/api/auth/login/route.ts`
   - Dodać guard `requireFeature('auth.login')`

2. `components/layout/Header.tsx`
   - Dodać `<FeatureFlag name="collections.list">` wokół linku Collections

**Akceptacja:**

- [ ] `/api/auth/login` zwraca 403 gdy `ENV_NAME=production`
- [ ] `/api/auth/login` działa normalnie gdy `ENV_NAME=local`
- [ ] Link "Collections" nie renderuje się gdy flaga OFF
- [ ] Link "Collections" renderuje się gdy flaga ON

**Czas:** 30 min

### Krok 8: Testy (Quality assurance)

**Pliki do utworzenia:**

1. `src/features/core/__tests__/is-feature-enabled.test.ts`
2. `src/features/api/__tests__/require-feature.test.ts`
3. `src/features/react/__tests__/FeatureFlag.test.tsx`
4. `src/features/react/__tests__/use-feature.test.ts`

**Akceptacja:**

- [ ] Wszystkie testy przechodzą (green)
- [ ] Coverage >= 80% dla `src/features/`

**Czas:** 1-2 godziny

### Krok 9: Konfiguracja środowisk (Deployment)

**Pliki do zaktualizowania:**

1. `.github/workflows/deploy.yml` (lub podobny)
   - Dodać `ENV_NAME=integration` dla integration environment
   - Dodać `ENV_NAME=production` dla production environment

2. `docker-compose.yml` (jeśli używany)
   - Dodać `environment: - ENV_NAME=local`

3. Vercel/DigitalOcean environment variables
   - Ustawić `ENV_NAME=production` w production
   - Ustawić `ENV_NAME=integration` w preview/staging

**Akceptacja:**

- [ ] Local development: ENV_NAME=local (z `.env.local`)
- [ ] Integration: ENV_NAME=integration (z CI/CD vars)
- [ ] Production: ENV_NAME=production (z platform env vars)

**Czas:** 30-60 min (zależnie od platformy)

### Krok 10: Rollout plan (Komunikacja z zespołem)

**Zadania:**

1. Stwórz checklist dla dodawania nowej flagi:

   ```
   □ Dodaj flagę do flags.json (wszystkie 3 środowiska)
   □ Zaktualizuj typ FeatureName w types.ts
   □ Dodaj guard requireFeature() w API route
   □ Dodaj <FeatureFlag> lub useFeature() w UI
   □ Napisz testy
   □ Update flags.json do włączenia na integration → test → production
   ```

2. Zaplanuj migrację istniejących feature toggles (jeśli są):
   - Zinwentaryzuj istniejące ad-hoc flagi (env vars, hardcoded ifs)
   - Przenieś do nowego systemu stopniowo

**Akceptacja:**

- [ ] Zespół wie jak używać feature flags
- [ ] Istniejący code został zmigrowowany lub zaplanowany do migracji

**Czas:** 1-2 godziny (meeting + dokumentacja)

---

## Łączny czas wdrożenia: 6-8 godzin

**Breakdown:**

- Implementacja core (kroki 1-5): ~3 godziny
- Dokumentacja i przykłady (kroki 6-7): 1 godzina
- Testy (krok 8): 1-2 godziny
- Deployment setup (krok 9): 0.5-1 godzina
- Rollout i komunikacja (krok 10): 1-2 godziny

## 8. Rozszerzenia przyszłościowe (poza MVP)

### Runtime Feature Flags (Phase 2)

**Problem:** Zmiana flagi wymaga rebuild i redeploy.

**Rozwiązanie:** Fetch flag z external service (LaunchDarkly, Unleash, custom API).

**Implementacja:**

```typescript
// src/features/core/feature-flags-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { FeatureName, FeatureFlags } from './types';

const FeatureFlagsContext = createContext<FeatureFlags | null>(null);

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlags | null>(null);

  useEffect(() => {
    // Fetch from API
    fetch('/api/feature-flags')
      .then(r => r.json())
      .then(setFlags);
  }, []);

  return (
    <FeatureFlagsContext.Provider value={flags}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useRuntimeFeature(name: FeatureName) {
  const flags = useContext(FeatureFlagsContext);

  if (!flags) {
    return { isEnabled: false, isLoading: true };
  }

  return { isEnabled: flags[name] ?? false, isLoading: false };
}
```

**Breaking changes:** Zero - nowy hook `useRuntimeFeature`, stary `useFeature` nadal działa.

### User-specific flags (Phase 3)

**Use case:** A/B testing, gradual rollout, beta features.

**Rozwiązanie:** Fetch flag per user ID.

```typescript
export function useUserFeature(name: FeatureName) {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    if (user) {
      fetch(`/api/feature-flags/${name}?userId=${user.id}`)
        .then((r) => r.json())
        .then((data) => setIsEnabled(data.enabled));
    }
  }, [name, user]);

  return { isEnabled };
}
```

**Backend logic:**

```typescript
// app/api/feature-flags/[name]/route.ts
export async function GET(
  req: Request,
  { params }: { params: { name: FeatureName } }
) {
  const userId = req.nextUrl.searchParams.get("userId");

  // Logic: 10% rollout
  const isEnabled = hashUserId(userId) % 100 < 10;

  return NextResponse.json({ enabled: isEnabled });
}
```

### Analytics & Metrics (Phase 4)

**Use case:** Track feature usage, measure adoption.

```typescript
export function requireFeature(name: FeatureName) {
  if (!isFeatureEnabled(name)) {
    // Log blocked attempt
    analytics.track("feature_flag_blocked", {
      feature: name,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: "Feature not available" },
      { status: 403 }
    );
  }

  // Log successful access
  analytics.track("feature_flag_accessed", {
    feature: name,
  });

  return null;
}
```

**Metrics to track:**

- `feature_flag_accessed` - ile razy feature został użyty
- `feature_flag_blocked` - ile razy próbowano użyć wyłączonego feature
- `feature_flag_duration` - czas od włączenia do 100% adoption

---

## Podsumowanie

System Feature Flags dla 10xCards to compile-time, type-safe rozwiązanie umożliwiające bezpieczne rozdzielenie deploymentów od releasów. Główne założenia:

✅ **Universal API** - jedna funkcja `isFeatureEnabled()` działa w API i UI
✅ **Type-safe** - TypeScript autocomplete dla nazw flag
✅ **Security-first** - server-side guards chronią API
✅ **Simple MVP** - statyczna konfiguracja JSON, boolean flags only
✅ **Future-proof** - architektura gotowa na runtime flags bez breaking changes

**Rozpocznij od kroków 1-5 (core implementation), a następnie przetestuj na przykładzie (krok 7) przed pełnym rollout.**
