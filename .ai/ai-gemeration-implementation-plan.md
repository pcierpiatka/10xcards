# API Endpoint Implementation Plan: `POST /api/ai/generations`

## 1. Przegląd punktu końcowego
Punkt końcowy generuje propozycje fiszek z użyciem modelu AI (OpenRouter `gpt-4o-mini`), utrwala pełny rekord `ai_generations` oraz zwraca propozycje użytkownikowi do dalszej akceptacji.

## 2. Szczegóły żądania
- Metoda HTTP: `POST`
- Struktura URL: `/api/ai/generations`
- Parametry:
    - Wymagane: brak parametrów ścieżki ani zapytania
    - Opcjonalne: brak
- Request Body (`application/json`):
  ```json
  {
    "input_text": "string (1000-10000 characters)"
  }
  ```
- Nagłówki: `Authorization: Bearer <Supabase JWT>`, `Content-Type: application/json`

## 3. Wykorzystywane typy
- DTO wejściowe: `CreateAiGenerationCommand` (`input_text`)
- DTO wyjściowe: `AiGenerationResponseDto` (`generation_id`, `proposals`)
- Schemat walidacji: `createAiGenerationSchema` (Zod) w `lib/validation/ai-generations.ts`
- Modele Service: `AiGenerationService` (nowy) z metodą `createGeneration(userId: string, command: CreateAiGenerationCommand): Promise<AiGenerationResponseDto>`

## 4. Szczegóły odpowiedzi
- Sukces (`201 Created`):
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
- Błędy:
    - `400 Bad Request` – naruszenia walidacji wejścia lub wyjścia AI
    - `401 Unauthorized` – brak ważnego JWT
    - `429 Too Many Requests` – przekroczenie limitów generacji
    - `500 Internal Server Error` – awaria zewnętrznego dostawcy AI (komunikat przyjazny użytkownikowi)

## 5. Przepływ danych
1. `route.ts`:
    - uzyskanie klienta Supabase via `createRouteHandlerClient`
    - sprawdzenie uwierzytelnienia (`supabase.auth.getUser`)
    - walidacja żądania przy użyciu Zod
    - inicjalizacja `AiGenerationService` z klientem Supabase i klientem `OpenRouterClient`
2. `AiGenerationService.createGeneration`:
    - pomiar czasu (ms) dla zapytania do `OpenRouter`
    - wywołanie `OpenRouterClient.generateFlashcards(input_text)`
    - walidacja/normalizacja wyników (limit znaków, maks. 10 propozycji)
    - budowanie rekordu `ai_generations` (`insert`) z `input_text`, `model_name`, `generated_proposals`, `generated_count`, `duration_ms`
    - zwrot identyfikatora rekordu i znormalizowanych propozycji
3. `OpenRouterClient` (`lib/integrations/openrouter-client.ts`):
    - wysyłka żądania `POST` z `AbortController` (timeout 30s)
    - obsługa błędów HTTP i transformacja odpowiedzi do wewnętrznej struktury
    - Narazie stworz mock dla openrouter-client.ts ktory zawsze bedzie zwracal 6 fiszek
4. `route.ts` zwraca `NextResponse.json(dto, { status: 201 })`

## 6. Względy bezpieczeństwa
- Uwierzytelnianie: Supabase JWT, weryfikacja w route handlerze
- Autoryzacja: RLS w bazie (`user_id = auth.uid()`) zapewnia izolację danych
- Sekrety: klucz API OpenRouter przechowywany w zmiennych środowiskowych serwera, nigdy w kliencie
- Wejście: walidacja długości `input_text`, sanity check dla znaków (opcjonalnie trim i normalization)
- Wyjście: normalizacja danych AI, aby zapobiec zapisowi niepoprawnych danych
- Transport: HTTPS (wymóg środowiska produkcyjnego)

## 7. Obsługa błędów
- Walidacja Zod: `400` z komunikatem o polu
- Brak JWT: `401`
- Limit generacji (middleware rate limit lub usługa): zgłoszenie `RateLimitError` → `429` + `Retry-After`
- Błędy OpenRouter:
    - wyjątek sieciowy/timeout → `500` z komunikatem per `US-007`
    - niepoprawne dane wyjściowe → `400` (np. brak propozycji, przekroczone limity znaków)
- Logowanie: `console.error("[AiGenerationService] ...", { userId, ... })`
- Brak dedykowanej tabeli błędów → logowanie w konsoli/monitoringu

## 8. Rozważania dotyczące wydajności
- Ograniczenie do maks. 10 propozycji (zgodnie z ograniczeniami DB)
- Pomiar i zapis `duration_ms` dla monitorowania
- Timeout 30s dla wywołania OpenRouter
- Potencjalne cachowanie modeli/konfiguracji w pamięci, jeśli konieczne

## 9. Etapy wdrożenia
1. **Walidacja**: utworzenie `createAiGenerationSchema` w `lib/validation/ai-generations.ts`
2. **Klient AI**: zaimplementowanie `OpenRouterClient` (timeout, fetch, mapowanie odpowiedzi)
3. **Serwis**: dodać `AiGenerationService` w `lib/services/ai-generation-service.ts`
    - wstrzykiwanie `SupabaseClient` i `OpenRouterClient`
    - logika walidacji wyników i zapis do `ai_generations`
4. **Obsługa błędów**: zdefiniowanie klas błędów (`ValidationError`, `ExternalServiceError`) w `lib/errors/`
5. **Route handler**: `app/api/ai/generations/route.ts`
    - uwierzytelnienie, walidacja, wywołanie serwisu
    - mapowanie wyjątków na statusy HTTP
6. **Testy jednostkowe**:
    - walidacja schematu
    - `AiGenerationService` (mock OpenRouterClient, Supabase insert)
    - mapowanie błędów na statusy