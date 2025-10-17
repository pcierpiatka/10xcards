# Dashboard View Implementation Plan

## Przegląd zadania

Implementacja widoku Dashboard (`/dashboard`) - głównego ekranu aplikacji dla zalogowanych użytkowników. Widok umożliwia:

- Generowanie fiszek za pomocą AI (1000-10000 znaków tekstu)
- Ręczne dodawanie fiszek
- Przeglądanie listy fiszek z paginacją
- Edycję inline fiszek
- Usuwanie fiszek z potwierdzeniem

## Approach (Podejście MVP)

**Filozofia**: Budujemy minimalną wersję, która działa end-to-end. Priorytet: działające flow AI → lista fiszek → podstawowe CRUD.

### Kluczowe decyzje architektoniczne:

1. **Custom hook `useDashboardManager`** - cała logika biznesowa w jednym miejscu
2. **Optymistic updates** - używamy `useOptimistic` z React 19 dla natychmiastowego feedbacku UI
3. **Komponenty shadcn/ui** - maksymalne wykorzystanie gotowych komponentów
4. **Client component na szczycie** - `DashboardView` z dyrektywą `'use client'`
5. **Walidacja inline** - przyciski disabled w czasie rzeczywistym, brak osobnych błędów

### Iteracje (MVPowy podział pracy):

**Iteracja 1: Struktura + Lista (read-only)**

- Struktura plików i komponentów
- Hook `useDashboardManager` (szkielet)
- GET /api/flashcards z paginacją
- FlashcardList (tylko wyświetlanie)
- EmptyState

**Iteracja 2: AI Flow (core value proposition)**

- AiGeneratorForm z walidacją 1000-10000 znaków
- POST /api/ai/generations
- AiProposalsList z checkboxami
- POST /api/ai/generations/accept
- Integracja z listą fiszek

**Iteracja 3: CRUD Operations**

- ManualFlashcardForm (POST /api/flashcards)
- FlashcardItem - edycja inline (PATCH)
- FlashcardItem - usuwanie z AlertDialog (DELETE)
- Optymistic updates dla wszystkich operacji

**Iteracja 4: Polish & Error Handling**

- Loading states (Skeleton)
- Error handling (toasts)
- Dostępność (aria-labels, focus management)
- Testowanie wszystkich user stories

## Rozbicie zadań (Task Breakdown)

### 1. Struktura plików i podstawowych komponentów

- [ ] Utworzyć `app/dashboard/page.tsx` (`'use client'`)
- [ ] Utworzyć folder `components/dashboard/`
- [ ] Utworzyć `components/dashboard/DashboardView.tsx` (główny komponent)
- [ ] Utworzyć `components/dashboard/EmptyState.tsx` (prosty komunikat + button)
- [ ] Utworzyć `hooks/useDashboardManager.ts` (szkielet z typami stanu)

### 2. Hook zarządzania stanem (szkielet)

- [ ] Zdefiniować typy stanu w `useDashboardManager`:
  - `flashcards: FlashcardViewModel[]`
  - `pagination: PaginationDto | null`
  - `aiProposals: AiGenerationResponseDto | null`
  - `viewState: 'idle' | 'loadingList' | 'generatingAi' | 'acceptingProposals' | 'error'`
  - `error: string | null`
- [ ] Zdefiniować sygnatury funkcji (puste implementacje):
  - `generateAiProposals(text: string)`
  - `acceptAiProposals(selected: AiProposalDto[])`
  - `rejectAiProposals()`
  - `createManualFlashcard(data: CreateManualFlashcardCommand)`
  - `updateFlashcard(id: FlashcardId, data: UpdateFlashcardCommand)`
  - `deleteFlashcard(id: FlashcardId)`
  - `loadMoreFlashcards()`

### 3. Warstwa API service

- [ ] Utworzyć `lib/services/flashcardService.ts`:
  - `fetchFlashcards(query: FlashcardListQuery): Promise<FlashcardListResponseDto>`
  - `generateAiFlashcards(command: CreateAiGenerationCommand): Promise<AiGenerationResponseDto>`
  - `acceptAiGeneration(command: AcceptAiGenerationCommand): Promise<void>`
  - `createManualFlashcard(command: CreateManualFlashcardCommand): Promise<CreateManualFlashcardResponseDto>`
  - `updateFlashcard(id: FlashcardId, command: UpdateFlashcardCommand): Promise<UpdateFlashcardResponseDto>`
  - `deleteFlashcard(id: FlashcardId): Promise<void>`

### 4. Implementacja GET /api/flashcards (lista + paginacja)

- [ ] W `useDashboardManager`: Dodać `useEffect` do ładowania pierwszej strony
- [ ] Zaimplementować `loadMoreFlashcards()` (dołączanie do `flashcards`, update `pagination`)
- [ ] Utworzyć `components/dashboard/FlashcardList.tsx`:
  - Mapowanie `flashcards` na `FlashcardItem`
  - Przycisk "Załaduj więcej" (warunkowo, jeśli `hasMore`)
- [ ] Utworzyć `components/dashboard/FlashcardItem.tsx` (read-only na razie):
  - Wyświetlanie `front`, `back`, `source_type` (badge), `created_at`
  - Placeholder buttony dla Edit/Delete (nieaktywne)

### 5. ViewModel type dla UI state

- [ ] Utworzyć `lib/types/viewModels.ts`:
  ```typescript
  export interface FlashcardViewModel extends FlashcardListItemDto {
    id: FlashcardId | string; // UUID lub temp ID (timestamp)
    status?: "syncing" | "synced" | "error";
  }
  ```

### 6. AI Generator Form

- [ ] Zainstalować brakujące komponenty shadcn/ui:
  - `npx shadcn@latest add textarea`
- [ ] Utworzyć `components/dashboard/AiGeneratorForm.tsx`:
  - `shadcn/Textarea` z licznikiem znaków
  - Walidacja: 1000 ≤ length ≤ 10000
  - `shadcn/Button` "Generuj" (disabled jeśli walidacja fails)
  - Props: `isGenerating: boolean`, `onSubmit: (text: string) => void`
- [ ] W `useDashboardManager`: Zaimplementować `generateAiProposals(text)`
  - Wywołanie `flashcardService.generateAiFlashcards()`
  - Aktualizacja `aiProposals` w stanie
  - Obsługa błędów (ustawienie `error` state)

### 7. AI Proposals List

- [ ] Zainstalować brakujące komponenty shadcn/ui:
  - `npx shadcn@latest add checkbox`
  - `npx shadcn@latest add card`
- [ ] Utworzyć `components/dashboard/AiProposalItem.tsx`:
  - `shadcn/Checkbox` + `shadcn/Card` z `front` i `back`
  - Props: `proposal: AiProposalDto`, `isSelected: boolean`, `onToggle: () => void`
- [ ] Utworzyć `components/dashboard/AiProposalsList.tsx`:
  - Stan lokalny: `selectedProposals: Set<number>` (indeksy)
  - Mapowanie na `AiProposalItem`
  - Przyciski: "Akceptuj zaznaczone" (disabled jeśli brak selekcji), "Odrzuć wszystko" (destructive)
  - Props: `proposals: AiProposalDto[]`, `onAccept`, `onReject`

### 8. Akceptacja/Odrzucenie AI

- [ ] W `useDashboardManager`: Zaimplementować `acceptAiProposals(selected)`
  - Wywołanie `flashcardService.acceptAiGeneration()`
  - Czyszczenie `aiProposals` (null)
  - Odświeżenie listy: `fetchFlashcards({ page: 1 })` (nowe fiszki na górze)
- [ ] W `useDashboardManager`: Zaimplementować `rejectAiProposals()`
  - Ustawienie `aiProposals = null` (bez wywołania API)

### 9. Manual Flashcard Form

- [ ] Zainstalować brakujące komponenty shadcn/ui:
  - `npx shadcn@latest add input`
- [ ] Utworzyć `components/dashboard/ManualFlashcardForm.tsx`:
  - `shadcn/Input` dla "Przód" (max 300 znaków)
  - `shadcn/Textarea` dla "Tył" (max 600 znaków)
  - Walidacja inline: length > 0 && length ≤ limit
  - Przyciski: "Zapisz" (disabled jeśli walidacja fails), "Anuluj"
  - Props: `onSave: (data: CreateManualFlashcardCommand) => void`, `onCancel: () => void`
- [ ] W `DashboardView`: Dodać stan `showManualForm: boolean` + button "Dodaj fiszkę"
- [ ] W `useDashboardManager`: Zaimplementować `createManualFlashcard(data)`
  - Optymistic update: dodanie tymczasowej fiszki z `id = Date.now().toString()`
  - Wywołanie `flashcardService.createManualFlashcard()`
  - Zastąpienie temp ID prawdziwym ID z odpowiedzi

### 10. Optymistic updates (useOptimistic)

- [ ] W `useDashboardManager`: Dodać `useOptimistic` dla `flashcards`:
  ```typescript
  const [optimisticFlashcards, addOptimisticFlashcard] = useOptimistic(
    flashcards,
    (state, newFlashcard: FlashcardViewModel) => [newFlashcard, ...state]
  );
  ```
- [ ] Zastosować dla operacji:
  - Create: dodanie z `status: 'syncing'`
  - Update: zmiana pól z `status: 'syncing'`
  - Delete: usunięcie z listy
- [ ] W przypadku błędu API: automatyczne wycofanie + toast notification

### 11. Edycja inline (FlashcardItem)

- [ ] W `FlashcardItem`: Dodać stan lokalny `isEditing: boolean`
- [ ] W trybie edycji:
  - Zamiana tekstu na `Input` (front) i `Textarea` (back)
  - Walidacja: front ≤ 300, back ≤ 600
  - Przyciski: "Zapisz" (disabled jeśli walidacja fails), "Anuluj"
- [ ] W trybie readonly:
  - Wyświetlanie tekstu + badge `source_type`
  - Button "Edytuj" (ikona)
- [ ] Wywołanie `onUpdate(id, { front, back })` przy zapisie

### 12. Usuwanie z AlertDialog

- [ ] Zainstalować brakujące komponenty shadcn/ui:
  - `npx shadcn@latest add alert-dialog`
- [ ] W `FlashcardItem`: Dodać button "Usuń" (ikona)
- [ ] Po kliknięciu: Otwarcie `shadcn/AlertDialog` z potwierdzeniem
- [ ] Po potwierdzeniu: Wywołanie `onDelete(id)`

### 13. Loading states

- [ ] Zainstalować komponenty shadcn/ui:
  - `npx shadcn@latest add skeleton`
- [ ] Dodać `Skeleton` dla:
  - Początkowe ładowanie listy (`viewState === 'loadingList'`)
  - Ładowanie więcej fiszek (button "Załaduj więcej" z spinnerem)
  - Generowanie AI (`isGenerating` w `AiGeneratorForm`)

### 14. Error handling & Toasts

- [ ] Zainstalować komponenty shadcn/ui:
  - `npx shadcn@latest add sonner` (toast notifications)
- [ ] Dodać `Toaster` w `DashboardView`
- [ ] Obsługa błędów:
  - Błąd ładowania listy: Komponent `ErrorState` z przyciskiem "Spróbuj ponownie"
  - Błąd generowania AI: Toast + komunikat pod formularzem
  - Błędy CRUD: Toast po wycofaniu optimistic update
  - Błąd akceptacji AI: Toast + propozycje pozostają widoczne

### 15. Dostępność (a11y)

- [ ] Dodać `aria-label` dla przycisków-ikon (Edit, Delete)
- [ ] Dodać `aria-live="polite"` dla licznika znaków
- [ ] Zarządzanie focusem:
  - Po wejściu w tryb edycji → focus na pierwszy input
  - Po zamknięciu `AlertDialog` → focus na button "Usuń"
  - Po akceptacji AI → focus na pierwszy nowy element listy

### 16. Testowanie user stories

- [ ] US-004: Generowanie fiszek AI (1000-10000 znaków)
- [ ] US-005: Przeglądanie propozycji AI + akceptacja/odrzucenie
- [ ] US-006: Przeglądanie listy fiszek z paginacją
- [ ] US-007: Dodawanie ręcznej fiszki
- [ ] US-008: Edycja fiszki
- [ ] US-009: Usuwanie fiszki
- [ ] US-010: Wyświetlanie EmptyState

## What I Actually Did (vs Plan)

### Iteracja 1: Struktura + Lista (read-only) ✅ UKOŃCZONE

**Krok 1/3: Struktura plików + szkielet komponentów**

- ✅ Utworzono folder structure: `app/dashboard/`, `components/dashboard/`, `hooks/`, `lib/services/`, `lib/types/`
- ✅ Utworzono `hooks/useDashboardManager.ts` ze szkieletem:
  - Wszystkie typy stanu (`ViewState`, `flashcards`, `pagination`, `aiProposals`, `viewState`, `error`)
  - Wszystkie funkcje (szkielety z console.log)
- ✅ Utworzono `lib/types/viewModels.ts` z typem `FlashcardViewModel`
- ✅ Utworzono `components/dashboard/EmptyState.tsx` - prosty komponent z przyciskiem "Generuj z AI"
- ✅ Utworzono `components/dashboard/DashboardView.tsx` - główny 'use client' komponent
- ✅ Utworzono `app/dashboard/page.tsx` - wrapper strony

**Krok 2/3: API Service Layer**

- ✅ Utworzono `lib/services/flashcardService.ts` z wszystkimi 6 funkcjami:
  - `fetchFlashcards()` - GET /api/flashcards z query params
  - `generateAiFlashcards()` - POST /api/ai/generations
  - `acceptAiGeneration()` - POST /api/ai/generations/accept
  - `createManualFlashcard()` - POST /api/flashcards
  - `updateFlashcard()` - PATCH /api/flashcards/{id}
  - `deleteFlashcard()` - DELETE /api/flashcards/{id}
- ✅ Dodano klasę `ApiError` dla typowanych błędów API
- ✅ Zaimplementowano `apiFetch<T>()` wrapper z obsługą błędów i 204 No Content

**Krok 3/3: GET /api/flashcards w hooku**

- ✅ Zainstalowano `shadcn/ui skeleton` component
- ✅ W `useDashboardManager`:
  - Dodano `useEffect` do ładowania pierwszej strony (page=1, page_size=20)
  - Zaimplementowano `loadMoreFlashcards()` z concat logic
  - Dodano computed value `hasMore` dla paginacji
  - Obsługa błędów z `ApiError`
- ✅ W `DashboardView`:
  - Skeleton loading state dla initial load
  - Error state z przyciskiem "Spróbuj ponownie"
  - "Load More" button z disabled state podczas ładowania
  - Debug info: liczba fiszek, strona, total_pages

**TypeScript check:** ✅ Wszystko kompiluje się bez błędów

**Stan implementacji:**

- Routing `/dashboard` działa ✅
- Ładowanie pierwszej strony z API (mock) ✅
- Paginacja "Load More" ✅
- EmptyState dla pustej listy ✅
- Loading states (Skeleton, button disabled) ✅
- Error handling (error state, try again) ✅

### Iteracja 2: AI Flow (core value proposition) ✅ UKOŃCZONE

**Krok 4/6: FlashcardList + FlashcardItem (read-only)**

- ✅ Zainstalowano `shadcn/ui badge` component
- ✅ Utworzono `components/dashboard/FlashcardItem.tsx`:
  - Card z front/back display
  - Badge dla source_type (manual/ai/ai-edited) z różnymi wariantami
  - Formatowanie daty created_at (dzisiaj/wczoraj/X dni temu)
  - Placeholder buttony Edit/Delete (disabled)
- ✅ Utworzono `components/dashboard/FlashcardList.tsx`:
  - Mapowanie flashcards na FlashcardItem
  - Przycisk "Załaduj więcej" z isLoadingMore state
  - Props: onUpdate, onDelete przekazywane do items
- ✅ Zintegrowano FlashcardList z DashboardView

**Krok 5/6: AI Generator Form**

- ✅ Zainstalowano `shadcn/ui textarea` component
- ✅ Utworzono `components/dashboard/AiGeneratorForm.tsx`:
  - Textarea z licznikiem znaków (live update)
  - Walidacja: 1000 ≤ length ≤ 10000 (disabled button)
  - Kolory licznika: czerwony (za dużo), zielony (OK), szary (za mało)
  - Pomocniczy tekst: "jeszcze X znaków" / "za dużo: X"
  - aria-live="polite" dla accessibility
  - Loading state podczas generowania
- ✅ W `useDashboardManager`: Zaimplementowano `generateAiProposals()`:
  - Wywołanie `flashcardService.generateAiFlashcards()`
  - Ustawienie stanu `generatingAi`
  - Zapisanie response do `aiProposals`
  - Error handling z ApiError
- ✅ Zintegrowano AiGeneratorForm z DashboardView

**Krok 6/6: AI Proposals List**

- ✅ Zainstalowano `shadcn/ui checkbox` component
- ✅ Utworzono `components/dashboard/AiProposalItem.tsx`:
  - Card z checkboxem
  - Wyświetlanie front/back propozycji
  - Border highlight dla zaznaczonych (border-primary)
- ✅ Utworzono `components/dashboard/AiProposalsList.tsx`:
  - Stan lokalny `selectedIndices: Set<number>`
  - Mapowanie proposals na AiProposalItem
  - Licznik zaznaczonych propozycji
  - Przyciski:
    - "Akceptuj zaznaczone (X)" - disabled jeśli brak selekcji
    - "Odrzuć wszystko" - destructive variant
- ✅ W `useDashboardManager`: Zaimplementowano `acceptAiProposals()`:
  - Wywołanie `flashcardService.acceptAiGeneration()`
  - Czyszczenie `aiProposals` (null)
  - Odświeżenie listy fiszek (page=1) - nowe fiszki na górze
  - Error handling
- ✅ W `useDashboardManager`: `rejectAiProposals()` już działał (setAiProposals(null))
- ✅ Zintegrowano AiProposalsList z DashboardView (conditional render)

**TypeScript check:** ✅ Wszystko kompiluje się bez błędów

**Stan implementacji:**

- Formularz generowania AI z walidacją ✅
- Generowanie propozycji (POST /api/ai/generations) ✅
- Wyświetlanie propozycji z checkboxami ✅
- Akceptacja wybranych (POST /api/ai/generations/accept) ✅
- Odrzucenie wszystkich ✅
- Odświeżanie listy fiszek po akceptacji ✅
- **KOMPLETNY FLOW AI działa end-to-end!** ✅

### Dodatkowe zmiany UX (post-iteracja 2)

**UX Improvement 1: Grid layout dla fiszek**

- ✅ Zmieniono `FlashcardList` z pionowej listy na grid 3 kolumny
- ✅ Responsive: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- ✅ Mobile (1 kolumna) → Tablet (2 kolumny) → Desktop (3 kolumny)

**UX Improvement 2: Grid layout dla propozycji AI**

- ✅ Zmieniono `AiProposalsList` z pionowej listy na grid 3 kolumny
- ✅ Responsive: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- ✅ Lepsza wizualizacja wielu propozycji jednocześnie

**UX Improvement 3: Wizualne wyróżnienie zaznaczonych propozycji**

- ✅ Dodano zieloną otoczkę dla zaznaczonych propozycji:
  - `border-2 border-green-500` - grubszy zielony border
  - `bg-green-50/50` - lekkie zielone tło (light mode)
  - `dark:bg-green-950/20` - ciemne zielone tło (dark mode)
- ✅ Zastąpiono `border-primary` bardziej wyrazistym zielonym kolorem

**UX Improvement 4: Czyszczenie textarea po akcji**

- ✅ Dodano mechanizm `formResetKey` w `useDashboardManager`
- ✅ Po akceptacji propozycji → textarea automatycznie się czyści
- ✅ Po odrzuceniu propozycji → textarea automatycznie się czyści
- ✅ Używa React key prop do wymuszenia remount komponentu

**Techniczne detale:**

- Docker rebuild był wymagany dla `@radix-ui/react-checkbox` dependency
- Komenda: `docker-compose build --no-cache app && docker-compose up -d app`
- Problem z anonymous volumes został rozwiązany przez usunięcie kontenera

## Zmiany w planie

_Znaczące zmiany wymagające re-approval będą tutaj dokumentowane_

## Notatki MVP

**Świadome uproszczenia (można dodać później bez breaking changes):**

- Brak bulk delete (można dodać checkbox selection)
- Brak filtrowania po source_type (można dodać dropdown)
- Brak search (można dodać input + debounced query)
- Brak sortowania (fixed: created_at DESC)
- Brak undo dla delete (można dodać toast z "Cofnij")
- Brak auto-save dla edycji (explicit Save/Cancel)

**Anti-patterns do uniknięcia:**

- ❌ Osobne stany dla każdej operacji (używamy `viewState`)
- ❌ Ręczne zarządzanie optimistic updates (używamy `useOptimistic`)
- ❌ Inline error messages w formularzach (tylko disabled buttons + toast na submit)
- ❌ Nested fetch cascade (wszystkie operacje są niezależne)
- ❌ Mutating state directly (zawsze immutable updates)

## Pytania do rozstrzygnięcia

- [ ] Czy EmptyState powinien mieć button "Dodaj fiszkę" czy "Generuj z AI"?
  - **Decyzja**: "Generuj z AI" (scroll do formularza) - promuje core value proposition
- [ ] Czy paginacja "Load More" czy klasyczne strony 1, 2, 3?
  - **Decyzja**: "Load More" (append) - lepszy UX dla mobile, mniej klików
- [ ] Czy przy akceptacji AI odświeżamy całą listę czy tylko append?
  - **Decyzja**: Odświeżamy całą listę (`page=1`) - nowe fiszki na górze, prostsza implementacja
