# Plan Testów - 10xCards (Fiszkomat AI)

**Wersja**: 1.0
**Data**: 2025-01-01
**Status**: Draft
**Projekt**: 10xCards MVP - AI-powered flashcard generator

---

## 1. Przegląd projektu

### 1.1. Opis aplikacji

**10xCards (Fiszkomat AI)** to aplikacja webowa do tworzenia i nauki z fiszek edukacyjnych, wykorzystująca AI do automatycznego generowania fiszek z tekstu. Aplikacja składa się z:

- **Systemu autentykacji** (rejestracja, logowanie, reset hasła)
- **Generatora AI** (OpenRouter + gpt-4o-mini) - do 10 fiszek z tekstu 1000-10000 znaków
- **CRUD fiszek** (tworzenie manualne, edycja, usuwanie, przeglądanie)
- **Trybu nauki** (losowa kolejność, odkrywanie front/back)
- **Dashboardu** z listą fiszek i akcjami

### 1.2. Stack technologiczny

- **Frontend**: Next.js 15, React 19, TypeScript 5, Tailwind 4, shadcn/ui
- **Backend**: Next.js API Routes, Supabase (@supabase/ssr), PostgreSQL
- **AI**: OpenRouter (gpt-4o-mini)
- **Walidacja**: Zod + React Hook Form
- **Deployment**: Docker, GitHub Actions, DigitalOcean

### 1.3. Kluczowe metryki sukcesu (do weryfikacji w testach)

1. **75% AI acceptance rate**: `accepted_flashcards / generated_proposals ≥ 0.75`
2. **75% AI creation rate**: `ai_flashcards / total_flashcards ≥ 0.75`

---

## 2. Strategia testowania

### 2.1. Podejście

**Filozofia**: Test Pyramid z naciskiem na **bezpieczeństwo** i **integrację**

```
         /\
        /E2E\          ← User journeys (5-10 testów)
       /------\
      /Integration\    ← API + DB + Auth (30-40 testów)
     /------------\
    /   Unit Tests  \  ← Logic, validation (50+ testów)
   /------------------\
```

**Priorytet 1 (MUST HAVE - MVP):**

- ✅ Security testing (auth, user isolation)
- ✅ Integration testing (API Routes + Database)
- ✅ Critical user journeys (E2E)
- ✅ Validation schemas (unit)
- ✅ Error handling coverage

**Priorytet 2 (SHOULD HAVE - post-MVP):**

- Component testing (React components)
- Performance testing (API latency)

**Priorytet 3 (NICE TO HAVE):**

- Visual regression testing
- Accessibility testing
- Load testing

### 2.2. Poziom pokrycia (Coverage)

**Cel dla MVP:**

- **Unit tests**: ≥ 80% coverage (lib/, validation schemas)
- **Integration tests**: 100% API routes covered
- **E2E tests**: 100% critical user paths

**Wykluczenia z coverage:**

- `components/ui/*` (shadcn/ui - external library)
- `node_modules/`
- `.next/`
- Type definition files (`*.types.ts`)

### 2.3. Środowiska testowe

| Środowisko     | Przeznaczenie                    | Database            | AI Mock               |
| -------------- | -------------------------------- | ------------------- | --------------------- |
| **Local**      | Development testing              | Docker Supabase     | ✅ Mock               |
| **CI/CD**      | Automated tests (GitHub Actions) | Test DB (ephemeral) | ✅ Mock               |
| **Staging**    | Pre-production E2E               | Staging DB          | ⚠️ Real API (limited) |
| **Production** | Smoke tests only                 | Production DB       | ❌ Real API           |

---

## 3. Rodzaje testów

### 3.1. Testy jednostkowe (Unit Tests)

**Cel**: Testowanie izolowanych funkcji, logiki biznesowej, walidacji

**Narzędzia**:

- **Framework**: Vitest (fast, TypeScript-first)
- **Mocking**: vitest/mock
- **Assertions**: expect() API

**Zakres testowania**:

#### 3.1.1. Validation Schemas (Zod)

**Pliki do testowania**:

- `lib/validations/auth.ts`
  - `loginSchema` (email format, required fields)
  - `registerSchema` (password complexity: min 8 chars, 1 digit, 1 uppercase, 1 lowercase)
  - `passwordResetSchema` (email format)
  - `updatePasswordSchema` (password match, complexity)

- `lib/validation/flashcard-validation.ts`
  - `createFlashcardSchema` (front max 300 chars, back max 600 chars)
  - `updateFlashcardSchema` (same constraints)

- `lib/validation/ai-generations.ts`
  - `generateFlashcardsSchema` (text length 1000-10000 chars)

**Test cases (przykład)**:

```typescript
// lib/validations/auth.test.ts
import { describe, it, expect } from "vitest";
import { registerSchema } from "./auth";

describe("registerSchema", () => {
  it("should accept valid email and strong password", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "Password123",
      confirmPassword: "Password123",
    });
    expect(result.success).toBe(true);
  });

  it("should reject password without uppercase letter", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain("wielką literę");
  });

  it("should reject mismatched passwords", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "Password123",
      confirmPassword: "Different123",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["confirmPassword"]);
  });

  // ... więcej test cases
});
```

#### 3.1.2. Utility Functions

**Pliki do testowania**:

- `lib/utils.ts`
  - `cn()` - className merging

- `lib/api/error-responses.ts`
  - `ApiError` class
  - `errorResponse()` function
  - `ApiErrors` factory methods

**Test cases**:

```typescript
// lib/api/error-responses.test.ts
import { describe, it, expect } from "vitest";
import { ApiError, ApiErrors, errorResponse } from "./error-responses";

describe("ApiError", () => {
  it("should create error with status code and message", () => {
    const error = new ApiError(401, "Unauthorized");
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe("Unauthorized");
  });
});

describe("ApiErrors factory", () => {
  it("should create BadRequest with custom message", () => {
    const error = ApiErrors.BadRequest("Invalid input");
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Invalid input");
  });

  it("should create Unauthorized with default message", () => {
    const error = ApiErrors.Unauthorized;
    expect(error.statusCode).toBe(401);
  });
});

describe("errorResponse", () => {
  it("should handle ApiError correctly", () => {
    const error = new ApiError(404, "Not found");
    const response = errorResponse(error);
    expect(response.status).toBe(404);
  });

  it("should handle unknown errors with 500", () => {
    const error = new Error("Something broke");
    const response = errorResponse(error);
    expect(response.status).toBe(500);
  });
});
```

#### 3.1.3. DTO Transformations

**Pliki do testowania**:

- `lib/dto/types.ts` (type-level tests)
- View model transformations (jeśli istnieją funkcje)

**Test cases**:

```typescript
// lib/dto/types.test.ts
import { describe, it, expect } from "vitest";
import type { CreateManualFlashcardDto } from "./types";

describe("DTO types", () => {
  it("should enforce FlashcardId branding", () => {
    // TypeScript type-level test
    const validDto: CreateManualFlashcardDto = {
      front: "Question",
      back: "Answer",
    };
    expect(validDto).toBeDefined();
  });
});
```

#### 3.1.4. OpenRouter Client (mocked)

**Pliki do testowania**:

- `lib/integrations/openrouter-client.ts`
  - `generateFlashcards()` function

**Test cases**:

```typescript
// lib/integrations/openrouter-client.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateFlashcards } from "./openrouter-client";

// Mock fetch
global.fetch = vi.fn();

describe("generateFlashcards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call OpenRouter API with correct parameters", async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify([
              { front: "Q1", back: "A1" },
              { front: "Q2", back: "A2" },
            ]),
          },
        },
      ],
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await generateFlashcards("Test input text");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("openrouter.ai"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: expect.stringContaining("Bearer"),
        }),
      })
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ front: "Q1", back: "A1" });
  });

  it("should handle API errors gracefully", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
    });

    await expect(generateFlashcards("Test")).rejects.toThrow();
  });

  it("should handle timeout errors", async () => {
    global.fetch.mockRejectedValueOnce(new Error("Timeout"));
    await expect(generateFlashcards("Test")).rejects.toThrow("Timeout");
  });
});
```

**Coverage target**: ≥ 80% dla wszystkich plików w `lib/` (poza types)

---

### 3.2. Testy integracyjne (Integration Tests)

**Cel**: Testowanie współpracy między komponentami (API Routes + Database + Auth)

**Narzędzia**:

- **Framework**: Vitest
- **HTTP Client**: node-fetch lub supertest
- **Database**: Test Supabase instance (Docker)
- **Auth**: Mock Supabase Auth responses

**Zakres testowania**:

#### 3.2.1. Auth API Routes

**Endpoint**: `POST /api/auth/register`

**Test cases**:

```typescript
// app/api/auth/register/route.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { POST } from "./route";

describe("POST /api/auth/register", () => {
  beforeEach(async () => {
    // Setup test database
    await setupTestDb();
  });

  afterEach(async () => {
    // Cleanup test users
    await cleanupTestDb();
  });

  it("should register new user with valid data", async () => {
    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe("test@example.com");
    expect(data.session).toBeDefined();
  });

  it("should reject registration with existing email", async () => {
    // First registration
    await registerUser("existing@example.com", "Password123");

    // Second registration with same email
    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "existing@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toContain("zajęty");
  });

  it("should reject weak password", async () => {
    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "weak",
        confirmPassword: "weak",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
```

**Endpoint**: `POST /api/auth/login`

**Test cases**:

- ✅ Login with valid credentials → 200 + session cookie
- ✅ Login with invalid password → 401 + generic error message
- ✅ Login with non-existent email → 401 + generic error message (security!)
- ✅ Login with malformed email → 400 + validation error

**Endpoint**: `POST /api/auth/logout`

**Test cases**:

- ✅ Logout with valid session → 204 + cookie removed
- ✅ Logout without session → 204 (idempotent)

**Endpoint**: `POST /api/auth/password-reset`

**Test cases**:

- ✅ Request reset for existing email → 200 + email sent
- ✅ Request reset for non-existent email → 200 (security - no user enumeration)
- ✅ Request reset with invalid email format → 400

#### 3.2.2. Flashcard CRUD API Routes

**Endpoint**: `GET /api/flashcards`

**Test cases**:

```typescript
// app/api/flashcards/route.test.ts
describe("GET /api/flashcards", () => {
  it("should return only current user flashcards", async () => {
    // Setup: Create 2 users with flashcards
    const user1 = await createTestUser("user1@example.com");
    const user2 = await createTestUser("user2@example.com");

    await createFlashcard(user1.id, "User1 Q", "User1 A");
    await createFlashcard(user1.id, "User1 Q2", "User1 A2");
    await createFlashcard(user2.id, "User2 Q", "User2 A");

    // Act: Get flashcards as user1
    const request = createAuthenticatedRequest(user1.session);
    const response = await GET(request);

    // Assert: Only user1 flashcards returned
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.flashcards).toHaveLength(2);
    expect(data.flashcards.every((f) => f.front.startsWith("User1"))).toBe(
      true
    );
  });

  it("should return 401 for unauthenticated request", async () => {
    const request = new Request("http://localhost/api/flashcards");
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("should return empty array for user with no flashcards", async () => {
    const user = await createTestUser("newuser@example.com");
    const request = createAuthenticatedRequest(user.session);
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.flashcards).toEqual([]);
  });
});
```

**Endpoint**: `POST /api/flashcards`

**Test cases**:

- ✅ Create flashcard with valid data → 201 + flashcard object
- ✅ Create flashcard without auth → 401
- ✅ Create flashcard with front > 300 chars → 400 + validation error
- ✅ Create flashcard with back > 600 chars → 400 + validation error
- ✅ Create flashcard with empty front/back → 400
- ✅ Verify source_type = 'manual' for manually created flashcard

**Endpoint**: `PATCH /api/flashcards/[id]`

**Test cases**:

- ✅ Update own flashcard → 200 + updated flashcard
- ✅ Update other user's flashcard → 403 Forbidden
- ✅ Update non-existent flashcard → 404
- ✅ Update with invalid data → 400
- ✅ Verify source_type changes to 'ai-edited' if was 'ai'

**Endpoint**: `DELETE /api/flashcards/[id]`

**Test cases**:

- ✅ Delete own flashcard → 204 + flashcard removed from DB
- ✅ Delete other user's flashcard → 403
- ✅ Delete non-existent flashcard → 404
- ✅ Delete without auth → 401

#### 3.2.3. AI Generation API Routes

**Endpoint**: `POST /api/ai/generations`

**Test cases**:

```typescript
describe("POST /api/ai/generations", () => {
  it("should generate flashcards from valid text", async () => {
    const user = await createTestUser("test@example.com");
    const inputText = "Lorem ipsum ".repeat(200); // ~2000 chars

    const request = createAuthenticatedRequest(user.session, {
      method: "POST",
      body: JSON.stringify({ text: inputText }),
    });

    // Mock OpenRouter response
    mockOpenRouterApi([
      { front: "Q1", back: "A1" },
      { front: "Q2", back: "A2" },
    ]);

    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.generation_id).toBeDefined();
    expect(data.proposals).toHaveLength(2);
    expect(data.proposals[0]).toEqual({ front: "Q1", back: "A1" });

    // Verify database record
    const generation = await getAiGeneration(data.generation_id);
    expect(generation.user_id).toBe(user.id);
    expect(generation.input_text).toBe(inputText);
    expect(generation.generated_count).toBe(2);
    expect(generation.model_name).toBe("gpt-4o-mini");
    expect(generation.duration_ms).toBeGreaterThan(0);
  });

  it("should reject text shorter than 1000 chars", async () => {
    const user = await createTestUser("test@example.com");
    const request = createAuthenticatedRequest(user.session, {
      method: "POST",
      body: JSON.stringify({ text: "Short text" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: expect.stringContaining("1000"),
    });
  });

  it("should reject text longer than 10000 chars", async () => {
    const user = await createTestUser("test@example.com");
    const longText = "a".repeat(10001);

    const request = createAuthenticatedRequest(user.session, {
      method: "POST",
      body: JSON.stringify({ text: longText }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("should handle OpenRouter API errors gracefully", async () => {
    const user = await createTestUser("test@example.com");
    const inputText = "Lorem ipsum ".repeat(200);

    mockOpenRouterApiError(500, "Internal Server Error");

    const request = createAuthenticatedRequest(user.session, {
      method: "POST",
      body: JSON.stringify({ text: inputText }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({
      error: expect.stringContaining("nie udało się wygenerować"),
    });
  });
});
```

**Endpoint**: `POST /api/ai/generations/accept`

**Test cases**:

```typescript
describe("POST /api/ai/generations/accept", () => {
  it("should accept selected proposals and create flashcards", async () => {
    const user = await createTestUser("test@example.com");

    // Generate proposals first
    const generation = await createAiGeneration(user.id, [
      { front: "Q1", back: "A1" },
      { front: "Q2", back: "A2" },
      { front: "Q3", back: "A3" },
    ]);

    // Accept 2 out of 3
    const request = createAuthenticatedRequest(user.session, {
      method: "POST",
      body: JSON.stringify({
        generation_id: generation.id,
        selected_indices: [0, 2], // Q1 and Q3
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    // Verify flashcards created
    const flashcards = await getUserFlashcards(user.id);
    expect(flashcards).toHaveLength(2);
    expect(flashcards[0].front).toBe("Q1");
    expect(flashcards[0].source_type).toBe("ai");
    expect(flashcards[1].front).toBe("Q3");

    // Verify acceptance tracking
    const acceptance = await getGenerationAcceptance(generation.id);
    expect(acceptance.accepted_count).toBe(2);
    expect(acceptance.ai_generation_id).toBe(generation.id);
  });

  it("should prevent accepting other user's generation", async () => {
    const user1 = await createTestUser("user1@example.com");
    const user2 = await createTestUser("user2@example.com");

    const generation = await createAiGeneration(user1.id, [
      { front: "Q1", back: "A1" },
    ]);

    // user2 tries to accept user1's generation
    const request = createAuthenticatedRequest(user2.session, {
      method: "POST",
      body: JSON.stringify({
        generation_id: generation.id,
        selected_indices: [0],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
  });

  it("should handle acceptance of all proposals", async () => {
    const user = await createTestUser("test@example.com");
    const generation = await createAiGeneration(user.id, [
      { front: "Q1", back: "A1" },
      { front: "Q2", back: "A2" },
    ]);

    const request = createAuthenticatedRequest(user.session, {
      method: "POST",
      body: JSON.stringify({
        generation_id: generation.id,
        selected_indices: [0, 1],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const flashcards = await getUserFlashcards(user.id);
    expect(flashcards).toHaveLength(2);

    // Verify metrics: 2/2 = 100% acceptance rate
    const acceptance = await getGenerationAcceptance(generation.id);
    expect(acceptance.accepted_count).toBe(2);
  });
});
```

#### 3.2.4. Middleware Integration

**Test cases**:

```typescript
// middleware.test.ts
describe("Middleware auth protection", () => {
  it("should allow access to public routes without auth", async () => {
    const publicRoutes = ["/", "/login", "/register", "/password-reset"];

    for (const route of publicRoutes) {
      const request = new NextRequest(`http://localhost${route}`);
      const response = await middleware(request);
      expect(response.status).not.toBe(307); // No redirect
    }
  });

  it("should redirect unauthenticated users from protected routes", async () => {
    const protectedRoutes = ["/dashboard", "/study", "/settings"];

    for (const route of protectedRoutes) {
      const request = new NextRequest(`http://localhost${route}`);
      const response = await middleware(request);

      expect(response.status).toBe(307); // Redirect
      expect(response.headers.get("location")).toContain("/login");
    }
  });

  it("should redirect authenticated users from auth pages to dashboard", async () => {
    const authRoutes = ["/login", "/register"];
    const user = await createTestUser("test@example.com");

    for (const route of authRoutes) {
      const request = createAuthenticatedRequest(user.session, {
        url: `http://localhost${route}`,
      });
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/dashboard");
    }
  });

  it("should block API requests without auth", async () => {
    const protectedApiRoutes = ["/api/flashcards", "/api/ai/generations"];

    for (const route of protectedApiRoutes) {
      const request = new NextRequest(`http://localhost${route}`);
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/login");
    }
  });

  it("should allow public API routes", async () => {
    const publicApiRoutes = [
      "/api/auth/login",
      "/api/auth/register",
      "/api/health",
    ];

    for (const route of publicApiRoutes) {
      const request = new NextRequest(`http://localhost${route}`);
      const response = await middleware(request);
      expect(response.status).not.toBe(307);
    }
  });
});
```

**Coverage target**: 100% wszystkich API routes

---

### 3.3. Testy funkcjonalne (Functional / E2E Tests)

**Cel**: Testowanie pełnych user journeys w przeglądarce

**Narzędzia**:

- **Framework**: Playwright (cross-browser, fast, reliable)
- **Assertions**: expect() API
- **Screenshots**: Automatic on failure
- **Video**: Record for failed tests

**Zakres testowania**:

#### 3.3.1. Critical User Journeys

**Journey 1: New User Onboarding → First Flashcard**

```typescript
// e2e/user-onboarding.spec.ts
import { test, expect } from "@playwright/test";

test.describe("New user onboarding", () => {
  test("should register, create flashcard manually, and study", async ({
    page,
  }) => {
    // 1. Navigate to app
    await page.goto("http://localhost:3000");

    // 2. Click register
    await page.click("text=Zarejestruj się");

    // 3. Fill registration form
    await page.fill('input[type="email"]', `test-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', "TestPassword123");
    await page.fill('input[name="confirmPassword"]', "TestPassword123");
    await page.click('button[type="submit"]');

    // 4. Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // 5. Should see empty state
    await expect(
      page.locator("text=Wygeneruj swoje pierwsze fiszki")
    ).toBeVisible();

    // 6. Create manual flashcard
    await page.click("text=Dodaj nową fiszkę");
    await page.fill('textarea[name="front"]', "What is TypeScript?");
    await page.fill('textarea[name="back"]', "A typed superset of JavaScript");
    await page.click('button:has-text("Zapisz")');

    // 7. Flashcard should appear in list
    await expect(page.locator("text=What is TypeScript?")).toBeVisible();

    // 8. Start study mode
    await page.click("text=Rozpocznij naukę");
    await expect(page).toHaveURL(/\/study/);

    // 9. Should see flashcard front
    await expect(page.locator("text=What is TypeScript?")).toBeVisible();

    // 10. Click to reveal back
    await page.click(".flashcard"); // Assuming flashcard has this class
    await expect(
      page.locator("text=A typed superset of JavaScript")
    ).toBeVisible();

    // 11. End session
    await page.click("text=Zakończ");
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
```

**Journey 2: AI Generation → Acceptance → Study**

```typescript
test.describe("AI flashcard generation", () => {
  test("should generate, accept, and study AI flashcards", async ({ page }) => {
    // 1. Login as existing user
    await loginUser(page, "existing@example.com", "Password123");

    // 2. Navigate to dashboard
    await page.goto("http://localhost:3000/dashboard");

    // 3. Paste text for AI generation (2000 chars)
    const sampleText = "Lorem ipsum dolor sit amet... ".repeat(100);
    await page.fill('textarea[name="aiInput"]', sampleText);

    // 4. Verify character counter
    await expect(page.locator("text=/[0-9]+ znaków/")).toBeVisible();

    // 5. Click generate
    await page.click('button:has-text("Generuj")');

    // 6. Should show loading modal
    await expect(page.locator("text=Generowanie fiszek")).toBeVisible();

    // 7. Wait for proposals (max 30s)
    await expect(page.locator(".ai-proposal-item")).toBeVisible({
      timeout: 30000,
    });

    // 8. Should have up to 10 proposals
    const proposals = await page.locator(".ai-proposal-item").count();
    expect(proposals).toBeGreaterThan(0);
    expect(proposals).toBeLessThanOrEqual(10);

    // 9. Select first 3 proposals
    await page
      .locator(".ai-proposal-item")
      .nth(0)
      .locator('input[type="checkbox"]')
      .check();
    await page
      .locator(".ai-proposal-item")
      .nth(1)
      .locator('input[type="checkbox"]')
      .check();
    await page
      .locator(".ai-proposal-item")
      .nth(2)
      .locator('input[type="checkbox"]')
      .check();

    // 10. Accept selected
    await page.click('button:has-text("Akceptuj zaznaczone")');

    // 11. Proposals should disappear, flashcards added to list
    await expect(page.locator(".ai-proposal-item")).not.toBeVisible();
    const flashcardCount = await page.locator(".flashcard-item").count();
    expect(flashcardCount).toBeGreaterThanOrEqual(3);

    // 12. Start study with AI flashcards
    await page.click("text=Rozpocznij naukę");
    await expect(page).toHaveURL(/\/study/);

    // 13. Navigate through flashcards
    for (let i = 0; i < 3; i++) {
      await page.click(".flashcard"); // Flip
      await page.click('button:has-text("Następna")');
    }
  });

  test("should handle AI generation errors gracefully", async ({ page }) => {
    // Mock network failure or API error
    await page.route("**/api/ai/generations", (route) => {
      route.abort("failed");
    });

    await loginUser(page, "existing@example.com", "Password123");
    await page.goto("http://localhost:3000/dashboard");

    const sampleText = "Lorem ipsum ".repeat(200);
    await page.fill('textarea[name="aiInput"]', sampleText);
    await page.click('button:has-text("Generuj")');

    // Should show error toast
    await expect(
      page.locator("text=/nie udało się wygenerować/i")
    ).toBeVisible();
  });
});
```

**Journey 3: Edit & Delete Flashcard**

```typescript
test.describe("Flashcard management", () => {
  test("should edit and delete flashcard", async ({ page }) => {
    await loginUser(page, "existing@example.com", "Password123");
    await page.goto("http://localhost:3000/dashboard");

    // Assume there's at least 1 flashcard
    const firstFlashcard = page.locator(".flashcard-item").first();

    // 1. Click edit icon
    await firstFlashcard.locator('[aria-label="Edit"]').click();

    // 2. Should show inline edit mode
    await expect(
      firstFlashcard.locator('textarea[name="front"]')
    ).toBeVisible();

    // 3. Edit content
    await firstFlashcard
      .locator('textarea[name="front"]')
      .fill("Updated question");
    await firstFlashcard
      .locator('textarea[name="back"]')
      .fill("Updated answer");

    // 4. Save
    await firstFlashcard.locator('button:has-text("Zapisz")').click();

    // 5. Should show updated content
    await expect(firstFlashcard.locator("text=Updated question")).toBeVisible();

    // 6. Delete flashcard
    await firstFlashcard.locator('[aria-label="Delete"]').click();

    // 7. Should show confirmation modal
    await expect(
      page.locator("text=/Czy na pewno chcesz usunąć/i")
    ).toBeVisible();

    // 8. Confirm deletion
    await page.click('button:has-text("Usuń")');

    // 9. Flashcard should be removed
    await expect(firstFlashcard).not.toBeVisible();
  });
});
```

**Journey 4: Password Reset Flow**

```typescript
test.describe("Password reset", () => {
  test("should reset password via email link", async ({ page, context }) => {
    // 1. Navigate to login
    await page.goto("http://localhost:3000/login");

    // 2. Click "Forgot password"
    await page.click("text=Zapomniałeś hasła?");

    // 3. Enter email
    await page.fill('input[type="email"]', "existing@example.com");
    await page.click('button:has-text("Wyślij link")');

    // 4. Should show success message
    await expect(page.locator("text=/E-mail został wysłany/i")).toBeVisible();

    // 5. Simulate email link click (mock)
    // In real test: check email service, extract link
    const resetToken = "mock-reset-token-123";
    await page.goto(
      `http://localhost:3000/update-password#access_token=${resetToken}`
    );

    // 6. Fill new password
    await page.fill('input[name="password"]', "NewPassword123");
    await page.fill('input[name="confirmPassword"]', "NewPassword123");
    await page.click('button:has-text("Ustaw nowe hasło")');

    // 7. Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // 8. Logout and login with new password
    await page.click('button[aria-label="User menu"]');
    await page.click("text=Wyloguj się");

    await page.goto("http://localhost:3000/login");
    await page.fill('input[type="email"]', "existing@example.com");
    await page.fill('input[type="password"]', "NewPassword123");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/);
  });
});
```

**Coverage target**: 100% critical user paths (US-001 to US-015)

---

### 3.4. Testy wydajnościowe (Performance Tests)

**Cel**: Weryfikacja że aplikacja działa sprawnie przy normalnym obciążeniu

**Narzędzia**:

- **Framework**: k6 (load testing)
- **Monitoring**: console.time() w API routes
- **Database**: EXPLAIN ANALYZE dla slow queries

**Zakres testowania**:

#### 3.4.1. API Response Time

**Kryteria wydajności**:

| Endpoint                          | Max Response Time (P95) | Notes                             |
| --------------------------------- | ----------------------- | --------------------------------- |
| `GET /api/flashcards`             | 200ms                   | Simple query, indexed by user_id  |
| `POST /api/flashcards`            | 300ms                   | Single INSERT                     |
| `POST /api/ai/generations`        | 15s                     | Zależne od OpenRouter API         |
| `POST /api/ai/generations/accept` | 500ms                   | Batch INSERT via stored procedure |
| `DELETE /api/flashcards/[id]`     | 200ms                   | Single DELETE                     |

**Test cases**:

```typescript
// performance/api-benchmarks.test.ts
import { test, expect } from "vitest";
import { performance } from "perf_hooks";

describe("API Performance Benchmarks", () => {
  test("GET /api/flashcards should respond within 200ms", async () => {
    const user = await createTestUser("test@example.com");
    await createFlashcards(user.id, 50); // 50 flashcards

    const start = performance.now();
    const response = await fetch("http://localhost:3000/api/flashcards", {
      headers: { Cookie: user.sessionCookie },
    });
    const duration = performance.now() - start;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(200);
  });

  test("POST /api/ai/generations should respond within 15s", async () => {
    const user = await createTestUser("test@example.com");
    const inputText = "Lorem ipsum ".repeat(500); // ~5000 chars

    const start = performance.now();
    const response = await fetch("http://localhost:3000/api/ai/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: user.sessionCookie,
      },
      body: JSON.stringify({ text: inputText }),
    });
    const duration = performance.now() - start;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(15000);
  });
});
```

#### 3.4.2. Database Query Performance

**Test cases**:

```sql
-- Check index usage for flashcard queries
EXPLAIN ANALYZE
SELECT * FROM flashcards
WHERE user_id = 'test-user-uuid'
ORDER BY created_at DESC;

-- Expected: Index Scan on flashcards_user_id_idx
-- Cost: < 1ms for 100 flashcards

EXPLAIN ANALYZE
SELECT
  COUNT(*) FILTER (WHERE source_type = 'ai') as ai_count,
  COUNT(*) FILTER (WHERE source_type = 'manual') as manual_count
FROM flashcards
WHERE user_id = 'test-user-uuid';

-- Expected: Index Scan, < 5ms for 1000 flashcards
```

#### 3.4.3. Frontend Performance (Lighthouse)

**Kryteria**:

- **Performance score**: ≥ 90
- **Accessibility**: ≥ 95
- **Best Practices**: ≥ 95
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.0s

**Test cases**:

```typescript
// e2e/lighthouse.spec.ts
import { test } from "@playwright/test";
import { playAudit } from "playwright-lighthouse";

test("Dashboard page should meet Lighthouse thresholds", async ({ page }) => {
  await page.goto("http://localhost:3000/dashboard");

  await playAudit({
    page,
    thresholds: {
      performance: 90,
      accessibility: 95,
      "best-practices": 95,
      seo: 80,
    },
  });
});
```

---

### 3.5. Testy bezpieczeństwa (Security Tests)

**Cel**: Weryfikacja mechanizmów ochrony przed atakami

**Zakres testowania**:

#### 3.5.1. Authentication & Authorization

**Test cases**:

```typescript
describe("Security: Auth bypass attempts", () => {
  test("should prevent JWT forgery", async () => {
    // Try to access protected route with fake JWT
    const fakeJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake.signature";

    const response = await fetch("http://localhost:3000/api/flashcards", {
      headers: { Cookie: `sb-access-token=${fakeJwt}` },
    });

    expect(response.status).toBe(401);
  });

  test("should prevent user isolation breach", async () => {
    const user1 = await createTestUser("user1@example.com");
    const user2 = await createTestUser("user2@example.com");

    const user1Flashcard = await createFlashcard(user1.id, "Secret", "Data");

    // user2 tries to access user1's flashcard
    const response = await fetch(
      `http://localhost:3000/api/flashcards/${user1Flashcard.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: user2.sessionCookie,
        },
        body: JSON.stringify({ front: "Hacked" }),
      }
    );

    expect(response.status).toBe(403);

    // Verify flashcard unchanged
    const flashcard = await getFlashcard(user1Flashcard.id);
    expect(flashcard.front).toBe("Secret");
  });

  test("should prevent session hijacking", async () => {
    const user = await createTestUser("test@example.com");

    // Logout
    await fetch("http://localhost:3000/api/auth/logout", {
      method: "POST",
      headers: { Cookie: user.sessionCookie },
    });

    // Try to use old session
    const response = await fetch("http://localhost:3000/api/flashcards", {
      headers: { Cookie: user.sessionCookie },
    });

    expect(response.status).toBe(401);
  });
});
```

#### 3.5.2. Input Validation & Sanitization

**Test cases**:

```typescript
describe("Security: XSS prevention", () => {
  test("should sanitize HTML in flashcard content", async () => {
    const user = await createTestUser("test@example.com");

    const xssPayload = '<script>alert("XSS")</script>';

    const response = await fetch("http://localhost:3000/api/flashcards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: user.sessionCookie,
      },
      body: JSON.stringify({
        front: xssPayload,
        back: "Answer",
      }),
    });

    expect(response.status).toBe(201);

    const flashcard = await response.json();
    // Verify script tag is escaped or removed
    expect(flashcard.flashcard.front).not.toContain("<script>");
  });

  test("should prevent SQL injection in API queries", async () => {
    const user = await createTestUser("test@example.com");

    const sqlPayload = "'; DROP TABLE flashcards; --";

    const response = await fetch("http://localhost:3000/api/flashcards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: user.sessionCookie,
      },
      body: JSON.stringify({
        front: sqlPayload,
        back: "Answer",
      }),
    });

    // Should create flashcard normally (Supabase SDK prevents SQL injection)
    expect(response.status).toBe(201);

    // Verify table still exists
    const flashcards = await getUserFlashcards(user.id);
    expect(flashcards).toBeDefined();
  });
});
```

#### 3.5.3. Rate Limiting & DoS Prevention

**Test cases** (jeśli zaimplementowane):

```typescript
describe("Security: Rate limiting", () => {
  test("should rate-limit AI generation requests", async () => {
    const user = await createTestUser("test@example.com");
    const inputText = "Lorem ipsum ".repeat(200);

    // Send 10 requests rapidly
    const requests = Array.from({ length: 10 }, () =>
      fetch("http://localhost:3000/api/ai/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: user.sessionCookie,
        },
        body: JSON.stringify({ text: inputText }),
      })
    );

    const responses = await Promise.all(requests);
    const rateLimited = responses.filter((r) => r.status === 429);

    // Expect some requests to be rate-limited
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

---

### 3.6. Testy komponentów React (Component Tests)

**Cel**: Testowanie izolowanych komponentów UI

**Narzędzia**:

- **Framework**: Vitest + React Testing Library
- **Mocking**: MSW (Mock Service Worker) dla API calls

**Zakres testowania** (priorytet 2 - post-MVP):

#### 3.6.1. Form Components

**Komponent**: `LoginForm.tsx`

**Test cases**:

```typescript
// components/auth/LoginForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginForm } from './LoginForm'
import { vi } from 'vitest'

describe('LoginForm', () => {
  it('should render email and password fields', () => {
    render(<LoginForm />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/hasło/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /zaloguj/i })).toBeInTheDocument()
  })

  it('should show validation errors for invalid email', async () => {
    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /zaloguj/i })

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/nieprawidłowy format/i)).toBeInTheDocument()
    })
  })

  it('should call login API on valid submission', async () => {
    const mockLogin = vi.fn()
    render(<LoginForm onLogin={mockLogin} />)

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByLabelText(/hasło/i), {
      target: { value: 'Password123' }
    })

    fireEvent.click(screen.getByRole('button', { name: /zaloguj/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123'
      })
    })
  })

  it('should disable submit button while loading', async () => {
    render(<LoginForm />)

    const submitButton = screen.getByRole('button', { name: /zaloguj/i })

    fireEvent.click(submitButton)

    expect(submitButton).toBeDisabled()
  })
})
```

**Komponent**: `AiGeneratorForm.tsx`

**Test cases**:

- ✅ Should show character counter
- ✅ Should disable submit if text < 1000 or > 10000 chars
- ✅ Should enable submit within valid range
- ✅ Should call generate API on submit
- ✅ Should show loading modal during generation

#### 3.6.2. List Components

**Komponent**: `FlashcardList.tsx`

**Test cases**:

- ✅ Should render all flashcards
- ✅ Should show empty state when no flashcards
- ✅ Should call edit callback on edit click
- ✅ Should show delete confirmation modal on delete click

**Komponent**: `AiProposalsList.tsx`

**Test cases**:

- ✅ Should render all proposals with checkboxes
- ✅ Should allow selecting/deselecting proposals
- ✅ Should enable "Accept" button when at least 1 selected
- ✅ Should call accept callback with selected indices

---

## 4. Narzędzia testowe

### 4.1. Test Frameworks

| Rodzaj testu       | Narzędzie                     | Wersja  | Dlaczego                                      |
| ------------------ | ----------------------------- | ------- | --------------------------------------------- |
| Unit & Integration | **Vitest**                    | ^2.0.0  | Fast, TypeScript-native, Vite-compatible      |
| E2E                | **Playwright**                | ^1.48.0 | Cross-browser, reliable, built-in screenshots |
| Component          | **React Testing Library**     | ^16.1.0 | User-centric testing, accessibility focus     |
| API Mocking        | **MSW** (Mock Service Worker) | ^2.6.0  | Intercepts requests at network level          |
| Performance        | **k6**                        | ^0.54.0 | Load testing, scriptable                      |
| Lighthouse         | **playwright-lighthouse**     | ^4.0.0  | Performance audits in Playwright              |

### 4.2. Instalacja

```bash
# Test frameworks
npm install --save-dev vitest @vitest/ui
npm install --save-dev @playwright/test
npm install --save-dev @testing-library/react @testing-library/jest-dom

# Mocking & utilities
npm install --save-dev msw
npm install --save-dev @faker-js/faker

# Performance testing
brew install k6  # or download from k6.io
```

### 4.3. Konfiguracja

**vitest.config.ts**:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json"],
      exclude: [
        "node_modules/",
        ".next/",
        "components/ui/**", // shadcn/ui components
        "**/*.types.ts",
        "**/*.config.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

**playwright.config.ts**:

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
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

### 4.4. Database Testing Setup

**Docker Compose dla testów**:

```yaml
# docker-compose.test.yml
services:
  supabase-test:
    image: supabase/postgres:15.1.0.117
    environment:
      POSTGRES_PASSWORD: test-password
      POSTGRES_DB: test_10xcards
    ports:
      - "5433:5432" # Different port to avoid conflict
    volumes:
      - ./supabase/migrations:/docker-entrypoint-initdb.d
```

**Test database helpers**:

```typescript
// test-utils/database.ts
import { createClient } from "@supabase/supabase-js";

export async function setupTestDb() {
  const supabase = createClient(
    process.env.TEST_SUPABASE_URL!,
    process.env.TEST_SUPABASE_ANON_KEY!
  );

  // Run migrations
  // Clear all data
  await supabase.from("flashcards").delete().neq("flashcard_id", "");
  await supabase.from("ai_generations").delete().neq("id", "");
  await supabase.auth.admin.deleteUser(); // Delete test users
}

export async function cleanupTestDb() {
  // Same as setup - clear all test data
}
```

---

## 5. Środowiska testowe

### 5.1. Local Development

**Konfiguracja**:

- Database: Docker Supabase (port 5433)
- App: Next.js dev server (port 3000)
- AI: Mocked responses (MSW)

**Uruchomienie**:

```bash
# Start test database
docker-compose -f docker-compose.test.yml up -d

# Run unit + integration tests
npm run test

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:coverage
```

### 5.2. CI/CD (GitHub Actions)

**Workflow** (`.github/workflows/test.yml`):

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-integration:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: supabase/postgres:15.1.0.117
        env:
          POSTGRES_PASSWORD: test-password
          POSTGRES_DB: test_10xcards
        ports:
          - 5433:5432

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        run: npm run db:migrate:test

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json

  e2e:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "22"

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Start test database
        run: docker-compose -f docker-compose.test.yml up -d

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/

  security:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Run npm audit
        run: npm audit --audit-level=moderate

      - name: Run OWASP ZAP scan
        uses: zaproxy/action-full-scan@v0.11.0
        with:
          target: "http://localhost:3000"
```

### 5.3. Staging Environment

**Konfiguracja**:

- Database: Staging Supabase project
- App: Vercel/DigitalOcean staging deployment
- AI: Real OpenRouter API (limited budget)

**Smoke tests**:

```bash
# Health check
curl https://staging.10xcards.com/api/health

# Run critical E2E paths only
npm run test:e2e:smoke -- --project=chromium
```

### 5.4. Production Environment

**Monitoring tylko** - nie uruchamiamy pełnych testów na produkcji!

**Smoke tests** (post-deployment):

```bash
# Health check
curl https://10xcards.com/api/health

# Synthetic user monitoring
npm run test:smoke:production
```

---

## 6. Kryteria akceptacji

### 6.1. Definicja "Done" dla testów

Test jest uznany za zakończony gdy:

1. **Kod testowy**:
   - ✅ Wszystkie test cases zaimplementowane zgodnie z planem
   - ✅ Testy są czytelne i utrzymywalne (komentarze, naming)
   - ✅ Używane są helper functions dla powtarzalnego setup/teardown

2. **Pokrycie kodu**:
   - ✅ Unit tests: ≥ 80% coverage dla `lib/`
   - ✅ Integration tests: 100% API routes
   - ✅ E2E tests: 100% critical user journeys (US-001 do US-015)

3. **Jakość**:
   - ✅ Wszystkie testy przechodzą (0 failures)
   - ✅ Brak flaky tests (niestabilnych testów)
   - ✅ Testy wykonują się w rozsądnym czasie:
     - Unit: < 10 sekund
     - Integration: < 2 minuty
     - E2E: < 5 minut

4. **CI/CD**:
   - ✅ Testy uruchamiają się automatycznie w GitHub Actions
   - ✅ PR nie może być zmergowany bez passing tests
   - ✅ Coverage report dostępny w PR comments

### 6.2. Exit Criteria dla MVP

Aplikacja jest gotowa do release gdy:

1. **Funkcjonalność**:
   - ✅ Wszystkie User Stories (US-001 do US-015) mają passing E2E tests
   - ✅ Critical bugs: 0
   - ✅ High priority bugs: < 3

2. **Bezpieczeństwo**:
   - ✅ Security tests: 100% pass
   - ✅ npm audit: 0 high/critical vulnerabilities
   - ✅ Auth flow: verified in E2E tests

3. **Wydajność**:
   - ✅ API response times: meet thresholds (section 3.4.1)
   - ✅ Lighthouse score: ≥ 90 (performance)
   - ✅ Database queries: indexed, < 100ms (P95)

4. **Metryki**:
   - ✅ Mechanizm śledzenia metryk działa (acceptance tracking)
   - ✅ Tests weryfikują zapisywanie `ai_generations_acceptance`

---

## 7. Harmonogram testowania

### 7.1. Fazy implementacji testów

**Faza 1: Foundation (Tydzień 1)**

- ✅ Setup test infrastructure (Vitest, Playwright)
- ✅ Konfiguracja test database (Docker)
- ✅ Implementacja helper functions (setupTestDb, createTestUser)
- ✅ First smoke test (health check)

**Faza 2: Critical Path (Tydzień 2)**

- ✅ Unit tests: Validation schemas (auth, flashcard, AI)
- ✅ Integration tests: Auth API routes
- ✅ E2E test: New user registration → first flashcard

**Faza 3: Core Features (Tydzień 3)**

- ✅ Integration tests: Flashcard CRUD API
- ✅ Integration tests: AI generation API
- ✅ E2E test: AI generation → acceptance → study
- ✅ Component tests: LoginForm, RegisterForm

**Faza 4: Security & Performance (Tydzień 4)**

- ✅ Security tests: Auth bypass, user isolation
- ✅ Performance tests: API benchmarks
- ✅ E2E test: Edit & delete flashcard
- ✅ E2E test: Password reset flow

**Faza 5: Completeness (Tydzień 5)**

- ✅ Coverage gaps analysis → fill missing tests
- ✅ Flaky tests investigation → stabilize
- ✅ CI/CD pipeline optimization
- ✅ Documentation update (README.md)

### 7.2. Test Execution Strategy

**Continuous (każdy commit)**:

```bash
# Pre-commit hook (husky)
npm run test:unit:changed  # Only changed files
npm run lint
```

**Daily (nightly builds)**:

```bash
npm run test:all           # Full test suite
npm run test:coverage      # Generate report
```

**Pre-release**:

```bash
npm run test:all
npm run test:e2e:all-browsers  # Chromium, Firefox, WebKit
npm run test:performance
npm run test:security
```

**Post-deployment (production)**:

```bash
npm run test:smoke:production  # Only critical paths
```

---

## 8. Metryki i raportowanie

### 8.1. Metryki testowe

**Tracked metrics**:

| Metryka                   | Cel              | Pomiar               |
| ------------------------- | ---------------- | -------------------- |
| **Test Coverage**         | ≥ 80%            | `vitest --coverage`  |
| **Test Pass Rate**        | 100%             | CI/CD dashboard      |
| **Flaky Test Rate**       | < 5%             | Manual tracking      |
| **Test Execution Time**   | < 5 min (total)  | CI/CD logs           |
| **Bugs Found in Testing** | Trend ↓          | GitHub Issues labels |
| **Regression Rate**       | < 2% per release | Manual analysis      |

### 8.2. Coverage Reporting

**Tools**:

- **Vitest**: Generuje `coverage/` folder z HTML report
- **Codecov**: Automatyczny upload w CI/CD
- **GitHub PR Comments**: Coverage diff vs main branch

**Przykład raportu**:

```
--------------------------------|---------|----------|---------|---------|
File                            | % Stmts | % Branch | % Funcs | % Lines |
--------------------------------|---------|----------|---------|---------|
All files                       |   82.5  |   78.3   |   85.1  |   82.8  |
 lib/                           |   88.2  |   84.6   |   90.3  |   88.5  |
  validations/                  |   95.6  |   92.1   |   100   |   95.8  |
   auth.ts                      |   96.2  |   93.5   |   100   |   96.4  |
   flashcard-validation.ts      |   94.8  |   90.2   |   100   |   95.1  |
  api/                          |   86.4  |   82.3   |   88.7  |   86.9  |
   auth-utils.ts                |   91.2  |   87.5   |   100   |   91.6  |
   error-responses.ts           |   78.5  |   72.1   |   75.0  |   78.9  |
--------------------------------|---------|----------|---------|---------|
```

### 8.3. Test Results Dashboard

**GitHub Actions Summary**:

```
✅ Unit Tests: 156 passed, 0 failed (12.3s)
✅ Integration Tests: 42 passed, 0 failed (1m 23s)
✅ E2E Tests (Chromium): 18 passed, 0 failed (3m 45s)
✅ E2E Tests (Firefox): 18 passed, 0 failed (4m 12s)
✅ Coverage: 82.5% (target: 80%) ✅

Total: 234 tests, 0 failures, 5m 20s
```

**Playwright HTML Report**:

- Screenshots on failure
- Video recordings
- Test traces for debugging

### 8.4. Bug Tracking

**GitHub Issues Labels**:

- `bug` - ogólny bug
- `critical` - blokuje release
- `security` - podatność bezpieczeństwa
- `regression` - feature działał, teraz nie działa
- `flaky-test` - test niestabilny

**Bug priority**:

1. **P0 (Critical)**: Security issues, data loss, app crash
2. **P1 (High)**: Core features broken, major UX issues
3. **P2 (Medium)**: Minor features broken, cosmetic bugs
4. **P3 (Low)**: Edge cases, nice-to-have improvements

---

## 9. Specyficzne wymagania dla stacku technologicznego

### 9.1. Next.js 15 Considerations

**Server Components Testing**:

```typescript
// Test Server Component rendering
import { render } from "@testing-library/react";
import DashboardPage from "@/app/dashboard/page";

describe("Dashboard Server Component", () => {
  it("should fetch and render flashcards", async () => {
    // Mock Supabase client
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({
        data: [{ front: "Q1", back: "A1" }],
        error: null,
      }),
    };

    // Render async component
    const PageComponent = await DashboardPage();
    const { container } = render(PageComponent);

    expect(container.textContent).toContain("Q1");
  });
});
```

**Middleware Testing**:

- Mock `NextRequest` and `NextResponse`
- Test cookie handling (set, remove)
- Verify redirect logic

**API Route Testing**:

- Use `NextRequest` for request mocking
- Test with/without auth headers
- Verify response format (NextResponse.json)

### 9.2. Supabase Specific

**Auth Testing**:

```typescript
// Mock Supabase Auth
vi.mock("@/lib/db/supabase.server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "test-user-id", email: "test@example.com" } },
        error: null,
      }),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  })),
}));
```

**Database Testing**:

- Use real test database (not mocks) dla integration tests
- Run migrations przed testami
- Cleanup po każdym teście (truncate tables)

**RLS Policies Testing** (jeśli zaimplementowane):

```sql
-- Test RLS policy for flashcards
SET ROLE authenticated;
SET request.jwt.claims.sub = 'user-uuid';

SELECT * FROM flashcards; -- Should only return user's flashcards
```

### 9.3. OpenRouter API

**Mocking Strategy**:

```typescript
// MSW handler for OpenRouter
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const handlers = [
  http.post("https://openrouter.ai/api/v1/chat/completions", () => {
    return HttpResponse.json({
      choices: [
        {
          message: {
            content: JSON.stringify([
              { front: "Mocked Q1", back: "Mocked A1" },
              { front: "Mocked Q2", back: "Mocked A2" },
            ]),
          },
        },
      ],
    });
  }),
];

export const server = setupServer(...handlers);

// In tests:
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

**Error Scenarios**:

- 429 Too Many Requests
- 500 Internal Server Error
- Timeout (30s+)
- Invalid JSON response
- Rate limit headers

### 9.4. TypeScript & Zod

**Type-level Testing**:

```typescript
// Compile-time type checks
import { expectTypeOf } from "vitest";
import type { FlashcardDto } from "@/lib/dto/types";

test("FlashcardDto type structure", () => {
  expectTypeOf<FlashcardDto>().toMatchTypeOf<{
    id: string;
    front: string;
    back: string;
    source_type: "manual" | "ai" | "ai-edited";
  }>();
});
```

**Zod Schema Testing**:

- Test valid inputs → success
- Test invalid inputs → error with correct message
- Test edge cases (boundary values)
- Test .refine() custom validations

---

## 10. Ryzyka i mitygacje

### 10.1. Potencjalne ryzyka

| Ryzyko                        | Prawdopodobieństwo | Impact | Mitygacja                                       |
| ----------------------------- | ------------------ | ------ | ----------------------------------------------- |
| **Flaky E2E tests**           | High               | Medium | Retry logic, explicit waits, stable selectors   |
| **Test data pollution**       | Medium             | High   | Strict cleanup, isolated test DB                |
| **Slow test execution**       | Medium             | Medium | Parallel execution, mock external APIs          |
| **OpenRouter API changes**    | Low                | High   | Contract testing, version pinning               |
| **Supabase breaking changes** | Low                | High   | Pin @supabase/ssr version, changelog monitoring |
| **CI/CD failures**            | Medium             | High   | Health checks, retry logic, notifications       |

### 10.2. Strategie mitygacji

**Flaky tests**:

```typescript
// Use Playwright's auto-waiting
await page.waitForSelector(".flashcard-item", { state: "visible" });

// Explicit timeout for slow operations
await page.waitForResponse(
  (response) => response.url().includes("/api/ai/generations"),
  { timeout: 30000 }
);

// Retry failed tests in CI
// playwright.config.ts: retries: process.env.CI ? 2 : 0
```

**Test data isolation**:

```typescript
// Generate unique user per test
const uniqueEmail = `test-${Date.now()}-${Math.random()}@example.com`;

// Cleanup after each test
afterEach(async () => {
  await cleanupTestDb();
});
```

**Performance**:

```typescript
// Run tests in parallel
// vitest.config.ts: workers: 4

// Mock external APIs by default
// Use real API only in staging
if (process.env.TEST_ENV === "staging") {
  // Real OpenRouter
} else {
  // MSW mock
}
```

---

## 11. Maintenance i Evolution

### 11.1. Test Maintenance

**Comiesięcznie**:

- Review flaky test rate
- Update snapshots jeśli zmiany w UI
- Remove obsolete tests
- Refactor duplicate test code

**Co release**:

- Update test coverage baseline
- Document new test patterns
- Review failed tests in production

### 11.2. Rozszerzenie testów post-MVP

**Faza 2 (post-MVP features)**:

- Accessibility testing (axe-core)
- Visual regression (Percy, Chromatic)
- Mutation testing (Stryker)
- Contract testing dla OpenRouter API
- Chaos engineering (random failures)

**Performance testing**:

- Load testing (1000 concurrent users)
- Stress testing (find breaking point)
- Soak testing (24h continuous load)

---

## 12. Podsumowanie

### 12.1. Quick Start

**Uruchomienie testów lokalnie**:

```bash
# 1. Start test database
docker-compose -f docker-compose.test.yml up -d

# 2. Run all tests
npm run test:all

# 3. View coverage report
open coverage/index.html

# 4. Run specific test file
npm run test lib/validations/auth.test.ts

# 5. Run E2E in UI mode (debug)
npx playwright test --ui
```

### 12.2. Kluczowe liczby

- **Total tests planned**: ~250-300
  - Unit: ~150
  - Integration: ~80
  - E2E: ~30
  - Component: ~40

- **Coverage targets**:
  - Overall: ≥ 80%
  - lib/: ≥ 80%
  - API routes: 100%
  - Critical paths: 100%

- **Execution time**:
  - Unit: < 10s
  - Integration: < 2min
  - E2E: < 5min
  - **Total**: < 8min

### 12.3. Success Criteria (Final Check)

Przed release, verify:

- [ ] All US-001 to US-015 have passing E2E tests
- [ ] Security tests: 100% pass
- [ ] Coverage: ≥ 80%
- [ ] 0 critical bugs
- [ ] API performance: meet thresholds
- [ ] Lighthouse score: ≥ 90
- [ ] CI/CD: green build
- [ ] Metrics tracking: verified in tests

---

## 13. Kontakt i wsparcie

**Team lead**: [Imię]
**QA engineer**: [Imię]
**DevOps**: [Imię]

**Resources**:

- Test documentation: `.ai/test-plan.md` (this file)
- Test helpers: `test-utils/`
- CI/CD workflow: `.github/workflows/test.yml`
- Coverage reports: `coverage/index.html`
- Playwright reports: `playwright-report/index.html`

**Links**:

- Vitest docs: https://vitest.dev
- Playwright docs: https://playwright.dev
- React Testing Library: https://testing-library.com/react
- MSW docs: https://mswjs.io

---

**Koniec planu testów**
