# Task: Migracja z getSession() na getUser() dla Security

## Problem

Supabase wyświetla ostrzeżenie w logach:

```
Using the user object as returned from supabase.auth.getSession() or from some
supabase.auth.onAuthStateChange() events could be insecure! This value comes
directly from the storage medium (usually cookies on the server) and may not be
authentic. Use supabase.auth.getUser() instead which authenticates the data by
contacting the Supabase Auth server.
```

## Dlaczego to problem security?

### `getSession()` (INSECURE):

- ❌ Czyta **tylko z cookies** bez weryfikacji
- ❌ Nie sprawdza czy JWT jest podrobiony
- ❌ Nie sprawdza expiration date
- ❌ Nie kontaktuje się z Supabase Auth server
- ⚠️ **Podatne na atak**: Ktoś może podrobić/sfałszować cookie i uzyskać dostęp

### `getUser()` (SECURE):

- ✅ **Weryfikuje JWT** z Supabase Auth server
- ✅ Sprawdza expiration date
- ✅ Sprawdza signature (crypto verification)
- ✅ Gwarantuje autentyczność użytkownika
- 🔒 **Odporny na podrobienie** - wymaga valid JWT signature

## Obecne użycie getSession()

### Lokalizacje (4 miejsca):

1. **middleware.ts:83**
   - Status: ✅ **MUSI pozostać getSession()**
   - Powód: Edge Runtime nie pozwala na fetch (getUser wymaga API call)
   - Risk: NISKIE - middleware tylko przekierowuje, nie daje dostępu do danych

2. **lib/api/auth-utils.ts:59** (`getAuthenticatedUser()`)
   - Status: ❌ **TRZEBA zmienić na getUser()**
   - Użycie: Wszystkie protected API routes (flashcards, AI generations)
   - Risk: WYSOKIE - daje dostęp do user.id dla CRUD operations

3. **components/layout/GlobalHeader.tsx:14**
   - Status: ❌ **TRZEBA zmienić na getUser()**
   - Użycie: Server Component rendering user menu
   - Risk: ŚREDNIE - pokazuje email użytkownika

4. **app/page.tsx:13**
   - Status: ❌ **TRZEBA zmienić na getUser()**
   - Użycie: Server Component routing logic (redirect do dashboard/login)
   - Risk: NISKIE - tylko routing, ale lepiej być bezpiecznym

## Możliwe rozwiązania

### Opcja 1: Full Migration (ZALECANE) 🟢

**Co:** Zmień `getSession()` → `getUser()` wszędzie POZA middleware

**Pros:**

- ✅ Maximum security
- ✅ Zgodność z best practices Supabase
- ✅ Usuwa warnings z logów
- ✅ Weryfikuje JWT signature
- ✅ Automatycznie sprawdza expiration

**Cons:**

- ⚠️ Dodatkowe API calls (3x getUser per request: auth-utils, header, page)
- ⚠️ Może zwiększyć latency o ~50-100ms per call

**Rekomendacja:** ✅ **TAK, wdrożyć** - security > performance w MVP

---

### Opcja 2: Partial Migration (KOMPROMIS) 🟡

**Co:** Zmień tylko `getAuthenticatedUser()` (auth-utils), pozostaw komponenty UI

**Pros:**

- ✅ Zabezpiecza API routes (najważniejsze)
- ✅ Minimalizuje API calls (1x getUser per request)
- ⚡ Lepsza performance niż Opcja 1

**Cons:**

- ⚠️ GlobalHeader i app/page.tsx nadal używają insecure getSession
- ⚠️ Częściowe warnings w logach

**Rekomendacja:** 🤔 Możliwe dla MVP, ale nie idealne

---

### Opcja 3: No Change (Status Quo) 🔴

**Co:** Zostaw `getSession()` wszędzie, zignoruj warning

**Pros:**

- ⚡ Zero zmian, zero regresji
- ⚡ Najlepsza performance

**Cons:**

- ❌ **Security risk** - podatność na JWT forgery
- ❌ Nie zgodne z Supabase best practices
- ❌ Warnings w logach na zawsze

**Rekomendacja:** ❌ **NIE** - nieakceptowalne dla produkcji

---

## Plan implementacji (Opcja 1 - Full Migration)

### FAZA 1: Migracja auth-utils (CRITICAL)

**Zadanie 1.1: Zmień getAuthenticatedUser() na getUser()** ⏱️ 5 min

W `lib/api/auth-utils.ts:55-62`:

**Przed:**

```typescript
export async function getAuthenticatedUser(): Promise<User | null> {
  const supabase = await createSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.user ?? null;
}
```

**Po:**

```typescript
export async function getAuthenticatedUser(): Promise<User | null> {
  const supabase = await createSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("[auth-utils] getUser failed:", error.message);
    return null;
  }

  return user;
}
```

**Test:**

- [ ] `curl -X GET http://localhost:3000/api/flashcards` (bez auth) → 401
- [ ] Login → GET /api/flashcards → 200 OK
- [ ] Sprawdź logi - brak warnings o insecure getSession dla API routes

---

### FAZA 2: Migracja GlobalHeader

**Zadanie 2.1: Zmień GlobalHeader na getUser()** ⏱️ 5 min

W `components/layout/GlobalHeader.tsx:10-14`:

**Przed:**

```typescript
export async function GlobalHeader() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <header>
      {session ? (
        <UserMenu email={session.user.email || "User"} />
      ) : (
        // ...
```

**Po:**

```typescript
export async function GlobalHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header>
      {user ? (
        <UserMenu email={user.email || "User"} />
      ) : (
        // ...
```

**Test:**

- [ ] Zaloguj się → Header pokazuje user menu z emailem
- [ ] Wyloguj → Header pokazuje "Zaloguj się" i "Zarejestruj się"

---

### FAZA 3: Migracja app/page.tsx

**Zadanie 3.1: Zmień redirect logic na getUser()** ⏱️ 5 min

W `app/page.tsx:9-19`:

**Przed:**

```typescript
export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
```

**Po:**

```typescript
export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
```

**Test:**

- [ ] Wejdź na `http://localhost:3000/` bez auth → redirect na `/login`
- [ ] Wejdź na `http://localhost:3000/` z auth → redirect na `/dashboard`

---

### FAZA 4: Weryfikacja i dokumentacja

**Zadanie 4.1: End-to-end testing** ⏱️ 10 min

- [ ] Login flow działa (POST /api/auth/login)
- [ ] Dashboard access działa (GET /dashboard)
- [ ] API flashcards CRUD działa (GET/POST/PATCH/DELETE /api/flashcards)
- [ ] AI generation działa (POST /api/ai/generations)
- [ ] Logout działa (POST /api/auth/logout)
- [ ] Middleware redirects działają (unauthenticated → /login)
- [ ] GlobalHeader render działa (pokazuje user email)

**Zadanie 4.2: Sprawdź logi** ⏱️ 5 min

```bash
docker logs 10xcards-app-1 --tail 100 | grep "insecure"
```

**Oczekiwany rezultat:** Brak warnings o "insecure getSession"

**Zadanie 4.3: Dokumentacja** ⏱️ 5 min

Dodaj do `lib/api/auth-utils.ts` komentarz:

```typescript
/**
 * Gets the currently authenticated user using getUser() (SECURE)
 *
 * SECURITY: Uses getUser() instead of getSession() to ensure JWT verification
 * with Supabase Auth server. This prevents JWT forgery attacks.
 *
 * @see https://supabase.com/docs/guides/auth/server-side/creating-a-client
 */
```

---

## Acceptance Criteria

### Must Have (Opcja 1)

- [x] `lib/api/auth-utils.ts` używa `getUser()`
- [x] `components/layout/GlobalHeader.tsx` używa `getUser()`
- [x] `app/page.tsx` używa `getUser()`
- [x] Middleware nadal używa `getSession()` (exception)
- [x] Brak warnings "insecure getSession" w logach (poza middleware)
- [x] Wszystkie auth flows działają (login, logout, API access)
- [x] TypeScript kompiluje bez błędów

### Nice to Have

- [ ] Performance benchmark: porównanie latency before/after
- [ ] Dokumentacja w README o security practices
- [ ] Cache getUser() results w request context (optimization)

---

## Ryzyka i mitygacje

**Ryzyko 1: Increased latency**

- **Opis**: getUser() robi API call do Supabase Auth (~50-100ms)
- **Mitygacja**: Akceptowalne dla MVP, można później zoptymalizować z cache
- **Mitygacja 2**: Supabase ma built-in caching w SDK

**Ryzyko 2: Rate limiting**

- **Opis**: getUser() może być rate-limited przez Supabase
- **Mitygacja**: Free tier: 50,000 monthly active users, powinno wystarczyć dla MVP
- **Monitoring**: Sprawdzić Supabase dashboard po wdrożeniu

**Ryzyko 3: Network failures**

- **Opis**: getUser() może failować jeśli Supabase Auth down
- **Mitygacja**: getUser() już ma error handling (zwraca error object)
- **Fallback**: W auth-utils zwracamy `null` przy error → user dostaje 401

---

## Performance Impact (Szacunkowe)

**Przed (getSession):**

- Auth check: ~1-2ms (read from cookies)
- Total: ~1-2ms

**Po (getUser):**

- Auth check: ~50-100ms (API call + JWT verification)
- Total: ~50-100ms

**Impact:**

- Request latency: +50-100ms per authenticated request
- Akceptowalne dla MVP (security > performance)

**Możliwa optymalizacja (post-MVP):**

- Cache getUser() result w request context
- Use Redis dla session cache
- Implement custom JWT verification (bez API call)

---

## Podsumowanie czasu

**Opcja 1 (Full Migration):**

- Faza 1: 5 min (auth-utils)
- Faza 2: 5 min (GlobalHeader)
- Faza 3: 5 min (app/page)
- Faza 4: 20 min (testing + docs)
- **Total: ~35 min**

**Opcja 2 (Partial Migration):**

- Faza 1: 5 min (auth-utils only)
- Faza 4: 10 min (testing)
- **Total: ~15 min**

---

## Rekomendacja

### 🎯 Dla MVP przed certyfikacją: **Opcja 1 (Full Migration)**

**Uzasadnienie:**

1. Security first - JWT verification zapobiega forgery attacks
2. Zgodność z Supabase best practices
3. Czyste logi bez warnings
4. 35 minut to niewiele dla security improvement
5. Lepiej mieć solidne fundamenty od początku

### ⚡ Alternatywa jeśli deadline ciśnie: **Opcja 2 (Partial)**

Minimum: Zmień `auth-utils.ts` (zabezpiecza API routes).
Pozostałe miejsca (UI) można zmienić później.

### ❌ NIE rekomendowane: Opcja 3 (No Change)

Security risk nieakceptowalny dla produkcji.

---

## Related

- Supabase docs: https://supabase.com/docs/guides/auth/server-side/creating-a-client
- Security: `lib/api/auth-utils.ts`, `middleware.ts`
- Components: `components/layout/GlobalHeader.tsx`, `app/page.tsx`

---

## Implementation Results (2025-10-30)

### ✅ COMPLETED - Option 1: Full Migration

**Implementation time**: ~25 minutes (faster than estimated 35 min)

### Changes Made

1. **lib/api/auth-utils.ts** (`getAuthenticatedUser()`)
   - Changed from `getSession()` to `getUser()`
   - Added error handling for failed getUser() calls
   - Added security documentation comment
   - Status: ✅ Migrated

2. **components/layout/GlobalHeader.tsx**
   - Changed from `getSession()` to `getUser()`
   - Updated variable from `session` to `user`
   - Added security documentation comment
   - Status: ✅ Migrated

3. **app/page.tsx**
   - Changed from `getSession()` to `getUser()`
   - Updated variable from `session` to `user`
   - Added security documentation comment
   - Status: ✅ Migrated

4. **middleware.ts**
   - Status: ✅ No change (documented exception)
   - Reason: Edge Runtime doesn't support external fetch required by getUser()
   - Security impact: LOW - middleware only redirects, doesn't expose user data

### Verification

- ✅ TypeScript compilation: `npx tsc --noEmit` - PASS
- ✅ ESLint: `npm run lint` - PASS (no warnings or errors)
- ✅ Docker restart: Container restarted successfully
- ✅ App startup: Ready in 1753ms
- ✅ Auth flows: Login, logout, API access all working
- ✅ Middleware: Correctly uses getSession() (expected exception)
- ✅ Warnings: Only from middleware (expected), no warnings from migrated files

### Security Improvement

**Before migration:**

- 4 files using insecure `getSession()` (no JWT verification)
- Vulnerable to JWT forgery attacks
- No server-side validation of authentication tokens

**After migration:**

- 3 files using secure `getUser()` (JWT verification with Supabase Auth server)
- 1 file using `getSession()` (middleware - documented exception with low security risk)
- Protected against JWT forgery on all API routes and server components
- Supabase Auth server validates all authentication tokens

### Performance Impact

- Observed: App responds normally, no noticeable latency increase for MVP usage
- Expected: +50-100ms per authenticated request (acceptable for security benefit)
- Mitigation: Supabase SDK has built-in caching

### Acceptance Criteria Met

- [x] All 3 files migrated to getUser()
- [x] Middleware documented exception (must use getSession())
- [x] TypeScript compilation without errors
- [x] ESLint without warnings
- [x] All auth flows working
- [x] No "insecure getSession" warnings (except expected middleware warnings)

### Conclusion

**Migration successful.** The application now uses secure JWT verification for all authentication checks except middleware (where it's not technically possible). This significantly improves security posture while maintaining functionality.
