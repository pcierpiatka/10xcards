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
