### 1. Podsumowanie kluczowych punktów specyfikacji API

Punkt końcowy `POST /api/ai/generations/accept` służy do finalizowania procesu generowania fiszek przez AI. Użytkownik
przesyła identyfikator sesji generowania (`generation_id`) oraz listę zaakceptowanych propozycji fiszek. System musi:

1. Zweryfikować, czy sesja generowania należy do uwierzytelnionego użytkownika.
2. Sprawdzić, czy ta sesja nie została już wcześniej zaakceptowana.
3. Utworzyć nowy wpis w tabeli `flashcard_sources`, oznaczając go jako pochodzący z AI (`source_type='ai'`).
4. Dodać wszystkie zaakceptowane propozycje jako nowe fiszki do tabeli `flashcards`, powiązując je z nowo utworzonym
   źródłem.
5. Zapisać metryki akceptacji (liczbę zaakceptowanych i odrzuconych propozycji) w tabeli `ai_generations_acceptance`.
6. Cała operacja musi być transakcyjna, aby zapewnić spójność danych.
7. W przypadku sukcesu, punkt końcowy zwraca status `204 No Content`.

### 2. Wymagane i opcjonalne parametry

- **Nagłówki:**
  - `Authorization: Bearer <Supabase JWT>` (Wymagane)
- **Ciało żądania (Request Body - JSON):**
  - `generation_id` (string, UUID): Wymagane.
  - `proposals` (tablica obiektów `{"front": "string", "back": "string"}`): Wymagane. Tablica nie może być pusta.

### 3. Niezbędne typy DTO i Command Modele

Na podstawie dostarczonego pliku `type_definitions` (`lib/dto/types.ts`):

- **Request Command Model:** `AcceptAiGenerationCommand`. Idealnie pasuje do struktury ciała żądania.
  ```typescript
  export interface AcceptAiGenerationCommand {
    generation_id: AiGenerationId;
    proposals: AiProposalDto[];
  }
  ```
- **Response DTO:** Nie jest potrzebny, ponieważ odpowiedź sukcesu to `204 No Content`.
- **Error DTO:** `ErrorResponseDto` będzie używany do zwracania spójnych komunikatów o błędach.

### 4. Wyodrębnienie logiki do serwisu

Logika tego punktu końcowego jest złożona i obejmuje operacje na czterech różnych tabelach (`ai_generations`,
`ai_generations_acceptance`, `flashcard_sources`, `flashcards`). Zgodnie z `implementation_rules`, cała ta logika
biznesowa powinna być wyodrębniona do klasy serwisowej w `lib/services/`.

- **Nazwa serwisu:** `ai-generation-service.ts`.
- **Klasa:** `AiGenerationService`.
- **Metoda:** `async acceptGeneration(userId: string, command: AcceptAiGenerationCommand): Promise<void>`.
- **Obowiązki metody:**
  1. Uruchomienie transakcji w bazie danych (np. przy użyciu funkcji RPC Supabase `plv8` lub zarządzania transakcjami
     na poziomie aplikacji, jeśli framework to wspiera).
  2. Pobranie rekordu `ai_generations` na podstawie `generation_id` i `userId` w celu weryfikacji własności i pobrania
     `generated_count`.
  3. Walidacja biznesowa (np. czy liczba zaakceptowanych fiszek nie przekracza liczby wygenerowanych).
  4. Sprawdzenie, czy akceptacja dla danego `generation_id` już nie istnieje.
  5. Wstawienie rekordu do `flashcard_sources`.
  6. Masowe wstawienie (`bulk insert`) rekordów do `flashcards`.
  7. Wstawienie rekordu do `ai_generations_acceptance`.
  8. Zatwierdzenie transakcji.

### 5. Plan walidacji danych wejściowych

Walidacja zostanie przeprowadzona na dwóch poziomach: w `route.ts` dla formatu danych i w serwisie dla logiki
biznesowej.

- **Poziom 1: Walidacja składni (w `route.ts` przy użyciu Zod):**
  - Utworzenie schematu Zod w `lib/validation/ai-generation-validation.ts`.
  - Schema `acceptAiGenerationSchema` będzie weryfikować:
    - `generation_id`: musi być stringiem w formacie UUID (`z.string().uuid()`).
    - `proposals`: musi być tablicą (`z.array(...)`) i nie może być pusta (`.nonempty()`).
    - Każdy element w `proposals` musi być obiektem zawierającym:
      - `front`: string o długości od 1 do 300 znaków (`z.string().min(1).max(300)`).
      - `back`: string o długości od 1 do 600 znaków (`z.string().min(1).max(600)`).
  - Użycie `schema.safeParse()` i zwrócenie `400 Bad Request` w przypadku błędu.

- **Poziom 2: Walidacja biznesowa (w `AiGenerationService`):**
  1. Po pobraniu rekordu `ai_generations`, sprawdzić, czy istnieje (`404 Not Found`, jeśli nie).
  2. Obliczyć `accepted_count = command.proposals.length` i
     `rejected_count = aiGeneration.generated_count - accepted_count`.
  3. Sprawdzić, czy `rejected_count >= 0`. Jeśli nie, zwrócić błąd `400 Bad Request` (np. "Liczba zaakceptowanych
     propozycji przekracza liczbę wygenerowanych").
  4. Sprawdzić, czy rekord akceptacji już istnieje (zapytanie do `ai_generations_acceptance`). Jeśli tak, zwrócić
     `409 Conflict`.

### 6. Sposób rejestrowania błędów

Zgodnie z `implementation_rules`, nie ma dedykowanej tabeli błędów. Błędy serwera (status 500) powinny być logowane do
konsoli z kontekstem. W bloku `catch` w pliku `route.ts` należy umieścić:
`console.error("[POST /api/ai/generations/accept] Operation failed", { error, userId, generationId });`

### 7. Potencjalne zagrożenia bezpieczeństwa

1. **Nieautoryzowany dostęp:** Użytkownik próbuje zaakceptować generację nienależącą do niego. Zostanie to zablokowane
   przez polityki RLS w bazie danych. Zapytanie `SELECT` w serwisie po prostu nie zwróci żadnych wyników, co doprowadzi
   do błędu `404 Not Found`, zgodnie z najlepszymi praktykami (nie ujawniamy istnienia zasobu).
2. **Atak typu Replay:** Użytkownik próbuje wielokrotnie zaakceptować tę samą generację. Ograniczenie `PRIMARY KEY` na
   kolumnie `ai_generation_id` w tabeli `ai_generations_acceptance` zapobiegnie duplikatom. Serwis musi przechwycić ten
   błąd bazy danych i przekształcić go w odpowiedź `409 Conflict`.
3. **Wstrzyknięcie danych (Data Injection):** Rygorystyczna walidacja za pomocą Zod (długość, typ) oraz użycie
   parametryzowanych zapytań przez klienta Supabase skutecznie chronią przed wstrzyknięciem SQL.

### 8. Scenariusze błędów i kody stanu

- `400 Bad Request`:
  - Ciało żądania ma niepoprawny format JSON.
  - Brak `generation_id` lub `proposals` w ciele żądania.
  - `generation_id` nie jest w formacie UUID.
  - Tablica `proposals` jest pusta.
  - `front` lub `back` w propozycji nie spełnia ograniczeń długości.
  - Liczba zaakceptowanych propozycji jest większa niż liczba pierwotnie wygenerowanych.
- `401 Unauthorized`: Brak lub nieprawidłowy token JWT w nagłówku `Authorization`.
- `404 Not Found`: Rekord `ai_generations` o podanym `generation_id` nie istnieje lub nie należy do uwierzytelnionego
  użytkownika (obsłużone przez RLS).
- `409 Conflict`: Próba ponownej akceptacji już przetworzonej sesji generowania.
- `500 Internal Server Error`: Nieoczekiwany błąd serwera, np. błąd transakcji bazy danych, awaria połączenia.

</analysis>
# Plan Implementacji Punktu Końcowego API: POST /api/ai/generations/accept

## 1. Przegląd Punktu Końcowego

Celem tego punktu końcowego jest umożliwienie użytkownikowi akceptacji wybranych propozycji fiszek, które zostały
wygenerowane przez AI w poprzednim kroku (`POST /api/ai/generations`). Implementacja przetworzy żądanie, tworząc w
sposób transakcyjny nowe rekordy fiszek i ich źródła, a także zapisze metryki dotyczące decyzji użytkownika. Jest to
kluczowy krok w przepływie "AI-to-flashcard", łączący propozycje z finalnymi, użytecznymi danymi.

## 2. Szczegóły Żądania

- **Metoda HTTP:** `POST`
- **Struktura URL:** `/api/ai/generations/accept`
- **Nagłówki:**
  - `Authorization`: `Bearer <Supabase JWT>` (Wymagany)
- **Ciało Żądania (Request Body):**
  ```json
  {
    "generation_id": "string (uuid)",
    "proposals": [
      {
        "front": "string (1-300 znaków)",
        "back": "string (1-600 znaków)"
      }
    ]
  }
  ```

## 3. Wykorzystywane Typy

- **Request Command Model:** `AcceptAiGenerationCommand` z `lib/dto/types.ts` do typowania przychodzących danych w ciele
  żądania.
- **Walidacja:** Schemat Zod `acceptAiGenerationSchema` (do utworzenia w `lib/validation/ai-generation-validation.ts`)
  do walidacji struktury i zawartości ciała żądania.
- **Odpowiedź na błąd:** `ErrorResponseDto` z `lib/dto/types.ts` do ustandaryzowanego formatowania odpowiedzi o błędach.

## 4. Szczegóły Odpowiedzi

- **Odpowiedź sukcesu:**
  - Kod statusu: `204 No Content`
  - Ciało odpowiedzi: Puste
- **Odpowiedzi błędów:**
  - `400 Bad Request`: Nieprawidłowe dane wejściowe.
  - `401 Unauthorized`: Błąd uwierzytelnienia.
  - `404 Not Found`: Sesja generowania nie znaleziona lub brak uprawnień.
  - `409 Conflict`: Sesja generowania została już wcześniej zaakceptowana.
  - `500 Internal Server Error`: Wewnętrzny błąd serwera.

## 5. Przepływ Danych

Całość operacji musi być wykonana w ramach jednej transakcji bazy danych, aby zapewnić spójność danych.

1. **Uwierzytelnienie:** Handler w `route.ts` weryfikuje token JWT użytkownika za pomocą `supabase.auth.getUser()`.
2. **Walidacja Składni:** Ciało żądania jest walidowane przy użyciu schematu Zod `acceptAiGenerationSchema`. W przypadku
   błędu zwracany jest status `400`.
3. **Wywołanie Serwisu:** Handler wywołuje metodę `acceptGeneration(userId, command)` w `AiGenerationService`.
4. **Rozpoczęcie Transakcji:** Serwis rozpoczyna transakcję w bazie danych. Najprostszym sposobem w Supabase będzie
   stworzenie funkcji PostgreSQL (`plpgsql`), która wykonuje wszystkie operacje atomowo, a następnie wywołanie jej przez
   RPC.
5. **Pobranie i Weryfikacja Sesji:** W ramach transakcji, funkcja pobiera rekord z `ai_generations` na podstawie
   `generation_id`. Polityka RLS automatycznie zapewni, że zapytanie powiedzie się tylko dla właściciela rekordu. Jeśli
   rekord nie zostanie znaleziony, transakcja jest przerywana, a serwis zwraca błąd prowadzący do odpowiedzi `404`.
6. **Sprawdzenie Duplikatów:** Funkcja sprawdza istnienie rekordu w `ai_generations_acceptance` dla danego
   `ai_generation_id`. Jeśli istnieje, transakcja jest przerywana, a serwis zwraca błąd prowadzący do odpowiedzi `409`.
7. **Walidacja Biznesowa:** Obliczana jest liczba zaakceptowanych (`accepted_count`) i odrzuconych (`rejected_count`)
   propozycji. Jeśli `accepted_count > generated_count` (z pobranego rekordu), transakcja jest przerywana, a serwis
   zwraca błąd prowadzący do odpowiedzi `400`.
8. **Tworzenie Źródła:** Wstawiany jest nowy rekord do tabeli `flashcard_sources` z `source_type = 'ai'` i `source_id`
   ustawionym na `generation_id`. ID nowego źródła (`flashcard_source_id`) jest przechwytywane do dalszego użytku.
9. **Tworzenie Fiszek:** Wykonywany jest masowy `INSERT` do tabeli `flashcards` dla każdej propozycji z żądania. Każda
   nowa fiszka jest powiązana z `flashcard_source_id` uzyskanym w poprzednim kroku.
10. **Zapis Metryk:** Wstawiany jest nowy rekord do tabeli `ai_generations_acceptance` z `ai_generation_id`,
    `accepted_count` oraz `user_id`.
11. **Zakończenie Transakcji:** Jeśli wszystkie kroki powiodły się, transakcja jest zatwierdzana. W przypadku
    jakiegokolwiek błędu, jest ona wycofywana.
12. **Zwrócenie Odpowiedzi:** Serwis kończy działanie bez błędu, a handler `route.ts` zwraca odpowiedź `204 No Content`.

## 6. Względy Bezpieczeństwa

- **Uwierzytelnianie:** Każde żądanie musi zawierać prawidłowy token JWT, który jest weryfikowany na serwerze.
- **Autoryzacja:** Polityki RLS (Row-Level Security) w bazie PostgreSQL są głównym mechanizmem autoryzacji. Zapewnią
  one, że użytkownik może modyfikować (`accept`) tylko swoje własne sesje generowania. Próba dostępu do cudzych zasobów
  zostanie zablokowana na poziomie bazy danych i będzie skutkować odpowiedzią `404 Not Found`.
- **Walidacja Danych Wejściowych:** Rygorystyczna walidacja za pomocą Zod chroni przed nieprawidłowymi danymi, które
  mogłyby prowadzić do błędów aplikacji lub bazy danych, oraz stanowi pierwszą linię obrony przed atakami typu
  injection.
- **Idempotentność:** Unikalny klucz główny (`PRIMARY KEY`) na `ai_generations_acceptance(ai_generation_id)` zapobiega
  wielokrotnemu przetwarzaniu tego samego żądania, co chroni przed duplikacją danych. Błąd naruszenia unikalności klucza
  zostanie przechwycony i przetłumaczony na odpowiedź `409 Conflict`.

## 7. Rozważania dotyczące Wydajności

- **Transakcje:** Użycie pojedynczej, atomowej transakcji (najlepiej w ramach funkcji PostgreSQL) minimalizuje liczbę
  rund do bazy danych i zapewnia spójność danych bez narzutu na wielokrotne commity.
- **Masowe Operacje:** Fiszki powinny być wstawiane za pomocą pojedynczej operacji `INSERT` z wieloma wierszami (
  `bulk insert`), a nie w pętli. Klient Supabase (`.insert([...])`) domyślnie obsługuje to efektywnie.
- **Liczba Fiszek:** Specyfikacja nie nakłada twardego limitu na liczbę propozycji w żądaniu, ale walidacja i operacje
  bazodanowe są wystarczająco szybkie dla rozsądnych limitów (np. do 50 fiszek na raz).

## 8. Etapy Wdrożenia

1. **Stworzenie funkcji PostgreSQL:**
   - Napisać funkcję `plpgsql` o nazwie np. `accept_ai_generation`, która przyjmuje `user_id`, `generation_id` oraz
     `proposals` (jako JSONB) i wykonuje logikę opisaną w "Przepływie Danych" (kroki 5-11) w sposób transakcyjny.
   - Dodać migrację Supabase dla tej funkcji.

2. **Definicja Walidacji:**
   - W pliku `lib/validation/ai-generation-validation.ts` (lub podobnym) zdefiniować schemat Zod
     `acceptAiGenerationSchema`, który waliduje ciało żądania zgodnie ze specyfikacją.

3. **Aktualizacja Serwisu:**
   - W pliku `lib/services/ai-generation-service.ts` (utworzyć, jeśli nie istnieje) dodać metodę
     `async acceptGeneration(userId: string, command: AcceptAiGenerationCommand)`.
   - Wewnątrz metody, wywołać funkcję bazodanową przez `supabase.rpc('accept_ai_generation', { ... })`.
   - Dodać obsługę błędów specyficznych dla RPC, np. przechwycenie błędu naruszenia unikalnego klucza i rzucenie
     niestandardowego wyjątku, który zostanie później zmapowany na `409 Conflict`.

4. **Implementacja Handlera API:**
   - Utworzyć plik `app/api/ai/generations/accept/route.ts`.
   - Zaimplementować funkcję `export async function POST(req: NextRequest)`.
   - Wewnątrz funkcji:
     a. Pozyskać klienta Supabase i uwierzytelnić użytkownika.
     b. Odczytać i sparsować ciało żądania.
     c. Zwalidować dane przy użyciu `acceptAiGenerationSchema.safeParse()`.
     d. Wywołać metodę `aiGenerationService.acceptGeneration()`.
     e. Zaimplementować blok `try...catch` do obsługi błędów z serwisu i mapowania ich na odpowiednie odpowiedzi
     `NextResponse.json()` (np. `400`, `404`, `409`, `500`).
     f. W przypadku sukcesu zwrócić `new NextResponse(null, { status: 204 })`.

5. **Testowanie:**
   - Napisać testy jednostkowe dla logiki serwisu (jeśli to możliwe, mockując wywołanie RPC).
   - Napisać testy integracyjne dla punktu końcowego API, które symulują pełny przepływ i sprawdzają różne scenariusze
     sukcesu i błędów.
