Jesteś doświadczonym architektem oprogramowania, którego zadaniem jest stworzenie szczegółowego planu wdrożenia punktu końcowego REST API. Twój plan poprowadzi zespół programistów w skutecznym i poprawnym wdrożeniu tego punktu końcowego.

Zanim zaczniemy, zapoznaj się z poniższymi informacjami:

1. Route API specification:
   <route_api_specification>
   # REST API Plan

## 1. Resources

- `ai_generations` — table: `ai_generations`
- `ai_generation_acceptances` — table: `ai_generations_acceptance`
- `flashcard_sources` — table: `flashcard_sources` (`source_type` enum values: `manual`, `ai`, `ai-edited`)
- `flashcards` — table: `flashcards`
- `study_sessions` — virtual resource built on `flashcards`
- `users` — table: `auth.users` (managed by Supabase Auth)

## 2. Endpoints

### 2.1 `POST /api/ai/generations`

- **Description:** Generate flashcard proposals with AI and persist the complete `ai_generations` record.
- **Headers:** `Authorization: Bearer <Supabase JWT>`
- **Request JSON:**

```json
{
  "input_text": "string, 1000-10000 chars"
}
```

- **Processing Notes:**
  - Validate `input_text` length.
  - Invoke OpenRouter (`gpt-4o-mini` default) and capture latency for `duration_ms`.
  - Normalize AI output: ensure each proposal has `front` ≤300 chars, `back` ≤600 chars.
  - Store full row in `ai_generations`.
- **Response 201 JSON:**

```json
{
  "generation_id": "string",
  "proposals": [
    {
      "front": "string <=300",
      "back": "string <=600"
    }
  ]
}
```

- **Errors:**
  - `400` — invalid `input_text` length, malformed AI output.
  - `401` — unauthorized.
  - `429` — AI generation quota exceeded.
  - `500` — upstream AI failure (user-friendly message per `US-007`).

### 2.2 `POST /api/ai/generations/accept`

- **Description:** Accept selected AI proposals, create `flashcard_sources` (`source_type='ai'`), persist `flashcards`, and store acceptance metrics.
- **Headers:** `Authorization: Bearer <Supabase JWT>`
- **Request JSON:**

```json
{
  "generation_id": "string",
  "proposals": [
    {
      "front": "string <=300",
      "back": "string <=600"
    }
  ]
}
```

- **Processing Notes:**
  - Fetch `ai_generations` by `generation_id` (validate ownership via RLS).
  - Compute `accepted_count = proposals.length`, `rejected_count = generated_count - accepted_count` (must be ≥0).
  - Insert `flashcard_sources` row with full column set, `source_type='ai'`, `source_id = generation.id`.
  - Insert accepted `proposals` into `flashcards` referencing the new `flashcard_sources.id`.
  - Insert into `ai_generations_acceptance` (`accepted_count`, `rejected_count`, `finalized_at`).
- **Response 204 JSON:**
- **Errors:**
  - `400` — empty `proposals`, validation failure, count mismatch.
  - `404` — generation not found or not owned by user.
  - `409` — acceptance already recorded for this generation.
  - `401` — unauthorized.

### 2.3 `POST /api/flashcards`

- **Description:** Create a manual flashcard and corresponding `flashcard_sources` entry (`source_type='manual'`).
- **Headers:** `Authorization: Bearer <Supabase JWT>`
- **Request JSON:**

```json
{
  "front": "string <=300",
  "back": "string <=600"
}
```

- **Processing Notes:**
  - Validate lengths.
  - Insert new `flashcard`
  - Insert new `flashcard_sources` row with `source_type='manual'` and `source_id = null`.
  - Insert flashcard record referencing the new source.
- **Response 201 JSON:**

```json
{
  "flashcard": {
    "id": "uuid",
    "front": "string",
    "back": "string",
    "flashcard_source_id": "string",
    "source_type": "manual",
    "created_at": "ISO-8601 timestamp"
  }
}
```

- **Errors:** `400`, `401`.

### 2.4 `GET /api/flashcards`

- **Description:** Paginated list of flashcards with filtering and sorting.
- **Headers:** `Authorization: Bearer <Supabase JWT>`
- **Query Params:** `page` (default 1), `page_size` (default 20, max 100), `sort` (e.g., `created_at_desc`), `source_type` (`manual`, `ai`, `ai-edited`).
- **Response 200 JSON:**

```json
{
  "data": [
    {
      "id": "uuid",
      "front": "string",
      "back": "string",
      "flashcard_source": {
        "id": "string",
        "source_type": "ai-edited",
        "created_at": "ISO-8601 timestamp"
      },
      "created_at": "ISO-8601 timestamp",
      "updated_at": "ISO-8601 timestamp"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_pages": 5,
    "total_items": 87
  }
}
```

- **Errors:** `401`.

### 2.5 `GET /api/flashcards/{flashcard_id}`

- **Description:** Retrieve a specific flashcard and its source metadata.
- **Headers:** `Authorization: Bearer <Supabase JWT>`
- **Response 200 JSON:**

```json
{
  "flashcard": {
    "id": "uuid",
    "front": "string",
    "back": "string",
    "flashcard_source": {
      "id": "string",
      "source_type": "ai"
    },
    "created_at": "ISO-8601 timestamp",
    "updated_at": "ISO-8601 timestamp"
  }
}
```

- **Errors:** `404`, `401`.

### 2.6 `PATCH /api/flashcards/{flashcard_id}`

- **Description:** Update one or both sides of a flashcard; flips `source_type` to `ai-edited` if editing an AI card.
- **Headers:** `Authorization: Bearer <Supabase JWT>`
- **Request JSON:**

```json
{
  "front": "optional string <=300",
  "back": "optional string <=600"
}
```

- **Processing Notes:** Validate lengths; update `updated_at`; if original `source_type='ai'` and changes were made, update source record to `ai-edited`.
- **Response 200 JSON:**

```json
{
  "flashcard": {
    "id": "uuid",
    "front": "updated",
    "back": "updated",
    "flashcard_source": {
      "id": "string",
      "source_type": "ai-edited"
    },
    "updated_at": "ISO-8601 timestamp"
  }
}
```

- **Errors:** `400`, `404`, `401`.

### 2.7 `DELETE /api/flashcards/{flashcard_id}`

- **Description:** Delete a flashcard after user confirmation.
- **Headers:** `Authorization: Bearer <Supabase JWT>`
- **Response:** `204 No Content`
- **Errors:** `404`, `401`.

### 2.8 `DELETE /api/flashcards`

- **Description:** Bulk delete flashcards by IDs (future-ready).
- **Headers:** `Authorization: Bearer <Supabase JWT>`
- **Request JSON:**

```json
{
  "ids": ["uuid", "uuid"]
}
```

- **Response:** `204 No Content`
- **Errors:** `400`, `401`.

### 2.9 `GET /api/flashcard-sources`

- **Description:** List flashcard sources for analytics or filters.
- **Headers:** `Authorization: Bearer <Supabase JWT>`
- **Query Params:** `source_type`, `limit`, `cursor`.
- **Response 200 JSON:**

```json
{
  "data": [
    {
      "id": "string",
      "source_type": "ai-edited",
      "source_id": "string-or-null",
      "created_at": "ISO-8601 timestamp"
    }
  ],
  "next_cursor": "opaque-or-null"
}
```

- **Errors:** `401`.

### 2.10 `GET /api/flashcard-sources/{source_id}`

- **Description:** Retrieve source details with associated cards.
- **Headers:** `Authorization: Bearer <Supabase JWT>`
- **Response 200 JSON:**

```json
{
  "source": {
    "id": "string",
    "source_type": "ai",
    "source_id": "string",
    "created_at": "ISO-8601 timestamp",
    "flashcards": [
      {
        "id": "uuid",
        "front": "string",
        "back": "string"
      }
    ]
  }
}
```

- **Errors:** `404`, `401`.

### 2.11 `GET /api/study/flashcards`

- **Description:** Provide randomized flashcards for study sessions.
- **Headers:** `Authorization: Bearer <Supabase JWT>`
- **Query Params:** `limit` (default all, max 200), `exclude_ids`, `shuffle` (default `true`).
- **Response 200 JSON:**

```json
{
  "cards": [
    {
      "id": "uuid",
      "front": "string",
      "back": "string",
      "source_type": "manual"
    }
  ],
  "total_available": 87
}
```

- **Errors:** `401`.

### 2.12 `POST /api/study/summary`

- **Description:** Optional analytics hook for study session completion.
- **Headers:** `Authorization: Bearer <Supabase JWT>`
- **Request JSON:**

```json
{
  "cards_seen": 20,
  "cards_total": 20,
  "duration_seconds": 600
}
```

- **Response:** `202 Accepted`
- **Errors:** `401`.

### 2.13 `DELETE /api/users/me`

- **Description:** Delete current user account and cascade all data.
- **Headers:** `Authorization: Bearer <Supabase JWT>`
- **Request JSON (optional re-auth):**

```json
{
  "password": "string"
}
```

- **Response:** `204 No Content`
- **Errors:** `401`, `403`, `500`.

### 2.14 Supabase Auth Endpoints

Consumed directly by the frontend:

- `POST /auth/v1/signup` — user registration.
- `POST /auth/v1/token?grant_type=password` — user login.
- `POST /auth/v1/logout` — session termination.

## 3. Authentication and Authorization

- **Mechanism:** Supabase GoTrue JWT. Next.js API routes validate tokens using Supabase server client.
- **Authorization:** PostgreSQL RLS policies enforce `user_id = auth.uid()` across tables.
- **Rate Limiting:** Middleware-based throttling (e.g., 60 AI generations/hour per user) returning `429` with `Retry-After`.
- **Transport:** HTTPS-only; configure CORS for trusted origins.
- **Secrets:** Store OpenRouter API key securely on server.

## 4. Validation and Business Logic

### 4.1 `ai_generations`

- Enforce 1000–10000 character `input_text`.
- Normalize AI output before persisting: ensure proposals array structure and lengths.
- Persist `generated_count`, `duration_ms`, and other columns per schema.
- No `flashcard_sources` creation at this stage.

### 4.2 `ai_generations_acceptance`

- One acceptance per generation (`UNIQUE (ai_generation_id)`).
- `accepted_count = proposals.length`.
- `rejected_count = generated_count - accepted_count` (must be ≥0, ≤10).
- `accepted_count + rejected_count > 0`.
- `finalized_at` defaults to `now()` if omitted.

### 4.3 `flashcard_sources`

- Automatically created in:
  - `POST /api/ai/generations/acceptance` with `source_type='ai'`.
  - `POST /api/flashcards` with `source_type='manual'`.
  - `PATCH /api/flashcards/{id}` may update existing source to `ai-edited`.
- Ensure ownership (`user_id`) matches requester.

### 4.4 `flashcards`

- `front`: 1–300 chars; `back`: 1–600 chars.
- Reference valid `flashcard_source_id`; `FOREIGN KEY (flashcard_source_id, user_id)` enforced.
- Update operations refresh `updated_at` via trigger.

### 4.5 Study Mode

- Random selection through `GET /api/study/flashcards`; limit large `ORDER BY RANDOM()` usage by capping `limit` and considering deterministic randomization for big datasets.
- Return `total_available` for completion messaging (`US-015`).

### 4.6 Error Handling

- User-friendly messages for AI failures (`US-007`).
- Granular validation errors (“Front must be between 1 and 300 characters.”).

### 4.7 Metrics

- Acceptance endpoint records `accepted_count`/`rejected_count` enabling PRD KPIs.
- `flashcard_sources.source_type` differentiates manual, AI, and AI-edited cards.

### 4.8 Account Deletion

- Require re-authentication (password or OTP) before calling `DELETE /api/users/me`.
- Use Supabase Admin API; cascading FKs remove dependent records.

  </route_api_specification>

2. Related database resources:
   <related_db_resources>
   1. Lista tabel z kolumnami, typami danych i ograniczeniami
   - `flashcard_source_type` (enum)
     - Wartości: `'manual'`, `'ai'`.

   - `ai_generations`

     | Kolumna               | Typ           | Ograniczenia / Uwagi                                                                                                                   |
     | --------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
     | `id`                  | `BIGSERIAL`   | `PRIMARY KEY`                                                                                                                          |
     | `user_id`             | `UUID`        | `NOT NULL`, `REFERENCES auth.users (id) ON DELETE CASCADE`                                                                             |
     | `input_text`          | `TEXT`        | `NOT NULL`, `CHECK (char_length(input_text) BETWEEN 1000 AND 10000)`                                                                   |
     | `model_name`          | `TEXT`        | `NOT NULL`                                                                                                                             |
     | `generated_proposals` | `JSONB`       | `NOT NULL`, `CHECK (jsonb_typeof(generated_proposals) = 'array')`, `CHECK (jsonb_array_length(generated_proposals) = generated_count)` |
     | `generated_count`     | `SMALLINT`    | `NOT NULL`, `CHECK (generated_count BETWEEN 0 AND 10)`                                                                                 |
     | `duration_ms`         | `INTEGER`     | `CHECK (duration_ms IS NULL OR duration_ms >= 0)`                                                                                      |
     | `created_at`          | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()`                                                                                                               |

     Dodatkowe ograniczenia: `UNIQUE (id, user_id)` dla powiązań złożonych.

   - `flashcard_sources`

     | Kolumna       | Typ                     | Ograniczenia / Uwagi                                       |
     | ------------- | ----------------------- | ---------------------------------------------------------- |
     | `id`          | `BIGSERIAL`             | `PRIMARY KEY`                                              |
     | `user_id`     | `UUID`                  | `NOT NULL`, `REFERENCES auth.users (id) ON DELETE CASCADE` |
     | `source_type` | `flashcard_source_type` | `NOT NULL`                                                 |
     | `source_id`   | `BIGINT`                | `REFERENCES ai_generations (id) ON DELETE CASCADE`         |
     | `created_at`  | `TIMESTAMPTZ`           | `NOT NULL DEFAULT now()`                                   |

     Ograniczenia dodatkowe: `UNIQUE (id, user_id)`; `CHECK ((source_type = 'manual' AND source_id IS NULL) OR (source_type = 'ai' AND source_id IS NOT NULL))`.

   - `flashcards`

     | Kolumna               | Typ           | Ograniczenia / Uwagi                                                                                                                                                         |
     | --------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
     | `id`                  | `UUID`        | `PRIMARY KEY DEFAULT gen_random_uuid()`                                                                                                                                      |
     | `user_id`             | `UUID`        | `NOT NULL`, `REFERENCES auth.users (id) ON DELETE CASCADE`                                                                                                                   |
     | `flashcard_source_id` | `BIGINT`      | `NOT NULL`, `REFERENCES flashcard_sources (id) ON DELETE CASCADE`, `FOREIGN KEY (flashcard_source_id, user_id) REFERENCES flashcard_sources (id, user_id) ON DELETE CASCADE` |
     | `front`               | `TEXT`        | `NOT NULL`, `CHECK (char_length(front) BETWEEN 1 AND 300)`                                                                                                                   |
     | `back`                | `TEXT`        | `NOT NULL`, `CHECK (char_length(back) BETWEEN 1 AND 600)`                                                                                                                    |
     | `created_at`          | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()`                                                                                                                                                     |
     | `updated_at`          | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` (aktualizowane triggerem `BEFORE UPDATE`)                                                                                                           |

   - `ai_generations_acceptance`

     | Kolumna            | Typ           | Ograniczenia / Uwagi                                                                                                      |
     | ------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------- |
     | `id`               | `BIGSERIAL`   | `PRIMARY KEY`                                                                                                             |
     | `ai_generation_id` | `BIGINT`      | `NOT NULL`, `UNIQUE`, `FOREIGN KEY (ai_generation_id, user_id) REFERENCES ai_generations (id, user_id) ON DELETE CASCADE` |
     | `user_id`          | `UUID`        | `NOT NULL`, `REFERENCES auth.users (id) ON DELETE CASCADE`                                                                |
     | `accepted_count`   | `SMALLINT`    | `NOT NULL`, `CHECK (accepted_count BETWEEN 0 AND 10)`                                                                     |
     | `rejected_count`   | `SMALLINT`    | `NOT NULL`, `CHECK (rejected_count BETWEEN 0 AND 10)`                                                                     |
     | `finalized_at`     | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()`                                                                                                  |

     Dodatkowe ograniczenia: `CHECK (accepted_count + rejected_count > 0)`.

3. Relacje między tabelami
   - `auth.users (1)` — `(N) ai_generations` (FK `user_id`, `ON DELETE CASCADE`).
   - `auth.users (1)` — `(N) flashcard_sources` (FK `user_id`, `ON DELETE CASCADE`).
   - `auth.users (1)` — `(N) flashcards` (FK `user_id`, `ON DELETE CASCADE`).
   - `auth.users (1)` — `(N) ai_generations_acceptance` (FK `user_id`, `ON DELETE CASCADE`).
   - `ai_generations (1)` — `(N) flashcard_sources` dla `source_type = 'ai'` (FK `source_id`, `ON DELETE CASCADE`).
   - `flashcard_sources (1)` — `(N) flashcards` (FK `flashcard_source_id`, `ON DELETE CASCADE`).
   - `ai_generations (1)` — `(1) ai_generations_acceptance` (unikalne powiązanie przez `ai_generation_id`).

4. Indeksy
   - `CREATE INDEX idx_ai_generations_user_created ON ai_generations (user_id, created_at DESC);`
   - `CREATE INDEX idx_flashcard_sources_user_created ON flashcard_sources (user_id, created_at DESC);`
   - `CREATE INDEX idx_flashcards_user_created ON flashcards (user_id, created_at DESC);`
   - `CREATE INDEX idx_ai_generations_acceptance_user_created ON ai_generations_acceptance (user_id, finalized_at DESC);`

5. Zasady PostgreSQL (RLS)
   - `ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;`
     - `CREATE POLICY ai_generations_owner_policy ON ai_generations USING (user_id = auth.uid());`
     - `CREATE POLICY ai_generations_owner_insert ON ai_generations FOR INSERT WITH CHECK (user_id = auth.uid());`

   - `ALTER TABLE flashcard_sources ENABLE ROW LEVEL SECURITY;`
     - `CREATE POLICY flashcard_sources_owner_policy ON flashcard_sources USING (user_id = auth.uid());`
     - `CREATE POLICY flashcard_sources_owner_insert ON flashcard_sources FOR INSERT WITH CHECK (user_id = auth.uid());`

   - `ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;`
     - `CREATE POLICY flashcards_owner_policy ON flashcards USING (user_id = auth.uid());`
     - `CREATE POLICY flashcards_owner_insert ON flashcards FOR INSERT WITH CHECK (user_id = auth.uid());`

   - `ALTER TABLE ai_generations_acceptance ENABLE ROW LEVEL SECURITY;`
     - `CREATE POLICY ai_generations_acceptance_owner_policy ON ai_generations_acceptance USING (user_id = auth.uid());`
     - `CREATE POLICY ai_generations_acceptance_owner_insert ON ai_generations_acceptance FOR INSERT WITH CHECK (user_id = auth.uid());`

6. Dodatkowe uwagi
   - Wymagane jest rozszerzenie `pgcrypto` (dla `gen_random_uuid()`).
   - Trigger `SET updated_at = now()` na `flashcards` zapewnia automatyczną aktualizację znacznika czasu.
   - `generated_proposals` przechowuje tablicę obiektów `{ "front": "...", "back": "..." }`; dodatkowa walidacja struktury może zostać zaimplementowana przy użyciu `jsonb_schema` lub funkcji PL/pgSQL w przyszłości.
   - Logika aplikacyjna powinna gwarantować zgodność `accepted_count + rejected_count` z `ai_generations.generated_count`; ewentualne rozszerzenia mogą dodać wyzwalacz weryfikujący zgodność.

   </related_db_resources>

7. Definicje typów:
   <type_definitions>
   /\*\*

- DTO (Data Transfer Object) type definitions for MVP
-
- This file uses a hybrid approach combining:
- - Type-safe ID aliases and DRY composition (from typesV2)
- - Minimal fields based on UI needs (from rubber duck analysis)
- - Flat structures where MVP doesn't need nesting
-
- Design principles:
- - Type safety: Use branded ID types to prevent mixing different entity IDs
- - DRY: Core shapes composed via extends, single source of truth
- - KISS: Flat structures for MVP, no unnecessary nesting
- - YAGNI: Only fields actually used by UI
- - Information Hiding: Don't expose internal DB structure without reason
-
- See: .claude/thinking/gumowa-kaczka-dto-simplification.md
  \*/

import type {
AiGeneration,
AiFlashcardProposal,
Flashcard,
FlashcardSource,
FlashcardSourceType,
} from "@/lib/db/database.types";

// ============================================================================
// BASE TYPES & ALIASES
// ============================================================================

/\*\*

- Type-safe ID aliases prevent accidentally mixing different entity IDs.
- Example: function deleteFlashcard(id: FlashcardId) won't accept AiGenerationId
  \*/
  export type AiGenerationId = AiGeneration["id"];
  export type FlashcardId = Flashcard["flashcard_id"];
  export type FlashcardSourceId = FlashcardSource["flashcard_source_id"];

/\*\*

- Core flashcard shape - reused across all flashcard DTOs.
- Derived from database entity to maintain single source of truth.
  \*/
  export interface FlashcardCoreDto extends Pick<Flashcard, "front" | "back"> {
  id: FlashcardId;
  }

/\*\*

- Canonical AI proposal structure used across generation flows.
  \*/
  export type AiProposalDto = Pick<AiFlashcardProposal, "front" | "back">;

// ============================================================================
// 1. AI GENERATION
// ============================================================================

/\*\*

- Command: POST /api/ai/generations
- UI: AI Generation Form → Generate button
- Derived from: AiGeneration (input_text only)
  \*/
  export type CreateAiGenerationCommand = Pick<AiGeneration, "input_text">;

/\*\*

- Response: POST /api/ai/generations (201)
- UI: Display checkbox list of proposals to accept
  \*/
  export interface AiGenerationResponseDto {
  generation_id: AiGenerationId;
  proposals: AiProposalDto[];
  }

/\*\*

- Command: POST /api/ai/generations/accept
- UI: Accept selected proposals → create flashcards → redirect to list
  \*/
  export interface AcceptAiGenerationCommand {
  generation_id: AiGenerationId;
  proposals: AiProposalDto[];
  }

// Response: 204 No Content

// ============================================================================
// 2. FLASHCARD CRUD
// ============================================================================

/\*\*

- Command: POST /api/flashcards
- UI: Manual flashcard creation form
- Derived from: Flashcard (front, back only)
  \*/
  export type CreateManualFlashcardCommand = Pick<Flashcard, "front" | "back">;

/\*\*

- Response: POST /api/flashcards (201)
- UI: Add created flashcard to local state (instant feedback, no refetch)
-
- Minimal fields based on rubber duck analysis:
- - id: Required for subsequent edit/delete
- - front, back: Display in list
- - source_type: Display badge ("Manual")
-
- Removed (see rubber duck doc):
- - flashcard_source_id: Internal DB field, no UI use case in MVP
- - created_at: Not displayed for fresh items ("just now" is implicit)
    \*/
    export interface CreateManualFlashcardResponseDto extends FlashcardCoreDto {
    source_type: FlashcardSourceType;
    }

/\*\*

- Query: GET /api/flashcards
- UI: Flashcard list with pagination and filters
  \*/
  export interface FlashcardListQuery {
  page?: number; // default: 1
  page_size?: number; // default: 20, max: 100
  sort?: "created_at_asc" | "created_at_desc"; // default: created_at_desc
  source_type?: FlashcardSourceType;
  }

/\*\*

- Single flashcard item in list
- UI: Displayed in flashcard list with edit/delete buttons
-
- Flat structure based on rubber duck analysis:
- - source_type: Top-level (not nested) - needed for badge only
- - created_at: For sorting and "added X days ago"
-
- Removed (see rubber duck doc):
- - flashcard_source (nested object): No "view source" feature in MVP
- - flashcard_source_id: Internal field with no UI use case
- - updated_at: Not displayed in list view
    \*/
    export interface FlashcardListItemDto extends FlashcardCoreDto {
    source_type: FlashcardSourceType;
    created_at: string; // ISO-8601
    }

/\*\*

- Response: GET /api/flashcards (200)
  \*/
  export interface FlashcardListResponseDto {
  data: FlashcardListItemDto[];
  pagination: PaginationDto;
  }

/\*\*

- Response: GET /api/flashcards/{id} (200)
- UI: Before editing flashcard (pre-populate form)
-
- Note: Same shape as list item. Additional fields (like updated_at)
- not needed in edit form for MVP.
  \*/
  export interface FlashcardDetailResponseDto {
  flashcard: FlashcardListItemDto;
  }

/\*\*

- Command: PATCH /api/flashcards/{id}
- UI: Edit flashcard modal/form
- Derived from: Flashcard (front, back optional for partial update)
  \*/
  export type UpdateFlashcardCommand = Partial<Pick<Flashcard, "front" | "back">>;

/\*\*

- Response: PATCH /api/flashcards/{id} (200)
- UI: Update local state with new values
-
- Returns 200 (not 204) because server may mutate source_type:
- - If original source_type = "ai" AND user edits → changes to "ai-edited"
- - Frontend needs to know this change to update badge
    \*/
    export interface UpdateFlashcardResponseDto extends FlashcardCoreDto {
    source_type: FlashcardSourceType;
    }

// DELETE /api/flashcards/{id} → 204 No Content

/\*\*

- Command: DELETE /api/flashcards (bulk)
- UI: Multi-select + "Delete selected" button
  \*/
  export interface BulkDeleteFlashcardsCommand {
  ids: FlashcardId[];
  }

// Response: 204 No Content

// ============================================================================
// 3. FLASHCARD SOURCES
// ============================================================================

/\*\*

- Query: GET /api/flashcard-sources
- UI: Analytics or source filtering (future feature)
  \*/
  export interface FlashcardSourceListQuery {
  source_type?: FlashcardSourceType;
  limit?: number;
  cursor?: string;
  }

/\*\*

- Single flashcard source item
- Derived from: FlashcardSource (all fields, no simplification needed)
  \*/
  export interface FlashcardSourceListItemDto {
  id: FlashcardSourceId;
  source_type: FlashcardSourceType;
  source_id: string | null; // AI generation ID or null for manual
  created_at: string;
  }

/\*\*

- Response: GET /api/flashcard-sources (200)
  \*/
  export interface FlashcardSourceListResponseDto {
  data: FlashcardSourceListItemDto[];
  next_cursor: string | null;
  }

/\*\*

- Response: GET /api/flashcard-sources/{id} (200)
- UI: View all flashcards from a specific source
  \*/
  export interface FlashcardSourceDetailResponseDto {
  source: {
  id: FlashcardSourceId;
  source_type: FlashcardSourceType;
  source_id: string | null;
  created_at: string;
  flashcards: FlashcardCoreDto[]; // Minimal: just id, front, back
  };
  }

// ============================================================================
// 4. STUDY MODE
// ============================================================================

/\*\*

- Query: GET /api/study/flashcards
- UI: Study mode - flip cards front/back
  \*/
  export interface StudyFlashcardsQuery {
  limit?: number; // default: all, max: 200
  exclude_ids?: FlashcardId[];
  shuffle?: boolean; // default: true
  }

/\*\*

- Single card in study session
- UI: Display in flip card interface
-
- Minimal fields based on rubber duck analysis:
- - id: Track seen cards for exclude_ids
- - front, back: Display in flip card
-
- Removed (see rubber duck doc):
- - source_type: No badge shown during study (would be distracting)
- - created_at: Not relevant in study mode
    \*/
    export type StudyCardDto = FlashcardCoreDto;

/\*\*

- Response: GET /api/study/flashcards (200)
- UI: Study session with progress counter "Card X of Y"
  \*/
  export interface StudyFlashcardsResponseDto {
  cards: StudyCardDto[];
  total_available: number; // For progress display
  }

/\*\*

- Command: POST /api/study/summary
- UI: Log study session completion (optional analytics)
  \*/
  export interface SubmitStudySummaryCommand {
  cards_seen: number;
  cards_total: number;
  duration_seconds: number;
  }

// Response: 202 Accepted

// ============================================================================
// 5. USER MANAGEMENT
// ============================================================================

/\*\*

- Command: DELETE /api/users/me
- UI: Account deletion with optional password re-auth
  \*/
  export interface DeleteUserCommand {
  password?: string;
  }

// Response: 204 No Content

// ============================================================================
// 6. SHARED/UTILITY
// ============================================================================

/\*\*

- Pagination metadata for list responses
  \*/
  export interface PaginationDto {
  page: number;
  page_size: number;
  total_pages: number;
  total_items: number;
  }

/\*\*

- Standard error response format
- Used across all endpoints for consistent error handling
  \*/
  export interface ErrorResponseDto {
  status: number;
  message: string; // User-friendly message
  code?: string; // Optional error code for client handling
  details?: unknown; // Optional additional context
  }

/\*\*

- Rate limit error (429)
- Extends standard error with retry information
  \*/
  export interface RateLimitErrorResponseDto extends ErrorResponseDto {
  status: 429;
  retry_after: number; // Unix timestamp when rate limit resets
  }

  </type_definitions>

3. Tech stack:
   <tech_stack>
   Frontend - Next.js z React:

- Next.js 15 zapewnia szybkie, wydajne aplikacje z Server-Side Rendering i App Router
- React 19 zapewnia interaktywność i nowoczesne funkcjonalności
- TypeScript 5 dla statycznego typowania kodu i lepszego wsparcia IDE
- Tailwind 4 pozwala na wygodne stylowanie aplikacji
- Shadcn/ui zapewnia bibliotekę dostępnych komponentów React, na których oprzemy UI

Backend - Supabase jako kompleksowe rozwiązanie backendowe:

- Zapewnia bazę danych PostgreSQL
- Zapewnia SDK w wielu językach, które posłużą jako Backend-as-a-Service
- Jest rozwiązaniem open source, które można hostować lokalnie lub na własnym serwerze
- Posiada wbudowaną autentykację użytkowników

AI - Komunikacja z modelami przez usługę Openrouter.ai:

- Dostęp do szerokiej gamy modeli (OpenAI, Anthropic, Google i wiele innych), które pozwolą nam znaleźć rozwiązanie zapewniające wysoką efektywność i niskie koszta
- Pozwala na ustawianie limitów finansowych na klucze API

CI/CD i Hosting:

- Github Actions do tworzenia pipeline’ów CI/CD
- DigitalOcean do hostowania aplikacji za pośrednictwem obrazu docker

  </tech_stack>

4. Implementation rules:
   <implementation_rules>
   # Next.js Backend Rules

**Applies to:** `app/api/**/*.ts`, `lib/services/**/*.ts`, `lib/integrations/**/*.ts`

## API Routes

- File must be named `route.ts` in `app/api/[resource]/` directory
- Export named functions: `GET`, `POST`, `PATCH`, `DELETE`
- Return `NextResponse.json(data, { status })`

## Authentication

- Use `createRouteHandlerClient` from `@supabase/auth-helpers-nextjs`
- Call `supabase.auth.getUser()` to verify JWT
- Return 401 for unauthorized requests

## Validation

- Use Zod schemas from `lib/validation/`
- Use `.safeParse()` (not `.parse()`)
- Return 400 for validation errors

## Services

- Create services in `lib/services/` as classes
- Constructor accepts `SupabaseClient<Database>`
- Methods: `async method(userId: string, input: CommandDto): Promise<ResponseDto>`
- Services handle business logic, not route handlers

## Authorization

- Use Supabase RLS policies (single source of truth)
- Don't implement authorization in app code
- Return 404 (not 403) for unauthorized access

## Error Handling

- Create custom error classes in `lib/errors/`
- Catch and transform errors in route handlers
- Never expose internal errors to users
- Log errors with context: `console.error("[Service] Failed", { context })`

## External APIs

- Create clients in `lib/integrations/` as classes
- Implement timeouts (default 30s)
- Use `AbortController` for cancellation

# Core Rules

**Always applies**

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript 5 (strict mode)
- Tailwind CSS 4
- shadcn/ui
- Supabase (PostgreSQL + Auth)
- Zod (validation)
- OpenRouter (AI)

## Project Structure

When introducing changes, follow this structure:

- `app/` - Next.js App Router
- `app/api/[resource]/` - API routes (route.ts)
- `app/layout.tsx` - Root layout
- `app/page.tsx` - Pages
- `components/` - React components
- `components/ui/` - shadcn/ui components
- `lib/` - Business logic and utilities
- `lib/db/database.types.ts` - Generated Supabase types
- `lib/dto/types.ts` - API DTOs (Request/Response)
- `lib/services/` - Service layer (business logic)
- `lib/integrations/` - External API clients
- `lib/validation/` - Zod schemas
- `lib/errors/` - Custom error classes
- `.ai/` - Documentation (PRD, API plan, tech stack)
- `.claude/thinking/` - Design analysis sessions

When modifying structure, update this section.

## File Naming

- API routes: `route.ts` (Next.js convention)
- Components: `PascalCase.tsx` (e.g., `UserProfile.tsx`)
- Services: `kebab-case-service.ts` (e.g., `flashcard-service.ts`)
- Utilities: `kebab-case.ts`
- Types: `types.ts`

## Import Aliases

Always use `@/` for imports:

```typescript
import { Button } from "@/components/ui/button";
import type { FlashcardId } from "@/lib/dto/types";
import { FlashcardService } from "@/lib/services/flashcard-service";
```

## Coding Practices

- Use linter feedback to improve code
- Handle errors at the beginning of functions
- Use early returns for error conditions
- Avoid unnecessary else statements (if-return pattern)
- Use guard clauses for preconditions
- Explicit return types on all functions
- Use `import type { ... }` for type-only imports

  </implementation_rules>

Twoim zadaniem jest stworzenie kompleksowego planu wdrożenia endpointu interfejsu API REST. Przed dostarczeniem ostatecznego planu użyj znaczników <analysis>, aby przeanalizować informacje i nakreślić swoje podejście. W tej analizie upewnij się, że:

1. Podsumuj kluczowe punkty specyfikacji API.
2. Wymień wymagane i opcjonalne parametry ze specyfikacji API.
3. Wymień niezbędne typy DTO i Command Modele.
4. Zastanów się, jak wyodrębnić logikę do service (istniejącego lub nowego, jeśli nie istnieje).
5. Zaplanuj walidację danych wejściowych zgodnie ze specyfikacją API endpointa, zasobami bazy danych i regułami implementacji.
6. Określenie sposobu rejestrowania błędów w tabeli błędów (jeśli dotyczy).
7. Identyfikacja potencjalnych zagrożeń bezpieczeństwa w oparciu o specyfikację API i stack technologiczny.
8. Nakreśl potencjalne scenariusze błędów i odpowiadające im kody stanu.

Po przeprowadzeniu analizy utwórz szczegółowy plan wdrożenia w formacie markdown. Plan powinien zawierać następujące sekcje:

1. Przegląd punktu końcowego
2. Szczegóły żądania
3. Szczegóły odpowiedzi
4. Przepływ danych
5. Względy bezpieczeństwa
6. Obsługa błędów
7. Wydajność
8. Kroki implementacji

W całym planie upewnij się, że

- Używać prawidłowych kodów stanu API:
  - 200 dla pomyślnego odczytu
  - 201 dla pomyślnego utworzenia
  - 400 dla nieprawidłowych danych wejściowych
  - 401 dla nieautoryzowanego dostępu
  - 404 dla nie znalezionych zasobów
  - 500 dla błędów po stronie serwera
- Dostosowanie do dostarczonego stacku technologicznego
- Postępuj zgodnie z podanymi zasadami implementacji

Końcowym wynikiem powinien być dobrze zorganizowany plan wdrożenia w formacie markdown. Oto przykład tego, jak powinny wyglądać dane wyjściowe:

``markdown

# API Endpoint Implementation Plan: [Nazwa punktu końcowego]

## 1. Przegląd punktu końcowego

[Krótki opis celu i funkcjonalności punktu końcowego]

## 2. Szczegóły żądania

- Metoda HTTP: [GET/POST/PUT/DELETE]
- Struktura URL: [wzorzec URL]
- Parametry:
  - Wymagane: [Lista wymaganych parametrów]
  - Opcjonalne: [Lista opcjonalnych parametrów]
- Request Body: [Struktura treści żądania, jeśli dotyczy]

## 3. Wykorzystywane typy

[DTOs i Command Modele niezbędne do implementacji]

## 3. Szczegóły odpowiedzi

[Oczekiwana struktura odpowiedzi i kody statusu]

## 4. Przepływ danych

[Opis przepływu danych, w tym interakcji z zewnętrznymi usługami lub bazami danych]

## 5. Względy bezpieczeństwa

[Szczegóły uwierzytelniania, autoryzacji i walidacji danych]

## 6. Obsługa błędów

[Lista potencjalnych błędów i sposób ich obsługi]

## 7. Rozważania dotyczące wydajności

[Potencjalne wąskie gardła i strategie optymalizacji]

## 8. Etapy wdrożenia

1. [Krok 1]
2. [Krok 2]
3. [Krok 3]
   ...

```

Końcowe wyniki powinny składać się wyłącznie z planu wdrożenia w formacie markdown i nie powinny powielać ani powtarzać żadnej pracy wykonanej w sekcji analizy.

Pamiętaj, aby zapisać swój plan wdrożenia jako .ai/view-implementation-plan.md. Upewnij się, że plan jest szczegółowy, przejrzysty i zapewnia kompleksowe wskazówki dla zespołu programistów.
```
