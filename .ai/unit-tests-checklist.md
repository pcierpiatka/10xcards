# Checklist testów jednostkowych - 10xCards

**Wersja**: 1.0
**Data**: 2025-01-01
**Bazuje na**: `.ai/test-plan.md`

---

## 📋 Spis treści

1. [Przegląd](#przegląd)
2. [Kategoria 1: Validation Schemas (Zod)](#kategoria-1-validation-schemas-zod)
3. [Kategoria 2: Error Handling](#kategoria-2-error-handling)
4. [Kategoria 3: Utility Functions](#kategoria-3-utility-functions)
5. [Kategoria 4: OpenRouter Client](#kategoria-4-openrouter-client)
6. [Kategoria 5: Services (opcjonalne)](#kategoria-5-services-opcjonalne)
7. [Podsumowanie i priorytetyzacja](#podsumowanie-i-priorytetyzacja)

---

## Przegląd

### Cele testów jednostkowych

- **Coverage**: ≥ 80% dla katalogów `lib/`
- **Framework**: Vitest (TypeScript-native)
- **Liczba testów**: ~150 testów
- **Priorytet MVP**: Validation + Error handling + Core utilities

### Struktura testów

```
lib/
├── validations/
│   ├── auth.test.ts                    ✅ PRIORYTET 1
│   └── ...
├── validation/
│   ├── flashcard-validation.test.ts    ✅ PRIORYTET 1
│   └── ai-generations.test.ts          ✅ PRIORYTET 1
├── api/
│   └── error-responses.test.ts         ✅ PRIORYTET 1
├── errors/
│   └── openrouter-errors.test.ts       ✅ PRIORYTET 1
├── utils.test.ts                        ✅ PRIORYTET 2
├── integrations/
│   └── openrouter-client.test.ts       ✅ PRIORYTET 2
└── services/
    └── *.test.ts                        ⚪ PRIORYTET 2
```

---

## Kategoria 1: Validation Schemas (Zod)

### 1.1. Auth Validation (`lib/validations/auth.ts`)

**Priorytet**: 🔴 **KRYTYCZNY (MVP)**
**Estymacja**: ~25 testów
**Ścieżka pliku testowego**: `lib/validations/auth.test.ts`

#### Schemas do przetestowania:

##### 1.1.1. `loginSchema`

**Funkcjonalność**: Walidacja danych logowania (email + password)

**Test cases**:

```typescript
describe("loginSchema", () => {
  // ✅ Happy path
  it("should accept valid email and password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "SomePassword123",
    });
    expect(result.success).toBe(true);
  });

  // ❌ Email validation
  it("should reject invalid email format", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain(
      "Nieprawidłowy format e-mail"
    );
  });

  it("should reject missing email", () => {
    const result = loginSchema.safeParse({
      password: "password",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty email", () => {
    const result = loginSchema.safeParse({
      email: "",
      password: "password",
    });
    expect(result.success).toBe(false);
  });

  // ❌ Password validation
  it("should reject empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain("Hasło jest wymagane");
  });

  it("should reject missing password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
    });
    expect(result.success).toBe(false);
  });

  // ✅ Edge cases
  it("should accept password with 1 character", () => {
    // Login nie wymaga silnego hasła (tylko required)
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "a",
    });
    expect(result.success).toBe(true);
  });
});
```

**Estymacja**: 7 testów

---

##### 1.1.2. `registerSchema`

**Funkcjonalność**: Walidacja rejestracji (email + silne hasło + confirmPassword)

**Test cases**:

```typescript
describe("registerSchema", () => {
  // ✅ Happy path
  it("should accept valid registration data", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "Password123",
      confirmPassword: "Password123",
    });
    expect(result.success).toBe(true);
  });

  // ❌ Email validation (similar to loginSchema)
  it("should reject invalid email format", () => {
    const result = registerSchema.safeParse({
      email: "invalid",
      password: "Password123",
      confirmPassword: "Password123",
    });
    expect(result.success).toBe(false);
  });

  // ❌ Password complexity validation
  it("should reject password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "Pass12", // 6 chars
      confirmPassword: "Pass12",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain("minimum 8 znaków");
  });

  it("should reject password without uppercase letter", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "password123", // no uppercase
      confirmPassword: "password123",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain("wielką literę");
  });

  it("should reject password without lowercase letter", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "PASSWORD123", // no lowercase
      confirmPassword: "PASSWORD123",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain("małą literę");
  });

  it("should reject password without digit", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "PasswordABC", // no digit
      confirmPassword: "PasswordABC",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain("cyfrę");
  });

  // ❌ Password match validation
  it("should reject mismatched passwords", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "Password123",
      confirmPassword: "Different123",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["confirmPassword"]);
    expect(result.error?.issues[0].message).toContain("identyczne");
  });

  // ✅ Edge cases
  it("should accept exactly 8 character password with all requirements", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "Pass123!", // exactly 8 chars
      confirmPassword: "Pass123!",
    });
    expect(result.success).toBe(true);
  });

  it("should accept password with special characters", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "P@ssw0rd!",
      confirmPassword: "P@ssw0rd!",
    });
    expect(result.success).toBe(true);
  });

  it("should accept very long password", () => {
    const longPassword = "Password123" + "a".repeat(100);
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: longPassword,
      confirmPassword: longPassword,
    });
    expect(result.success).toBe(true);
  });
});
```

**Estymacja**: 11 testów

---

##### 1.1.3. `passwordResetSchema`

**Funkcjonalność**: Walidacja email dla resetu hasła

**Test cases**:

```typescript
describe("passwordResetSchema", () => {
  it("should accept valid email", () => {
    const result = passwordResetSchema.safeParse({
      email: "user@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email format", () => {
    const result = passwordResetSchema.safeParse({
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing email", () => {
    const result = passwordResetSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
```

**Estymacja**: 3 testy

---

##### 1.1.4. `updatePasswordSchema`

**Funkcjonalność**: Walidacja nowego hasła (identyczna jak registerSchema dla hasła)

**Test cases**:

```typescript
describe("updatePasswordSchema", () => {
  // Same as registerSchema password tests
  it("should accept valid password update", () => {
    const result = updatePasswordSchema.safeParse({
      password: "NewPass123",
      confirmPassword: "NewPass123",
    });
    expect(result.success).toBe(true);
  });

  it("should reject mismatched passwords", () => {
    const result = updatePasswordSchema.safeParse({
      password: "NewPass123",
      confirmPassword: "Different123",
    });
    expect(result.success).toBe(false);
  });

  // Include all password complexity tests from registerSchema
  // (min 8 chars, uppercase, lowercase, digit)
});
```

**Estymacja**: 7 testów (podobne do registerSchema)

---

### 1.2. Flashcard Validation (`lib/validation/flashcard-validation.ts`)

**Priorytet**: 🔴 **KRYTYCZNY (MVP)**
**Estymacja**: ~10 testów
**Ścieżka pliku testowego**: `lib/validation/flashcard-validation.test.ts`

#### Schemas do przetestowania:

##### 1.2.1. `flashcardListQuerySchema`

**Funkcjonalność**: Walidacja query params dla GET /api/flashcards (page, page_size)

**Test cases**:

```typescript
describe("flashcardListQuerySchema", () => {
  // ✅ Happy path - defaults
  it("should use default values when params not provided", () => {
    const result = flashcardListQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    expect(result.data?.page).toBe(1);
    expect(result.data?.page_size).toBe(20);
  });

  // ✅ Valid page numbers
  it("should accept valid page number", () => {
    const result = flashcardListQuerySchema.safeParse({
      page: "5",
    });
    expect(result.success).toBe(true);
    expect(result.data?.page).toBe(5);
  });

  it("should accept valid page_size", () => {
    const result = flashcardListQuerySchema.safeParse({
      page_size: "50",
    });
    expect(result.success).toBe(true);
    expect(result.data?.page_size).toBe(50);
  });

  // ❌ Invalid page numbers
  it("should reject negative page number", () => {
    expect(() => {
      flashcardListQuerySchema.parse({ page: "-1" });
    }).toThrow("dodatnią liczbą całkowitą");
  });

  it("should reject zero page number", () => {
    expect(() => {
      flashcardListQuerySchema.parse({ page: "0" });
    }).toThrow("dodatnią liczbą całkowitą");
  });

  it("should reject non-integer page", () => {
    expect(() => {
      flashcardListQuerySchema.parse({ page: "1.5" });
    }).toThrow();
  });

  // ❌ Invalid page_size
  it("should reject page_size less than 1", () => {
    expect(() => {
      flashcardListQuerySchema.parse({ page_size: "0" });
    }).toThrow("od 1 do 100");
  });

  it("should reject page_size greater than 100", () => {
    expect(() => {
      flashcardListQuerySchema.parse({ page_size: "101" });
    }).toThrow("od 1 do 100");
  });

  // ✅ Edge cases
  it("should accept page_size = 1", () => {
    const result = flashcardListQuerySchema.safeParse({ page_size: "1" });
    expect(result.success).toBe(true);
  });

  it("should accept page_size = 100", () => {
    const result = flashcardListQuerySchema.safeParse({ page_size: "100" });
    expect(result.success).toBe(true);
  });
});
```

**Estymacja**: 10 testów

---

### 1.3. AI Generations Validation (`lib/validation/ai-generations.ts`)

**Priorytet**: 🔴 **KRYTYCZNY (MVP)**
**Estymacja**: ~15 testów
**Ścieżka pliku testowego**: `lib/validation/ai-generations.test.ts`

#### Schemas do przetestowania:

##### 1.3.1. `createAiGenerationSchema`

**Funkcjonalność**: Walidacja input_text (1-10000 chars)

**Test cases**:

```typescript
describe("createAiGenerationSchema", () => {
  // ✅ Happy path
  it("should accept valid input text", () => {
    const text = "Lorem ipsum ".repeat(100); // ~1200 chars
    const result = createAiGenerationSchema.safeParse({
      input_text: text,
    });
    expect(result.success).toBe(true);
  });

  // ❌ Empty validation
  it("should reject empty string", () => {
    const result = createAiGenerationSchema.safeParse({
      input_text: "",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain("nie może być pusty");
  });

  it("should reject whitespace-only string", () => {
    const result = createAiGenerationSchema.safeParse({
      input_text: "   \n\t   ",
    });
    expect(result.success).toBe(false);
  });

  // ❌ Max length validation
  it("should reject text longer than 10000 chars", () => {
    const text = "a".repeat(10001);
    const result = createAiGenerationSchema.safeParse({
      input_text: text,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain(
      "maksymalnie 10000 znaków"
    );
  });

  // ✅ Edge cases
  it("should accept exactly 10000 chars", () => {
    const text = "a".repeat(10000);
    const result = createAiGenerationSchema.safeParse({
      input_text: text,
    });
    expect(result.success).toBe(true);
  });

  it("should trim whitespace", () => {
    const result = createAiGenerationSchema.safeParse({
      input_text: "  valid text  ",
    });
    expect(result.success).toBe(true);
    expect(result.data?.input_text).toBe("valid text");
  });
});
```

**Estymacja**: 6 testów

---

##### 1.3.2. `aiProposalSchema`

**Funkcjonalność**: Walidacja pojedynczej propozycji fiszki (front 1-300, back 1-600)

**Test cases**:

```typescript
describe("aiProposalSchema", () => {
  // ✅ Happy path
  it("should accept valid proposal", () => {
    const result = aiProposalSchema.safeParse({
      front: "What is TypeScript?",
      back: "A typed superset of JavaScript",
    });
    expect(result.success).toBe(true);
  });

  // ❌ Front validation
  it("should reject empty front", () => {
    const result = aiProposalSchema.safeParse({
      front: "",
      back: "Answer",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain("nie może być pusty");
  });

  it("should reject front longer than 300 chars", () => {
    const result = aiProposalSchema.safeParse({
      front: "a".repeat(301),
      back: "Answer",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain("maksymalnie 300 znaków");
  });

  // ❌ Back validation
  it("should reject empty back", () => {
    const result = aiProposalSchema.safeParse({
      front: "Question",
      back: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject back longer than 600 chars", () => {
    const result = aiProposalSchema.safeParse({
      front: "Question",
      back: "a".repeat(601),
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain("maksymalnie 600 znaków");
  });

  // ✅ Edge cases
  it("should accept front exactly 300 chars", () => {
    const result = aiProposalSchema.safeParse({
      front: "a".repeat(300),
      back: "Answer",
    });
    expect(result.success).toBe(true);
  });

  it("should accept back exactly 600 chars", () => {
    const result = aiProposalSchema.safeParse({
      front: "Question",
      back: "a".repeat(600),
    });
    expect(result.success).toBe(true);
  });

  it("should trim whitespace from front and back", () => {
    const result = aiProposalSchema.safeParse({
      front: "  Question  ",
      back: "  Answer  ",
    });
    expect(result.success).toBe(true);
    expect(result.data?.front).toBe("Question");
    expect(result.data?.back).toBe("Answer");
  });
});
```

**Estymacja**: 8 testów

---

##### 1.3.3. `acceptAiGenerationSchema`

**Funkcjonalność**: Walidacja akceptacji propozycji (generation_id + proposals array)

**Test cases**:

```typescript
describe("acceptAiGenerationSchema", () => {
  const validProposal = { front: "Q", back: "A" };

  // ✅ Happy path
  it("should accept valid acceptance data", () => {
    const result = acceptAiGenerationSchema.safeParse({
      generation_id: "123e4567-e89b-12d3-a456-426614174000",
      proposals: [validProposal],
    });
    expect(result.success).toBe(true);
  });

  // ❌ generation_id validation
  it("should reject invalid UUID format", () => {
    const result = acceptAiGenerationSchema.safeParse({
      generation_id: "not-a-uuid",
      proposals: [validProposal],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain("UUID");
  });

  // ❌ proposals array validation
  it("should reject empty proposals array", () => {
    const result = acceptAiGenerationSchema.safeParse({
      generation_id: "123e4567-e89b-12d3-a456-426614174000",
      proposals: [],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain("co najmniej jedną");
  });

  it("should reject more than 10 proposals", () => {
    const result = acceptAiGenerationSchema.safeParse({
      generation_id: "123e4567-e89b-12d3-a456-426614174000",
      proposals: Array(11).fill(validProposal),
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain("maksymalnie 10");
  });

  // ✅ Edge cases
  it("should accept exactly 10 proposals", () => {
    const result = acceptAiGenerationSchema.safeParse({
      generation_id: "123e4567-e89b-12d3-a456-426614174000",
      proposals: Array(10).fill(validProposal),
    });
    expect(result.success).toBe(true);
  });
});
```

**Estymacja**: 5 testów

---

## Kategoria 2: Error Handling

### 2.1. API Error Responses (`lib/api/error-responses.ts`)

**Priorytet**: 🔴 **KRYTYCZNY (MVP)**
**Estymacja**: ~12 testów
**Ścieżka pliku testowego**: `lib/api/error-responses.test.ts`

#### Klasy/funkcje do przetestowania:

##### 2.1.1. `ApiError` class

**Funkcjonalność**: Custom error z status code

**Test cases**:

```typescript
describe("ApiError", () => {
  it("should create error with status code and message", () => {
    const error = new ApiError(401, "Unauthorized");

    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe("Unauthorized");
    expect(error.name).toBe("ApiError");
  });

  it("should maintain error stack trace", () => {
    const error = new ApiError(500, "Server error");

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain("ApiError");
  });
});
```

**Estymacja**: 2 testy

---

##### 2.1.2. `ApiErrors` factory

**Funkcjonalność**: Pre-defined error instances

**Test cases**:

```typescript
describe("ApiErrors factory", () => {
  it("should create Unauthorized error (401)", () => {
    const error = ApiErrors.Unauthorized;

    expect(error.statusCode).toBe(401);
    expect(error.message).toContain("zalogowany");
  });

  it("should create Forbidden error (403)", () => {
    const error = ApiErrors.Forbidden;

    expect(error.statusCode).toBe(403);
    expect(error.message).toContain("Brak dostępu");
  });

  it("should create NotFound error (404)", () => {
    const error = ApiErrors.NotFound;

    expect(error.statusCode).toBe(404);
    expect(error.message).toContain("nie został znaleziony");
  });

  it("should create BadRequest with custom message", () => {
    const error = ApiErrors.BadRequest("Invalid input");

    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Invalid input");
  });

  it("should create InternalServerError (500)", () => {
    const error = ApiErrors.InternalServerError;

    expect(error.statusCode).toBe(500);
    expect(error.message).toContain("błąd serwera");
  });
});
```

**Estymacja**: 5 testów

---

##### 2.1.3. `errorResponse()` function

**Funkcjonalność**: Convert errors to NextResponse

**Test cases**:

```typescript
describe("errorResponse", () => {
  it("should handle ApiError correctly", async () => {
    const error = new ApiError(404, "Not found");
    const response = errorResponse(error);

    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body).toEqual({ error: "Not found" });
  });

  it("should handle unknown errors with 500", async () => {
    const error = new Error("Something broke");
    const response = errorResponse(error);

    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body.error).toContain("błąd serwera");
  });

  it("should handle non-Error objects", async () => {
    const error = "String error";
    const response = errorResponse(error);

    expect(response.status).toBe(500);
  });

  it("should handle null/undefined", async () => {
    const response = errorResponse(null);

    expect(response.status).toBe(500);
  });

  it("should log unexpected errors (spy on console.error)", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const error = new Error("Unexpected");
    errorResponse(error);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Unexpected API error:",
      error
    );

    consoleErrorSpy.mockRestore();
  });
});
```

**Estymacja**: 5 testów

---

### 2.2. OpenRouter Errors (`lib/errors/openrouter-errors.ts`)

**Priorytet**: 🟡 **ŚREDNI (MVP)**
**Estymacja**: ~10 testów
**Ścieżka pliku testowego**: `lib/errors/openrouter-errors.test.ts`

#### Klasy do przetestowania:

```typescript
describe("OpenRouterError (base class)", () => {
  it("should create error with code and retryable flag", () => {
    const error = new OpenRouterError("Test error", "TEST_CODE", true, {
      detail: "info",
    });

    expect(error.message).toBe("Test error");
    expect(error.code).toBe("TEST_CODE");
    expect(error.retryable).toBe(true);
    expect(error.details).toEqual({ detail: "info" });
    expect(error.name).toBe("OpenRouterError");
  });
});

describe("OpenRouterConfigError", () => {
  it("should create non-retryable config error", () => {
    const error = new OpenRouterConfigError("Missing API key");

    expect(error.message).toBe("Missing API key");
    expect(error.code).toBe("OPENROUTER_CONFIG_ERROR");
    expect(error.retryable).toBe(false);
    expect(error.name).toBe("OpenRouterConfigError");
  });
});

describe("OpenRouterNetworkError", () => {
  it("should create retryable network error", () => {
    const error = new OpenRouterNetworkError("Network failure", {
      url: "https://...",
    });

    expect(error.retryable).toBe(true);
    expect(error.code).toBe("OPENROUTER_NETWORK_ERROR");
  });
});

describe("OpenRouterApiError", () => {
  it("should create error with status code", () => {
    const error = new OpenRouterApiError("Rate limited", 429, true);

    expect(error.statusCode).toBe(429);
    expect(error.retryable).toBe(true);
    expect(error.code).toBe("OPENROUTER_API_429");
  });
});

describe("OpenRouterParseError", () => {
  it("should create non-retryable parse error", () => {
    const error = new OpenRouterParseError("Invalid JSON", { content: "..." });

    expect(error.retryable).toBe(false);
    expect(error.details).toEqual({ content: "..." });
  });
});

describe("OpenRouterTimeoutError", () => {
  it("should create retryable timeout error", () => {
    const error = new OpenRouterTimeoutError(30000);

    expect(error.retryable).toBe(true);
    expect(error.message).toContain("30s");
  });
});
```

**Estymacja**: 6 testów (po 1 dla każdej klasy)

---

## Kategoria 3: Utility Functions

### 3.1. Class Name Utilities (`lib/utils.ts`)

**Priorytet**: 🟢 **NISKI (post-MVP)**
**Estymacja**: ~5 testów
**Ścieżka pliku testowego**: `lib/utils.test.ts`

#### Funkcja do przetestowania:

##### 3.1.1. `cn()` function

**Funkcjonalność**: Merge Tailwind CSS classes

**Test cases**:

```typescript
describe("cn utility", () => {
  it("should merge class names", () => {
    const result = cn("px-4", "py-2");
    expect(result).toContain("px-4");
    expect(result).toContain("py-2");
  });

  it("should handle conditional classes", () => {
    const result = cn("base", true && "active", false && "disabled");
    expect(result).toContain("base");
    expect(result).toContain("active");
    expect(result).not.toContain("disabled");
  });

  it("should deduplicate conflicting Tailwind classes", () => {
    const result = cn("px-4", "px-8");
    // twMerge should keep only px-8
    expect(result).toBe("px-8");
  });

  it("should handle arrays", () => {
    const result = cn(["px-4", "py-2"]);
    expect(result).toContain("px-4");
  });

  it("should handle undefined/null values", () => {
    const result = cn("base", undefined, null);
    expect(result).toBe("base");
  });
});
```

**Estymacja**: 5 testów

---

## Kategoria 4: OpenRouter Client

### 4.1. OpenRouter Client (`lib/integrations/openrouter-client.ts`)

**Priorytet**: 🟡 **ŚREDNI (MVP)**
**Estymacja**: ~25 testów
**Ścieżka pliku testowego**: `lib/integrations/openrouter-client.test.ts`

**WAŻNE**: Wymaga mockowania `fetch` API

#### Metody do przetestowania:

##### 4.1.1. Constructor

**Test cases**:

```typescript
describe("OpenRouterClient constructor", () => {
  beforeEach(() => {
    // Reset env vars
    delete process.env.OPENROUTER_API_KEY;
  });

  it("should throw error when API key missing", () => {
    expect(() => new OpenRouterClient()).toThrow(
      "OPENROUTER_API_KEY is not configured"
    );
  });

  it("should use API key from config", () => {
    const client = new OpenRouterClient({ apiKey: "sk-test-123" });
    expect(client).toBeDefined();
  });

  it("should use API key from env", () => {
    process.env.OPENROUTER_API_KEY = "sk-test-env";
    const client = new OpenRouterClient();
    expect(client).toBeDefined();
  });

  it("should use default model if not specified", () => {
    const client = new OpenRouterClient({ apiKey: "sk-test-123" });
    // Model is private, but we can verify behavior indirectly
    expect(client).toBeDefined();
  });

  it("should throw error in browser context", () => {
    const originalWindow = global.window;
    global.window = {} as any;

    expect(() => new OpenRouterClient({ apiKey: "sk-test" })).toThrow(
      "can only be used server-side"
    );

    delete (global as any).window;
  });

  it("should warn about unusual API key format", () => {
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    new OpenRouterClient({ apiKey: "unusual-key" });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("API key format looks unusual")
    );

    consoleWarnSpy.mockRestore();
  });
});
```

**Estymacja**: 6 testów

---

##### 4.1.2. `generateFlashcards()` - Happy Path

**Test cases**:

```typescript
describe("generateFlashcards - happy path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("should call OpenRouter API with correct parameters", async () => {
    const mockResponse = {
      id: "test-id",
      model: "gpt-4o-mini",
      created: Date.now() / 1000,
      choices: [
        {
          message: {
            content: JSON.stringify({
              flashcards: [
                { front: "Q1", back: "A1" },
                { front: "Q2", back: "A2" },
              ],
            }),
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150,
      },
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const client = new OpenRouterClient({ apiKey: "sk-test-123" });
    const inputText = "Lorem ipsum ".repeat(100); // ~1200 chars

    const result = await client.generateFlashcards(inputText);

    // Verify fetch called
    expect(global.fetch).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer sk-test-123",
          "Content-Type": "application/json",
        }),
      })
    );

    // Verify result
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ front: "Q1", back: "A1" });
    expect(result[1]).toEqual({ front: "Q2", back: "A2" });
  });

  it("should include site headers if configured", async () => {
    // Mock successful response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                flashcards: [{ front: "Q", back: "A" }],
              }),
            },
          },
        ],
      }),
    });

    const client = new OpenRouterClient({
      apiKey: "sk-test-123",
      siteUrl: "https://10xcards.com",
      siteName: "10xCards",
    });

    await client.generateFlashcards("Lorem ipsum ".repeat(100));

    const callArgs = (global.fetch as any).mock.calls[0][1];
    expect(callArgs.headers["HTTP-Referer"]).toBe("https://10xcards.com");
    expect(callArgs.headers["X-Title"]).toBe("10xCards");
  });
});
```

**Estymacja**: 2 testy

---

##### 4.1.3. `generateFlashcards()` - Input Validation

**Test cases**:

```typescript
describe("generateFlashcards - input validation", () => {
  let client: OpenRouterClient;

  beforeEach(() => {
    client = new OpenRouterClient({ apiKey: "sk-test-123" });
  });

  it("should reject empty input", async () => {
    await expect(client.generateFlashcards("")).rejects.toThrow(
      "cannot be empty"
    );
  });

  it("should reject whitespace-only input", async () => {
    await expect(client.generateFlashcards("   \n\t   ")).rejects.toThrow(
      "cannot be empty"
    );
  });

  it("should reject input shorter than 1000 chars", async () => {
    const shortText = "Short text";
    await expect(client.generateFlashcards(shortText)).rejects.toThrow(
      "at least 1000 characters"
    );
  });

  it("should reject input longer than 10000 chars", async () => {
    const longText = "a".repeat(10001);
    await expect(client.generateFlashcards(longText)).rejects.toThrow(
      "cannot exceed 10000"
    );
  });

  it("should accept exactly 1000 chars", async () => {
    const text = "a".repeat(1000);

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                flashcards: [{ front: "Q", back: "A" }],
              }),
            },
          },
        ],
      }),
    });

    await expect(client.generateFlashcards(text)).resolves.toBeDefined();
  });

  it("should accept exactly 10000 chars", async () => {
    const text = "a".repeat(10000);

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                flashcards: [{ front: "Q", back: "A" }],
              }),
            },
          },
        ],
      }),
    });

    await expect(client.generateFlashcards(text)).resolves.toBeDefined();
  });
});
```

**Estymacja**: 6 testów

---

##### 4.1.4. `generateFlashcards()` - Error Handling

**Test cases**:

```typescript
describe("generateFlashcards - error handling", () => {
  let client: OpenRouterClient;

  beforeEach(() => {
    client = new OpenRouterClient({ apiKey: "sk-test-123" });
    global.fetch = vi.fn();
  });

  it("should throw OpenRouterTimeoutError on timeout", async () => {
    // Mock AbortError
    global.fetch.mockRejectedValueOnce(
      Object.assign(new Error("The operation was aborted"), {
        name: "AbortError",
      })
    );

    await expect(
      client.generateFlashcards("Lorem ipsum ".repeat(100))
    ).rejects.toThrow(OpenRouterTimeoutError);
  });

  it("should throw OpenRouterNetworkError on network failure", async () => {
    global.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(
      client.generateFlashcards("Lorem ipsum ".repeat(100))
    ).rejects.toThrow(OpenRouterNetworkError);
  });

  it("should throw OpenRouterApiError on 401", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: async () => "Unauthorized",
      headers: new Headers(),
    });

    await expect(
      client.generateFlashcards("Lorem ipsum ".repeat(100))
    ).rejects.toThrow(OpenRouterApiError);
  });

  it("should throw OpenRouterApiError on 429 (rate limit)", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
      text: async () => "",
      headers: new Headers(),
    });

    await expect(
      client.generateFlashcards("Lorem ipsum ".repeat(100))
    ).rejects.toThrow(OpenRouterApiError);
  });

  it("should throw OpenRouterParseError on invalid JSON", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: "Invalid JSON string",
            },
          },
        ],
      }),
    });

    await expect(
      client.generateFlashcards("Lorem ipsum ".repeat(100))
    ).rejects.toThrow(OpenRouterParseError);
  });
});
```

**Estymacja**: 5 testów

---

##### 4.1.5. `generateFlashcards()` - Retry Logic

**Test cases**:

```typescript
describe("generateFlashcards - retry logic", () => {
  let client: OpenRouterClient;

  beforeEach(() => {
    client = new OpenRouterClient({ apiKey: "sk-test-123", maxRetries: 3 });
    global.fetch = vi.fn();
  });

  it("should retry on timeout error", async () => {
    // Fail twice, succeed on 3rd attempt
    global.fetch
      .mockRejectedValueOnce(
        Object.assign(new Error("Aborted"), { name: "AbortError" })
      )
      .mockRejectedValueOnce(
        Object.assign(new Error("Aborted"), { name: "AbortError" })
      )
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  flashcards: [{ front: "Q", back: "A" }],
                }),
              },
            },
          ],
        }),
      });

    const result = await client.generateFlashcards("Lorem ipsum ".repeat(100));

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(result).toHaveLength(1);
  });

  it("should NOT retry on non-retryable error (401)", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: async () => "",
      headers: new Headers(),
    });

    await expect(
      client.generateFlashcards("Lorem ipsum ".repeat(100))
    ).rejects.toThrow();

    // Should only try once (no retry for 401)
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("should throw after max retries exhausted", async () => {
    // All 3 attempts fail
    global.fetch.mockRejectedValue(
      Object.assign(new Error("Aborted"), { name: "AbortError" })
    );

    await expect(
      client.generateFlashcards("Lorem ipsum ".repeat(100))
    ).rejects.toThrow();

    expect(global.fetch).toHaveBeenCalledTimes(3);
  });
});
```

**Estymacja**: 3 testy

---

## Kategoria 5: Services (opcjonalne)

### 5.1. Flashcard Service (`lib/services/flashcard-service.server.ts`)

**Priorytet**: 🔵 **OPCJONALNY (post-MVP)**
**Uwaga**: Services zazwyczaj testuje się w testach integracyjnych (z DB)

**Rekomendacja**: Pomiń testy jednostkowe dla services, przetestuj w integration tests

---

### 5.2. AI Generation Service (`lib/services/ai-generation-service.server.ts`)

**Priorytet**: 🔵 **OPCJONALNY (post-MVP)**

**Rekomendacja**: Pomiń, testuj w integration tests

---

## Podsumowanie i priorytetyzacja

### Statystyki testów

| Kategoria                 | Liczba testów | Priorytet    | Status            |
| ------------------------- | ------------- | ------------ | ----------------- |
| **Validation Schemas**    | ~60           | 🔴 Krytyczny | MUST HAVE         |
| - auth.ts                 | 28            | 🔴           | MVP               |
| - flashcard-validation.ts | 10            | 🔴           | MVP               |
| - ai-generations.ts       | 19            | 🔴           | MVP               |
| **Error Handling**        | ~22           | 🔴 Krytyczny | MUST HAVE         |
| - error-responses.ts      | 12            | 🔴           | MVP               |
| - openrouter-errors.ts    | 6             | 🟡           | MVP               |
| **Utilities**             | ~5            | 🟢 Niski     | SHOULD HAVE       |
| - utils.ts                | 5             | 🟢           | Post-MVP          |
| **OpenRouter Client**     | ~25           | 🟡 Średni    | SHOULD HAVE       |
| - openrouter-client.ts    | 22            | 🟡           | MVP               |
| **Services**              | 0             | 🔵           | Integration tests |
| **TOTAL**                 | **~110**      |              |                   |

### Kolejność implementacji (zalecana)

#### Sprint 1: Fundamenty (Priorytet 1) - 2-3 dni

1. ✅ `lib/validations/auth.test.ts` (28 testów)
2. ✅ `lib/validation/flashcard-validation.test.ts` (10 testów)
3. ✅ `lib/validation/ai-generations.test.ts` (19 testów)
4. ✅ `lib/api/error-responses.test.ts` (12 testów)

**Razem**: ~70 testów | **Coverage**: Validation + API errors

---

#### Sprint 2: Integracje (Priorytet 2) - 2 dni

5. ✅ `lib/errors/openrouter-errors.test.ts` (6 testów)
6. ✅ `lib/integrations/openrouter-client.test.ts` (22 testy)

**Razem**: ~28 testów | **Coverage**: OpenRouter integration

---

#### Sprint 3: Polish (Priorytet 3) - 1 dzień

7. ✅ `lib/utils.test.ts` (5 testów)

**Razem**: ~5 testów | **Coverage**: Utilities

---

### Komendy do uruchomienia

```bash
# Setup (jednorazowo)
npm install --save-dev vitest @vitest/ui

# Uruchom testy
npm run test                           # Wszystkie
npm run test:unit                      # Tylko unit tests
npm run test lib/validations/          # Tylko validation tests
npm run test lib/validations/auth.test.ts  # Konkretny plik

# Watch mode (podczas development)
npm run test:watch

# Coverage
npm run test:coverage
open coverage/index.html
```

### Template pliku testowego

```typescript
// lib/validations/auth.test.ts
import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "./auth";

describe("auth validation schemas", () => {
  describe("loginSchema", () => {
    it("should accept valid credentials", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "password",
      });
      expect(result.success).toBe(true);
    });

    // ... more tests
  });

  describe("registerSchema", () => {
    // ... tests
  });
});
```

---

## Next Steps

1. **Create vitest config**: `vitest.config.ts` (see test-plan.md section 4.3)
2. **Setup test helpers**: `test-utils/` directory
3. **Implement Sprint 1**: Validation tests (highest priority)
4. **Track progress**: Update this checklist as tests are implemented
5. **Review coverage**: `npm run test:coverage` after each sprint

---

## Kontakt

**Test plan**: `.ai/test-plan.md`
**Integration tests**: Implement after unit tests completed
**E2E tests**: Implement after integration tests

✅ = Zaimplementowane
⏳ = W trakcie
❌ = Do zrobienia
