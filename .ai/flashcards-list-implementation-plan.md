# API Endpoint Implementation Plan: GET /api/flashcards

## 1. Przegląd punktu końcowego

Punkt końcowy `GET /api/flashcards` jest odpowiedzialny za pobieranie listy fiszek dla uwierzytelnionego użytkownika. Umożliwia paginację wyników, sortowanie po dacie utworzenia. Odpowiedź ma sformalizowaną strukturę zawierającą dane oraz informacje o paginacji.

## 2. Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/api/flashcards`
- **Nagłówki:**
  - `Authorization`: `Bearer <Supabase JWT>` (Wymagane)
- **Parametry Zapytania (Query Params):**
  - **Opcjonalne:**
    - `page` (`number`): Numer strony do pobrania. Domyślnie: `1`.
    - `page_size` (`number`): Liczba elementów na stronie. Domyślnie: `20`, Maksymalnie: `100`.
    - `sort` (`string`): Pole i kierunek sortowania. Dopuszczalne wartości: `created_at_desc`, `created_at_asc`. Domyślnie: `created_at_desc`.

## 3. Wykorzystywane typy

Do implementacji tego punktu końcowego zostaną wykorzystane następujące typy zdefiniowane w `lib/dto/types.ts`:

- **Request Query:** `FlashcardListQuery`
- **Response Body:** `FlashcardListResponseDto`
- **Response Data Item:** `FlashcardListItemDto`
- **Response Pagination:** `PaginationDto`

## 4. Szczegóły odpowiedzi

- **Sukces (200 OK):**
  Zwraca obiekt JSON zgodny z typem `FlashcardListResponseDto`.

  ```json
  {
    "data": [
      {
        "id": "c2a9b3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6",
        "front": "What is REST?",
        "back": "Representational State Transfer is an architectural style...",
        "source_type": "ai",
        "created_at": "2024-07-28T10:00:00Z"
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

- **Błędy:**
  - `400 Bad Request`: Nieprawidłowe parametry zapytania.
  - `401 Unauthorized`: Brak autoryzacji.
  - `500 Internal Server Error`: Wewnętrzny błąd serwera.

## 5. Przepływ danych

1.  Żądanie `GET` trafia do `app/api/flashcards/route.ts`.
2.  **Uwierzytelnianie:** Handler używa `createRouteHandlerClient` do pobrania sesji użytkownika. Jeśli użytkownik nie jest uwierzytelniony, zwracany jest błąd `401 Unauthorized`.
3.  **Walidacja:** Parametry zapytania są parsowane i walidowane przy użyciu dedykowanego schematu Zod dla `FlashcardListQuery`. W przypadku niepowodzenia walidacji, zwracany jest błąd `400 Bad Request` ze szczegółami.
4.  **Wywołanie serwisu:** Tworzona jest instancja `FlashcardService`, a następnie wywoływana jest metoda `getFlashcards(userId, validatedQuery)`.
5.  **Logika w serwisie (`FlashcardService`):**
    a. Metoda `getFlashcards` konstruuje zapytanie do bazy danych Supabase skierowane wyłącznie do tabeli `flashcards`.
    b. Do zapytania dodawane jest `sort` na podstawie zwalidowanych parametrów.
    c. Zapytanie jest wykonywane z opcją `{ count: 'exact' }`, aby jednocześnie pobrać dane i całkowitą liczbę rekordów pasujących do filtrów, co eliminuje potrzebę drugiego zapytania.
    d. Na podstawie zwróconej liczby całkowitej (`count`) obliczane są metadane paginacji (`total_pages`).
    e. Wyniki z bazy danych są bezpośrednio mapowane na strukturę `FlashcardListItemDto`, ponieważ tabela `flashcards` zawiera wszystkie wymagane pola (`id`, `front`, `back`, `source_type`, `created_at`).
    f. Metoda zwraca kompletny obiekt `FlashcardListResponseDto`.
6.  **Odpowiedź:** Handler w `route.ts` otrzymuje dane z serwisu i zwraca je jako odpowiedź JSON ze statusem `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie:** Dostęp do punktu końcowego jest zabezpieczony i wymaga prawidłowego tokenu JWT, który jest weryfikowany przez Supabase Auth Helpers na serwerze.
- **Autoryzacja:** Dostęp do danych jest kontrolowany przez polityki Row Level Security (RLS) w bazie danych PostgreSQL. Polityki te gwarantują, że użytkownik może odczytać wyłącznie własne fiszki (`user_id = auth.uid()`). Kod aplikacji **nie powinien** implementować dodatkowej logiki autoryzacji w warstwie serwisowej.
- **Walidacja danych wejściowych:** Wszystkie parametry zapytania są ściśle walidowane za pomocą Zod, co zapobiega błędom w logice biznesowej i potencjalnym atakom (np. poprzez manipulację `page_size`).

## 7. Obsługa błędów

Błędy będą obsługiwane w handlerze (`route.ts`) w bloku `try...catch`.

| Kod statusu          | Sytuacja                                                                  | Akcja                                                                                                             |
| -------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `400 Bad Request`    | Błąd walidacji parametrów zapytania (np. `page_size > 100`).              | Zwrócenie odpowiedzi JSON z komunikatem błędu i szczegółami walidacji z Zod.                                      |
| `401 Unauthorized`   | Brak lub nieważny token JWT.                                              | Zwrócenie standardowej odpowiedzi `401`.                                                                          |
| `500 Internal Error` | Nieoczekiwany błąd serwera (np. błąd bazy danych, błąd w logice serwisu). | Zalogowanie szczegółowego błędu do konsoli (`console.error`) i zwrócenie generycznej odpowiedzi `500` do klienta. |

## 8. Rozważania dotyczące wydajności

- **Indeksowanie bazy danych:** Zapytanie będzie filtrować i sortować dane w tabeli `flashcards`. Istniejący indeks `idx_flashcards_user_id_created_at` jest kluczowy. W celu optymalizacji zapytań z filtrowaniem po `source_type`, zalecane jest dodanie indeksu złożonego na kolumnach `(user_id, source_type, created_at)`.
- **Paginacja:** Ograniczenie `page_size` do `100` zapobiega pobieraniu nadmiernej ilości danych w jednym żądaniu, chroniąc serwer i bazę danych przed przeciążeniem.
- **Rozmiar odpowiedzi:** Zastosowanie DTO (`FlashcardListItemDto`) o spłaszczonej, minimalnej strukturze, ogranicza rozmiar odpowiedzi, co przekłada się na szybsze przesyłanie danych do klienta.

## 9. Etapy wdrożenia

1.  **Walidacja:**
    - Utworzyć plik `lib/validation/flashcard-validation.ts`.
    - Zdefiniować w nim schemat Zod `flashcardListQuerySchema` walidujący parametry `page`, `page_size`, `sort`/ z odpowiednimi domyślnymi wartościami i ograniczeniami.

2.  **Warstwa serwisowa:**
    - W pliku `lib/services/flashcard-service.ts`, w klasie `FlashcardService`, zaimplementować metodę `async getFlashcards(userId: string, query: FlashcardListQuery): Promise<FlashcardListResponseDto>`.
    - Wewnątrz metody zaimplementować logikę budowania i wykonania zapytania do tabeli `flashcards`, mapowania wyników na DTO oraz konstruowania finalnej odpowiedzi.

3.  **Handler API:**
    - W pliku `app/api/flashcards/route.ts` zaimplementować funkcję `export async function GET(request: NextRequest)`.
    - Dodać logikę uwierzytelniania użytkownika.
    - Zwalidować parametry zapytania przy użyciu schematu Zod.
    - Wywołać metodę z `FlashcardService`, przekazując `userId` i zwalidowane parametry.
    - Zaimplementować obsługę błędów w bloku `try...catch`.
    - Zwrócić odpowiedź w formacie `NextResponse.json()`.

4.  **Testy:**
    - Napisać testy jednostkowe dla metody `getFlashcards` w `FlashcardService`, symulując różne parametry wejściowe.
    - Napisać testy integracyjne dla punktu końcowego `GET /api/flashcards`, weryfikując poprawność działania paginacji, sortowania i filtrowania w różnych scenariuszach.
