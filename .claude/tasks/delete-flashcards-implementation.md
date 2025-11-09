# Delete Flashcards Implementation

## Cel zadania

Implementacja endpointów DELETE dla fiszek zgodnie z planem wdrożenia `.ai/delete-fishcards-implementation-plan.md`:

- `DELETE /api/flashcards/{flashcard_id}` - usuwanie pojedynczej fiszki
- `DELETE /api/flashcards` - masowe usuwanie fiszek

## Zakres

### Funkcjonalności

- Usuwanie pojedynczej fiszki na podstawie UUID
- Masowe usuwanie wielu fiszek (bulk delete)
- Uwierzytelnienie przez Supabase JWT
- Autoryzacja: użytkownik może usuwać tylko swoje fiszki (RLS + filtrowanie po user_id)
- Walidacja UUID przez Zod
- Odpowiednia obsługa błędów (400, 401, 404, 500)

### Zgodność

- Typy DTO: `lib/dto/types.ts` (FlashcardId, BulkDeleteFlashcardsCommand)
- Reguły backend: `.claude/rules/nextjs-backend.md`
- Database types: `lib/db/database.types.ts`

## Podejście implementacji

**3 kroki → feedback → 3 kroki → feedback → itd.**

### Grupa 1: Fundament (validation + errors + service)

1. **Validation schemas** (`lib/validation/flashcard-schemas.ts`)
   - deleteFlashcardParamsSchema (UUID validation)
   - bulkDeleteFlashcardsSchema (array of UUIDs, min 1)

2. **Error classes** (`lib/errors/index.ts`)
   - NotFoundError (404)
   - ValidationError (400)
   - UnauthorizedError (401)

3. **FlashcardService** (`lib/services/FlashcardService.ts`)
   - `delete(id: FlashcardId, userId: string): Promise<void>`
   - `bulkDelete(ids: FlashcardId[], userId: string): Promise<void>`
   - Sprawdzanie count po DELETE, rzucanie NotFoundError jeśli 0

### Grupa 2: API Routes

4. **Single delete route** (`app/api/flashcards/[flashcard_id]/route.ts`)
   - Export funkcji DELETE
   - Auth: createRouteHandlerClient + getUser()
   - Walidacja params.flashcard_id
   - Wywołanie flashcardService.delete()
   - Error handling → NextResponse

5. **Bulk delete route** (`app/api/flashcards/route.ts`)
   - Export funkcji DELETE
   - Auth + body parsing
   - Walidacja body przez bulkDeleteFlashcardsSchema
   - Wywołanie flashcardService.bulkDelete()
   - Error handling → NextResponse

### Grupa 3: Testy

6. **Testy jednostkowe i integracyjne**
   - FlashcardService tests
   - API endpoint tests (happy path, validation errors, auth, 404, IDOR)

## Status wykonania

### ✅ Przygotowanie

- [x] Przeczytanie planu implementacji
- [x] Przeczytanie DTO types
- [x] Przeczytanie nextjs-backend rules
- [x] Przeczytanie database.types.ts
- [x] Stworzenie task file

### ✅ Grupa 1: Fundament

- [x] Validation schemas
- [x] Error classes (already existed)
- [x] FlashcardService (delete + bulkDelete)

### ✅ Grupa 2: API Routes

- [x] Single delete route
- [x] Bulk delete route

### ⏳ Grupa 3: Testy

- [ ] Unit tests (service)
- [ ] Integration tests (endpoints)

## Względy bezpieczeństwa

### IDOR Prevention (Insecure Direct Object Reference)

- **Service layer:** Wszystkie DELETE queries z `.eq('user_id', userId)`
- **Database layer:** RLS policies (dodatkowa warstwa zabezpieczeń)
- **Response:** 404 Not Found (nie 403) gdy użytkownik próbuje usunąć cudzą fiszkę

### Walidacja

- Wszystkie ID muszą być valid UUID (Zod)
- Bulk delete: tablica nie może być pusta
- Auth: JWT token w każdym żądaniu

### Error handling

- Błędy DB logowane na serwerze (`console.error`)
- Klient dostaje tylko generyczną wiadomość (nie internal details)
- Kody statusu zgodne z REST best practices

## Dodatkowe uwagi

### Wydajność

- Bulk delete używa `.in('flashcard_id', ids)` - bardziej wydajne niż N pojedynczych DELETE
- ON DELETE CASCADE z flashcard_sources - automatyczne usuwanie powiązanych wpisów

### MVP Scope

- Brak soft delete (hard delete od razu)
- Brak history/audit log
- Brak undo functionality
- Proste 204 No Content (bez dodatkowych info w response)

### Ewolucja

- W przyszłości można dodać: soft delete, trash/undo, bulk operations z filters (np. "delete all from source X")
- Struktura pozwala na non-breaking extensions

## Plan na teraz

**Implementuję maksymalnie 3 kroki z Grupy 1, potem STOP i czekam na feedback.**

Po każdej grupie:

1. Podsumowanie co zrobione
2. Plan na kolejne 3 kroki
3. STOP - czekam na feedback użytkownika
