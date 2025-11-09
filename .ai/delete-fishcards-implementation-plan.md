### 1. Podsumowanie kluczowych punktów specyfikacji

`DELETE /api/flashcards` ma dwie funkcjonalności: 1. **Usuwanie pojedynczej fiszki:** `DELETE /api/flashcards/{flashcard_id}` usuwa jedną fiszkę na podstawie jej ID. 2. **Masowe usuwanie fiszek:** `DELETE /api/flashcards` usuwa wiele fiszek na podstawie listy ID dostarczonej w ciele żądania.
Obie operacje wymagają uwierzytelnienia za pomocą Supabase JWT i w przypadku powodzenia zwracają status 204 No Content.

2. Wymagane i opcjonalne parametry
   DELETE /api/flashcards/{flashcard_id}

Wymagane: flashcard_id (parametr ścieżki URL) - musi być w formacie UUID.

Opcjonalne: Brak.

DELETE /api/flashcards

Wymagane: Ciało żądania w formacie JSON z kluczem ids, zawierającym tablicę identyfikatorów fiszek (UUID).

Opcjonalne: Brak.

3. Niezbędne typy DTO i Command Models
   FlashcardId: Typ dla identyfikatora fiszki (alias dla string w formacie UUID).

BulkDeleteFlashcardsCommand: Interfejs dla ciała żądania masowego usuwania, zawierający pole ids: FlashcardId[].

4. Ekstrakcja logiki do serwisu
   Logika biznesowa zostanie umieszczona w dedykowanym serwisie, prawdopodobnie FlashcardService w lib/services/FlashcardService.ts. Serwis będzie zawierał dwie metody:

delete(id: FlashcardId, userId: string): Promise<void>: Do usuwania pojedynczej fiszki.

bulkDelete(ids: FlashcardId[], userId: string): Promise<void>: Do masowego usuwania fiszek.

Metody te będą odpowiedzialne za konstruowanie i wykonywanie zapytań do Supabase, zapewniając, że użytkownik może usuwać tylko swoje własne zasoby. Sprawdzą również, czy operacja faktycznie usunęła zasób, aby poprawnie obsłużyć przypadek 404 Not Found.

5. Plan walidacji danych wejściowych
   Walidacja będzie realizowana zgodnie z nextjs-backend.md przy użyciu biblioteki Zod.

Dla DELETE /api/flashcards/{flashcard_id}: Parametr flashcard_id ze ścieżki URL będzie walidowany jako z.string().uuid().

Dla DELETE /api/flashcards: Ciało żądania będzie walidowane za pomocą schemy: z.object({ ids: z.array(z.string().uuid()).min(1, "The 'ids' array cannot be empty.") }). Użycie .min(1) zapobiegnie wysyłaniu pustej tablicy.

6. Rejestrowanie błędów
   Zgodnie z nextjs-backend.md, błędy (np. błędy bazy danych, nieoczekiwane wyjątki) będą logowane na serwerze za pomocą console.error z odpowiednim kontekstem, np. console.error("FlashcardService.delete failed", { error, flashcard_id, userId }). Nie będą one ujawniane klientowi.

7. Identyfikacja potencjalnych zagrożeń bezpieczeństwa
   Brak uwierzytelnienia: Każde żądanie musi być uwierzytelnione. Route handler użyje createRouteHandlerClient do pobrania sesji użytkownika. Brak sesji zwróci 401 Unauthorized.

Niewystarczająca autoryzacja (IDOR): Główne zagrożenie polega na tym, że użytkownik A mógłby próbować usunąć fiszkę użytkownika B. Zostanie to zniwelowane na dwóch poziomach:

Warstwa serwisu: Wszystkie zapytania DELETE w FlashcardService będą zawierać warunek .eq('user_id', userId).

Warstwa bazy danych: Polityki RLS (Row Level Security) w Supabase zapewniają, że użytkownik ma dostęp tylko do swoich własnych wierszy w tabeli flashcards. Zgodnie z nextjs-backend.md, próba dostępu do cudzego zasobu powinna skutkować błędem 404 Not Found.

8. Potencjalne scenariusze błędów i kody stanu
   204 No Content: Operacja usuwania zakończyła się sukcesem.

400 Bad Request:

flashcard_id ma niepoprawny format UUID.

Ciało żądania dla masowego usuwania jest nieprawidłowe (np. brak pola ids, pusta tablica ids, ids zawiera wartości inne niż UUID).

401 Unauthorized: Brak, nieważny lub wygasły token JWT.

404 Not Found: Fiszka o podanym flashcard_id nie istnieje lub nie należy do uwierzytelnionego użytkownika. W przypadku masowego usuwania, żaden z podanych ids nie odpowiada fiszkom należącym do użytkownika.

500 Internal Server Error: Wystąpił błąd po stronie serwera, np. błąd połączenia z bazą danych. Szczegóły błędu zostaną zalogowane, a klient otrzyma generyczną odpowiedź.

</analysis>
text
# API Endpoint Implementation Plan: DELETE /api/flashcards

## 1. Przegląd punktu końcowego

Ten dokument opisuje plan wdrożenia dla punktu końcowego `DELETE /api/flashcards`, który obsługuje dwie kluczowe operacje: usuwanie pojedynczej fiszki na podstawie jej identyfikatora oraz masowe usuwanie wielu fiszek. Obie operacje są kluczowe dla zarządzania cyklem życia fiszek przez użytkownika.

## 2. Szczegóły żądania

- **Metoda HTTP:** `DELETE`
- **Struktura URL:**
  - Usuwanie pojedyncze: `/api/flashcards/{flashcard_id}`
  - Usuwanie masowe: `/api/flashcards`
- **Parametry:**
  - **Wymagane:**
    - Dla usuwania pojedynczego: `flashcard_id` (parametr ścieżki, musi być w formacie UUID).
- **Ciało żądania (Request Body):**
  - Dotyczy tylko usuwania masowego.
  - Musi być w formacie JSON i pasować do struktury `BulkDeleteFlashcardsCommand`.
  ```
  {
    "ids": ["uuid-1", "uuid-2", "uuid-3"]
  }
  ```

## 3. Wykorzystywane typy

- **`FlashcardId: string`**: Alias typu dla ID fiszki (UUID).
- **`BulkDeleteFlashcardsCommand`**: Interfejs definiujący strukturę ciała żądania dla masowego usuwania.
  export interface BulkDeleteFlashcardsCommand {
  ids: FlashcardId[];
  }

text

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu:**
  - Kod statusu: `204 No Content`.
  - Ciało odpowiedzi: Brak.
- **Odpowiedzi błędów:**
  - `400 Bad Request`: Błędne dane wejściowe.
  - `401 Unauthorized`: Brak autoryzacji.
  - `404 Not Found`: Zasób nie istnieje lub użytkownik nie ma do niego dostępu.
  - `500 Internal Server Error`: Wewnętrzny błąd serwera.

## 5. Przepływ danych

1.  Żądanie `DELETE` trafia do odpowiedniego handlera w Next.js (`/app/api/flashcards/[flashcard_id]/route.ts` lub `/app/api/flashcards/route.ts`).
2.  Handler uwierzytelnia użytkownika za pomocą `createRouteHandlerClient` i pobiera `user_id` z tokena JWT. Jeśli użytkownik nie jest uwierzytelniony, zwracany jest błąd `401`.
3.  Handler waliduje dane wejściowe za pomocą Zod:

- Dla pojedynczego usunięcia: Sprawdza, czy `flashcard_id` jest poprawnym UUID.
- Dla masowego usunięcia: Sprawdza, czy ciało żądania zawiera niepustą tablicę `ids` składającą się z poprawnych UUID.
- W przypadku błędu walidacji zwracany jest błąd `400`.

4.  Handler wywołuje odpowiednią metodę w `FlashcardService` (`delete` lub `bulkDelete`), przekazując ID/identyfikatory oraz `user_id`.
5.  `FlashcardService` wykonuje zapytanie `DELETE` do bazy danych Supabase, używając warunku `eq('user_id', userId)`, aby zapewnić, że użytkownicy mogą usuwać tylko własne fiszki.
6.  Polityki RLS (Row Level Security) na poziomie bazy danych stanowią dodatkową warstwę zabezpieczeń.
7.  Serwis sprawdza wynik operacji. Jeśli żadne wiersze nie zostały usunięte (ponieważ zasoby nie istniały dla danego użytkownika), rzucany jest błąd `NotFoundError`, który handler mapuje na odpowiedź `404 Not Found`.
8.  Jeśli operacja w bazie danych zakończy się niepowodzeniem, błąd jest logowany, a do klienta wysyłana jest odpowiedź `500 Internal Server Error`.
9.  W przypadku pomyślnego usunięcia, handler zwraca odpowiedź `204 No Content`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie:** Wszystkie żądania będą chronione i muszą zawierać prawidłowy token `Supabase JWT` w nagłówku `Authorization`. Handler odrzuci każde żądanie bez ważnej sesji użytkownika, zwracając `401`.
- **Autoryzacja:** Zapytania do bazy danych będą filtrowane przez `user_id`, co w połączeniu z politykami RLS w Supabase zapobiega nieautoryzowanemu dostępowi do danych (IDOR). Zgodnie z zasadami, próba usunięcia cudzego zasobu zwróci `404 Not Found`, a nie `403 Forbidden`.
- **Walidacja danych:** Ścisła walidacja formatu UUID dla wszystkich identyfikatorów fiszek za pomocą Zod chroni przed atakami typu SQL Injection i zapewnia spójność danych.

## 7. Rozważania dotyczące wydajności

- Operacje `DELETE` w PostgreSQL są wydajne, zwłaszcza na kolumnach z indeksami (`flashcard_id`, `user_id`).
- Masowe usuwanie za pomocą `in()` jest znacznie bardziej wydajne niż wykonywanie wielu pojedynczych zapytań `DELETE`.
- Tabela `flashcards` ma relację `ON DELETE CASCADE` z `flashcard_sources`. Oznacza to, że usunięcie fiszki automatycznie usunie powiązany z nią wpis w tabeli źródeł, co jest pożądane, ale może wpłynąć na wydajność przy usuwaniu bardzo dużej liczby fiszek jednocześnie. Należy monitorować wydajność tej operacji kaskadowej.

## 8. Etapy wdrożenia

1.  **Walidacja:** W pliku `lib/validation/flashcard-schemas.ts` zdefiniuj schemę Zod dla masowego usuwania:

```
export const bulkDeleteFlashcardsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "The 'ids' array cannot be empty."),
});
```

2.  **Serwis:** W klasie `lib/services/FlashcardService.ts` zaimplementuj metody `delete` i `bulkDelete`:

- `async delete(id: FlashcardId, userId: string)`: Wykonuje `supabase.from('flashcards').delete().match({ flashcard_id: id, user_id: userId })`. Sprawdza `count` i rzuca `NotFoundError`, jeśli wynosi 0.
- `async bulkDelete(ids: FlashcardId[], userId: string)`: Wykonuje `supabase.from('flashcards').delete().in('flashcard_id', ids).eq('user_id', userId)`. Sprawdza `count` i rzuca `NotFoundError`, jeśli wynosi 0.

3.  **API Route (pojedyncze usuwanie):** Utwórz plik `app/api/flashcards/[flashcard_id]/route.ts`:

- Zdefiniuj i wyeksportuj asynchroniczną funkcję `DELETE(request, { params })`.
- Uwierzytelnij użytkownika.
- Zwaliduj `params.flashcard_id` jako UUID.
- Wywołaj `flashcardService.delete(params.flashcard_id, userId)`.
- Zaimplementuj obsługę błędów (try-catch) i zwracaj odpowiednie `NextResponse`.

4.  **API Route (masowe usuwanie):** Zmodyfikuj plik `app/api/flashcards/route.ts`:

- Zdefiniuj i wyeksportuj asynchroniczną funkcję `DELETE(request)`.
- Uwierzytelnij użytkownika.
- Odczytaj i zwaliduj ciało żądania za pomocą `bulkDeleteFlashcardsSchema`.
- Wywołaj `flashcardService.bulkDelete(validatedData.ids, userId)`.
- Zaimplementuj obsługę błędów i zwracaj odpowiednie `NextResponse`.

5.  **Testowanie:** Utwórz testy jednostkowe i integracyjne dla obu punktów końcowych, obejmujące scenariusze pomyślne, błędne dane wejściowe, brak uwierzytelnienia oraz próby usunięcia nieistniejących lub cudzych zasobów.
6.  **Dokumentacja:** Zaktualizuj dokumentację API (np. w Postmanie lub Swaggerze), aby odzwierciedlić wdrożone punkty końcowe.
