# Specyfikacja techniczna modułu rejestracji, logowania i odzyskiwania hasła w Fiszkomat AI

---

## 1. Architektura Interfejsu Użytkownika (Frontend) - Next.js + React

### Struktura i nawigacja

- Aplikacja typu SPA oparta o Next.js 15 i React 19.
- Routing korzysta z Next.js App Router.
- Dodanie nowych stron publicznych: `/login`, `/register`, `/password-reset`, `/update-password`.
- Chronione trasy: `/dashboard`, `/study`, `/settings` wymagają uwierzytelnienia.

### Komponenty UI

- Formularze logowania (`LoginForm.tsx`), rejestracji (`RegisterForm.tsx`), resetu hasła (`PasswordResetForm.tsx`), ustawienia nowego hasła (`UpdatePasswordForm.tsx`).
- Komponent `UserMenu` z opcjami wylogowania i nawigacją do ustawień.
- Globalny komponent nagłówka `GlobalHeader` z dynamiczną zawartością zależną od stanu autoryzacji.

### Walidacja i komunikaty

- Walidacja formularzy po stronie klienta z wykorzystaniem bibliotek (`zod`, `react-hook-form`).
- Komunikaty błędów np. "Nieprawidłowy e-mail lub hasło", "E-mail zajęty", komunikaty sukcesu wyświetlane w komponencie `ToastNotification`.

### Kluczowe scenariusze

1. Rejestracja: po poprawnym wypełnieniu i rejestracji użytkownik jest automatycznie zalogowany i przekierowany na `/dashboard`.
2. Logowanie: po podaniu poprawnych danych przekierowanie na `/dashboard`, błędne dane powodują wyświetlenie błędu.
3. Wylogowanie: usuwa sesję, przekierowuje na `/login`.
4. Reset hasła: wysłanie e-mail z linkiem resetu, ustawienie nowego hasła przez dedykowany formularz.

---

## 2. Logika Backendowa (Next.js API Routes + Supabase Auth)

### Endpointy API (ścieżka: `/src/app/api/auth/`)

- `register/route.ts`: rejestracja użytkownika (walidacja, Supabase `signUp`), odpowiedź JSON z sesją lub błędem.
- `login/route.ts`: logowanie użytkownika (Supabase `signInWithPassword`), ustawianie cookie sesyjnego.
- `logout/route.ts`: wylogowanie (Supabase `signOut`), usuwanie cookie.
- `password-reset/route.ts`: inicjalizacja resetu hasła (Supabase `resetPasswordForEmail`).

### Walidacja i obsługa błędów

- Walidacja serwerowa danych wejściowych w endpointach (np. przy pomocy `zod`).
- Obsługa wyjątków zwracająca odpowiednie kody HTTP i komunikaty generyczne.

### Middleware autoryzacyjny

- Middleware Next.js do weryfikacji sesji JWT z cookie.
- Automatyczne przekierowywanie niezalogowanych z chronionych tras na `/login`.

---

## 3. System Autentykacji - Supabase Auth

- Konfiguracja klienta Supabase HTTP i Admin.
- Wykorzystanie `@supabase/ssr` do zarządzania sesjami (nowoczesny, framework-agnostic package).
- Token JWT przechowywany w bezpiecznych ciasteczkach `httpOnly` i `secure`.
- Obsługa potwierdzania adresu e-mail i resetu hasła przez Supabase.
- Dostęp do sesji zarówno po stronie klienta React, jak i po stronie serwera Next.js.
- Wykorzystanie `getUser()` zamiast `getSession()` dla bezpiecznej weryfikacji JWT.

---

## 4. Zalecane pliki i moduły

- `src/components/LoginForm.tsx`
- `src/components/RegisterForm.tsx`
- `src/components/PasswordResetForm.tsx`
- `src/components/UpdatePasswordForm.tsx`
- `src/components/UserMenu.tsx`
- `src/components/GlobalHeader.tsx`
- `src/app/login/page.tsx`, `register/page.tsx`, `password-reset/page.tsx`, `update-password/page.tsx`
- `src/app/api/auth/register/route.ts`, `login/route.ts`, `logout/route.ts`, `password-reset/route.ts`
- `src/middleware.ts`
- `src/lib/supabaseClient.ts`
