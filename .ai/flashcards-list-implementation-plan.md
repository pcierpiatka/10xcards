# API Endpoint Implementation Plan: GET /api/ai/flashcards

## 1. Przegląd punktu końcowego

Endpoint zwraca listę wygenerowanych przez AI propozycji fiszek wraz z metadanymi generacji i informacją o akceptacji. Dane pochodzą z tabel `ai_generations`, `ai_generations_acceptance`, `flashcard_sources` oraz `flashcards`. Celem jest umożliwienie UI prezentacji historii generacji AI oraz stanu (zaakceptowane, odrzucone/pending) poszczególnych propozycji.

## 2. Szczegóły żądania

- Metoda HTTP: `GET`
- Struktura URL: `/api/ai/flashcards`
- Parametry zapytania:
  - Wymagane: brak
  - Opcjonalne:
    - `page` — liczba całkowita ≥1, domyślnie `1`
    - `page_size` — liczba całkowita w zakresie [1, 50], domyślnie `20`
    - `sort` — enum (`"created_at_desc"` domyślnie, `"created_at_asc"`)
    - `status` — enum (`"all"`, `"pending"`, `"accepted"`), domyślnie `"all"`
    - `generation_id` — identyfikator BIGINT w formie string; filtruje do jednej generacji użytkownika
- Nagłówki:
  - `Authorization: Bearer <Supabase JWT>` (wymagane)
- Body: brak

## 3. Wykorzystywane typy

Do zaktualizowania/utworzenia w `@/lib/dto/types`:

- `export interface AiFlashcardListQuery { page?: number; page_size?: number; sort?: "created_at_asc" | "created_at_desc"; status?: "all" | "pending" | "accepted"; generation_id?: string; }`
- `export interface AiFlashcardProposalStateDto extends AiProposalDto { proposal_index: number; state: "pending" | "accepted"; flashcard_id: FlashcardId | null; }`
- `export interface AiFlashcardListItemDto { generation_id: AiGenerationId; created_at: string; duration_ms: number | null; model_name: string; generated_count: number; accepted_count: number; rejected_count: number; proposals: AiFlashcardProposalStateDto[]; }`
- `export interface AiFlashcardListResponseDto { data: AiFlashcardListItemDto[]; pagination: PaginationDto; }`

Command modele nie są potrzebne (tylko operacja odczytu). Reużywamy `PaginationDto`, `AiProposalDto`, `AiGenerationId`, `FlashcardId`.

## 4. Szczegóły odpowiedzi

- Status sukcesu: `200 OK`
- Treść JSON (`AiFlashcardListResponseDto`):

```json
{
  "data": [
    {
      "generation_id": "123",
      "created_at": "2024-06-01T12:00:00Z",
      "duration_ms": 8500,
      "model_name": "gpt-4o-mini",
      "generated_count": 5,
      "accepted_count": 3,
      "rejected_count": 2,
      "proposals": [
        {
          "proposal_index": 0,
          "front": "Question?",
          "back": "Answer.",
          "state": "accepted",
          "flashcard_id": "uuid-or-null"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_pages": 3,
    "total_items": 45
  }
}
```

- Kody statusu błędów:
  - `400 Bad Request` — błędne parametry zapytania
  - `401 Unauthorized` — brak poprawnego JWT
  - `404 Not Found` — `generation_id` nie istnieje lub nie należy do użytkownika
  - `500 Internal Server Error` — nieoczekiwany błąd serwera

## 5. Przepływ danych

1. Route handler (`app/api/ai/flashcards/route.ts`, funkcja `GET`) tworzy klienta Supabase (`createRouteHandlerClient`) i uwierzytelnia użytkownika.
2. Parametry zapytania są walidowane Zod-em (`AiFlashcardListQuerySchema` w `@/lib/validation/ai-flashcards`).
3. Handler instancjonuje `AiFlashcardService` (np. `@/lib/services/ai-flashcard-service`), przekazując klienta Supabase.
4. `AiFlashcardService.listAiFlashcards`:
   - Buduje bazowe zapytanie do `ai_generations` filtrowane po `user_id`.
   - Stosuje filtry (`generation_id`, `status` – bazując na obecności wpisu w `ai_generations_acceptance`).
   - Paginuje (limit/offset) i sortuje.
   - Dołącza (`left join`) `ai_generations_acceptance` dla metryk akceptacji.
   - Pobiera powiązane `flashcard_sources` (`source_type='ai'`) i `flashcards` dla danej generacji (po `flashcard_sources.source_id = ai_generations.id`).
   - Mapuje `generated_proposals` (JSON) z pozycji `proposal_index` i ustala `state` na `"accepted"` dla propozycji, które mają odpowiadającą fiszkę; pozostałe `"pending"`.
5. Service zwraca `AiFlashcardListResponseDto`.
6. Route handler zwraca `NextResponse.json(dto, { status: 200 })`.
7. Wszystkie operacje polegać będą na istniejącym RLS — brak dodatkowych ograniczeń w kodzie.

## 6. Względy bezpieczeństwa

- Uwierzytelnienie: Supabase JWT sprawdzane poprzez `supabase.auth.getUser()`. Brak użytkownika ⇒ 401.
- Autoryzacja: relying na RLS (`user_id = auth.uid()`), zapytania zawsze ograniczają się do bieżącego użytkownika.
- Walidacja wejścia: Zod gwarantuje typy i zakresy parametrów, zapobiega SQL injection (Supabase query builder).
- Ochrona danych: Response nie powinien ujawniać danych innych użytkowników (zapewnia RLS).
- Rate limiting: opcjonalnie dodać w przyszłości middleware, ale obecnie brak specyficznego limitu dla GET.
- Dane wrażliwe: w odpowiedzi tylko konieczne informacje (bez `input_text` oryginalnego promptu, jeśli niepotrzebne; rozważyć pominięcie, aby zminimalizować wycieki).

## 7. Obsługa błędów

- Walidacja Zod → w przypadku `!success` zwracamy `400` z `ErrorResponseDto` (np. `"message": "Invalid query parameters"` z `details`).
- Brak użytkownika (`getUser()` zwraca null) → `NextResponse.json({ message: "Unauthorized" }, { status: 401 })`.
- Gdy `generation_id` podany, ale nie ma wyniku → `404` z komunikatem `"Generation not found"`.
- Supabase error (np. problemy DB) → log przez `console.error("[AiFlashcardService] listAiFlashcards failed", { userId, query, error })`, zwrócić `500` z przyjazną wiadomością (`"message": "Failed to load AI flashcards."`).
- Nie ujawniamy szczegółów błędów w odpowiedzi.

## 8. Rozważania dotyczące wydajności

- Pagination (limit/offset) – ograniczenie `page_size` do 50. Dodatkowo sortowanie po `created_at DESC` korzysta z indeksu `idx_ai_generations_user_created`.
- Redukcja liczby zapytań: jedno główne zapytanie do `ai_generations`, następnie jedno pomocnicze do `flashcards` z `WHERE source_id IN (...)` (użyć `in` i `select` w Supabase).
- JSON `generated_proposals` – mapowanie w kodzie (unikanie wielu round-trips).
- Przy dużej historii generacji monitorować koszt transferu (możliwe w przyszłości kursory).
- Opcjonalnie wprowadzić caching na warstwie CDN (ale dane per użytkownik, więc raczej SSR no-store).
- Brak kosztownych `ORDER BY RANDOM()`.

## 9. Etapy wdrożenia

1. **DTO & typy**
   - Dodać nowe interfejsy (`AiFlashcardListQuery`, `AiFlashcardProposalStateDto`, `AiFlashcardListItemDto`, `AiFlashcardListResponseDto`) do `@/lib/dto/types`.
2. **Walidacja**
   - Utworzyć `@/lib/validation/ai-flashcards.ts` z `AiFlashcardListQuerySchema` (Zod), eksportować helper `parseAiFlashcardListQuery(searchParams: URLSearchParams)`.
3. **Serwis**
   - Dodać `@/lib/services/ai-flashcard-service.ts` z klasą `AiFlashcardService`.
   - Metoda `constructor(client: SupabaseClient<Database>)`. Sprawdzic czy SupabaseClient pochdzi z @/lib/db/supabase.server
   - Metoda `async listAiFlashcards(userId: string, query: AiFlashcardListQuery): Promise<AiFlashcardListResponseDto>`.
   - Zaimplementować zapytania Supabase:
     - Pobranie generacji z paginacją i sortowaniem.
     - Pobranie akceptacji (`ai_generations_acceptance`).
     - Pobranie fiszek (`flashcards` dołączonych przez `flashcard_sources`).
     - Mapowanie do DTO (w tym `state`).
4. **Route handler**
   - Utworzyć `app/api/ai/flashcards/route.ts`.
   - Implementacja `export async function GET(request: NextRequest)`:
     - Inicjalizacja Supabase clienta.
     - Autoryzacja użytkownika.
     - Parsowanie zapytania (użycie walidatora).
     - Wywołanie serwisu.
     - Obsługa błędów za pomocą `try/catch`, translacja do `ErrorResponseDto`.
5. **Obsługa błędów**
   - W razie potrzeby dodać nowe klasy błędów (np. `InvalidQueryError`, `NotFoundError`) w `@/lib/errors`.
   - Route handler tłumaczy je na odpowiednie kody statusu.
6. **Testy jednostkowe**
   - Przygotować testy dla walidatora Zod.
   - Testy serwisu wykorzystujące Supabase client mock lub local Supabase (np. `vitest` + `@supabase/supabase-js` w trybie stub).
   - Test route handler (np. `supertest` / `next-test-api-route-handler`).
7. **Dokumentacja**
   - Upewnić się, że Swagger / Postman (jeśli używany) jest spójny.
8. **Review & Deployment**
   - Code review pod kątem zgodności z zasadami (Zod, RLS, logowanie).
   - Po zatwierdzeniu wdrożyć przez pipeline GitHub Actions → DigitalOcean.
