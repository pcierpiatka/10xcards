# API Endpoint Implementation Plan: PUT /api/flashcards/{flashcard_id}

## 1. Przegląd punktu końcowego

**Cel:** Endpoint umożliwia edycję istniejącej fiszki (jednej lub obu stron: front/back) dla zaautoryzowanego użytkownika.

**Kluczowa funkcjonalność:**

- Częściowa aktualizacja fiszki (opcjonalne `front` i/lub `back`)
- Zabezpieczenie przed IDOR (użytkownik może edytować tylko swoje fiszki)
- Zwraca 200 OK z zaktualizowanym obiektem (nie 204, bo server może zmutować `source_type`)

**User Story:**

- **US-011**: "Jako użytkownik, chcę móc poprawić literówkę lub zmienić treść zapisanej fiszki"
- **F-09**: "Użytkownik musi mieć możliwość edycji treści istniejącej, zapisanej fiszki"

## 2. Szczegóły żądania

### Metoda HTTP

`PUT /api/flashcards/{flashcard_id}`

### Struktura URL

```
PUT https://api.example.com/api/flashcards/550e8400-e29b-41d4-a716-446655440000
```

### Nagłówki

| Nagłówek        | Wartość                 | Wymagany |
| --------------- | ----------------------- | -------- |
| `Authorization` | `Bearer <Supabase JWT>` | ✅ Tak   |
| `Content-Type`  | `application/json`      | ✅ Tak   |

### Parametry

#### Path Parameters (wymagane)

- **`flashcard_id`** (string, UUID)
  - ID fiszki do edycji
  - Format: UUID v4
  - Walidacja: Zod `.uuid()`

#### Query Parameters

Brak

#### Request Body (opcjonalny, ale przynajmniej jedno pole wymagane)

```typescript
{
  "front": string,  // 1-300 znaków
  "back": string    // 1-600 znaków
}
```

**Warunki:**

- Zwasze wysyłamy `front` i `back`
- Pole, musi spełniać ograniczenia długości
- Puste stringi są niedozwolone

**Przykłady request body:**

```json
// ✅ Edycja
{
  "front": "Updated front text",
  "back": "Updated back text"
}


// ❌ Pusty body
{}

// ❌ Puste stringi
{
  "front": ""
}

// ❌ Za długi tekst
{
  "front": "x".repeat(301)
}
```

## 3. Wykorzystywane typy

### DTOs (lib/dto/types.ts)

**Request Command:**

```typescript
// Linia 168 (istniejące)
export type UpdateFlashcardCommand = Partial<Pick<Flashcard, "front" | "back">>;
```

**Response DTO:**

```typescript
// Linia 178 (istniejące)
export interface UpdateFlashcardResponseDto extends FlashcardCoreDto {
  source_type: FlashcardSourceType;
}

// FlashcardCoreDto (linia 48):
export interface FlashcardCoreDto extends Pick<Flashcard, "front" | "back"> {
  id: FlashcardId;
}

// Więc UpdateFlashcardResponseDto = { id, front, back, source_type }
```

**ID Alias:**

```typescript
// Linia 41 (istniejące)
export type FlashcardId = Flashcard["flashcard_id"];
```

### Validation Schemas (lib/validation/flashcard-validation.ts - NOWE)

**Path Params Schema:**

```typescript
export const updateFlashcardParamsSchema = z.object({
  flashcard_id: z.string().uuid("ID fiszki musi być w formacie UUID"),
});
```

**Body Schema:**

```typescript
export const updateFlashcardBodySchema = z
  .object({
    front: z
      .string()
      .min(1, "Przód fiszki nie może być pusty")
      .max(300, "Przód fiszki może mieć maksymalnie 300 znaków")
      .optional(),
    back: z
      .string()
      .min(1, "Tył fiszki nie może być pusty")
      .max(600, "Tył fiszki może mieć maksymalnie 600 znaków")
      .optional(),
  })
  .refine((data) => data.front !== undefined || data.back !== undefined, {
    message: "Przynajmniej jedno pole (front lub back) musi być podane",
  });
```

## 4. Szczegóły odpowiedzi

### Success Response (200 OK)

**Status Code:** `200 OK`

**Body:**

```typescript
{
  "flashcard": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "front": "Updated front text",
    "back": "Updated back text",
    "source_type": "ai-edited"  // Zmienione z "ai" jeśli była edycja AI fiszki
  }
}
```

**Uwaga:** Odpowiedź zawiera pełny obiekt fiszki (nie tylko zmienione pola), ponieważ:

1. `source_type` może zostać zmutowany przez serwer
2. Frontend potrzebuje pełnych danych do aktualizacji local state

### Error Responses

| Status | Code                   | Komunikat                                                  | Scenariusz                                        |
| ------ | ---------------------- | ---------------------------------------------------------- | ------------------------------------------------- |
| 400    | `VALIDATION_ERROR`     | "ID fiszki musi być w formacie UUID"                       | Nieprawidłowy format UUID w path                  |
| 400    | `VALIDATION_ERROR`     | "Przynajmniej jedno pole (front lub back) musi być podane" | Pusty body lub brak obu pól                       |
| 400    | `VALIDATION_ERROR`     | "Przód fiszki nie może być pusty"                          | `front` jest pustym stringiem                     |
| 400    | `VALIDATION_ERROR`     | "Tył fiszki nie może być pusty"                            | `back` jest pustym stringiem                      |
| 400    | `VALIDATION_ERROR`     | "Przód fiszki może mieć maksymalnie 300 znaków"            | `front` > 300 znaków                              |
| 400    | `VALIDATION_ERROR`     | "Tył fiszki może mieć maksymalnie 600 znaków"              | `back` > 600 znaków                               |
| 401    | `AUTHENTICATION_ERROR` | "Musisz być zalogowany"                                    | Brak tokenu JWT lub nieprawidłowy token           |
| 404    | `NOT_FOUND_ERROR`      | "Nie znaleziono fiszki"                                    | Fiszka nie istnieje lub nie należy do użytkownika |
| 500    | -                      | "Nie udało się zaktualizować fiszki"                       | Błąd bazy danych lub nieoczekiwany błąd           |

**Format błędu:**

```typescript
{
  "status": 400,
  "message": "Przód fiszki może mieć maksymalnie 300 znaków",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "front",
    "errors": [...]
  }
}
```

## 5. Przepływ danych

### Diagram przepływu

```
1. Client → API Route Handler
   ↓
2. requireAuth() - weryfikacja JWT (użytkownik zalogowany?)
   ↓
3. Walidacja path params (flashcard_id jest UUID?)
   ↓
4. Parse request body (JSON)
   ↓
5. Walidacja body (front/back długość? przynajmniej jedno pole?)
   ↓
6. FlashcardService.update(flashcard_id, user_id, command)
   ↓
   a) Pobierz aktualną fiszkę (SELECT)
      - Sprawdź czy istnieje
      - Sprawdź czy należy do user_id (RLS + explicit)
   ↓
   b) Wykonaj UPDATE
      - Zaktualizuj front i/lub back
      - Zaktualizuj source_type (jeśli zmieniony)
      - Zwróć zaktualizowany wiersz
   ↓
7. Map database row → UpdateFlashcardResponseDto
   ↓
8. Return 200 OK z zaktualizowanym obiektem
```

### Interakcje z bazą danych

**Tabela:** `flashcards`

**Query 1 - SELECT (sprawdzenie właściciela i pobranie aktualnych danych):**

```sql
SELECT flashcard_id, user_id, front, back, source_type, created_at
FROM flashcards
WHERE flashcard_id = $1 AND user_id = $2
LIMIT 1;
```

**Query 2 - UPDATE:**

```sql
UPDATE flashcards
SET
  front = COALESCE($3, front),
  back = COALESCE($4, back),
  source_type = $5
WHERE flashcard_id = $1 AND user_id = $2
RETURNING flashcard_id, front, back, source_type;
```

**Parametry:**

- `$1`: flashcard_id
- `$2`: user_id
- `$3`: front
- `$4`: back
- `$5`: source_type

**Supabase SDK Equivalent:**

```typescript
// Query 1
const { data: existing, error: fetchError } = await supabase
  .from("flashcards")
  .select("flashcard_id, user_id, front, back, source_type, created_at")
  .eq("flashcard_id", id)
  .eq("user_id", userId)
  .single();

// Query 2
const updateData = {
  ...(data.front !== undefined && { front: data.front }),
  ...(data.back !== undefined && { back: data.back }),
  source_type: newSourceType,
};

const { data: updated, error: updateError } = await supabase
  .from("flashcards")
  .update(updateData)
  .eq("flashcard_id", id)
  .eq("user_id", userId)
  .select("flashcard_id, front, back, source_type")
  .single();
```

### Interakcje z zewnętrznymi serwisami

Brak (endpoint nie korzysta z OpenRouter ani innych zewnętrznych API)

## 6. Względy bezpieczeństwa

### 6.1 Uwierzytelnianie (Authentication)

- **Mechanizm:** Supabase GoTrue JWT w nagłówku `Authorization: Bearer <token>`
- **Implementacja:** Funkcja `requireAuth()` z `lib/api/auth-utils.ts`
- **Weryfikacja:**
  - `supabase.auth.getSession()` sprawdza ważność tokenu
  - Jeśli brak sesji lub token wygasł → 401 Unauthorized
- **Error handling:** `throw ApiErrors.Unauthorized` (ApiError instance)

### 6.2 Autoryzacja (Authorization)

**Problem:** IDOR - użytkownik może próbować edytować fiszki innych użytkowników przez manipulację `flashcard_id` w URL

**Mitigacje:**

1. **RLS Policies (PostgreSQL):**

   ```sql
   -- z db-plan.md, linie 77-79
   ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
   CREATE POLICY flashcards_owner_policy ON flashcards USING (user_id = auth.uid());
   ```

   - RLS automatycznie filtruje wiersze na poziomie bazy danych
   - Tylko wiersze gdzie `user_id === auth.uid()` są widoczne

2. **Explicit user_id check w query:**

   ```typescript
   .eq('flashcard_id', id)
   .eq('user_id', userId)  // Podwójna ochrona
   ```

   - Nawet jeśli RLS by nie działał, explicit check zapobiega IDOR

3. **404 zamiast 403:**
   - Gdy fiszka nie istnieje LUB nie należy do użytkownika → 404 Not Found
   - Zapobiega leakaniu informacji o istnieniu zasobów

### 6.3 Walidacja danych wejściowych

**Cel:** Zapobieganie atakom (SQL injection, mass assignment, data corruption)

**Walidacja na poziomie aplikacji (Zod):**

- Path param `flashcard_id`: UUID format
- Body `front`: 1-300 znaków, nie pusty string
- Body `back`: 1-600 znaków, nie pusty string
- Przynajmniej jedno z `front`/`back` musi być obecne

**Walidacja na poziomie bazy danych:**

```sql
-- z db-plan.md, linie 40-41
CHECK (char_length(front) BETWEEN 1 AND 300)
CHECK (char_length(back) BETWEEN 1 AND 600)
```

- Ostateczna linia obrony (defense in depth)

**Zapobieganie SQL Injection:**

- Supabase używa parametryzowanych queries (prepared statements)
- Dane użytkownika nigdy nie są interpolowane bezpośrednio do SQL

**Zapobieganie Mass Assignment:**

- Zod schema akceptuje tylko `front` i `back`
- Inne pola (np. `user_id`, `flashcard_id`, `created_at`) są ignorowane
- Service layer explicite buduje update object tylko z dozwolonych pól

### 6.4 Rate Limiting

**Status:** Nie zaimplementowany w MVP (zgodnie z CLAUDE.md - uproszczony zakres)

**Zalecenia na przyszłość:**

- Middleware limitujący liczbę update requestów (np. 100/minute per user)
- Rate limiting na poziomie Supabase (built-in feature)

### 6.5 HTTPS

- **Wymagane:** Wszystkie requesty muszą być przez HTTPS
- **Konfiguracja:** Na poziomie DigitalOcean/reverse proxy (poza kodem)

## 7. Obsługa błędów

### 7.1 Struktura obsługi błędów

```typescript
try {
  // 1. Authentication
  const user = await requireAuth(); // throws ApiError (401)

  // 2. Validation - path params
  const validationResult = updateFlashcardParamsSchema.safeParse(params);
  if (!validationResult.success) {
    throw new ValidationError(...); // 400
  }

  // 3. Validation - body
  const body = await request.json();
  const bodyResult = updateFlashcardBodySchema.safeParse(body);
  if (!bodyResult.success) {
    throw new ValidationError(...); // 400
  }

  // 4. Business logic
  const result = await flashcardService.update(...);
  // Service może throw NotFoundError (404) lub DatabaseError (500)

  // 5. Success
  return NextResponse.json({ flashcard: result }, { status: 200 });

} catch (error) {
  return handleError(error); // Centralized error handler
}
```

### 7.2 Katalog błędów

| Błąd                | Status | Code                   | User Message                                             | Log Level | Retry?                                  |
| ------------------- | ------ | ---------------------- | -------------------------------------------------------- | --------- | --------------------------------------- |
| Brak tokenu JWT     | 401    | `AUTHENTICATION_ERROR` | "Musisz być zalogowany"                                  | WARN      | ❌ Nie (user musi się zalogować)        |
| Nieprawidłowy UUID  | 400    | `VALIDATION_ERROR`     | "ID fiszki musi być w formacie UUID"                     | INFO      | ❌ Nie (client error)                   |
| Pusty body          | 400    | `VALIDATION_ERROR`     | "Przynajmniej jedno pole musi być podane"                | INFO      | ❌ Nie (client error)                   |
| `front` za długi    | 400    | `VALIDATION_ERROR`     | "Przód fiszki może mieć maksymalnie 300 znaków"          | INFO      | ❌ Nie (client error)                   |
| `back` za długi     | 400    | `VALIDATION_ERROR`     | "Tył fiszki może mieć maksymalnie 600 znaków"            | INFO      | ❌ Nie (client error)                   |
| Fiszka nie istnieje | 404    | `NOT_FOUND_ERROR`      | "Nie znaleziono fiszki"                                  | WARN      | ❌ Nie (resource deleted/never existed) |
| Błąd Supabase       | 500    | `DATABASE_ERROR`       | "Nie udało się zaktualizować fiszki"                     | ERROR     | ✅ Tak (transient error)                |
| Nieoczekiwany błąd  | 500    | -                      | "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później." | ERROR     | ✅ Tak (unknown issue)                  |

### 7.3 Logging Strategy

**Błędy 4xx (client errors):**

```typescript
// INFO level - nie logujemy stack trace
console.error(`[API] ${error.name}`, {
  message: error.message,
  code: error.code,
  details: error.details,
});
```

**Błędy 5xx (server errors):**

```typescript
// ERROR level - logujemy pełny kontekst
console.error("[API] Unexpected error", {
  error: error instanceof Error ? error.message : String(error),
  stack: error instanceof Error ? error.stack : undefined,
  context: {
    flashcard_id: id,
    user_id: userId,
    operation: "update",
  },
});
```

### 7.4 Error Handler Function

```typescript
function handleError(error: unknown): NextResponse<ErrorResponseDto> {
  // 1. Handle ApiError (from auth-utils) - 401
  if (error instanceof ApiError) {
    return NextResponse.json(
      { status: error.statusCode, message: error.message },
      { status: error.statusCode }
    );
  }

  // 2. Handle known application errors (ValidationError, NotFoundError, etc.)
  if (error instanceof AppError) {
    console.error(`[API] ${error.name}`, {
      message: error.message,
      code: error.code,
      details: error.details,
    });

    return NextResponse.json(
      {
        status: error.statusCode,
        message: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  // 3. Handle unknown errors (never expose internal details)
  console.error("[API] Unexpected error", {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

  return NextResponse.json(
    {
      status: 500,
      message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.",
    },
    { status: 500 }
  );
}
```

## 8. Rozważania dotyczące wydajności

### 8.1 Potencjalne wąskie gardła

**1. Dwa database roundtripy (SELECT + UPDATE):**

- **Problem:** Service wykonuje SELECT przed UPDATE aby sprawdzić `source_type`
- **Wpływ:** ~10-30ms dodatkowego latency (lokalnie), ~50-150ms (remote DB)
- **Czy to problem?** Nie dla MVP (< 100ms total roundtrip time)
- **Optymalizacja (future):** Conditional UPDATE z funkcją PL/pgSQL

**2. Brak connection pooling (potencjalnie):**

- **Problem:** Każdy request może tworzyć nowe połączenie do Supabase
- **Mitigacja:** Supabase SDK używa connection pooling out-of-the-box
- **Monitoring:** Obserwować `connection_count` w Supabase Dashboard

**3. Brak cachingu:**

- **Problem:** Każdy GET po UPDATE musi hit database
- **Wpływ:** Większe obciążenie DB przy wysokim traffic
- **Czy to problem?** Nie dla MVP (zakładany < 100 users)
- **Optymalizacja (future):** Redis cache dla często czytanych fiszek

### 8.2 Indeksy bazodanowe

**Istniejące indeksy (z db-plan.md, linia 65):**

```sql
CREATE INDEX idx_flashcards_user_id_created_at ON flashcards (user_id, created_at);
```

**Query pattern w UPDATE:**

```sql
WHERE flashcard_id = $1 AND user_id = $2
```

**Ocena:**

- ✅ `flashcard_id` jest PRIMARY KEY → index już istnieje
- ✅ Query używa PK lookup → O(log n) time
- ⚠️ `user_id` jest w composite index ale z `created_at` (nie używamy `created_at` w WHERE)
- **Wniosek:** Dla UPDATE query, PK index jest wystarczający (optimal)

**Potencjalna optymalizacja (future, jeśli problemy z performance):**

```sql
CREATE INDEX idx_flashcards_flashcard_id_user_id ON flashcards (flashcard_id, user_id);
```

- Ale to prawdopodobnie overkill, ponieważ PK index jest już bardzo szybki

### 8.3 Strategie optymalizacji

#### Immediate (MVP)

1. **Użyj `.single()` w Supabase queries**

   ```typescript
   .select('...').single() // Zamiast .select('...').limit(1)
   ```

   - Rzuca błąd jeśli 0 lub >1 wierszy (deterministyczny)
   - Mniejszy overhead (SDK nie parsuje array)

2. **Select tylko potrzebne kolumny**
   ```typescript
   .select('flashcard_id, front, back, source_type') // Bez created_at w UPDATE
   ```

   - Mniejsze data transfer

#### Future (post-MVP)

1. **Conditional UPDATE z PL/pgSQL function:**

   ```sql
   CREATE FUNCTION update_flashcard_with_ai_check(
     p_flashcard_id UUID,
     p_user_id UUID,
     p_front TEXT,
     p_back TEXT
   ) RETURNS TABLE (...) AS $$
   BEGIN
     UPDATE flashcards
     SET
       front = COALESCE(p_front, front),
       back = COALESCE(p_back, back),
       source_type = CASE
         WHEN source_type = 'ai' THEN 'ai-edited'
         ELSE source_type
       END
     WHERE flashcard_id = p_flashcard_id AND user_id = p_user_id
     RETURNING *;
   END;
   $$ LANGUAGE plpgsql;
   ```

   - Eliminuje SELECT query (single roundtrip)
   - ~30-50% reduction w latency

2. **Batch updates (jeśli potrzebne):**
   - Obecnie API wspiera tylko single update
   - Jeśli UI potrzebuje bulk edit → nowy endpoint `PATCH /api/flashcards/bulk`

### 8.4 Monitoring metryki

**Co monitorować (post-MVP):**

- Average response time (target: < 200ms)
- P95/P99 latency
- Error rate (target: < 1%)
- Database connection pool utilization
- Query execution time (Supabase Dashboard)

## 9. Etapy wdrożenia

### Faza 1: Validation Layer (lib/validation/flashcard-validation.ts)

**Zadanie 1.1:** Dodać schema walidacji dla path params

```typescript
/**
 * Schema for PUT /api/flashcards/{flashcard_id} path parameter
 *
 * Validates flashcard_id from URL path
 * Requirements:
 * - Must be a valid UUID format
 */
export const updateFlashcardParamsSchema = z.object({
  flashcard_id: z.string().uuid("ID fiszki musi być w formacie UUID"),
});
```

**Zadanie 1.2:** Dodać schema walidacji dla request body

```typescript
/**
 * Schema for PUT /api/flashcards/{flashcard_id} request body
 *
 * Validates UpdateFlashcardCommand DTO
 * Requirements:
 * - front: optional, 1-300 chars
 * - back: optional, 1-600 chars
 * - At least one field must be present
 */
export const updateFlashcardBodySchema = z
  .object({
    front: z
      .string()
      .min(1, "Przód fiszki nie może być pusty")
      .max(300, "Przód fiszki może mieć maksymalnie 300 znaków")
      .optional(),
    back: z
      .string()
      .min(1, "Tył fiszki nie może być pusty")
      .max(600, "Tył fiszki może mieć maksymalnie 600 znaków")
      .optional(),
  })
  .refine((data) => data.front !== undefined || data.back !== undefined, {
    message: "Przynajmniej jedno pole (front lub back) musi być podane",
  });
```

**Test coverage:**

- ✅ Valid UUID → pass
- ❌ Invalid UUID → error
- ✅ Only `front` → pass
- ✅ Only `back` → pass
- ✅ Both fields → pass
- ❌ Empty body → error
- ❌ `front` too long (301 chars) → error
- ❌ `back` too long (601 chars) → error
- ❌ Empty strings → error

### Faza 2: Service Layer (lib/services/flashcard-service.server.ts)

**Zadanie 2.1:** Dodać metodę `update()` do klasy `FlashcardService`

```typescript
/**
 * Updates a flashcard (front and/or back)
 *
 * Flow:
 * 1. Fetch existing flashcard to get current source_type
 * 2. Check if flashcard exists and belongs to user
 * 3. Determine new source_type:
 *    - If current is 'ai' → change to 'ai-edited'
 *    - Otherwise keep unchanged
 * 4. Execute UPDATE with new data
 * 5. Return updated flashcard
 *
 * Security:
 * - RLS policies enforce user_id isolation
 * - Explicit .eq('user_id', userId) prevents IDOR attacks
 * - Returns 404 (not 403) to avoid leaking resource existence
 *
 * @param id - Flashcard ID to update
 * @param userId - Authenticated user ID
 * @param data - Update command (front and/or back)
 * @returns Updated flashcard with possibly changed source_type
 * @throws NotFoundError if flashcard doesn't exist or doesn't belong to user
 * @throws Error if database operation fails
 */
async update(
  id: FlashcardId,
  userId: string,
  data: UpdateFlashcardCommand
): Promise<UpdateFlashcardResponseDto> {
  // 1. Fetch existing flashcard to get current source_type
  const { data: existing, error: fetchError } = await this.supabase
    .from("flashcards")
    .select("flashcard_id, source_type")
    .eq("flashcard_id", id)
    .eq("user_id", userId)
    .single();

  if (fetchError || !existing) {
    if (fetchError) {
      console.error("[FlashcardService] Failed to fetch flashcard", {
        flashcard_id: id,
        userId,
        error: fetchError.message,
        errorDetails: fetchError,
        errorCode: fetchError.code,
        errorHint: fetchError.hint,
      });
    }
    throw new NotFoundError("Nie znaleziono fiszki");
  }

  // 2. Determine new source_type
  const newSourceType =
    existing.source_type === "ai" ? "ai-edited" : existing.source_type;

  // 3. Build update object (only include provided fields)
  const updateData = {
    ...(data.front !== undefined && { front: data.front }),
    ...(data.back !== undefined && { back: data.back }),
    source_type: newSourceType,
  };

  // 4. Execute UPDATE
  const { data: updated, error: updateError } = await this.supabase
    .from("flashcards")
    .update(updateData)
    .eq("flashcard_id", id)
    .eq("user_id", userId)
    .select("flashcard_id, front, back, source_type")
    .single();

  if (updateError || !updated) {
    console.error("[FlashcardService] Failed to update flashcard", {
      flashcard_id: id,
      userId,
      updateData,
      error: updateError?.message,
      errorDetails: updateError,
      errorCode: updateError?.code,
      errorHint: updateError?.hint,
    });
    throw new Error("Nie udało się zaktualizować fiszki");
  }

  // 5. Map to DTO
  return {
    id: updated.flashcard_id,
    front: updated.front,
    back: updated.back,
    source_type: updated.source_type,
  };
}
```

**Zadanie 2.2:** Dodać eksport `updateFlashcardParamsSchema` i `updateFlashcardBodySchema` w `lib/validation/flashcard-validation.ts`

**Test coverage:**

- ✅ Update `front` only → success, source_type unchanged (if manual)
- ✅ Update `back` only → success
- ✅ Update both → success
- ✅ Update AI flashcard → source_type changes to 'ai-edited'
- ✅ Update 'ai-edited' flashcard → source_type stays 'ai-edited'
- ✅ Update manual flashcard → source_type stays 'manual'
- ❌ Flashcard doesn't exist → NotFoundError
- ❌ Flashcard belongs to different user → NotFoundError (RLS + explicit check)
- ❌ Database error → throws Error with Polish message

### Faza 3: API Route Handler (app/api/flashcards/[flashcard_id]/route.ts)

**Zadanie 3.1:** Dodać funkcję `PUT` do istniejącego pliku

**Struktura:**

```typescript
/**
 * PUT /api/flashcards/{flashcard_id}
 *
 * Updates a single flashcard (front and/or back)
 * Automatically changes source_type from 'ai' to 'ai-edited' when editing AI flashcard
 *
 * Request:
 * - Path params: flashcard_id (UUID)
 * - Body: { front?: string, back?: string }
 * - Headers: Authorization: Bearer <Supabase JWT>
 *
 * Response:
 * - 200: { flashcard: UpdateFlashcardResponseDto }
 * - 400: Validation error (invalid UUID, missing fields, length)
 * - 401: Authentication error
 * - 404: Flashcard not found or doesn't belong to user
 * - 500: Server error
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ flashcard_id: string }> }
): Promise<NextResponse> {
  try {
    // 1. Authentication - require valid user session
    const user = await requireAuth();

    // 2. Initialize Supabase client
    const supabase = await createClient();

    // 3. Await and validate path parameter
    const resolvedParams = await params;
    const paramsResult = updateFlashcardParamsSchema.safeParse(resolvedParams);

    if (!paramsResult.success) {
      const firstError = paramsResult.error.issues[0];
      throw new ValidationError(firstError.message, {
        field: firstError.path.join("."),
        errors: paramsResult.error.issues,
      });
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const bodyResult = updateFlashcardBodySchema.safeParse(body);

    if (!bodyResult.success) {
      const firstError = bodyResult.error.issues[0];
      throw new ValidationError(firstError.message, {
        field: firstError.path.join("."),
        errors: bodyResult.error.issues,
      });
    }

    // 5. Initialize service with dependencies
    const flashcardService = new FlashcardService(supabase);

    // 6. Execute update
    const result = await flashcardService.update(
      paramsResult.data.flashcard_id,
      user.id,
      bodyResult.data
    );

    // 7. Return 200 OK with updated flashcard
    return NextResponse.json({ flashcard: result }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}
```

**Zadanie 3.2:** Dodać import schematów walidacji

```typescript
import {
  // ... existing imports
  updateFlashcardParamsSchema,
  updateFlashcardBodySchema,
} from "@/lib/validation/flashcard-validation";
```

**Test coverage:**

- ✅ Valid request → 200 OK with updated flashcard
- ❌ No JWT → 401 Unauthorized
- ❌ Invalid JWT → 401 Unauthorized
- ❌ Invalid UUID → 400 Validation Error
- ❌ Empty body → 400 Validation Error
- ❌ Missing both fields → 400 Validation Error
- ❌ Front too long → 400 Validation Error
- ❌ Back too long → 400 Validation Error
- ❌ Empty strings → 400 Validation Error
- ❌ Flashcard not found → 404 Not Found
- ❌ Flashcard belongs to other user → 404 Not Found
- ❌ Database error → 500 Internal Server Error

### Faza 4: Integration Testing

**Zadanie 4.1:** Testy jednostkowe (Vitest)

**File:** `lib/services/flashcard-service.server.test.ts`

Test scenarios:

1. ✅ Update only front - success
2. ✅ Update only back - success
3. ✅ Update both fields - success
4. ✅ Update AI flashcard - source_type changes to 'ai-edited'
5. ✅ Update 'ai-edited' flashcard - source_type stays 'ai-edited'
6. ✅ Update manual flashcard - source_type stays 'manual'
7. ❌ Flashcard not found - throws NotFoundError
8. ❌ Flashcard belongs to other user - throws NotFoundError
9. ❌ Database error - throws Error

**Mock strategy:**

- Mock Supabase client with MSW (Mock Service Worker)
- Test only business logic (nie full DB roundtrip)

**Zadanie 4.2:** Testy E2E (Playwright)

**File:** `e2e/flashcards/update-flashcard.spec.ts`

Test scenarios:

1. ✅ User can edit flashcard front
2. ✅ User can edit flashcard back
3. ✅ User can edit both fields
4. ✅ Editing AI flashcard shows 'AI-edited' badge
5. ❌ Cannot edit flashcard without auth (redirect to login)
6. ❌ Cannot edit flashcard with invalid UUID (404 page)
7. ❌ Cannot edit another user's flashcard (404 page)
8. ✅ Cancel edit reverts changes
9. ✅ Front/back character counter shows remaining chars

**Setup:**

- Seed database z test flashcards
- Authenticated user context
- Test z real Supabase (local Docker instance)

### Faza 5: Dokumentacja

**Zadanie 5.1:** Dodać endpoint do API dokumentacji

**File:** `.ai/api-plan.md`

Update sekcję 2.6 aby odzwierciedlić aktualną implementację:

- Zmienić `PUT` → `PATCH` jeśli używamy PATCH (zalecane dla partial update)
- Potwierdzić wszystkie kody błędów
- Dodać przykłady curl requests

**Zadanie 5.2:** Update CHANGELOG

**File:** `CHANGELOG.md` (jeśli istnieje)

```markdown
## [Unreleased]

### Added

- PUT /api/flashcards/{flashcard_id} endpoint for updating flashcards
- Automatic source_type transition from 'ai' to 'ai-edited' when editing AI flashcards
- Validation schemas for flashcard update operations
```

### Faza 6: Manual Testing & Review

**Zadanie 6.1:** Manual testing checklist

- [ ] Test w Postman/Insomnia z różnymi payload
- [ ] Test UI w developerskim środowisku
- [ ] Test z real Supabase database (local Docker)
- [ ] Test z production-like data (seeded flashcards)
- [ ] Test error scenarios (network timeout, DB disconnect)
- [ ] Verify logging output (console.error messages)

**Zadanie 6.2:** Code review checklist

- [ ] Czy walidacja Zod jest kompletna?
- [ ] Czy obsługa błędów jest spójna z innymi endpointami?
- [ ] Czy service layer jest testowalny (dependency injection)?
- [ ] Czy kody statusu HTTP są poprawne?
- [ ] Czy komunikaty błędów są user-friendly (po polsku)?
- [ ] Czy security best practices są spełnione (IDOR, RLS)?
- [ ] Czy logging nie leakuje sensitive data?
- [ ] Czy TypeScript types są poprawne (brak `any`)?

### Faza 7: Deployment

**Zadanie 7.1:** Pre-deployment checks

- [ ] Wszystkie testy przechodzą (unit + E2E)
- [ ] Linting (`npm run lint`) - no errors
- [ ] Type checking (`npx tsc --noEmit`) - no errors
- [ ] Build (`npm run build`) - success
- [ ] Environment variables skonfigurowane na production

**Zadanie 7.2:** Deployment process

1. Merge PR do `main` branch
2. GitHub Actions CI/CD pipeline uruchamia się automatycznie
3. Pipeline wykonuje:
   - Linting
   - Type checking
   - Tests
   - Build
   - Docker image build & push (jeśli main branch)
4. Deploy na DigitalOcean (manual trigger lub auto-deploy)

**Zadanie 7.3:** Post-deployment monitoring

- [ ] Sprawdzić logi aplikacji (błędy w pierwszych 15 minutach?)
- [ ] Test smoke test na production (happy path)
- [ ] Monitorować Supabase Dashboard (query performance, errors)
- [ ] Sprawdzić czy RLS policies działają (test z różnymi userami)

---

## 10. Checklist końcowy

### Pre-implementation

- [ ] Przeczytano i zrozumiano API spec
- [ ] Przeczytano db-plan.md (tabele, relacje, constraints)
- [ ] Przeczytano tech-stack.md i implementation rules
- [ ] Przeczytano istniejący kod (DELETE endpoint jako wzór)
- [ ] Sprawdzono istniejące DTOs i validation schemas

### Implementation

- [ ] Faza 1: Validation schemas (lib/validation/flashcard-validation.ts)
- [ ] Faza 2: Service layer method (lib/services/flashcard-service.server.ts)
- [ ] Faza 3: API route handler (app/api/flashcards/[flashcard_id]/route.ts)
- [ ] Faza 4: Unit tests (Vitest)
- [ ] Faza 4: E2E tests (Playwright)
- [ ] Faza 5: Dokumentacja (api-plan.md, CHANGELOG.md)

### Testing

- [ ] Unit tests pass (lib/services/flashcard-service.server.test.ts)
- [ ] E2E tests pass (e2e/flashcards/update-flashcard.spec.ts)
- [ ] Manual testing w Postman/Insomnia
- [ ] Manual testing w UI (local dev environment)
- [ ] Security testing (IDOR, invalid tokens, etc.)

### Quality assurance

- [ ] Code review completed
- [ ] No linting errors (`npm run lint`)
- [ ] No type errors (`npx tsc --noEmit`)
- [ ] Build successful (`npm run build`)
- [ ] Test coverage ≥ 80% (if tracking)

### Deployment

- [ ] PR merged to main
- [ ] CI/CD pipeline success
- [ ] Deployed to production
- [ ] Smoke test na production
- [ ] Monitoring first 24h (no critical errors)

---

## Załączniki

### A. Przykład request/response (happy path)

**Request:**

```http
PUT /api/flashcards/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "front": "What is React?",
  "back": "A JavaScript library for building user interfaces"
}
```

**Response:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "flashcard": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "front": "What is React?",
    "back": "A JavaScript library for building user interfaces",
    "source_type": "ai-edited"
  }
}
```

### B. Przykład error response

**Request (invalid UUID):**

```http
PUT /api/flashcards/not-a-uuid HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "front": "Updated text"
}
```

**Response:**

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "status": 400,
  "message": "ID fiszki musi być w formacie UUID",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "flashcard_id",
    "errors": [
      {
        "code": "invalid_string",
        "message": "ID fiszki musi być w formacie UUID",
        "path": ["flashcard_id"],
        "validation": "uuid"
      }
    ]
  }
}
```

### C. Database schema reference

```sql
-- flashcards table (relevant columns)
CREATE TABLE flashcards (
  flashcard_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  flashcard_source_id UUID NOT NULL,
  source_type flashcard_source_type NOT NULL,
  front TEXT NOT NULL CHECK (char_length(front) BETWEEN 1 AND 300),
  back TEXT NOT NULL CHECK (char_length(back) BETWEEN 1 AND 600),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- flashcard_source_type enum
CREATE TYPE flashcard_source_type AS ENUM ('manual', 'ai', 'ai-edited');

-- RLS policies
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY flashcards_owner_policy ON flashcards USING (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_flashcards_user_id_created_at ON flashcards (user_id, created_at);
```

### D. Zależności między plikami

```
app/api/flashcards/[flashcard_id]/route.ts (PUT handler)
  ↓ uses
lib/validation/flashcard-validation.ts (schemas: updateFlashcardParamsSchema, updateFlashcardBodySchema)
  ↓ validates
lib/dto/types.ts (UpdateFlashcardCommand, UpdateFlashcardResponseDto)
  ↓ uses
lib/services/flashcard-service.server.ts (FlashcardService.update method)
  ↓ uses
lib/db/supabase.server.ts (createClient)
  ↓ connects to
Supabase PostgreSQL (flashcards table with RLS)
```

---

**Plan wygenerowany:** 2025-11-10
**Wersja dokumentu:** 1.0
**Status:** Ready for implementation
