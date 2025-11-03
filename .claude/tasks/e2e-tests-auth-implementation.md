# Testy E2E Authentication - 10xCards

**Data utworzenia**: 2025-01-03
**Framework**: Playwright ^1.48.0
**Zakres**: User registration + login flows
**Cel**: 100% coverage critical auth user journeys

---

## 1. Przegląd zadania

Implementacja testów end-to-end dla kluczowych user journeys związanych z autoryzacją zgodnie z `.ai/test-plan.md` (sekcja 3.3.1).

**Scenariusze testowane:**

- **Journey 1**: Rejestracja nowego użytkownika → redirect do dashboardu
- **Journey 2**: Logowanie istniejącego użytkownika → redirect do dashboardu
- **Edge cases**: Walidacja, błędne dane, duplicated emails, loading states, navigation

**Wymagania wstępne:**

- ✅ Auth API routes zaimplementowane (`/api/auth/register`, `/api/auth/login`)
- ✅ Strony auth (`/login`, `/register`) działają
- ✅ Middleware routing protection działa
- ✅ Aplikacja uruchamia się na `localhost:3000`

---

## 2. Approach (Podejście MVP)

**Filozofia**: Test critical paths first - najpierw happy paths (success flows), potem edge cases. Każdy test musi być izolowany (unique email per test).

### Kluczowe decyzje:

1. **Playwright over Cypress** - zgodnie z test-plan.md (cross-browser, reliable)
2. **Test isolation** - każdy test generuje unikalny email (`Date.now()` + random)
3. **Database cleanup** - `afterEach` hook usuwa test usera (wymaga `SUPABASE_SERVICE_ROLE_KEY`)
4. **No flaky tests** - explicit waits, retry logic w CI (2 retries)
5. **Helper functions** - reusable utilities dla DRY tests

### Test strategy (zgodnie z test pyramid):

```
    E2E Tests (Auth only)
    ----------------------
    ✅ Register happy path (1 test)
    ✅ Register edge cases (4 tests)
    ✅ Login happy path (1 test)
    ✅ Login edge cases (6 tests)
    ----------------------
    Total: 13 tests (~5 min execution)
```

---

## 3. Rozbicie zadań (Task Breakdown)

### FAZA 1: SETUP PLAYWRIGHT (Foundation)

#### Task 1.1: Instalacja Playwright i konfiguracja

**Zadanie:** Setup infrastruktury testowej zgodnie z test-plan.md

- [ ] Zainstalować Playwright:

  ```bash
  npm install --save-dev @playwright/test
  npx playwright install chromium
  ```

- [ ] Utworzyć `playwright.config.ts` w root projektu:

  ```typescript
  import { defineConfig, devices } from "@playwright/test";

  export default defineConfig({
    testDir: "./e2e",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,

    reporter: [["html"], ["json", { outputFile: "playwright-report.json" }]],

    use: {
      baseURL: "http://localhost:3000",
      trace: "on-first-retry",
      screenshot: "only-on-failure",
      video: "retain-on-failure",
    },

    projects: [
      {
        name: "chromium",
        use: { ...devices["Desktop Chrome"] },
      },
    ],

    webServer: {
      command: "npm run dev",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  });
  ```

- [ ] Dodać scripts do `package.json`:

  ```json
  {
    "scripts": {
      "test:e2e": "playwright test",
      "test:e2e:headed": "playwright test --headed",
      "test:e2e:ui": "playwright test --ui",
      "test:e2e:debug": "playwright test --debug"
    }
  }
  ```

- [ ] Dodać do `.gitignore`:
  ```
  # Playwright
  /test-results/
  /playwright-report/
  /playwright/.cache/
  ```

**Zależności:** Brak
**Czas:** ~15 minut

---

#### Task 1.2: Utworzenie helper functions

**Zadanie:** Reusable utilities dla testów (DRY principle)

- [ ] Utworzyć folder `e2e/utils/`

- [ ] Utworzyć `e2e/utils/test-helpers.ts`:

  ```typescript
  import { Page, expect } from "@playwright/test";

  /**
   * Generate unique test user email
   */
  export function generateTestEmail(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
  }

  /**
   * Fill registration form
   */
  export async function fillRegisterForm(
    page: Page,
    email: string,
    password: string
  ) {
    await page.fill('input[type="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
  }

  /**
   * Fill login form
   */
  export async function fillLoginForm(
    page: Page,
    email: string,
    password: string
  ) {
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
  }

  /**
   * Wait for navigation to dashboard
   */
  export async function waitForDashboard(page: Page) {
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard/);
  }
  ```

- [ ] Utworzyć `e2e/utils/db-helpers.ts`:

  ```typescript
  import { createClient } from "@supabase/supabase-js";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  /**
   * Admin Supabase client for test cleanup
   */
  export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  /**
   * Delete test user by email (cleanup after test)
   */
  export async function deleteTestUser(email: string) {
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const testUser = users?.users.find((u) => u.email === email);

    if (testUser) {
      await supabaseAdmin.auth.admin.deleteUser(testUser.id);
    }
  }
  ```

**Zależności:** @supabase/supabase-js (już zainstalowane)
**Czas:** ~20 minut

---

### FAZA 2: TESTY REJESTRACJI (Register Flow)

#### Task 2.1: Implementacja testów rejestracji (6 testów)

**Zadanie:** Full coverage register flow - happy path + edge cases

- [ ] Utworzyć `e2e/auth/register.spec.ts`

**Test 1: Happy path - successful registration**

```typescript
test("should register new user successfully and redirect to dashboard", async ({
  page,
}) => {
  const testEmail = generateTestEmail();
  const password = "TestPassword123";

  // Navigate to register
  await page.goto("/register");
  await expect(page.locator("h1")).toContainText("Utwórz konto");

  // Fill form
  await fillRegisterForm(page, testEmail, password);

  // Submit
  await page.click('button[type="submit"]');

  // Should redirect to dashboard
  await waitForDashboard(page);

  // Cleanup
  await deleteTestUser(testEmail);
});
```

**Test 2: Validation - weak password**

```typescript
test("should show validation error for weak password", async ({ page }) => {
  await page.goto("/register");

  const testEmail = generateTestEmail();
  const weakPassword = "weak";
  await fillRegisterForm(page, testEmail, weakPassword);
  await page.click('button[type="submit"]');

  // Should stay on register page
  await expect(page).toHaveURL(/\/register/);

  // Should show validation error
  await expect(page.locator("text=/wielką literę/i")).toBeVisible();
});
```

**Test 3: Validation - password mismatch**

```typescript
test("should show error when passwords don't match", async ({ page }) => {
  await page.goto("/register");

  const testEmail = generateTestEmail();
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[name="password"]', "TestPassword123");
  await page.fill('input[name="confirmPassword"]', "DifferentPassword123");
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/register/);
  await expect(
    page.locator("text=/hasła muszą być takie same/i")
  ).toBeVisible();
});
```

**Test 4: Duplicate email error**

```typescript
test("should prevent registration with existing email", async ({ page }) => {
  const testEmail = generateTestEmail();
  const password = "TestPassword123";

  // First registration
  await page.goto("/register");
  await fillRegisterForm(page, testEmail, password);
  await page.click('button[type="submit"]');
  await waitForDashboard(page);

  // Logout (navigate to login via API or UI)
  await page.goto("/");

  // Second registration with same email
  await page.goto("/register");
  await fillRegisterForm(page, testEmail, password);
  await page.click('button[type="submit"]');

  // Should show error
  await expect(page.locator(".bg-destructive\\/10")).toContainText(
    /zajęty|istnieje/i
  );

  // Cleanup
  await deleteTestUser(testEmail);
});
```

**Test 5: Loading state**

```typescript
test("should show loading state during registration", async ({ page }) => {
  await page.goto("/register");

  const testEmail = generateTestEmail();
  await fillRegisterForm(page, testEmail, "TestPassword123");

  const submitButton = page.locator('button[type="submit"]');
  await submitButton.click();

  // Should show loading text
  await expect(submitButton).toContainText("Tworzenie konta...");
  await expect(submitButton).toBeDisabled();

  // Wait for completion and cleanup
  await waitForDashboard(page);
  await deleteTestUser(testEmail);
});
```

**Test 6: Navigation - link to login**

```typescript
test("should have link to login page", async ({ page }) => {
  await page.goto("/register");

  const loginLink = page.locator('a[href="/login"]');
  await expect(loginLink).toBeVisible();
  await expect(loginLink).toContainText("Zaloguj się");

  // Click and verify navigation
  await loginLink.click();
  await expect(page).toHaveURL(/\/login/);
});
```

**Zależności:** Task 1.1, 1.2 (helpers)
**Czas:** ~45 minut

---

### FAZA 3: TESTY LOGOWANIA (Login Flow)

#### Task 3.1: Setup fixture - create test user przed login tests

**Zadanie:** Helper do tworzenia test usera przed testami logowania

- [ ] Dodać do `e2e/utils/test-helpers.ts`:

  ```typescript
  /**
   * Create test user via registration
   * Returns { email, password }
   */
  export async function createTestUser(page: Page) {
    const testEmail = generateTestEmail();
    const testPassword = "TestPassword123";

    await page.goto("/register");
    await fillRegisterForm(page, testEmail, testPassword);
    await page.click('button[type="submit"]');
    await waitForDashboard(page);

    // Logout to prepare for login test
    await page.goto("/api/auth/logout");

    return { email: testEmail, password: testPassword };
  }
  ```

**Czas:** ~10 minut

---

#### Task 3.2: Implementacja testów logowania (7 testów)

**Zadanie:** Full coverage login flow - happy path + edge cases

- [ ] Utworzyć `e2e/auth/login.spec.ts`

**Test 1: Happy path - successful login**

```typescript
test("should login successfully with valid credentials", async ({ page }) => {
  // Setup: create test user
  const { email, password } = await createTestUser(page);

  // Navigate to login
  await page.goto("/login");
  await expect(page.locator("h1")).toContainText("Zaloguj się");

  // Fill login form
  await fillLoginForm(page, email, password);

  // Submit
  await page.click('button[type="submit"]');

  // Should redirect to dashboard
  await waitForDashboard(page);

  // Cleanup
  await deleteTestUser(email);
});
```

**Test 2: Invalid password**

```typescript
test("should show error with invalid password", async ({ page }) => {
  const { email } = await createTestUser(page);

  await page.goto("/login");
  await fillLoginForm(page, email, "WrongPassword123");
  await page.click('button[type="submit"]');

  // Should stay on login page
  await expect(page).toHaveURL(/\/login/);

  // Should show generic error (security - no user enumeration)
  await expect(page.locator(".bg-destructive\\/10")).toContainText(
    /nieprawidłowe|błędne/i
  );

  await deleteTestUser(email);
});
```

**Test 3: Non-existent email**

```typescript
test("should show error for non-existent email", async ({ page }) => {
  await page.goto("/login");

  await fillLoginForm(page, "nonexistent@example.com", "TestPassword123");
  await page.click('button[type="submit"]');

  // Should show generic error (no user enumeration!)
  await expect(page.locator(".bg-destructive\\/10")).toContainText(
    /nieprawidłowe|błędne/i
  );
});
```

**Test 4: Invalid email format**

```typescript
test("should show validation error for invalid email format", async ({
  page,
}) => {
  await page.goto("/login");

  await page.fill('input[type="email"]', "invalid-email");
  await page.fill('input[type="password"]', "TestPassword123");
  await page.click('button[type="submit"]');

  // Should show validation error
  await expect(page.locator("text=/nieprawidłowy format/i")).toBeVisible();
});
```

**Test 5: Loading state**

```typescript
test("should show loading state during login", async ({ page }) => {
  const { email, password } = await createTestUser(page);

  await page.goto("/login");
  await fillLoginForm(page, email, password);

  const submitButton = page.locator('button[type="submit"]');
  await submitButton.click();

  // Should show loading text
  await expect(submitButton).toContainText("Logowanie...");
  await expect(submitButton).toBeDisabled();

  await waitForDashboard(page);
  await deleteTestUser(email);
});
```

**Test 6: Navigation links**

```typescript
test("should have links to register and password reset", async ({ page }) => {
  await page.goto("/login");

  // Link to register
  const registerLink = page.locator('a[href="/register"]');
  await expect(registerLink).toBeVisible();
  await expect(registerLink).toContainText("Zarejestruj się");

  // Link to password reset
  const resetLink = page.locator('a[href="/password-reset"]');
  await expect(resetLink).toBeVisible();
  await expect(resetLink).toContainText("Zapomniałeś hasła");
});
```

**Test 7: Authenticated redirect (middleware test)**

```typescript
test("should redirect authenticated user from login to dashboard", async ({
  page,
}) => {
  const { email, password } = await createTestUser(page);

  // Login first
  await page.goto("/login");
  await fillLoginForm(page, email, password);
  await page.click('button[type="submit"]');
  await waitForDashboard(page);

  // Try to access login page again (while authenticated)
  await page.goto("/login");

  // Should redirect to dashboard (middleware protection)
  await expect(page).toHaveURL(/\/dashboard/);

  await deleteTestUser(email);
});
```

**Zależności:** Task 1.1, 1.2, 3.1
**Czas:** ~50 minut

---

### FAZA 4: ENVIRONMENT & CI/CD (Optional)

#### Task 4.1: Environment variables setup

**Zadanie:** Konfiguracja env dla test database

- [ ] Sprawdzić czy `.env.local` ma wszystkie potrzebne zmienne:

  ```bash
  NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  ```

- [ ] Dodać do `playwright.config.ts` (jeśli potrzebne):
  ```typescript
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000",
  },
  ```

**Czas:** ~5 minut

---

#### Task 4.2: GitHub Actions workflow (Optional)

**Zadanie:** CI/CD dla testów e2e

- [ ] Utworzyć `.github/workflows/e2e-tests.yml`:

  ```yaml
  name: E2E Tests

  on:
    push:
      branches: [main, develop]
    pull_request:
      branches: [main]

  jobs:
    e2e:
      runs-on: ubuntu-latest
      timeout-minutes: 15

      steps:
        - uses: actions/checkout@v4

        - name: Setup Node.js
          uses: setup-node@v4
          with:
            node-version: "22"
            cache: "npm"

        - name: Install dependencies
          run: npm ci

        - name: Install Playwright browsers
          run: npx playwright install chromium --with-deps

        - name: Run E2E tests
          run: npm run test:e2e
          env:
            NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
            NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
            SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}

        - name: Upload Playwright report
          if: always()
          uses: actions/upload-artifact@v4
          with:
            name: playwright-report
            path: playwright-report/
            retention-days: 7
  ```

- [ ] Dodać secrets w GitHub repo settings:
  - `TEST_SUPABASE_URL`
  - `TEST_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

**Czas:** ~20 minut (opcjonalne)

---

## 4. Harmonogram implementacji

### Day 1: Setup & Register Tests (1.5h)

- [x] Faza 1: Setup Playwright (Task 1.1, 1.2) - 35 min
- [x] Faza 2: Register tests (Task 2.1) - 45 min

### Day 2: Login Tests (1h)

- [x] Faza 3: Login tests setup + implementation (Task 3.1, 3.2) - 60 min

### Day 3: Polish & CI (Optional) (25 min)

- [ ] Faza 4: Env setup + CI/CD (Task 4.1, 4.2) - 25 min

**Total time:** ~2.5 hours (bez CI/CD: ~2 godziny)

---

## 5. Success Criteria

✅ **Po implementacji:**

1. **Infrastructure:**
   - [ ] Playwright zainstalowany i skonfigurowany
   - [ ] `playwright.config.ts` utworzony
   - [ ] Scripts w `package.json` działają
   - [ ] Helper functions w `e2e/utils/` są reusable

2. **Register tests (6 testów):**
   - [ ] Happy path: rejestracja → redirect /dashboard
   - [ ] Validation: weak password → error message
   - [ ] Validation: password mismatch → error message
   - [ ] Duplicate email → error message
   - [ ] Loading state → button disabled + "Tworzenie konta..."
   - [ ] Navigation: link to /login działa

3. **Login tests (7 testów):**
   - [ ] Happy path: login → redirect /dashboard
   - [ ] Invalid password → generic error (security)
   - [ ] Non-existent email → generic error (no enumeration)
   - [ ] Invalid email format → validation error
   - [ ] Loading state → button disabled + "Logowanie..."
   - [ ] Navigation: links to /register i /password-reset
   - [ ] Authenticated redirect: /login → /dashboard (middleware)

4. **Quality:**
   - [ ] Wszystkie testy przechodzą (`npm run test:e2e`)
   - [ ] Test execution time < 5 minut
   - [ ] Cleanup działa (test users usuwani po testach)
   - [ ] Brak flaky tests (stabilne selektory, explicit waits)
   - [ ] Screenshots/video przy failure

5. **Documentation:**
   - [ ] Ten task file zawiera "What I Actually Did"
   - [ ] Playwright report generowany (HTML)

---

## 6. Files to Create

### Nowe pliki (6):

**Config (1):**

- `playwright.config.ts` - Playwright configuration

**Test utilities (2):**

- `e2e/utils/test-helpers.ts` - Helper functions (generateEmail, fillForms, waitForDashboard)
- `e2e/utils/db-helpers.ts` - Database cleanup (deleteTestUser)

**Test specs (2):**

- `e2e/auth/register.spec.ts` - 6 testów rejestracji
- `e2e/auth/login.spec.ts` - 7 testów logowania

**CI/CD (1, optional):**

- `.github/workflows/e2e-tests.yml` - GitHub Actions workflow

### Zmodyfikowane pliki (2):

- `package.json` - dodać scripts (test:e2e, test:e2e:headed, etc.)
- `.gitignore` - dodać /test-results/, /playwright-report/

---

## 7. Notatki MVP

**Świadome uproszczenia (można dodać później):**

- ❌ Tylko Chromium (nie Firefox, WebKit) - wystarczy dla MVP
- ❌ Brak testów password reset flow - będzie w osobnym tasku
- ❌ Brak testów logout flow - prosty endpoint, niskie ryzyko
- ❌ Brak visual regression tests (screenshots comparison)
- ❌ Brak performance metrics w testach (Lighthouse)

**Test isolation strategy:**

- ✅ Każdy test generuje unikalny email (`Date.now()` + random)
- ✅ `afterEach` hook usuwa test usera z DB
- ✅ Brak shared state między testami
- ✅ Testy mogą być uruchamiane równolegle (`fullyParallel: true`)

**Anti-patterns do uniknięcia:**

- ❌ Hardcoded emails/passwords (używaj helpers)
- ❌ Brak cleanup (memory leak w test DB)
- ❌ Niestabilne selektory (używaj semantic selectors: role, label, text)
- ❌ Brak explicit waits (używaj `waitForURL`, `toBeVisible`)
- ❌ Sprawdzanie implementacji zamiast behavior (test what user sees)

---

## 8. Pytania do rozstrzygnięcia

- [ ] Czy używać test database czy main database?
  - **Decyzja:** Main database dla MVP - cleanup po testach wystarczy. Test DB można dodać później.

- [ ] Czy CI/CD workflow jest w scope tego taska?
  - **Decyzja:** Opcjonalne - zaimplementuj jeśli zostanie czas (Faza 4).

- [ ] Czy testować middleware redirects?
  - **Decyzja:** TAK - Login Test 7 weryfikuje middleware (authenticated user redirect).

- [ ] Jak długo czekać na dashboard redirect?
  - **Decyzja:** 10s timeout (API może być wolne, zwłaszcza na CI).

---

## 9. Risks & Mitigations

| Ryzyko                        | Prawdopodobieństwo | Mitygacja                                               |
| ----------------------------- | ------------------ | ------------------------------------------------------- |
| **Flaky tests** (timeouts)    | High               | Explicit waits, retry logic (2x w CI), stable selectors |
| **Test data pollution**       | Medium             | Strict cleanup (afterEach), unique emails per test      |
| **Slow execution (>5 min)**   | Low                | Tylko Chromium, parallel tests, mock external APIs      |
| **CI failures (env vars)**    | Medium             | Secrets w GitHub, fallback do local .env                |
| **Database cleanup failures** | Low                | Use admin client, verify deletion w afterEach           |

---

## 10. What I Actually Did (vs Plan)

_Sekcja do wypełnienia podczas implementacji_

### FAZA 1: SETUP PLAYWRIGHT ✅ / ⏳ / ❌

**Task 1.1: Instalacja i konfiguracja**

- Status:
- Czas faktyczny:
- Zmiany vs plan:

**Task 1.2: Helper functions**

- Status:
- Czas faktyczny:
- Zmiany vs plan:

### FAZA 2: REGISTER TESTS ✅ / ⏳ / ❌

**Task 2.1: 6 testów rejestracji**

- Status:
- Czas faktyczny:
- Zmiany vs plan:
- Test results:

### FAZA 3: LOGIN TESTS ✅ / ⏳ / ❌

**Task 3.1: Setup fixture**

- Status:
- Czas faktyczny:
- Zmiany vs plan:

**Task 3.2: 7 testów logowania**

- Status:
- Czas faktyczny:
- Zmiany vs plan:
- Test results:

### FAZA 4: ENV & CI/CD (Optional) ✅ / ⏳ / ❌

**Task 4.1: Environment variables**

- Status:
- Czas faktyczny:
- Zmiany vs plan:

**Task 4.2: GitHub Actions**

- Status:
- Czas faktyczny:
- Zmiany vs plan:

---

## 11. References

- `.ai/test-plan.md` - Sekcja 3.3.1 (E2E Tests - User Journeys)
- [Playwright Docs](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Supabase Admin API](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser)

---

**KONIEC PLANU**

Następny krok: Zatwierdzenie planu przez usera → Faza 1 implementacja (Setup Playwright)
