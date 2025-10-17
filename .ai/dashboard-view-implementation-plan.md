# Plan implementacji widoku Główny (Dashboard)

## 1. Przegląd

Widok Główny (`Dashboard`) jest centralnym punktem aplikacji, w którym użytkownicy zarządzają swoimi fiszkami. Umożliwia generowanie fiszek przy użyciu AI, ręczne dodawanie, przeglądanie, edycję i usuwanie.

## 2. Routing widoku

Widok powinien być dostępny pod ścieżką `/dashboard`. Będzie to główny ekran aplikacji dla zalogowanych użytkowników.

## 3. Struktura komponentów

Komponenty zostaną zbudowane przy użyciu biblioteki `Shadcn/ui`. Struktura będzie zorganizowana w sposób hierarchiczny, z głównym komponentem (`DashboardView`) orkiestrującym stan i interakcje.

    /app/dashboard/page.tsx -> DashboardView ('use client')
    ├── AiGeneratorForm
    │   ├── shadcn/Textarea
    │   ├── shadcn/Button
    │   └── Licznik znaków
    ├── AiProposalsList (warunkowo)
    │   ├── shadcn/Button ("Akceptuj", "Odrzuć")
    │   └── AiProposalItem (mapowanie)
    │       ├── shadcn/Checkbox
    │       └── shadcn/Card
    ├── ManualFlashcardForm (warunkowo)
    │   ├── shadcn/Input
    │   ├── shadcn/Textarea
    │   └── shadcn/Button ("Zapisz", "Anuluj")
    ├── FlashcardList (warunkowo, w zależności od EmptyState)
    │   ├── FlashcardItem (mapowanie)
    │   │   ├── shadcn/Card
    │   │   ├── shadcn/Button (ikony Edytuj/Usuń)
    │   │   ├── shadcn/AlertDialog (dla potwierdzenia usunięcia)
    │   │   └── Pola formularza do edycji inline (warunkowo)
    │   └── shadcn/Button ("Załaduj więcej", warunkowo)
    └── EmptyState (warunkowo)
        ├── Komunikat
        └── shadcn/Button ("Wygeneruj swoje pierwsze fiszki")

## 4. Szczegóły komponentów

### `DashboardView`

- **Opis komponentu:** Główny kontener strony, oznaczony jako `'use client'`. Zarządza całym stanem widoku za pomocą customowego hooka `useDashboardManager` i przekazuje dane oraz handlery do komponentów-dzieci.
- **Główne elementy:** `AiGeneratorForm`, `AiProposalsList`, `FlashcardList`, `EmptyState`.
- **Obsługiwane interakcje:** Renderuje odpowiednie komponenty w zależności od stanu (np. `aiProposals`, `flashcards.length`).
- **Obsługiwana walidacja:** Brak walidacji na tym poziomie.
- **Typy:** `FlashcardViewModel`, `AiGenerationResponseDto`.
- **Propsy:** Brak (komponent strony).

### `AiGeneratorForm`

- **Opis komponentu:** Formularz do wprowadzania tekstu w celu wygenerowania fiszek przez AI.
- **Główne elementy:** `shadcn/Textarea` na tekst wejściowy, `<span>` z licznikiem znaków oraz `shadcn/Button` "Generuj".
- **Obsługiwane interakcje:** Wpisywanie tekstu, kliknięcie przycisku "Generuj".
- **Obsługiwana walidacja:**
  - Pole `textarea` musi zawierać od 1000 do 10000 znaków.
  - Przycisk "Generuj" jest nieaktywny (`disabled`), jeśli długość tekstu nie mieści się w wymaganym zakresie.
- **Typy:** Brak specyficznych typów DTO.
- **Propsy:**
  - `isGenerating: boolean` - do wyświetlania stanu ładowania na przycisku.
  - `onSubmit: (inputText: string) => void` - funkcja zwrotna wywoływana po zatwierdzeniu formularza.

### `AiProposalsList`

- **Opis komponentu:** Lista propozycji fiszek wygenerowanych przez AI, umożliwiająca użytkownikowi ich selekcję i akceptację.
- **Główne elementy:** Lista komponentów `AiProposalItem`, `shadcn/Button` "Akceptuj zaznaczone" oraz `shadcn/Button` (wariant `destructive`) "Odrzuć wszystko".
- **Obsługiwane interakcje:** Zaznaczanie/odznaczanie propozycji, akceptacja wybranych, odrzucenie wszystkich.
- **Obsługiwana walidacja:** Przycisk "Akceptuj zaznaczone" jest nieaktywny, jeśli żadna propozycja nie jest zaznaczona.
- **Typy:** `AiProposalDto`.
- **Propsy:**
  - `proposals: AiProposalDto[]` - tablica propozycji do wyświetlenia.
  - `onAccept: (selectedProposals: AiProposalDto[]) => void` - funkcja zwrotna z zaznaczonymi propozycjami.
  - `onReject: () => void` - funkcja zwrotna po odrzuceniu wszystkich propozycji.

### `FlashcardList`

- **Opis komponentu:** Renderuje listę zapisanych fiszek użytkownika.
- **Główne elementy:** Mapuje tablicę fiszek na komponenty `FlashcardItem`. Zawiera przycisk "Załaduj więcej", jeśli paginacja na to pozwala.
- **Obsługiwane interakcje:** Kliknięcie przycisku "Załaduj więcej".
- **Obsługiwana walidacja:** Brak.
- **Typy:** `FlashcardViewModel`.
- **Propsy:**
  - `flashcards: FlashcardViewModel[]` - lista fiszek do wyświetlenia.
  - `hasMore: boolean` - informuje, czy są kolejne strony do załadowania.
  - `onLoadMore: () => void` - funkcja do ładowania kolejnej strony fiszek.
  - `onUpdate: (id: FlashcardId, data: UpdateFlashcardCommand) => void` - handler do aktualizacji fiszki.
  - `onDelete: (id: FlashcardId) => void` - handler do usunięcia fiszki.

### `FlashcardItem`

- **Opis komponentu:** Reprezentuje pojedynczą fiszkę na liście. Obsługuje własny stan edycji (inline editing) oraz akcję usunięcia.
- **Główne elementy:** `shadcn/Card` z treścią fiszki. W trybie edycji wyświetla pola `shadcn/Input` lub `shadcn/Textarea`. Zawiera `shadcn/Button` z ikonami "Edytuj" i "Usuń" oraz `shadcn/AlertDialog` do potwierdzenia usunięcia.
- **Obsługiwane interakcje:** Wejście w tryb edycji, zapisanie zmian, anulowanie edycji, zainicjowanie i potwierdzenie usunięcia.
- **Obsługiwana walidacja:** Walidacja długości pól podczas edycji (`front` <= 300 znaków, `back` <= 600 znaków).
- **Typy:** `FlashcardViewModel`, `UpdateFlashcardCommand`, `FlashcardId`.
- **Propsy:**
  - `flashcard: FlashcardViewModel` - dane fiszki.
  - `onUpdate: (id: FlashcardId, data: UpdateFlashcardCommand) => void`.
  - `onDelete: (id: FlashcardId) => void`.

### `EmptyState`

- **Opis komponentu:** Wyświetlany, gdy użytkownik nie ma żadnych zapisanych fiszek.
- **Główne elementy:** Tekst informacyjny i `shadcn/Button` z wezwaniem do działania ("Wygeneruj fiszki z AI").
- **Obsługiwane interakcje:** Kliknięcie przycisku, które powinno przewinąć widok do formularza `AiGeneratorForm`.
- **Obsługiwana walidacja:** Brak.
- **Typy:** Brak.
- **Propsy:** Brak.

## 5. Typy

Oprócz typów DTO zdefiniowanych w `type_definitions`, wprowadzimy `ViewModel` do obsługi stanu UI, który nie jest częścią modelu danych serwera.

### `FlashcardViewModel`

Ten typ rozszerza `FlashcardListItemDto` o pola potrzebne do zarządzania stanem interfejsu, zwłaszcza przy optymistycznych aktualizacjach.

- `id: FlashcardId | string`
  - **Typ:** `string` (UUID z serwera) lub `string` (tymczasowe ID klienta, np. timestamp).
  - **Opis:** Unikalny identyfikator fiszki. Użycie tymczasowego ID jest kluczowe dla optymistycznego dodawania nowych elementów przed otrzymaniem odpowiedzi od API.
- `front: string`
- `back: string`
- `source_type: FlashcardSourceType`
- `created_at: string`
- `status?: 'syncing' | 'synced' | 'error'`
  - **Typ:** `string` (enum).
  - **Opis:** Opcjonalne pole do śledzenia stanu synchronizacji z API. `'syncing'` podczas wysyłania żądania, `'error'` w przypadku niepowodzenia. Pozwala na wyświetlenie wskaźnika ładowania lub błędu na poziomie pojedynczego elementu listy.

## 6. Zarządzanie stanem

Ze względu na złożoność widoku, cała logika zarządzania stanem, operacji CRUD i komunikacji z API zostanie zamknięta w customowym hooku `useDashboardManager`. Komponent `DashboardView` będzie go używał do pobierania stanu i funkcji obsługi zdarzeń.

### `useDashboardManager`

- **Cel:** Centralizacja logiki biznesowej widoku `/dashboard`.
- **Zarządzany stan:**
  - `flashcards: FlashcardViewModel[]`: Lista fiszek użytkownika.
  - `pagination: PaginationDto | null`: Informacje o paginacji z API.
  - `aiProposals: AiGenerationResponseDto | null`: Propozycje z AI do akceptacji.
  - `viewState: 'idle' | 'loadingList' | 'generatingAi' | 'acceptingProposals' | 'error'`: Ogólny stan widoku.
  - `error: string | null`: Komunikat o błędzie.
- **Funkcje (akcje):**
  - `generateAiProposals(text: string)`
  - `acceptAiProposals(selected: AiProposalDto[])`
  - `rejectAiProposals()`
  - `createManualFlashcard(data: CreateManualFlashcardCommand)`
  - `updateFlashcard(id: FlashcardId, data: UpdateFlashcardCommand)`
  - `deleteFlashcard(id: FlashcardId)`
  - `loadMoreFlashcards()`
- **Implementacja:** Hook wykorzysta `useOptimistic` z React 19 do natychmiastowych aktualizacji UI dla operacji `create`, `update` i `delete`, zapewniając automatyczne wycofanie zmian w przypadku błędu API.

## 7. Integracja API

Komunikacja z API będzie realizowana przez dedykowaną warstwę serwisową (np. `flashcardService`), która będzie wywoływana z poziomu hooka `useDashboardManager`.

- **Pobieranie listy fiszek:**
  - **Endpoint:** `GET /api/flashcards`
  - **Parametry zapytania:** `page`, `page_size`.
  - **Obsługa:** Wywoływane przy pierwszym ładowaniu widoku oraz przy kliknięciu "Załaduj więcej". Odpowiedź (`FlashcardListResponseDto`) aktualizuje stan `flashcards` i `pagination`.

- **Generowanie propozycji AI:**
  - **Endpoint:** `POST /api/ai/generations`
  - **Typ Ciała Żądania:** `CreateAiGenerationCommand` (`{ input_text: string }`)
  - **Obsługa:** Odpowiedź (`AiGenerationResponseDto`) jest zapisywana w stanie `aiProposals` i renderowana w `AiProposalsList`.

- **Akceptacja propozycji AI:**
  - **Endpoint:** `POST /api/ai/generations/accept`
  - **Typ Ciała Żądania:** `AcceptAiGenerationCommand` (`{ generation_id: string, proposals: AiProposalDto[] }`)
  - **Obsługa:** Po otrzymaniu statusu `204`, stan `aiProposals` jest czyszczony, a lista fiszek jest odświeżana przez ponowne wywołanie `GET /api/flashcards?page=1`, aby nowe fiszki pojawiły się na górze.

- **Tworzenie ręcznej fiszki:**
  - **Endpoint:** `POST /api/flashcards`
  - **Typ Ciała Żądania:** `CreateManualFlashcardCommand` (`{ front: string, back: string }`)
  - **Obsługa:** Akcja `createManualFlashcard` optymistycznie dodaje nową fiszkę do stanu. Po otrzymaniu odpowiedzi (`CreateManualFlashcardResponseDto`), tymczasowe ID klienta jest zastępowane prawdziwym ID z serwera.

- **Aktualizacja fiszki:** (`PATCH /api/flashcards/{id}`) i **Usuwanie fiszki:** (`DELETE /api/flashcards/{id}`) będą również obsługiwane optymistycznie z użyciem `useOptimistic`.

## 8. Interakcje użytkownika

- **Generowanie AI:** Użytkownik wpisuje tekst -> licznik znaków się aktualizuje, przycisk "Generuj" staje się aktywny -> klika "Generuj" -> formularz jest blokowany, pojawia się loader -> po chwili pojawia się `AiProposalsList`.
- **Akceptacja AI:** Użytkownik zaznacza checkboxy -> klika "Akceptuj zaznaczone" -> lista propozycji znika -> lista główna `FlashcardList` odświeża się z nowymi elementami na górze.
- **Dodawanie ręczne:** Użytkownik klika "Dodaj fiszkę" -> pojawia się `ManualFlashcardForm` -> wypełnia pola -> klika "Zapisz" -> formularz znika, a nowa fiszka natychmiast pojawia się na górze listy (optymistycznie).
- **Edycja fiszki:** Użytkownik klika ikonę "Edytuj" -> tekst fiszki zamienia się w edytowalne pola -> użytkownik wprowadza zmiany -> klika "Zapisz" -> pola znów stają się statycznym tekstem z nową treścią (optymistycznie).
- **Usuwanie fiszki:** Użytkownik klika ikonę "Usuń" -> pojawia się modal `AlertDialog` z prośbą o potwierdzenie -> klika "Usuń" -> modal znika, a fiszka natychmiast znika z listy (optymistycznie).

## 9. Warunki i walidacja

- **`AiGeneratorForm`**:
  - **Warunek**: Długość wprowadzonego tekstu musi być w przedziale [1000, 10000] znaków.
  - **Wpływ na UI**: Przycisk "Generuj" (`shadcn/Button`) ma atrybut `disabled` ustawiony na `true`, jeśli warunek nie jest spełniony.
  - **Weryfikacja**: W czasie rzeczywistym w handlerze `onChange` komponentu `shadcn/Textarea`.
- **`ManualFlashcardForm` / Edycja `FlashcardItem`**:
  - **Warunek 1**: Długość pola "Przód" musi być większa od 0 i mniejsza lub równa 300 znaków.
  - **Warunek 2**: Długość pola "Tył" musi być większa od 0 i mniejsza lub równa 600 znaków.
  - **Wpływ na UI**: Przycisk "Zapisz" jest `disabled`, jeśli którykolwiek z warunków nie jest spełniony.
  - **Weryfikacja**: W czasie rzeczywistym w handlerach `onChange` pól formularza.

## 10. Obsługa błędów

- **Błąd ładowania listy fiszek:** Jeśli początkowe `GET /api/flashcards` zawiedzie, zamiast `FlashcardList` i `EmptyState` zostanie wyświetlony komunikat o błędzie na całą sekcję, z przyciskiem "Spróbuj ponownie".
- **Błąd generowania AI:** Jeśli `POST /api/ai/generations` zawiedzie, pod formularzem generatora pojawi się przyjazny komunikat błędu, np. "Niestety, wystąpił błąd podczas generowania. Spróbuj ponownie za chwilę.".
- **Błędy optymistycznych aktualizacji (CRUD):** Dzięki `useOptimistic`, UI automatycznie powróci do stanu sprzed operacji. Dodatkowo, zostanie wyświetlony globalny komponent powiadomienia (toast/snackbar) z informacją o niepowodzeniu akcji, np. "Nie udało się usunąć fiszki".
- **Błąd akceptacji AI:** Jeśli `POST /api/ai/generations/accept` zawiedzie, lista propozycji pozostanie widoczna, a użytkownik otrzyma powiadomienie (toast) o błędzie.

## 11. Kroki implementacji

1.  **Struktura plików:** Stwórz plik `app/dashboard/page.tsx` oraz folder `components/dashboard/` na wszystkie komponenty-dzieci (`AiGeneratorForm.tsx`, `FlashcardList.tsx` itd.).
2.  **Hook stanu:** Zaimplementuj szkielet hooka `useDashboardManager` z definicjami stanu i pustymi funkcjami akcji.
3.  **Implementacja `GET /api/flashcards`:** W `useDashboardManager` zaimplementuj logikę pobierania pierwszej strony fiszek (`useEffect`) oraz paginacji (`loadMoreFlashcards`).
4.  **Komponenty listy:** Zbuduj komponenty `DashboardView`, `FlashcardList`, `FlashcardItem` (na razie tylko w trybie do odczytu) oraz `EmptyState`. Połącz je z danymi z hooka.
5.  **Implementacja Generatora AI:** Zbuduj `AiGeneratorForm`. W hooku `useDashboardManager` zaimplementuj `generateAiProposals` wywołujące `POST /api/ai/generations`.
6.  **Komponenty propozycji AI:** Zbuduj `AiProposalsList` i `AiProposalItem`. W `DashboardView` renderuj je warunkowo na podstawie stanu `aiProposals` z hooka.
7.  **Implementacja akceptacji/odrzucenia AI:** Zaimplementuj logikę `acceptAiProposals` i `rejectAiProposals` w hooku, w tym odświeżanie listy fiszek po akceptacji.
8.  **Implementacja ręcznego tworzenia:** Dodaj do `DashboardView` przycisk i logikę do pokazywania `ManualFlashcardForm`. W hooku zaimplementuj `createManualFlashcard` z użyciem `useOptimistic`.
9.  **Implementacja usuwania:** W `FlashcardItem` dodaj przycisk usuwania i `AlertDialog`. W hooku zaimplementuj `deleteFlashcard` z użyciem `useOptimistic`.
10. **Implementacja edycji inline:** W `FlashcardItem` dodaj logikę przełączania trybu edycji (`isEditing`). W hooku zaimplementuj `updateFlashcard` z `useOptimistic`.
11. **Dostępność i dopracowanie:** Przejrzyj wszystkie komponenty pod kątem dostępności (np. `aria-label` dla przycisków-ikon, zarządzanie focusem przy edycji inline). Dodaj stany ładowania (np. `Skeleton` z Shadcn) i obsłuż wszystkie przypadki błędów za pomocą powiadomień.
12. **Testowanie:** Przetestuj wszystkie historyjki użytkownika (`US-004` do `US-010`) i upewnij się, że wszystkie interakcje, walidacje i ścieżki błędów działają zgodnie z oczekiwaniami.

## 12. Dodatkowe zmiany

Po ukończeniu kroków implementacji 1-7 (Iteracja 1 i 2), wprowadzono następujące ulepszenia UX:

### 12.1. Layout gridu dla FlashcardList

**Zmiana:** Lista fiszek została zmieniona z układu pionowego na responsywny grid 3-kolumnowy.

**Implementacja:** W komponencie `FlashcardList` (`components/dashboard/FlashcardList.tsx:20-26`) zastosowano Tailwind CSS klasy do utworzenia responsywnego gridu:

```tsx
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
  {flashcards.map((flashcard) => (
    <FlashcardItem key={flashcard.id} {...props} />
  ))}
</div>
```

**Uzasadnienie:** Grid 3-kolumnowy umożliwia wyświetlenie większej liczby fiszek jednocześnie na ekranie, poprawiając przeglądalność kolekcji. Na urządzeniach mobilnych (< 768px) grid automatycznie przechodzi na 1 kolumnę, a na tabletach (768-1024px) na 2 kolumny.

### 12.2. Layout gridu dla AiProposalsList

**Zmiana:** Lista propozycji AI została zmieniona z układu pionowego na responsywny grid 3-kolumnowy.

**Implementacja:** W komponencie `AiProposalsList` (`components/dashboard/AiProposalsList.tsx:63-72`) zastosowano identyczny pattern gridu:

```tsx
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
  {proposals.map((proposal, index) => (
    <AiProposalItem key={index} {...props} />
  ))}
</div>
```

**Uzasadnienie:** Spójność UI z listą fiszek. Grid pozwala na szybkie przejrzenie wszystkich propozycji AI przed zaznaczeniem, co jest kluczowe dla osiągnięcia metryki sukcesu 75% akceptacji propozycji AI.

### 12.3. Wizualne wyróżnienie zaznaczonych propozycji

**Zmiana:** Dodano zieloną obwódkę i tło dla zaznaczonych propozycji AI.

**Implementacja:** W komponencie `AiProposalItem` (`components/dashboard/AiProposalItem.tsx:21-27`) dodano warunkowe stylowanie:

```tsx
<Card
  className={
    isSelected
      ? "border-2 border-green-500 bg-green-50/50 dark:bg-green-950/20"
      : ""
  }
>
```

**Uzasadnienie:** Wyraźne wskazanie wizualne zaznaczonych propozycji poprawia UX podczas selekcji fiszek. Użytkownik od razu widzi, które propozycje zostaną zaakceptowane. Kolor zielony jest semantycznie zgodny z akcją "akceptacji". Wsparcie dark mode zapewnia dostępność w obu motywach kolorystycznych.

### 12.4. Czyszczenie textarea po akceptacji propozycji

**Zmiana:** Pole tekstowe formularza AI jest automatycznie czyszczone po zaakceptowaniu propozycji.

**Implementacja:** Mechanizm składa się z dwóch części:

1. **Hook stanu** (`hooks/useDashboardManager.ts:36, 110`):

```tsx
const [formResetKey, setFormResetKey] = useState(0);

const acceptAiProposals = async (selected: AiProposalDto[]) => {
  // ... API call ...
  setFormResetKey((prev) => prev + 1); // Reset form
  // ...
};
```

2. **Komponent DashboardView** (`components/dashboard/DashboardView.tsx:77`):

```tsx
<AiGeneratorForm
  key={formResetKey}
  isGenerating={isGeneratingAi}
  onSubmit={generateAiProposals}
/>
```

**Uzasadnienie:** Po zaakceptowaniu propozycji, stary tekst wejściowy nie jest już potrzebny. Automatyczne czyszczenie formularza przygotowuje interfejs do następnej sesji generowania, eliminując konieczność ręcznego usuwania tekstu przez użytkownika. Mechanizm `key` powoduje całkowite odmontowanie i ponowne zamontowanie komponentu, resetując jego wewnętrzny stan React. Ten sam mechanizm działa również dla `rejectAiProposals()` (`hooks/useDashboardManager.ts:135`).
