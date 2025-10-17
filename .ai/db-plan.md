1. Lista tabel z kolumnami, typami danych i ograniczeniami
   - `flashcard_source_type` (enum)
     - Wartości: `'manual'`, `'ai', 'ai-edited'`.

   - `ai_generations`

     | Kolumna               | Typ           | Ograniczenia / Uwagi                                                                                                                   |
     | --------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
     | `id`                  | `UUID`        | `PRIMARY KEY DEFAULT gen_random_uuid()`                                                                                                |
     | `user_id`             | `UUID`        | `NOT NULL`, `REFERENCES auth.users (id) ON DELETE CASCADE`                                                                             |
     | `input_text`          | `TEXT`        | `NOT NULL`, `CHECK (char_length(input_text) BETWEEN 1000 AND 10000)`                                                                   |
     | `model_name`          | `TEXT`        | `NOT NULL`                                                                                                                             |
     | `generated_proposals` | `JSONB`       | `NOT NULL`, `CHECK (jsonb_typeof(generated_proposals) = 'array')`, `CHECK (jsonb_array_length(generated_proposals) = generated_count)` |
     | `generated_count`     | `INTEGER`     | `NOT NULL`, `CHECK (generated_count >= 0)`                                                                                             |
     | `duration_ms`         | `INTEGER`     | `CHECK (duration_ms IS NULL OR duration_ms >= 0)`                                                                                      |
     | `created_at`          | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()`                                                                                                               |

     Dodatkowe ograniczenia: `UNIQUE (id, user_id)` dla powiązań złożonych.

   - `flashcard_sources`

     | Kolumna               | Typ                     | Ograniczenia / Uwagi                                       |
     | --------------------- | ----------------------- | ---------------------------------------------------------- |
     | `flashcard_source_id` | `UUID`                  | `PRIMARY KEY DEFAULT gen_random_uuid()`                    |
     | `user_id`             | `UUID`                  | `NOT NULL`, `REFERENCES auth.users (id) ON DELETE CASCADE` |
     | `source_type`         | `flashcard_source_type` | `NOT NULL`                                                 |
     | `source_id`           | `UUID`                  | `REFERENCES ai_generations (id) ON DELETE CASCADE`         |
     | `created_at`          | `TIMESTAMPTZ`           | `NOT NULL DEFAULT now()`                                   |

     Ograniczenia dodatkowe: `UNIQUE (flashcard_source_id, user_id)`; `CHECK ((source_type = 'manual' AND source_id IS NULL) OR (source_type = 'ai' AND source_id IS NOT NULL))`.

   - `flashcards`

     | Kolumna               | Typ                     | Ograniczenia / Uwagi                                                                                                                   |
     | --------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
     | `flashcard_id`        | `UUID`                  | `PRIMARY KEY DEFAULT gen_random_uuid()`                                                                                                |
     | `user_id`             | `UUID`                  | `NOT NULL`, `REFERENCES auth.users (id) ON DELETE CASCADE`                                                                             |
     | `flashcard_source_id` | `UUID`                  | `NOT NULL`, `FOREIGN KEY (flashcard_source_id, user_id) REFERENCES flashcard_sources (flashcard_source_id, user_id) ON DELETE CASCADE` |
     | `source_type`         | `flashcard_source_type` | `NOT NULL`                                                                                                                             |
     | `front`               | `TEXT`                  | `NOT NULL`, `CHECK (char_length(front) BETWEEN 1 AND 300)`                                                                             |
     | `back`                | `TEXT`                  | `NOT NULL`, `CHECK (char_length(back) BETWEEN 1 AND 600)`                                                                              |
     | `created_at`          | `TIMESTAMPTZ`           | `NOT NULL DEFAULT now()`                                                                                                               |

   - `ai_generations_acceptance`

     | Kolumna            | Typ           | Ograniczenia / Uwagi                                                                                               |
     | ------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------ |
     | `ai_generation_id` | `UUID`        | `PRIMARY KEY`, `FOREIGN KEY (ai_generation_id, user_id) REFERENCES ai_generations (id, user_id) ON DELETE CASCADE` |
     | `user_id`          | `UUID`        | `NOT NULL`, `REFERENCES auth.users (id) ON DELETE CASCADE`                                                         |
     | `accepted_count`   | `INTEGER`     | `NOT NULL`, `CHECK (accepted_count >= 0)`                                                                          |
     | `created_at`       | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()`                                                                                           |

2. Relacje między tabelami
   - `auth.users (1)` — `(N) ai_generations` (FK `user_id`, `ON DELETE CASCADE`).
   - `auth.users (1)` — `(N) flashcard_sources` (FK `user_id`, `ON DELETE CASCADE`).
   - `auth.users (1)` — `(N) flashcards` (FK `user_id`, `ON DELETE CASCADE`).
   - `auth.users (1)` — `(N) ai_generations_acceptance` (FK `user_id`, `ON DELETE CASCADE`).
   - `ai_generations (1)` — `(N) flashcard_sources` dla `source_type = 'ai'` (FK `source_id`, `ON DELETE CASCADE`).
   - `flashcard_sources (1)` — `(N) flashcards` (FK `flashcard_source_id`, `ON DELETE CASCADE`).
   - `ai_generations (1)` — `(1) ai_generations_acceptance` (unikalne powiązanie przez `ai_generation_id`).

3. Indeksy
   - `CREATE INDEX idx_ai_generations_user_id_created_at ON ai_generations (user_id, created_at);`
   - `CREATE INDEX idx_flashcard_sources_user_id_created_at ON flashcard_sources (user_id, created_at);`
   - `CREATE INDEX idx_flashcards_user_id_created_at ON flashcards (user_id, created_at);`
   - `CREATE INDEX idx_ai_generations_acceptance_user_id_created_at ON ai_generations_acceptance (user_id, created_at);`

4. Zasady PostgreSQL (RLS)
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

5. Dodatkowe uwagi
   - Wymagane jest rozszerzenie `pgcrypto` (dla `gen_random_uuid()`).
   - `generated_proposals` przechowuje tablicę obiektów `{ "front": "...", "back": "..." }`; dodatkowa walidacja struktury może zostać zaimplementowana przy użyciu `jsonb_schema` lub funkcji PL/pgSQL w przyszłości.
   - Logika aplikacyjna powinna gwarantować zgodność `accepted_count` z `ai_generations.generated_count`; ewentualne rozszerzenia mogą dodać wyzwalacz weryfikujący zgodność.
   - Tabela `flashcards` nie ma triggera `updated_at` w migracji - do rozważenia dodanie w przyszłości jeśli będzie potrzebne.
