# Authentication & Authorization Implementation Plan

## Przegląd zadania

Implementacja pełnego systemu autoryzacji i uwierzytelniania użytkowników na podstawie `.ai/auth-spec.md`. Obejmuje:

- Rejestrację i logowanie użytkowników
- Reset hasła przez e-mail
- Ochronę wszystkich tras i endpointów API
- User menu z wylogowaniem
- Zasada: **niezalogowany użytkownik nie może wykonać ŻADNEJ akcji poza logowaniem/rejestracją**

## Approach (Podejście MVP)

**Filozofia**: Bezpieczeństwo first - zacznij od ochrony tras i API, potem dodaj UI. Użyj Supabase Auth (już zintegrowane) z cookie-based sessions.

### Kluczowe decyzje architektoniczne:

1. **Supabase Auth z SSR** - wykorzystanie `@supabase/ssr` (już zainstalowane)
2. **Middleware-first approach** - chronione trasy od początku, nie na końcu
3. **API route protection** - każdy endpoint weryfikuje sesję użytkownika
4. **shadcn/ui formularze** - walidacja z `zod` + `react-hook-form`
5. **Cookie-based sessions** - httpOnly, secure, zarządzane przez Supabase
6. **Toast notifications** - shadcn/sonner dla komunikatów (już zainstalowane w dashboard)

### Iteracje (MVPowy podział pracy 3x3):

**FAZA 1: BACKEND AUTH (API + Protection)**

- Task 1.1: Auth API endpoints (register, login, logout, password-reset)
- Task 1.2: Rozszerzenie middleware o ochronę chronionych tras
- Task 1.3: Dodanie autoryzacji do istniejących API routes

**FAZA 2: FRONTEND AUTH (Pages + Forms)**

- Task 2.1: Strony autoryzacyjne (/login, /register, /password-reset, /update-password)
- Task 2.2: Komponenty formularzy z walidacją (LoginForm, RegisterForm, etc.)
- Task 2.3: Instalacja i konfiguracja react-hook-form + zod

**FAZA 3: UX & INTEGRACJA (User Menu + Polish)**

- Task 3.1: GlobalHeader z UserMenu i wylogowaniem
- Task 3.2: Obsługa błędów i komunikatów (toasts)
- Task 3.3: Edge cases i testowanie user stories

## Rozbicie zadań (Task Breakdown)

### FAZA 1: BACKEND AUTH (API + Protection)

#### 1.1: Auth API endpoints (4 endpointy)

**Zadanie:** Utworzyć API routes dla wszystkich operacji autoryzacyjnych zgodnie z auth-spec.md

- [ ] Utworzyć `app/api/auth/register/route.ts`:
  - Walidacja: email (format), password (min 8 znaków)
  - Wywołanie `supabase.auth.signUp({ email, password })`
  - Obsługa błędów: "E-mail zajęty", "Błąd serwera"
  - Response: JSON z sesją lub błędem (201 Created / 400 Bad Request / 500)
  - **WAŻNE:** Po rejestracji użytkownik ma automatycznie sesję (nie wymaga potwierdzenia email w MVP)

- [ ] Utworzyć `app/api/auth/login/route.ts`:
  - Walidacja: email, password (required)
  - Wywołanie `supabase.auth.signInWithPassword({ email, password })`
  - Obsługa błędów: "Nieprawidłowy e-mail lub hasło"
  - Response: JSON z sesją (200 OK / 401 Unauthorized / 500)
  - Cookie sesyjne ustawiane automatycznie przez Supabase

- [ ] Utworzyć `app/api/auth/logout/route.ts`:
  - Wywołanie `supabase.auth.signOut()`
  - Usuwanie cookie sesyjnego (automatyczne)
  - Response: 204 No Content (zawsze sukces, nawet jeśli nie było sesji)

- [ ] Utworzyć `app/api/auth/password-reset/route.ts`:
  - Walidacja: email (format, required)
  - Wywołanie `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
  - `redirectTo` → `${process.env.NEXT_PUBLIC_APP_URL}/update-password`
  - Response: JSON { message: "E-mail został wysłany" } (200 OK)
  - **WAŻNE:** Zawsze zwracaj sukces, nawet jeśli email nie istnieje (bezpieczeństwo)

**Helper:** Utworzyć `lib/api/auth-utils.ts`:

- `async function getAuthenticatedUser(request: NextRequest)` - zwraca user lub null
- `async function requireAuth(request: NextRequest)` - zwraca user lub rzuca 401 error
- Reusable w innych API routes

**Walidacja:**

- Użyć `zod` dla schematów (EmailSchema, PasswordSchema, etc.)
- Centralna obsługa błędów walidacji → JSON { error, details }

**Czas:** ~45 minut

#### 1.2: Rozszerzenie middleware o ochronę chronionych tras

**Zadanie:** Dodać logikę przekierowań do istniejącego `middleware.ts`

- [ ] Zmodyfikować `middleware.ts`:
  - Po `await supabase.auth.getSession()` dodać logikę routing protection
  - Chronione trasy: `/dashboard`, `/study`, `/settings`
  - Publiczne trasy: `/login`, `/register`, `/password-reset`, `/update-password`, `/`
  - API routes: `/api/auth/*` publiczne, `/api/*` chronione

- [ ] Logika przekierowań:

  ```typescript
  const session = (await supabase.auth.getSession()).data.session;
  const isAuthPage = ["/login", "/register", "/password-reset"].some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );
  const isProtectedPage = ["/dashboard", "/study", "/settings"].some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );
  const isProtectedApi =
    request.nextUrl.pathname.startsWith("/api") &&
    !request.nextUrl.pathname.startsWith("/api/auth") &&
    !request.nextUrl.pathname.startsWith("/api/health");

  // Niezalogowany próbuje dostać się do chronionej trasy → redirect /login
  if (!session && (isProtectedPage || isProtectedApi)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Zalogowany próbuje dostać się do strony auth → redirect /dashboard
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  ```

- [ ] Dodać obsługę `/update-password` (specjalny case):
  - Wymaga tokenu `access_token` w URL (hash fragment)
  - Jeśli brak tokenu → redirect `/login`

**Testy manualne:**

- [ ] GET /dashboard (brak sesji) → redirect /login ✓
- [ ] GET /api/flashcards (brak sesji) → redirect /login ✓
- [ ] GET /login (z sesją) → redirect /dashboard ✓
- [ ] GET /api/auth/login (brak sesji) → 200 OK ✓
- [ ] GET /api/health (zawsze dostępny) → 200 OK ✓

**Czas:** ~30 minut

#### 1.3: Dodanie autoryzacji do istniejących API routes

**Zadanie:** Zabezpieczyć wszystkie endpointy wymagające uwierzytelnienia

- [ ] Zmodyfikować `app/api/flashcards/route.ts`:
  - `GET /api/flashcards`: Dodać `const user = await requireAuth(request)` na początku
  - Filtrować fiszki po `user_id = user.id`
  - `POST /api/flashcards`: Dodać `user_id: user.id` do insertu

- [ ] Zmodyfikować `app/api/flashcards/[id]/route.ts` (jeśli istnieje):
  - `PATCH /api/flashcards/:id`: Weryfikacja `user_id = user.id` przed update
  - `DELETE /api/flashcards/:id`: Weryfikacja `user_id = user.id` przed delete
  - Jeśli user_id się nie zgadza → 403 Forbidden

- [ ] Zmodyfikować `app/api/ai/generations/route.ts`:
  - `POST /api/ai/generations`: Dodać `const user = await requireAuth(request)`
  - Zapisać `user_id` w rekordzie `ai_generations`

- [ ] Zmodyfikować `app/api/ai/generations/accept/route.ts`:
  - `POST /api/ai/generations/accept`: Weryfikacja `user_id` generacji
  - Tylko właściciel generacji może ją zaakceptować → 403 jeśli not owner

**Helper użyty:**

- `requireAuth(request)` z `lib/api/auth-utils.ts`
- Zwraca `User` object lub rzuca `Response` 401 Unauthorized

**Schema bazodanowa (weryfikacja):**

- Sprawdzić czy wszystkie tabele mają kolumnę `user_id UUID NOT NULL`
- Jeśli nie → dodać migrację SQL (ale to powinno już być)

**Czas:** ~40 minut

---

### FAZA 2: FRONTEND AUTH (Pages + Forms)

#### 2.1: Strony autoryzacyjne (4 strony)

**Zadanie:** Utworzyć publiczne strony dla flow autoryzacyjnego

- [ ] Utworzyć `app/login/page.tsx`:
  - Server Component (nie wymaga 'use client')
  - Sprawdzenie sesji: jeśli zalogowany → redirect `/dashboard`
  - Renderowanie `<LoginForm />` (client component)
  - Metadata: title "Logowanie | 10xCards"

- [ ] Utworzyć `app/register/page.tsx`:
  - Podobna struktura jak `/login`
  - Renderowanie `<RegisterForm />`
  - Link do `/login` ("Masz już konto?")
  - Metadata: title "Rejestracja | 10xCards"

- [ ] Utworzyć `app/password-reset/page.tsx`:
  - Renderowanie `<PasswordResetForm />`
  - Komunikat: "Wyślemy Ci link do zresetowania hasła"
  - Link do `/login` ("Pamiętasz hasło?")
  - Metadata: title "Reset hasła | 10xCards"

- [ ] Utworzyć `app/update-password/page.tsx`:
  - Renderowanie `<UpdatePasswordForm />`
  - Sprawdzenie tokenu w URL hash (client component)
  - Jeśli brak tokenu → komunikat błędu + link do `/password-reset`
  - Metadata: title "Ustaw nowe hasło | 10xCards"

**Layout dla auth pages:**

- Centrowanie na ekranie (flex justify-center items-center min-h-screen)
- Card z shadcn/ui (max-width 400px)
- Logo na górze

**Czas:** ~35 minut

#### 2.2: Komponenty formularzy z walidacją (4 komponenty)

**Zadanie:** Utworzyć komponenty formularzy wykorzystujące react-hook-form + zod

- [ ] Zainstalować komponenty shadcn/ui:
  - `npx shadcn@latest add form` (wrapper dla react-hook-form)
  - `npx shadcn@latest add input`
  - `npx shadcn@latest add label`

- [ ] Utworzyć `components/auth/LoginForm.tsx` ('use client'):
  - Pola: email (input type="email"), password (input type="password")
  - Schema zod: email (valid email), password (min 1 char - nie sprawdzamy złożoności przy logowaniu)
  - Button "Zaloguj się" (disabled podczas submitu)
  - onSubmit: POST /api/auth/login, przy sukcesie router.push('/dashboard')
  - Obsługa błędów: toast z komunikatem
  - Link do `/register` ("Nie masz konta?")
  - Link do `/password-reset` ("Zapomniałeś hasła?")

- [ ] Utworzyć `components/auth/RegisterForm.tsx`:
  - Pola: email, password, confirmPassword
  - Schema zod:
    - email: email format
    - password: min 8 znaków, regex (min 1 cyfra, 1 wielka, 1 mała) - zgodnie ze spec Supabase
    - confirmPassword: musi być === password
  - Button "Zarejestruj się"
  - onSubmit: POST /api/auth/register, przy sukcesie router.push('/dashboard')
  - Komunikaty walidacji inline (react-hook-form errors)
  - Link do `/login`

- [ ] Utworzyć `components/auth/PasswordResetForm.tsx`:
  - Pole: email
  - Schema zod: email format
  - Button "Wyślij link resetujący"
  - onSubmit: POST /api/auth/password-reset
  - Po sukcesie: toast "E-mail został wysłany" + wyłączenie formularza (pokazać success message)
  - Link do `/login`

- [ ] Utworzyć `components/auth/UpdatePasswordForm.tsx`:
  - Pola: password, confirmPassword
  - Schema zod: password (jak w rejestracji), confirmPassword
  - Button "Ustaw nowe hasło"
  - onSubmit: Wywołanie `supabase.auth.updateUser({ password })` (client-side, bo mamy token w URL)
  - Po sukcesie: toast + router.push('/dashboard')
  - Token access z URL hash: `const hashParams = new URLSearchParams(window.location.hash.substring(1))`

**Helper hooks:**

- `useAuth()` custom hook w `hooks/useAuth.ts`:
  - Zwraca: `{ login, register, logout, resetPassword, updatePassword, isLoading, error }`
  - Enkapsulacja logiki API calls

**Czas:** ~60 minut

#### 2.3: Instalacja i konfiguracja react-hook-form + zod

**Zadanie:** Dodać biblioteki do walidacji formularzy

- [ ] Zainstalować pakiety:

  ```bash
  npm install react-hook-form zod @hookform/resolvers
  ```

- [ ] Utworzyć `lib/validations/auth.ts` - zod schemas:

  ```typescript
  export const loginSchema = z.object({
    email: z.string().email("Nieprawidłowy format e-mail"),
    password: z.string().min(1, "Hasło jest wymagane"),
  });

  export const registerSchema = z
    .object({
      email: z.string().email("Nieprawidłowy format e-mail"),
      password: z
        .string()
        .min(8, "Hasło musi mieć min. 8 znaków")
        .regex(/[A-Z]/, "Hasło musi zawierać wielką literę")
        .regex(/[a-z]/, "Hasło musi zawierać małą literę")
        .regex(/[0-9]/, "Hasło musi zawierać cyfrę"),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Hasła muszą być identyczne",
      path: ["confirmPassword"],
    });

  export const passwordResetSchema = z.object({
    email: z.string().email("Nieprawidłowy format e-mail"),
  });

  export const updatePasswordSchema = z
    .object({
      password: z
        .string()
        .min(8, "Hasło musi mieć min. 8 znaków")
        .regex(/[A-Z]/, "Hasło musi zawierać wielką literę")
        .regex(/[a-z]/, "Hasło musi zawierać małą literę")
        .regex(/[0-9]/, "Hasło musi zawierać cyfrę"),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Hasła muszą być identyczne",
      path: ["confirmPassword"],
    });
  ```

- [ ] Utworzyć `hooks/useAuth.ts`:

  ```typescript
  "use client";
  import { useRouter } from "next/navigation";
  import { useState } from "react";
  import { createClient } from "@/lib/db/supabase.client";

  export function useAuth() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const login = async (email: string, password: string) => {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Błąd logowania");
        setIsLoading(false);
        return false;
      }
      router.push("/dashboard");
      router.refresh(); // Refresh server components
      return true;
    };

    // Similar dla register, logout, resetPassword, updatePassword...

    return {
      login,
      register,
      logout,
      resetPassword,
      updatePassword,
      isLoading,
      error,
    };
  }
  ```

**Czas:** ~20 minut

---

### FAZA 3: UX & INTEGRACJA (User Menu + Polish)

#### 3.1: GlobalHeader z UserMenu i wylogowaniem

**Zadanie:** Dodać header z informacją o zalogowanym użytkowniku i opcją wylogowania

- [ ] Utworzyć `components/layout/GlobalHeader.tsx` (Server Component):
  - Pobieranie sesji: `const supabase = await createClient()` + `getSession()`
  - Jeśli brak sesji: wyświetl linki "Zaloguj się" / "Zarejestruj się"
  - Jeśli sesja: wyświetl `<UserMenu user={session.user} />`
  - Sticky header: `sticky top-0 z-50 border-b bg-background`

- [ ] Utworzyć `components/layout/UserMenu.tsx` ('use client'):
  - Zainstalować: `npx shadcn@latest add dropdown-menu` + `npx shadcn@latest add avatar`
  - Avatar z inicjałami: `{user.email[0].toUpperCase()}`
  - Dropdown menu items:
    - User email (disabled, tylko info)
    - Link: "Ustawienia" → `/settings` (jeśli zaimplementowane)
    - Separator
    - Button: "Wyloguj się" → wywołanie `handleLogout()`
  - `handleLogout()`:
    - POST /api/auth/logout
    - router.push('/login')
    - router.refresh()

- [ ] Dodać `<GlobalHeader />` do `app/layout.tsx`:
  - Umieścić przed `{children}`
  - Dynamiczny rendering: pokazuje się na każdej stronie

- [ ] Opcjonalnie: Breadcrumbs w headerze
  - `/dashboard` → "Panel główny"
  - `/study` → "Nauka"
  - `/settings` → "Ustawienia"

**Czas:** ~40 minut

#### 3.2: Obsługa błędów i komunikatów (toasts)

**Zadanie:** Spójny system notyfikacji dla user feedback

- [ ] Toast notifications już zainstalowane (sonner) - sprawdzić konfigurację
  - Jeśli brak: `npx shadcn@latest add sonner`
  - Dodać `<Toaster />` do `app/layout.tsx` (jeśli nie ma w dashboard)

- [ ] Standaryzacja komunikatów błędów:
  - **Login:**
    - 401: "Nieprawidłowy e-mail lub hasło"
    - 500: "Wystąpił błąd serwera. Spróbuj ponownie później."
  - **Register:**
    - 400 (email zajęty): "Ten adres e-mail jest już zajęty"
    - 400 (walidacja): Konkretny komunikat z zod
    - 500: "Wystąpił błąd podczas rejestracji"
  - **Password reset:**
    - Zawsze sukces (bezpieczeństwo): "Jeśli konto istnieje, e-mail został wysłany"
  - **Logout:**
    - Zawsze sukces: "Wylogowano pomyślnie" (toast)

- [ ] Utworzyć `lib/api/error-responses.ts`:

  ```typescript
  export class ApiError extends Error {
    constructor(
      public statusCode: number,
      message: string
    ) {
      super(message);
    }
  }

  export function errorResponse(error: unknown) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd serwera" },
      { status: 500 }
    );
  }
  ```

- [ ] Loading states:
  - Przyciski w formularzach: `disabled={isLoading}` + spinner icon
  - Użyć `shadcn/button` z `variant="default"` + `disabled` prop
  - Dodać `aria-busy="true"` dla accessibility

**Czas:** ~25 minut

#### 3.3: Edge cases i testowanie user stories

**Zadanie:** Manualny test wszystkich scenariuszy z auth-spec.md

- [ ] **User Story: Rejestracja**
  - [ ] Formularz waliduje email format
  - [ ] Formularz waliduje hasło (min 8 znaków, cyfra, wielka/mała)
  - [ ] Hasła muszą się zgadzać
  - [ ] Po rejestracji → automatyczne zalogowanie → redirect /dashboard
  - [ ] E-mail już zajęty → toast z błędem
  - [ ] Błąd serwera → toast "Wystąpił błąd"

- [ ] **User Story: Logowanie**
  - [ ] Nieprawidłowe dane → toast "Nieprawidłowy e-mail lub hasło"
  - [ ] Poprawne dane → redirect /dashboard
  - [ ] Jeśli zalogowany próbuje GET /login → redirect /dashboard (middleware)

- [ ] **User Story: Wylogowanie**
  - [ ] Kliknięcie "Wyloguj się" w UserMenu → redirect /login
  - [ ] Po wylogowaniu: GET /dashboard → redirect /login (middleware)
  - [ ] Cookie sesyjne usunięte (sprawdzić DevTools → Application → Cookies)

- [ ] **User Story: Reset hasła**
  - [ ] Formularz waliduje email
  - [ ] Po submicie → toast "E-mail został wysłany"
  - [ ] Link w e-mailu → redirect /update-password?access_token=...
  - [ ] Formularz update-password: walidacja nowego hasła
  - [ ] Po ustawieniu → redirect /dashboard

- [ ] **User Story: Ochrona tras**
  - [ ] GET /dashboard (niezalogowany) → redirect /login
  - [ ] GET /study (niezalogowany) → redirect /login
  - [ ] GET /api/flashcards (niezalogowany) → 401 Unauthorized
  - [ ] GET /api/ai/generations (niezalogowany) → 401 Unauthorized

- [ ] **Edge cases:**
  - [ ] Próba PATCH /api/flashcards/:id innego użytkownika → 403 Forbidden
  - [ ] Próba DELETE /api/flashcards/:id innego użytkownika → 403 Forbidden
  - [ ] Dostęp do /update-password bez tokenu → komunikat błędu
  - [ ] Session expiration → middleware refresh token (automatyczne)

**Dokumentacja testów:**

- Utworzyć checklist w sekcji "What I Actually Did"
- Screenshoty błędów (opcjonalnie)

**Czas:** ~45 minut

---

## Zmiany w planie

_Znaczące zmiany wymagające re-approval będą tutaj dokumentowane_

**Potencjalne zmiany:**

- Jeśli Supabase Auth wymaga email confirmation → dodać stronę `/confirm-email`
- Jeśli potrzebny RLS (Row Level Security) → dodać SQL policies
- Jeśli password reset nie działa lokalnie → użyć mock email service

---

## Notatki MVP

**Świadome uproszczenia (można dodać później):**

- ❌ Brak OAuth (Google, GitHub) - tylko email/password
- ❌ Brak email confirmation - użytkownik od razu zalogowany po rejestracji
- ❌ Brak "Remember me" checkbox - sesja zawsze długa
- ❌ Brak rate limiting dla API auth (można dodać middleware z @upstash/ratelimit)
- ❌ Brak 2FA (two-factor authentication)
- ❌ Brak "Change email" w ustawieniach
- ❌ Brak audit log dla logowań

**Założenia bezpieczeństwa:**

- ✅ Hasła hashowane przez Supabase (bcrypt)
- ✅ JWT token w httpOnly cookies (nie dostępny dla JS)
- ✅ CSRF protection przez SameSite cookies
- ✅ Middleware weryfikuje sesję na każdym requestcie
- ✅ API routes wymagają autoryzacji
- ✅ Każdy użytkownik widzi tylko swoje dane (user_id filtering)

**Anti-patterns do uniknięcia:**

- ❌ Przechowywanie haseł w plain text (Supabase zarządza tym)
- ❌ Token JWT w localStorage (używamy httpOnly cookies)
- ❌ Brak walidacji po stronie serwera (zawsze waliduj na backendzie)
- ❌ Zbyt szczegółowe komunikaty błędów ("User not found" → generic "Invalid credentials")
- ❌ Przekierowania bez router.refresh() (trzeba odświeżyć server components)

---

## Pytania do rozstrzygnięcia

- [ ] Czy wymagać potwierdzenia e-mail przy rejestracji?
  - **Decyzja:** NIE dla MVP - komplikuje flow, wymaga konfiguracji SMTP

- [ ] Czy dodać rate limiting dla endpointów auth?
  - **Decyzja:** NIE dla MVP - można dodać później z Upstash Redis

- [ ] Czy `/settings` jest w scope tego taska?
  - **Decyzja:** NIE - tylko link placeholder w UserMenu, implementacja w osobnym tasku

- [ ] Czy GlobalHeader powinien być w każdym layoucie czy tylko dla zalogowanych?
  - **Decyzja:** W root layoutcie, ale z conditional rendering (pokazuj linki login/register dla niezalogowanych)

- [ ] Czy EmptyState w dashboard powinien się zmienić po dodaniu auth?
  - **Decyzja:** NIE - EmptyState już istnieje, nie wymaga zmian (dotyczy fiszek, nie użytkowników)

---

## Files to Create/Modify

### Nowe pliki (17):

**API routes (4):**

- `app/api/auth/register/route.ts`
- `app/api/auth/login/route.ts`
- `app/api/auth/logout/route.ts`
- `app/api/auth/password-reset/route.ts`

**Strony (4):**

- `app/login/page.tsx`
- `app/register/page.tsx`
- `app/password-reset/page.tsx`
- `app/update-password/page.tsx`

**Komponenty (6):**

- `components/auth/LoginForm.tsx`
- `components/auth/RegisterForm.tsx`
- `components/auth/PasswordResetForm.tsx`
- `components/auth/UpdatePasswordForm.tsx`
- `components/layout/GlobalHeader.tsx`
- `components/layout/UserMenu.tsx`

**Lib/Hooks (3):**

- `lib/validations/auth.ts` - zod schemas
- `lib/api/auth-utils.ts` - requireAuth helper
- `hooks/useAuth.ts` - custom hook dla auth logic

### Zmodyfikowane pliki (6):

- `middleware.ts` - dodać routing protection
- `app/api/flashcards/route.ts` - dodać requireAuth + user_id filtering
- `app/api/ai/generations/route.ts` - dodać requireAuth + user_id
- `app/api/ai/generations/accept/route.ts` - dodać requireAuth + ownership check
- `app/layout.tsx` - dodać `<GlobalHeader />` + `<Toaster />` (jeśli nie ma)
- `package.json` - dodać react-hook-form, zod, @hookform/resolvers

---

## Success Criteria

✅ **Po implementacji:**

1. Niezalogowany użytkownik:
   - Może odwiedzić: `/`, `/login`, `/register`, `/password-reset`
   - NIE może odwiedzić: `/dashboard`, `/study`, `/settings` → redirect /login
   - NIE może wywołać: `/api/flashcards`, `/api/ai/*` → 401 Unauthorized

2. Zalogowany użytkownik:
   - Może odwiedzić: `/dashboard`, `/study`, `/settings`
   - NIE może odwiedzić: `/login`, `/register` → redirect /dashboard
   - Może wywołać wszystkie chronione API routes
   - Widzi TYLKO swoje fiszki (user_id filtering działa)

3. Funkcjonalność:
   - Rejestracja → automatyczne zalogowanie → dashboard
   - Logowanie → dashboard
   - Wylogowanie → /login (sesja usunięta)
   - Reset hasła → e-mail → update-password → dashboard

4. UI/UX:
   - Wszystkie formularze walidują dane (inline errors)
   - Loading states w przyciskach
   - Toast notifications dla komunikatów
   - GlobalHeader pokazuje UserMenu dla zalogowanych
   - Brak błędów TypeScript (`npx tsc --noEmit`)

---

## Time Estimate

**Total:** ~4.5 godziny (270 minut)

**FAZA 1 (Backend):** 115 minut

- Task 1.1 (API routes): 45 min
- Task 1.2 (Middleware): 30 min
- Task 1.3 (Protect existing APIs): 40 min

**FAZA 2 (Frontend):** 115 minut

- Task 2.1 (Pages): 35 min
- Task 2.2 (Forms): 60 min
- Task 2.3 (Setup validation): 20 min

**FAZA 3 (UX):** 110 minut

- Task 3.1 (GlobalHeader + UserMenu): 40 min
- Task 3.2 (Error handling): 25 min
- Task 3.3 (Testing): 45 min

---

## What I Actually Did (vs Plan)

_Sekcja do wypełnienia podczas implementacji_

### FAZA 1: BACKEND AUTH ✅ / ⏳ / ❌

**Task 1.1: Auth API endpoints**

- Status:
- Czas faktyczny:
- Zmiany vs plan:

**Task 1.2: Middleware protection**

- Status:
- Czas faktyczny:
- Zmiany vs plan:

**Task 1.3: Protect existing APIs**

- Status:
- Czas faktyczny:
- Zmiany vs plan:

### FAZA 2: FRONTEND AUTH ✅ / ⏳ / ❌

**Task 2.1: Auth pages**

- Status:
- Czas faktyczny:
- Zmiany vs plan:

**Task 2.2: Forms with validation**

- Status:
- Czas faktyczny:
- Zmiany vs plan:

**Task 2.3: React-hook-form + zod setup**

- Status:
- Czas faktyczny:
- Zmiany vs plan:

### FAZA 3: UX & INTEGRACJA ✅ / ⏳ / ❌

**Task 3.1: GlobalHeader + UserMenu**

- Status:
- Czas faktyczny:
- Zmiany vs plan:

**Task 3.2: Error handling + toasts**

- Status:
- Czas faktyczny:
- Zmiany vs plan:

**Task 3.3: Testing & edge cases**

- Status:
- Czas faktyczny:
- Test results:

---

## References

- `.ai/auth-spec.md` - Technical specification (Polish)
- [Supabase Auth with Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [shadcn/ui Form](https://ui.shadcn.com/docs/components/form)
- [react-hook-form Docs](https://react-hook-form.com/get-started)
- [Zod Schema Validation](https://zod.dev/)
