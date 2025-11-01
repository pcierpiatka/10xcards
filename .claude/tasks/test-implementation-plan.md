# Plan implementacji testów jednostkowych - 10xCards

**Data utworzenia**: 2025-01-01
**Framework**: Vitest 2.0
**Metodologia**: 3x3 (batche po 3 test cases)
**Cel coverage**: ≥ 80%

---

## 1. Analiza tech stacku

### Framework testowy

- **Vitest**: Brak w `package.json` - musi zostać zainstalowany
- **TypeScript**: v5.9.3 (zainstalowane)
- **Zod**: v4.1.12 (zainstalowane)

### Struktura projektu

```
lib/
├── validations/
│   └── auth.ts                        → auth.test.ts (28 testów)
├── validation/
│   ├── flashcard-validation.ts        → flashcard-validation.test.ts (10 testów)
│   └── ai-generations.ts              → ai-generations.test.ts (19 testów)
├── api/
│   └── error-responses.ts             → error-responses.test.ts (12 testów)
├── errors/
│   └── openrouter-errors.ts           → openrouter-errors.test.ts (6 testów)
└── utils.ts                           → utils.test.ts (5 testów)
```

---

## 2. Wymagania przed implementacją

### 2.1. Instalacja zależności

```bash
npm install --save-dev vitest @vitest/ui @vitest/coverage-v8
```

### 2.2. Konfiguracja Vitest

Utworzyć plik `vitest.config.ts`:

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
        "components/ui/**",
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

### 2.3. Setup file

Utworzyć `vitest.setup.ts`:

```typescript
import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
```

### 2.4. Scripts w package.json

Dodać:

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

---

## 3. Breakdown testów na batche (3x3)

### PRIORYTET 1: MVP - Krytyczny (70 testów)

#### **Batch 1** - Auth validation: loginSchema (7 testów)

**Plik**: `lib/validations/auth.test.ts`

1. TEST-001: Should accept valid email and password
2. TEST-002: Should reject invalid email format
3. TEST-003: Should reject missing email
4. TEST-004: Should reject empty email
5. TEST-005: Should reject empty password
6. TEST-006: Should reject missing password
7. TEST-007: Should accept password with 1 character

**Zależności**: Zod (zainstalowane)

---

#### **Batch 2** - Auth validation: registerSchema part 1 (3 testy)

**Plik**: `lib/validations/auth.test.ts` (kontynuacja)

8. TEST-008: Should accept valid registration data
9. TEST-009: Should reject invalid email format
10. TEST-010: Should reject password shorter than 8 characters

**Zależności**: Brak

---

#### **Batch 3** - Auth validation: registerSchema part 2 (3 testy)

**Plik**: `lib/validations/auth.test.ts` (kontynuacja)

11. TEST-011: Should reject password without uppercase letter
12. TEST-012: Should reject password without lowercase letter
13. TEST-013: Should reject password without digit

**Zależności**: Brak

---

#### **Batch 4** - Auth validation: registerSchema part 3 + passwordResetSchema (3 testy)

**Plik**: `lib/validations/auth.test.ts` (kontynuacja)

14. TEST-014: Should reject mismatched passwords
15. TEST-015: Should accept exactly 8 character password with all requirements
16. TEST-016: Should accept password with special characters

**Zależności**: Brak

---

#### **Batch 5** - Auth validation: registerSchema edge cases + passwordResetSchema (3 testy)

**Plik**: `lib/validations/auth.test.ts` (kontynuacja)

17. TEST-017: Should accept very long password
18. TEST-018: Should accept valid email (passwordResetSchema)
19. TEST-019: Should reject invalid email format (passwordResetSchema)

**Zależności**: Brak

---

#### **Batch 6** - Auth validation: passwordResetSchema + updatePasswordSchema (3 testy)

**Plik**: `lib/validations/auth.test.ts` (kontynuacja)

20. TEST-020: Should reject missing email (passwordResetSchema)
21. TEST-021: Should accept valid password update
22. TEST-022: Should reject mismatched passwords (updatePasswordSchema)

**Zależności**: Brak

---

#### **Batch 7** - Auth validation: updatePasswordSchema (3 testy)

**Plik**: `lib/validations/auth.test.ts` (kontynuacja)

23. TEST-023: Should reject password shorter than 8 characters (updatePasswordSchema)
24. TEST-024: Should reject password without uppercase letter (updatePasswordSchema)
25. TEST-025: Should reject password without lowercase letter (updatePasswordSchema)

**Zależności**: Brak

---

#### **Batch 8** - Auth validation: updatePasswordSchema (3 testy)

**Plik**: `lib/validations/auth.test.ts` (zakończenie)

26. TEST-026: Should reject password without digit (updatePasswordSchema)
27. TEST-027: Should accept exactly 8 character password (updatePasswordSchema)
28. TEST-028: Should accept password with special characters (updatePasswordSchema)

**Zależności**: Brak
**Status**: ✅ Kompletny moduł auth.test.ts (28 testów)

---

#### **Batch 9** - Flashcard validation: flashcardListQuerySchema (3 testy)

**Plik**: `lib/validation/flashcard-validation.test.ts`

29. TEST-029: Should use default values when params not provided
30. TEST-030: Should accept valid page number
31. TEST-031: Should accept valid page_size

**Zależności**: Zod

---

#### **Batch 10** - Flashcard validation: flashcardListQuerySchema (3 testy)

**Plik**: `lib/validation/flashcard-validation.test.ts` (kontynuacja)

32. TEST-032: Should reject negative page number
33. TEST-033: Should reject zero page number
34. TEST-034: Should reject non-integer page

**Zależności**: Brak

---

#### **Batch 11** - Flashcard validation: flashcardListQuerySchema (3 testy)

**Plik**: `lib/validation/flashcard-validation.test.ts` (kontynuacja)

35. TEST-035: Should reject page_size less than 1
36. TEST-036: Should reject page_size greater than 100
37. TEST-037: Should accept page_size = 1

**Zależności**: Brak

---

#### **Batch 12** - Flashcard validation: flashcardListQuerySchema (1 test) + AI generations (2 testy)

**Plik**: `lib/validation/flashcard-validation.test.ts` (zakończenie) + `lib/validation/ai-generations.test.ts`

38. TEST-038: Should accept page_size = 100
    **Status**: ✅ Kompletny moduł flashcard-validation.test.ts (10 testów)

39. TEST-039: Should accept valid input text (createAiGenerationSchema)
40. TEST-040: Should reject empty string (createAiGenerationSchema)

**Zależności**: Brak

---

#### **Batch 13** - AI generations: createAiGenerationSchema (3 testy)

**Plik**: `lib/validation/ai-generations.test.ts` (kontynuacja)

41. TEST-041: Should reject whitespace-only string
42. TEST-042: Should reject text longer than 10000 chars
43. TEST-043: Should accept exactly 10000 chars

**Zależności**: Brak

---

#### **Batch 14** - AI generations: createAiGenerationSchema + aiProposalSchema (3 testy)

**Plik**: `lib/validation/ai-generations.test.ts` (kontynuacja)

44. TEST-044: Should trim whitespace (createAiGenerationSchema)
45. TEST-045: Should accept valid proposal (aiProposalSchema)
46. TEST-046: Should reject empty front (aiProposalSchema)

**Zależności**: Brak

---

#### **Batch 15** - AI generations: aiProposalSchema (3 testy)

**Plik**: `lib/validation/ai-generations.test.ts` (kontynuacja)

47. TEST-047: Should reject front longer than 300 chars
48. TEST-048: Should reject empty back
49. TEST-049: Should reject back longer than 600 chars

**Zależności**: Brak

---

#### **Batch 16** - AI generations: aiProposalSchema (3 testy)

**Plik**: `lib/validation/ai-generations.test.ts` (kontynuacja)

50. TEST-050: Should accept front exactly 300 chars
51. TEST-051: Should accept back exactly 600 chars
52. TEST-052: Should trim whitespace from front and back

**Zależności**: Brak

---

#### **Batch 17** - AI generations: acceptAiGenerationSchema (3 testy)

**Plik**: `lib/validation/ai-generations.test.ts` (kontynuacja)

53. TEST-053: Should accept valid acceptance data
54. TEST-054: Should reject invalid UUID format
55. TEST-055: Should reject empty proposals array

**Zależności**: Brak

---

#### **Batch 18** - AI generations: acceptAiGenerationSchema (2 testy) + API errors (1 test)

**Plik**: `lib/validation/ai-generations.test.ts` (zakończenie) + `lib/api/error-responses.test.ts`

56. TEST-056: Should reject more than 10 proposals
57. TEST-057: Should accept exactly 10 proposals
    **Status**: ✅ Kompletny moduł ai-generations.test.ts (19 testów)

58. TEST-058: Should create error with status code and message (ApiError)

**Zależności**: NextResponse (Next.js)

---

#### **Batch 19** - API errors: ApiError + ApiErrors factory (3 testy)

**Plik**: `lib/api/error-responses.test.ts` (kontynuacja)

59. TEST-059: Should maintain error stack trace
60. TEST-060: Should create Unauthorized error (401)
61. TEST-061: Should create Forbidden error (403)

**Zależności**: Brak

---

#### **Batch 20** - API errors: ApiErrors factory (3 testy)

**Plik**: `lib/api/error-responses.test.ts` (kontynuacja)

62. TEST-062: Should create NotFound error (404)
63. TEST-063: Should create BadRequest with custom message
64. TEST-064: Should create InternalServerError (500)

**Zależności**: Brak

---

#### **Batch 21** - API errors: errorResponse() (3 testy)

**Plik**: `lib/api/error-responses.test.ts` (kontynuacja)

65. TEST-065: Should handle ApiError correctly
66. TEST-066: Should handle unknown errors with 500
67. TEST-067: Should handle non-Error objects

**Zależności**: Brak

---

#### **Batch 22** - API errors: errorResponse() (2 testy) + OpenRouter errors (1 test)

**Plik**: `lib/api/error-responses.test.ts` (zakończenie) + `lib/errors/openrouter-errors.test.ts`

68. TEST-068: Should handle null/undefined
69. TEST-069: Should log unexpected errors (spy on console.error)
    **Status**: ✅ Kompletny moduł error-responses.test.ts (12 testów)

70. TEST-070: Should create error with code and retryable flag (OpenRouterError)

**Zależności**: Brak

---

### PRIORYTET 2: MVP - Średni (28 testów)

#### **Batch 23** - OpenRouter errors (3 testy)

**Plik**: `lib/errors/openrouter-errors.test.ts` (kontynuacja)

71. TEST-071: Should create non-retryable config error (OpenRouterConfigError)
72. TEST-072: Should create retryable network error (OpenRouterNetworkError)
73. TEST-073: Should create error with status code (OpenRouterApiError)

**Zależności**: Brak

---

#### **Batch 24** - OpenRouter errors (2 testy) + Utils (1 test)

**Plik**: `lib/errors/openrouter-errors.test.ts` (kontynuacja) + `lib/utils.test.ts`

74. TEST-074: Should create non-retryable parse error (OpenRouterParseError)
75. TEST-075: Should create retryable timeout error (OpenRouterTimeoutError)
    **Status**: ✅ Kompletny moduł openrouter-errors.test.ts (6 testów)

76. TEST-076: Should merge class names (cn utility)

**Zależności**: clsx, tailwind-merge

---

#### **Batch 25** - Utils: cn() (3 testy)

**Plik**: `lib/utils.test.ts` (kontynuacja)

77. TEST-077: Should handle conditional classes
78. TEST-078: Should deduplicate conflicting Tailwind classes
79. TEST-079: Should handle arrays

**Zależności**: Brak

---

#### **Batch 26** - Utils: cn() (1 test)

**Plik**: `lib/utils.test.ts` (zakończenie)

80. TEST-080: Should handle undefined/null values
    **Status**: ✅ Kompletny moduł utils.test.ts (5 testów)

**Pozostałe 18 testów (OpenRouter Client)**:

- Ze względu na złożoność (mocking fetch, async operations, retry logic)
- Będzie zaimplementowany jako osobne zadanie w Batch 27-32

---

## 4. Harmonogram implementacji

### Faza 1: Setup (Day 1)

- [ ] Instalacja Vitest + dependencies
- [ ] Konfiguracja vitest.config.ts
- [ ] Setup vitest.setup.ts
- [ ] Dodanie scripts do package.json
- [ ] Test smoke test (prosty `expect(1 + 1).toBe(2)`)

### Faza 2: Priorytet 1 - Validation Schemas (Day 2-4)

- [ ] Batch 1-8: auth.test.ts (28 testów)
- [ ] Batch 9-12: flashcard-validation.test.ts (10 testów)
- [ ] Batch 13-18: ai-generations.test.ts (19 testów)

### Faza 3: Priorytet 1 - Error Handling (Day 5)

- [ ] Batch 19-22: error-responses.test.ts (12 testów)
- [ ] Batch 23-24: openrouter-errors.test.ts (6 testów)

### Faza 4: Priorytet 2 - Utilities (Day 6)

- [ ] Batch 25-26: utils.test.ts (5 testów)

### Faza 5: Coverage & Polish (Day 7)

- [ ] Uruchomienie `npm run test:coverage`
- [ ] Analiza luk w coverage
- [ ] Refactoring testów (DRY principle)
- [ ] Dokumentacja

---

## 5. Konwencje testowe

### Naming convention

- Test files: `<source-file-name>.test.ts`
- Test IDs: `TEST-XXX` (sequential numbering)
- Describe blocks: Nested by schema/function/class

### GWT Pattern (Given-When-Then)

```typescript
describe("Feature Name", () => {
  describe("GIVEN valid input", () => {
    it("WHEN parsing data THEN should accept valid credentials", () => {
      // Given (Arrange)
      const validInput = { email: "user@example.com", password: "Pass123" };

      // When (Act)
      const result = loginSchema.safeParse(validInput);

      // Then (Assert)
      expect(result.success).toBe(true);
    });
  });
});
```

### AAA Pattern (Arrange-Act-Assert) in code

```typescript
// Arrange - setup test data
const input = {
  /* ... */
};

// Act - execute function
const result = functionUnderTest(input);

// Assert - verify expectations
expect(result).toBe(expected);
```

---

## 6. Success Criteria

### Per batch

- [x] All 3 tests implemented
- [x] All tests passing (`npm run test`)
- [x] Code follows GWT/AAA patterns
- [x] Test IDs assigned (TEST-XXX)
- [x] No hardcoded values

### Per module

- [x] All planned tests implemented
- [x] File placed in correct location
- [x] Imports correct
- [x] No skipped tests (.skip)

### Final (all batches)

- [x] Total coverage ≥ 80%
- [x] All 80 tests passing (Priorytet 1 + 2)
- [x] CI/CD integration (optional)
- [x] Documentation updated

---

## 7. Ryzyka i mitygacje

| Ryzyko                    | Prawdopodobieństwo | Mitygacja                        |
| ------------------------- | ------------------ | -------------------------------- |
| Zod v4 breaking changes   | Medium             | Check Zod v4 migration guide     |
| Vitest setup issues       | Low                | Follow official docs             |
| Coverage gaps             | Medium             | Run coverage after each batch    |
| Test execution time > 10s | Low                | Use `vitest run` (no watch mode) |

---

## 8. Notatki

### Zmienione podczas implementacji

- (puste na start - będzie aktualizowane)

### Pytania do usera

- (puste na start)

---

**KONIEC PLANU**

Następny krok: Zatwierdzenie planu przez usera → Batch 1 implementacja
