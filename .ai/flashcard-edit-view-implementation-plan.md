# Plan implementacji funkcjonalności edycji fiszek w widoku Dashboard

## 1. Przegląd

Implementacja inline editing dla fiszek w widoku dashboard (`/dashboard`). Użytkownik może kliknąć ikonę edycji przy fiszce, co zamienia statyczny widok na edytowalne pola tekstowe. Po wprowadzeniu zmian użytkownik może zapisać (aktualizacja przez API) lub anulować (przywrócenie oryginalnych wartości). Zgodnie z `US-011` i wymaganiem `F-09`.

**Kluczowe cechy:**

- Inline editing (bez osobnego formularza/modala)
- Walidacja długości pól (front: 1-300 znaków, back: 1-600 znaków)
- Optimistic UI updates dla responsywności
- Automatyczna zmiana badge'a z "AI" na "AI (edytowana)" po edycji fiszki AI
- Focus management dla dostępności

## 2. Routing widoku

Funkcjonalność jest częścią istniejącego widoku **`/dashboard`** (nie wymaga nowego route).

## 3. Struktura komponentów

```
DashboardView (existing)
└── FlashcardList (existing)
    └── FlashcardItem (MODIFY)
        ├── FlashcardReadView (NEW - extracted)
        │   ├── Badge (source_type)
        │   ├── EditButton (ENABLE)
        │   ├── DeleteButton (existing)
        │   ├── Front text (read-only)
        │   └── Back text (read-only)
        └── FlashcardEditView (NEW)
            ├── Textarea (front) + CharacterCounter
            ├── Textarea (back) + CharacterCounter
            ├── ValidationErrors display
            ├── SaveButton
            └── CancelButton
```

**Legenda:**

- MODIFY - modyfikacja istniejącego komponentu
- NEW - nowy komponent do stworzenia
- ENABLE - włączenie disabled funkcjonalności
- existing - bez zmian

## 4. Szczegóły komponentów

### 4.1. FlashcardItem (MODIFY)

**Opis:**
Główny komponent reprezentujący pojedynczą fiszkę. Obecnie obsługuje tylko widok read-only i usuwanie. Wymaga dodania logiki inline editing - przełączania między trybem odczytu a edycji, zarządzania stanem edycji oraz komunikacji z API.

**Główne elementy:**

- Warunkowe renderowanie: `isEditing ? <FlashcardEditView /> : <FlashcardReadView />`
- Card container (z shadcn/ui)
- Props do zarządzania edycją (`onUpdate`, `onUpdateError`)

**Obsługiwane interakcje:**

- Kliknięcie przycisku "Edytuj" → włączenie trybu edycji (`handleEditClick`)
- Zapisanie zmian → walidacja → API call → optimistic update → toast success (`handleSave`)
- Anulowanie edycji → przywrócenie oryginalnych wartości → exit edit mode (`handleCancel`)
- Obsługa błędów API → rollback optimistic update → toast error

**Obsługiwana walidacja:**

- Brak (walidacja delegowana do `FlashcardEditView`)

**Typy:**

- `FlashcardViewModel` - dane fiszki z `lib/types/viewModels.ts`
- `UpdateFlashcardCommand` - command do wysłania na API (do poprawy - wymaga obu pól)
- `UpdateFlashcardResponseDto` - response z API

**Propsy:**

```typescript
interface FlashcardItemProps {
  flashcard: FlashcardViewModel;
  onUpdate?: (id: FlashcardId, updatedData: UpdateFlashcardResponseDto) => void; // optimistic update callback
  onUpdateError?: (id: FlashcardId, error: unknown) => void; // rollback callback
  onDelete?: (id: FlashcardId) => void; // existing
  onOptimisticDelete?: (id: FlashcardId) => void; // existing
  onDeleteError?: (id: FlashcardId, error: unknown) => void; // existing
}
```

**Stan lokalny:**

```typescript
const [isEditing, setIsEditing] = useState(false);
const [isSaving, setIsSaving] = useState(false);
// Oryginalne wartości do rollback
const originalFront = useRef(flashcard.front);
const originalBack = useRef(flashcard.back);
```

**Kluczowe funkcje:**

- `handleEditClick()` - rozpoczęcie edycji
- `handleSave(front: string, back: string)` - zapisanie zmian
- `handleCancel()` - anulowanie edycji

### 4.2. FlashcardReadView (NEW)

**Opis:**
Komponent odpowiedzialny za renderowanie fiszki w trybie read-only (widok statyczny). Wyodrębniony z `FlashcardItem` dla czytelności kodu. Wyświetla badge z source_type, datę utworzenia, przyciski akcji (edytuj, usuń) oraz treść fiszki (front/back).

**Główne elementy:**

- `CardHeader` z:
  - `Badge` - typ źródła ("Ręczna", "AI", "AI (edytowana)")
  - Data utworzenia (sformatowana)
  - Przyciski akcji:
    - `EditButton` - ikona ✏️ z `aria-label="Edytuj fiszkę"`
    - `DeleteButton` - existing component
- `CardContent` z:
  - Sekcja "PRZÓD" - tekst front
  - Sekcja "TYŁ" - tekst back

**Obsługiwane interakcje:**

- Kliknięcie `EditButton` → wywołanie `onEditClick()` przekazanego z parent

**Obsługiwana walidacja:**

- Brak (read-only view)

**Typy:**

- `FlashcardViewModel` - dane fiszki

**Propsy:**

```typescript
interface FlashcardReadViewProps {
  flashcard: FlashcardViewModel;
  onEditClick: () => void;
  onDeleteClick: () => void;
  isDeleting: boolean;
}
```

### 4.3. FlashcardEditView (NEW)

**Opis:**
Komponent odpowiedzialny za renderowanie fiszki w trybie edycji (inline editing). Wyświetla dwa edytowalne pola tekstowe (front i back) z licznikami znaków, komunikatami walidacji oraz przyciskami "Zapisz" i "Anuluj". Waliduje dane przed wysłaniem do parent component.

**Główne elementy:**

- Dwa `Textarea` (z shadcn/ui):
  - Front textarea (max 300 znaków)
  - Back textarea (max 600 znaków)
- `CharacterCounter` dla każdego pola:
  - Format: "X / 300" lub "X / 600"
  - Kolor czerwony gdy przekroczony limit
- Komunikaty błędów walidacji (pod każdym polem)
- Przyciski akcji:
  - `SaveButton` - "Zapisz" (primary, disabled podczas zapisywania lub gdy validation errors)
  - `CancelButton` - "Anuluj" (secondary, disabled podczas zapisywania)

**Obsługiwane interakcje:**

- Wpisywanie w textarea → aktualizacja lokalnego stanu → walidacja
- Kliknięcie "Zapisz" → walidacja → jeśli OK wywołanie `onSave()` z parent
- Kliknięcie "Anuluj" → wywołanie `onCancel()` z parent
- Naciśnięcie Escape → anulowanie (accessibility)
- Focus na pierwszym polu przy mount (accessibility)

**Obsługiwana walidacja:**

- **Front field:**
  - Nie może być pusty (po trim): "Przód fiszki nie może być pusty"
  - Max 300 znaków: "Przód fiszki może mieć maksymalnie 300 znaków"
  - Min 1 znak (po trim): automatycznie pokryte przez "nie może być pusty"

- **Back field:**
  - Nie może być pusty (po trim): "Tył fiszki nie może być pusty"
  - Max 600 znaków: "Tył fiszki może mieć maksymalnie 600 znaków"
  - Min 1 znak (po trim): automatycznie pokryte przez "nie może być pusty"

**Typy:**

- `ValidationErrors` - local type

**Propsy:**

```typescript
interface FlashcardEditViewProps {
  initialFront: string;
  initialBack: string;
  onSave: (front: string, back: string) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}
```

**Stan lokalny:**

```typescript
const [front, setFront] = useState(initialFront);
const [back, setBack] = useState(initialBack);
const [errors, setErrors] = useState<ValidationErrors>({
  front: undefined,
  back: undefined,
});
const frontInputRef = useRef<HTMLTextAreaElement>(null);
```

**Kluczowe funkcje:**

- `validateField(field: 'front' | 'back', value: string): string | undefined` - walidacja pojedynczego pola
- `validateAll(): boolean` - walidacja wszystkich pól przed zapisem
- `handleSave()` - walidacja → wywołanie onSave
- `handleCancel()` - wywołanie onCancel
- `handleKeyDown(e: KeyboardEvent)` - obsługa Escape

**Focus management:**

```typescript
useEffect(() => {
  // Auto-focus na pierwszym polu przy mount
  frontInputRef.current?.focus();
}, []);

// Po zapisaniu/anulowaniu focus wraca do przycisku "Edytuj" (handled by parent)
```

### 4.4. CharacterCounter (NEW - utility component)

**Opis:**
Mały komponent pomocniczy wyświetlający licznik znaków dla pola tekstowego. Pokazuje aktualną długość i maksymalną długość. Zmienia kolor na czerwony gdy przekroczony limit.

**Główne elementy:**

- `<span>` z tekstem w formacie "X / MAX"
- Conditional styling (red gdy current > max)

**Obsługiwane interakcje:**

- Brak (pure display component)

**Obsługiwana walidacja:**

- Brak

**Typy:**

- Brak (primitive props)

**Propsy:**

```typescript
interface CharacterCounterProps {
  current: number;
  max: number;
}
```

**Implementacja:**

```typescript
export function CharacterCounter({ current, max }: CharacterCounterProps) {
  const isOverLimit = current > max;

  return (
    <span className={cn(
      "text-xs",
      isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"
    )}>
      {current} / {max}
    </span>
  );
}
```

## 5. Typy

### 5.1. Istniejące typy (z lib/dto/types.ts)

```typescript
// UUID alias
export type FlashcardId = Flashcard["flashcard_id"];

// Enum dla typu źródła
export type FlashcardSourceType = "manual" | "ai" | "ai-edited";

// WYMAGA POPRAWY - obecnie Partial, powinno być required
export type UpdateFlashcardCommand = Partial<Pick<Flashcard, "front" | "back">>;

// Response DTO
export interface UpdateFlashcardResponseDto extends FlashcardCoreDto {
  source_type: FlashcardSourceType;
}

// Core flashcard shape
export interface FlashcardCoreDto extends Pick<Flashcard, "front" | "back"> {
  id: FlashcardId;
}
```

**WYMAGANA ZMIANA w lib/dto/types.ts:**

```typescript
// PRZED (błędne - Partial):
export type UpdateFlashcardCommand = Partial<Pick<Flashcard, "front" | "back">>;

// PO (poprawne - oba pola required):
export type UpdateFlashcardCommand = Pick<Flashcard, "front" | "back">;
```

**Uzasadnienie:**

- Backend endpoint to `PUT` (full update), nie `PATCH` (partial)
- Backend validation wymaga obu pól (front i back są required w `updateFlashcardBodySchema`)
- Dokumentacja w api-plan.md potwierdza: "both front and back required"

### 5.2. Istniejące typy (z lib/types/viewModels.ts)

```typescript
export interface FlashcardViewModel extends FlashcardListItemDto {
  id: FlashcardId | string;
  status?: "syncing" | "synced" | "error";
}
```

### 5.3. Nowe typy lokalne (w komponentach)

**W FlashcardEditView.tsx:**

```typescript
/**
 * Validation errors for edit form
 */
interface ValidationErrors {
  front?: string; // Error message for front field (undefined = no error)
  back?: string; // Error message for back field (undefined = no error)
}
```

## 6. Zarządzanie stanem

### 6.1. Stan lokalny w FlashcardItem

```typescript
// Tryb edycji
const [isEditing, setIsEditing] = useState<boolean>(false);

// Stan zapisywania (loading)
const [isSaving, setIsSaving] = useState<boolean>(false);

// Oryginalne wartości do rollback (useRef nie triggeruje re-render)
const originalFront = useRef<string>(flashcard.front);
const originalBack = useRef<string>(flashcard.back);

// Update refs gdy flashcard się zmieni (optimistic update)
useEffect(() => {
  if (!isEditing) {
    originalFront.current = flashcard.front;
    originalBack.current = flashcard.back;
  }
}, [flashcard.front, flashcard.back, isEditing]);
```

### 6.2. Stan lokalny w FlashcardEditView

```typescript
// Edytowane wartości
const [front, setFront] = useState<string>(initialFront);
const [back, setBack] = useState<string>(initialBack);

// Błędy walidacji
const [errors, setErrors] = useState<ValidationErrors>({
  front: undefined,
  back: undefined,
});

// Ref dla focus management
const frontInputRef = useRef<HTMLTextAreaElement>(null);
```

### 6.3. Stan globalny (parent - DashboardView)

Nie wymaga nowych zmiennych stanu globalnego. Używamy istniejącego mechanizmu callbacks:

- `onUpdate(id, updatedData)` - optimistic update w parent state
- `onUpdateError(id, error)` - rollback w parent state

### 6.4. Custom hook (opcjonalnie - future optimization)

Obecnie nie wymagany. W przyszłości można wyodrębnić logikę do `useFlashcardEdit`:

```typescript
function useFlashcardEdit(flashcard: FlashcardViewModel) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const originalFront = useRef(flashcard.front);
  const originalBack = useRef(flashcard.back);

  const startEdit = () => setIsEditing(true);
  const cancelEdit = () => setIsEditing(false);

  const saveEdit = async (front: string, back: string) => {
    setIsSaving(true);
    try {
      const response = await updateFlashcard(flashcard.id, { front, back });
      return response;
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  return {
    isEditing,
    isSaving,
    originalFront: originalFront.current,
    originalBack: originalBack.current,
    startEdit,
    cancelEdit,
    saveEdit,
  };
}
```

## 7. Integracja API

### 7.1. Endpoint

```
PUT /api/flashcards/{flashcard_id}
Authorization: Bearer <Supabase JWT>
Content-Type: application/json
```

### 7.2. Request Type

```typescript
UpdateFlashcardCommand = Pick<Flashcard, "front" | "back">;
```

**Request Body:**

```json
{
  "front": "string (1-300 chars, required)",
  "back": "string (1-600 chars, required)"
}
```

### 7.3. Response Type

```typescript
UpdateFlashcardResponseDto = {
  flashcard: {
    id: FlashcardId,
    front: string,
    back: string,
    source_type: FlashcardSourceType, // może się zmienić z 'ai' na 'ai-edited'
  },
};
```

**Response Body (200 OK):**

```json
{
  "flashcard": {
    "id": "uuid",
    "front": "updated front text",
    "back": "updated back text",
    "source_type": "ai-edited"
  }
}
```

### 7.4. Client Service Function

**WYMAGANA ZMIANA w lib/services/flashcard-service.client.ts:**

```typescript
// PRZED (błędne - używa PATCH):
export async function updateFlashcard(
  id: FlashcardId,
  command: UpdateFlashcardCommand
): Promise<UpdateFlashcardResponseDto> {
  return apiFetch<UpdateFlashcardResponseDto>(`${API_BASE}/flashcards/${id}`, {
    method: "PATCH", // ❌ BŁĄD
    body: JSON.stringify(command),
  });
}

// PO (poprawne - używa PUT):
export async function updateFlashcard(
  id: FlashcardId,
  command: UpdateFlashcardCommand
): Promise<UpdateFlashcardResponseDto> {
  return apiFetch<UpdateFlashcardResponseDto>(`${API_BASE}/flashcards/${id}`, {
    method: "PUT", // ✅ POPRAWKA
    body: JSON.stringify(command),
  });
}
```

### 7.5. Usage w FlashcardItem

```typescript
import {
  updateFlashcard,
  ApiError,
} from "@/lib/services/flashcard-service.client";

const handleSave = async (front: string, back: string) => {
  setIsSaving(true);

  // Optimistic update - natychmiast aktualizuj UI
  const optimisticData: UpdateFlashcardResponseDto = {
    flashcard: {
      id: flashcard.id,
      front,
      back,
      source_type:
        flashcard.source_type === "ai" ? "ai-edited" : flashcard.source_type,
    },
  };
  onUpdate?.(flashcard.id, optimisticData);

  try {
    // API call
    const response = await updateFlashcard(flashcard.id, { front, back });

    // Success - update with server response (może się różnić od optimistic)
    onUpdate?.(flashcard.id, response);
    toast.success("Fiszka zaktualizowana");
    setIsEditing(false);
  } catch (error) {
    // Error - rollback optimistic update
    onUpdateError?.(flashcard.id, error);

    // Show error message
    if (error instanceof ApiError) {
      switch (error.status) {
        case 400:
          toast.error("Nieprawidłowe dane. Sprawdź długość pól.");
          break;
        case 401:
          toast.error("Sesja wygasła. Zaloguj się ponownie.");
          break;
        case 404:
          toast.error("Fiszka nie istnieje lub została usunięta.");
          break;
        default:
          toast.error("Nie udało się zaktualizować fiszki. Spróbuj ponownie.");
      }
    } else {
      toast.error("Wystąpił nieoczekiwany błąd.");
    }

    console.error("[FlashcardItem] Update failed", {
      flashcardId: flashcard.id,
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    setIsSaving(false);
  }
};
```

### 7.6. Error Codes

| Status | Przyczyna                           | Obsługa w UI                                    |
| ------ | ----------------------------------- | ----------------------------------------------- |
| 200    | Success                             | Toast success, update state, exit edit mode     |
| 400    | Walidacja (długość pól, puste pola) | Toast error, zostań w edit mode                 |
| 401    | Unauthorized (token wygasł)         | Toast error, redirect do /login (opcjonalnie)   |
| 404    | Fiszka nie istnieje                 | Toast error, usuń z listy (przez onUpdateError) |
| 500    | Server error                        | Toast error, rollback optimistic update         |

## 8. Interakcje użytkownika

### 8.1. Rozpoczęcie edycji

**Akcja użytkownika:** Kliknięcie ikony ✏️ (przycisk "Edytuj")

**Przepływ:**

1. Użytkownik klika przycisk "Edytuj" przy fiszce
2. `FlashcardItem.handleEditClick()` zostaje wywołane
3. `setIsEditing(true)` - przełączenie trybu
4. `originalFront.current` i `originalBack.current` zachowują wartości do rollback
5. Component renderuje `<FlashcardEditView />` zamiast `<FlashcardReadView />`
6. `FlashcardEditView` automatycznie fokusuje pierwsze pole (front)

**Oczekiwany rezultat:**

- Widok zmienia się na formularz edycji
- Pola są wypełnione aktualnymi wartościami
- Focus jest na polu "front"
- Liczniki znaków są widoczne
- Przyciski "Zapisz" i "Anuluj" są widoczne

### 8.2. Edycja pól

**Akcja użytkownika:** Wpisywanie tekstu w pola textarea

**Przepływ:**

1. Użytkownik wpisuje/modyfikuje tekst w polu "front" lub "back"
2. `onChange` event aktualizuje lokalny stan (`setFront` lub `setBack`)
3. `CharacterCounter` aktualizuje się pokazując aktualną długość
4. (Opcjonalnie) Walidacja on-the-fly - pokazanie czerwonego koloru gdy > max

**Oczekiwany rezultat:**

- Tekst w polu aktualizuje się natychmiast
- Licznik znaków pokazuje aktualną długość
- Jeśli przekroczono limit → licznik jest czerwony

### 8.3. Zapisanie zmian (success)

**Akcja użytkownika:** Kliknięcie przycisku "Zapisz"

**Przepływ:**

1. Użytkownik klika "Zapisz"
2. `FlashcardEditView.handleSave()` waliduje pola
3. Jeśli walidacja OK → wywołanie `props.onSave(front, back)`
4. `FlashcardItem.handleSave()` wykonuje:
   - `setIsSaving(true)` - przycisk disabled, pokazuje spinner
   - Optimistic update: `onUpdate(id, optimisticData)` - natychmiastowa aktualizacja UI
   - API call: `updateFlashcard(id, { front, back })`
   - Success response → aktualizacja z danymi z serwera (może się różnić source_type)
   - `toast.success("Fiszka zaktualizowana")`
   - `setIsEditing(false)` - wyjście z trybu edycji
   - `setIsSaving(false)`
5. Focus wraca do przycisku "Edytuj" (nowy stan read-only)

**Oczekiwany rezultat:**

- Natychmiastowa aktualizacja fiszki w UI (optimistic)
- Przycisk "Zapisz" pokazuje loading (disabled + spinner)
- Toast success po zakończeniu
- Wyjście z trybu edycji
- Badge może się zmienić z "AI" na "AI (edytowana)"

### 8.4. Zapisanie zmian (validation error)

**Akcja użytkownika:** Kliknięcie przycisku "Zapisz" z nieprawidłowymi danymi

**Przepływ:**

1. Użytkownik klika "Zapisz"
2. `FlashcardEditView.handleSave()` waliduje pola
3. Wykryto błędy (np. pole puste, za długie)
4. `setErrors({ front: "...", back: "..." })` - ustawienie błędów
5. **NIE** wywołuje `props.onSave()` - nie wysyła do API

**Oczekiwany rezultat:**

- Komunikaty błędów pokazują się pod polami
- Użytkownik pozostaje w trybie edycji
- Może poprawić dane i spróbować ponownie

### 8.5. Zapisanie zmian (API error)

**Akcja użytkownika:** Kliknięcie przycisku "Zapisz" (API zwraca błąd)

**Przepływ:**

1. Użytkownik klika "Zapisz"
2. Walidacja OK → API call
3. Optimistic update wykonany
4. API zwraca błąd (400, 401, 404, 500)
5. `catch` block w `handleSave()`:
   - `onUpdateError(id, error)` - rollback optimistic update w parent
   - Toast z odpowiednim komunikatem błędu (na podstawie status code)
   - Pozostaje w trybie edycji (może spróbować ponownie)
   - `setIsSaving(false)`

**Oczekiwany rezultat:**

- Optimistic update jest rollback (fiszka wraca do oryginalnych wartości)
- Toast error z konkretnym komunikatem
- Użytkownik pozostaje w trybie edycji
- Może spróbować ponownie lub anulować

### 8.6. Anulowanie edycji

**Akcja użytkownika:** Kliknięcie przycisku "Anuluj" lub naciśnięcie Escape

**Przepływ:**

1. Użytkownik klika "Anuluj" lub naciska Escape
2. `FlashcardEditView.handleCancel()` → wywołanie `props.onCancel()`
3. `FlashcardItem.handleCancel()`:
   - `setIsEditing(false)` - wyjście z trybu edycji
   - Wartości nie są zapisywane (local state jest porzucany)
   - Focus wraca do przycisku "Edytuj"

**Oczekiwany rezultat:**

- Wyjście z trybu edycji bez zapisywania
- Fiszka pokazuje oryginalne wartości (sprzed rozpoczęcia edycji)
- Brak API call
- Brak toast message

## 9. Warunki i walidacja

### 9.1. Walidacja pola "front"

**Komponenty:** `FlashcardEditView`

**Warunki:**

1. **Niepuste pole (po trim):**
   - Warunek: `front.trim().length === 0`
   - Komunikat: "Przód fiszki nie może być pusty"
   - Wpływ: Przycisk "Zapisz" jest disabled, błąd pokazany pod polem

2. **Maksymalna długość:**
   - Warunek: `front.length > 300`
   - Komunikat: "Przód fiszki może mieć maksymalnie 300 znaków"
   - Wpływ: Przycisk "Zapisz" jest disabled, błąd pokazany pod polem, licznik znaków jest czerwony

**Implementacja:**

```typescript
function validateFront(value: string): string | undefined {
  if (value.trim().length === 0) {
    return "Przód fiszki nie może być pusty";
  }
  if (value.length > 300) {
    return "Przód fiszki może mieć maksymalnie 300 znaków";
  }
  return undefined; // No error
}
```

### 9.2. Walidacja pola "back"

**Komponenty:** `FlashcardEditView`

**Warunki:**

1. **Niepuste pole (po trim):**
   - Warunek: `back.trim().length === 0`
   - Komunikat: "Tył fiszki nie może być pusty"
   - Wpływ: Przycisk "Zapisz" jest disabled, błąd pokazany pod polem

2. **Maksymalna długość:**
   - Warunek: `back.length > 600`
   - Komunikat: "Tył fiszki może mieć maksymalnie 600 znaków"
   - Wpływ: Przycisk "Zapisz" jest disabled, błąd pokazany pod polem, licznik znaków jest czerwony

**Implementacja:**

```typescript
function validateBack(value: string): string | undefined {
  if (value.trim().length === 0) {
    return "Tył fiszki nie może być pusty";
  }
  if (value.length > 600) {
    return "Tył fiszki może mieć maksymalnie 600 znaków";
  }
  return undefined; // No error
}
```

### 9.3. Walidacja całego formularza

**Komponenty:** `FlashcardEditView`

**Warunek:**

- Oba pola muszą być prawidłowe (brak błędów)

**Wpływ na UI:**

- Przycisk "Zapisz" jest disabled jeśli `errors.front !== undefined || errors.back !== undefined`

**Implementacja:**

```typescript
function validateAll(): boolean {
  const frontError = validateFront(front);
  const backError = validateBack(back);

  setErrors({ front: frontError, back: backError });

  return frontError === undefined && backError === undefined;
}

const handleSave = async () => {
  if (!validateAll()) {
    return; // Don't proceed if validation fails
  }

  await onSave(front, back);
};
```

### 9.4. Stan przycisków

**Przycisk "Zapisz":**

- Disabled gdy: `isSaving || errors.front !== undefined || errors.back !== undefined`
- Pokazuje spinner gdy: `isSaving`

**Przycisk "Anuluj":**

- Disabled gdy: `isSaving`

## 10. Obsługa błędów

### 10.1. Błędy walidacji (client-side)

**Scenariusz:** Użytkownik próbuje zapisać fiszkę z pustym polem lub zbyt długim tekstem

**Obsługa:**

1. Walidacja wykrywa błąd przed wysłaniem request
2. Komunikat błędu pokazuje się pod odpowiednim polem
3. Przycisk "Zapisz" jest disabled
4. NIE wysyła request do API
5. Użytkownik może poprawić dane

**Przykład:**

```typescript
// W FlashcardEditView
{errors.front && (
  <p className="text-sm text-destructive mt-1">
    {errors.front}
  </p>
)}
```

### 10.2. Błąd 400 Bad Request

**Scenariusz:** Server odrzuca request (walidacja backend)

**Przyczyna:** Client-side validation nie wychwycił błędu (nie powinno się zdarzyć jeśli poprawnie zaimplementowane)

**Obsługa:**

```typescript
case 400:
  toast.error("Nieprawidłowe dane. Sprawdź długość pól.");
  // Pozostaje w edit mode - użytkownik może poprawić
  break;
```

### 10.3. Błąd 401 Unauthorized

**Scenariusz:** Token JWT wygasł

**Obsługa:**

```typescript
case 401:
  toast.error("Sesja wygasła. Zaloguj się ponownie.");
  // Opcjonalnie: redirect do /login
  // router.push('/login');
  break;
```

### 10.4. Błąd 404 Not Found

**Scenariusz:** Fiszka została usunięta (przez inną sesję/użytkownika)

**Obsługa:**

```typescript
case 404:
  toast.error("Fiszka nie istnieje lub została usunięta.");
  // Usuń z lokalnej listy przez onUpdateError callback
  onUpdateError?.(flashcard.id, error);
  setIsEditing(false); // Wyjdź z edit mode
  break;
```

W parent component (DashboardView):

```typescript
const handleUpdateError = (id: FlashcardId, error: unknown) => {
  if (error instanceof ApiError && error.status === 404) {
    // Usuń fiszkę z lokalnej listy
    setFlashcards((prev) => prev.filter((f) => f.id !== id));
  } else {
    // Rollback optimistic update - przywróć oryginalne wartości
    // (wymaga przechowywania snapshot przed optimistic update)
  }
};
```

### 10.5. Błąd 500 Server Error

**Scenariusz:** Problem z bazą danych lub nieoczekiwany błąd serwera

**Obsługa:**

```typescript
case 500:
default:
  toast.error("Nie udało się zaktualizować fiszki. Spróbuj ponownie.");
  // Rollback optimistic update
  onUpdateError?.(flashcard.id, error);
  // Pozostaje w edit mode - użytkownik może spróbować ponownie
  break;
```

### 10.6. Network Error

**Scenariusz:** Brak połączenia z internetem, timeout

**Obsługa:**

```typescript
} catch (error) {
  if (!(error instanceof ApiError)) {
    // Prawdopodobnie network error
    toast.error("Problem z połączeniem. Sprawdź internet i spróbuj ponownie.");
    onUpdateError?.(flashcard.id, error);
  }
  // ... rest of error handling
}
```

### 10.7. Optimistic Update Rollback

**Mechanizm:**

1. Przed optimistic update - parent zachowuje snapshot aktualnego stanu
2. Optimistic update - natychmiastowa aktualizacja UI
3. API call
4. Jeśli błąd → wywołanie `onUpdateError(id, error)`
5. Parent przywraca snapshot (rollback)

**Implementacja w DashboardView:**

```typescript
const [flashcards, setFlashcards] = useState<FlashcardViewModel[]>([]);
const flashcardsSnapshot = useRef<Map<FlashcardId, FlashcardViewModel>>(
  new Map()
);

const handleUpdate = (
  id: FlashcardId,
  updatedData: UpdateFlashcardResponseDto
) => {
  setFlashcards((prev) => {
    // Zachowaj snapshot przed optimistic update (tylko jeśli nie ma jeszcze)
    const current = prev.find((f) => f.id === id);
    if (current && !flashcardsSnapshot.current.has(id)) {
      flashcardsSnapshot.current.set(id, { ...current });
    }

    // Optimistic update
    return prev.map((f) =>
      f.id === id ? { ...f, ...updatedData.flashcard, status: "syncing" } : f
    );
  });
};

const handleUpdateError = (id: FlashcardId, error: unknown) => {
  // Rollback z snapshot
  const snapshot = flashcardsSnapshot.current.get(id);
  if (snapshot) {
    setFlashcards((prev) => prev.map((f) => (f.id === id ? snapshot : f)));
    flashcardsSnapshot.current.delete(id); // Cleanup
  }
};

// Cleanup snapshot po sukcesie (w handleUpdate przy otrzymaniu server response)
```

## 11. Kroki implementacji

### Krok 1: Poprawki w typach i client service

**Pliki:**

- `lib/dto/types.ts`
- `lib/services/flashcard-service.client.ts`

**Zadania:**

1. Zmień `UpdateFlashcardCommand` z `Partial<Pick<...>>` na `Pick<Flashcard, "front" | "back">` (usuń Partial)
2. Zmień metodę HTTP w `updateFlashcard()` z `PATCH` na `PUT`
3. Zweryfikuj type checking: `npx tsc --noEmit`

**Commit message:** `fix(types): correct UpdateFlashcardCommand to require both fields and use PUT method`

### Krok 2: Stworzenie komponentu CharacterCounter

**Plik:** `components/dashboard/CharacterCounter.tsx`

**Zadania:**

1. Stwórz plik z komponentem
2. Implementuj logikę wyświetlania licznika z conditional styling
3. Dodaj testy jednostkowe (opcjonalnie)

**Kod:**

```typescript
import { cn } from "@/lib/utils";

interface CharacterCounterProps {
  current: number;
  max: number;
}

export function CharacterCounter({ current, max }: CharacterCounterProps) {
  const isOverLimit = current > max;

  return (
    <span
      className={cn(
        "text-xs",
        isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"
      )}
      aria-live="polite"
    >
      {current} / {max}
    </span>
  );
}
```

**Commit message:** `feat(ui): add CharacterCounter component for text fields`

### Krok 3: Stworzenie komponentu FlashcardEditView

**Plik:** `components/dashboard/FlashcardEditView.tsx`

**Zadania:**

1. Stwórz plik z komponentem
2. Implementuj formularz z dwoma textarea
3. Dodaj CharacterCounter dla każdego pola
4. Implementuj walidację (validateFront, validateBack, validateAll)
5. Dodaj przyciski "Zapisz" i "Anuluj"
6. Implementuj focus management (auto-focus na mount)
7. Obsłuż Escape key dla anulowania
8. Dodaj aria-labels dla accessibility

**Szkielet:**

```typescript
"use client";

import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CharacterCounter } from "./CharacterCounter";

interface ValidationErrors {
  front?: string;
  back?: string;
}

interface FlashcardEditViewProps {
  initialFront: string;
  initialBack: string;
  onSave: (front: string, back: string) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export function FlashcardEditView({
  initialFront,
  initialBack,
  onSave,
  onCancel,
  isSaving,
}: FlashcardEditViewProps) {
  const [front, setFront] = useState(initialFront);
  const [back, setBack] = useState(initialBack);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const frontInputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus na mount
  useEffect(() => {
    frontInputRef.current?.focus();
  }, []);

  // Validation functions
  const validateFront = (value: string): string | undefined => {
    if (value.trim().length === 0) {
      return "Przód fiszki nie może być pusty";
    }
    if (value.length > 300) {
      return "Przód fiszki może mieć maksymalnie 300 znaków";
    }
    return undefined;
  };

  const validateBack = (value: string): string | undefined => {
    if (value.trim().length === 0) {
      return "Tył fiszki nie może być pusty";
    }
    if (value.length > 600) {
      return "Tył fiszki może mieć maksymalnie 600 znaków";
    }
    return undefined;
  };

  const validateAll = (): boolean => {
    const frontError = validateFront(front);
    const backError = validateBack(back);
    setErrors({ front: frontError, back: backError });
    return frontError === undefined && backError === undefined;
  };

  // Handlers
  const handleSave = async () => {
    if (!validateAll()) return;
    await onSave(front, back);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel();
    }
  };

  const hasErrors = errors.front !== undefined || errors.back !== undefined;

  return (
    <div className="space-y-4" onKeyDown={handleKeyDown}>
      {/* Front field */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label htmlFor="edit-front" className="text-xs font-medium text-muted-foreground">
            PRZÓD
          </label>
          <CharacterCounter current={front.length} max={300} />
        </div>
        <Textarea
          id="edit-front"
          ref={frontInputRef}
          value={front}
          onChange={(e) => setFront(e.target.value)}
          disabled={isSaving}
          className="min-h-[80px]"
          aria-label="Edytuj przód fiszki"
          aria-invalid={errors.front !== undefined}
          aria-describedby={errors.front ? "front-error" : undefined}
        />
        {errors.front && (
          <p id="front-error" className="text-sm text-destructive" role="alert">
            {errors.front}
          </p>
        )}
      </div>

      {/* Back field */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label htmlFor="edit-back" className="text-xs font-medium text-muted-foreground">
            TYŁ
          </label>
          <CharacterCounter current={back.length} max={600} />
        </div>
        <Textarea
          id="edit-back"
          value={back}
          onChange={(e) => setBack(e.target.value)}
          disabled={isSaving}
          className="min-h-[120px]"
          aria-label="Edytuj tył fiszki"
          aria-invalid={errors.back !== undefined}
          aria-describedby={errors.back ? "back-error" : undefined}
        />
        {errors.back && (
          <p id="back-error" className="text-sm text-destructive" role="alert">
            {errors.back}
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSaving}
        >
          Anuluj
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={handleSave}
          disabled={isSaving || hasErrors}
        >
          {isSaving ? "Zapisywanie..." : "Zapisz"}
        </Button>
      </div>
    </div>
  );
}
```

**Commit message:** `feat(flashcards): add FlashcardEditView component with inline editing`

### Krok 4: Wyodrębnienie FlashcardReadView z FlashcardItem

**Plik:** `components/dashboard/FlashcardReadView.tsx`

**Zadania:**

1. Skopiuj kod read-only view z `FlashcardItem.tsx`
2. Stwórz nowy komponent `FlashcardReadView`
3. Oddziel logikę wyświetlania od logiki edycji
4. Włącz przycisk "Edytuj" (usuń `disabled`)

**Szkielet:**

```typescript
"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FlashcardViewModel } from "@/lib/types/viewModels";

interface FlashcardReadViewProps {
  flashcard: FlashcardViewModel;
  onEditClick: () => void;
  onDeleteClick: () => void;
  isDeleting: boolean;
}

export function FlashcardReadView({
  flashcard,
  onEditClick,
  onDeleteClick,
  isDeleting,
}: FlashcardReadViewProps) {
  // Format date helper
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Dzisiaj";
    if (diffDays === 1) return "Wczoraj";
    if (diffDays < 7) return `${diffDays} dni temu`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tyg. temu`;
    return date.toLocaleDateString("pl-PL");
  };

  // Badge variant helper
  const getSourceTypeBadge = (sourceType: string) => {
    switch (sourceType) {
      case "manual":
        return { label: "Ręczna", variant: "secondary" as const };
      case "ai":
        return { label: "AI", variant: "default" as const };
      case "ai-edited":
        return { label: "AI (edytowana)", variant: "outline" as const };
      default:
        return { label: sourceType, variant: "outline" as const };
    }
  };

  const badge = getSourceTypeBadge(flashcard.source_type);

  return (
    <>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Badge variant={badge.variant}>{badge.label}</Badge>
          <span className="text-xs text-muted-foreground">
            {formatDate(flashcard.created_at)}
          </span>
        </div>
        <div className="flex gap-2">
          {/* Edit button - ENABLED */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onEditClick}
            aria-label="Edytuj fiszkę"
          >
            ✏️
          </Button>
          {/* Delete button placeholder (actual DeleteFlashcardButton) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDeleteClick}
            disabled={isDeleting}
            aria-label="Usuń fiszkę"
          >
            🗑️
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <div className="text-xs font-medium text-muted-foreground">PRZÓD</div>
            <p className="text-sm">{flashcard.front}</p>
          </div>
          <div className="border-t pt-2">
            <div className="text-xs font-medium text-muted-foreground">TYŁ</div>
            <p className="text-sm">{flashcard.back}</p>
          </div>
        </div>
      </CardContent>
    </>
  );
}
```

**Commit message:** `refactor(flashcards): extract FlashcardReadView component`

### Krok 5: Modyfikacja FlashcardItem

**Plik:** `components/dashboard/FlashcardItem.tsx`

**Zadania:**

1. Dodać import `FlashcardReadView` i `FlashcardEditView`
2. Dodać import `updateFlashcard` z client service
3. Dodać stan edycji (`isEditing`, `isSaving`, refs dla rollback)
4. Dodać `onUpdate` i `onUpdateError` do props
5. Implementuj `handleEditClick()`
6. Implementuj `handleSave()` z optimistic update i error handling
7. Implementuj `handleCancel()`
8. Conditional rendering: `isEditing ? <FlashcardEditView /> : <FlashcardReadView />`
9. Zintegruj z `DeleteFlashcardButton` i `DeleteFlashcardModal` (existing)

**Modyfikacje:**

```typescript
"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { FlashcardReadView } from "./FlashcardReadView";
import { FlashcardEditView } from "./FlashcardEditView";
import { DeleteFlashcardModal } from "./DeleteFlashcardModal";
import {
  deleteFlashcard,
  updateFlashcard,
  ApiError,
} from "@/lib/services/flashcard-service.client";
import { toast } from "sonner";
import type { FlashcardViewModel } from "@/lib/types/viewModels";
import type {
  FlashcardId,
  UpdateFlashcardCommand,
  UpdateFlashcardResponseDto
} from "@/lib/dto/types";

interface FlashcardItemProps {
  flashcard: FlashcardViewModel;
  onUpdate?: (id: FlashcardId, data: UpdateFlashcardResponseDto) => void;
  onUpdateError?: (id: FlashcardId, error: unknown) => void;
  onDelete?: (id: FlashcardId) => void;
  onOptimisticDelete?: (id: FlashcardId) => void;
  onDeleteError?: (id: FlashcardId, error: unknown) => void;
}

export function FlashcardItem({
  flashcard,
  onUpdate,
  onUpdateError,
  onDelete,
  onOptimisticDelete,
  onDeleteError,
}: FlashcardItemProps) {
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Delete state (existing)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Store original values for rollback
  const originalFront = useRef(flashcard.front);
  const originalBack = useRef(flashcard.back);

  // Update refs when flashcard changes (optimistic update)
  useEffect(() => {
    if (!isEditing) {
      originalFront.current = flashcard.front;
      originalBack.current = flashcard.back;
    }
  }, [flashcard.front, flashcard.back, isEditing]);

  // Edit handlers
  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSave = async (front: string, back: string) => {
    setIsSaving(true);

    // Optimistic update
    const optimisticData: UpdateFlashcardResponseDto = {
      flashcard: {
        id: flashcard.id,
        front,
        back,
        source_type: flashcard.source_type === 'ai' ? 'ai-edited' : flashcard.source_type,
      },
    };
    onUpdate?.(flashcard.id, optimisticData);

    try {
      // API call
      const response = await updateFlashcard(flashcard.id, { front, back });

      // Success - update with server response
      onUpdate?.(flashcard.id, response);
      toast.success("Fiszka zaktualizowana");
      setIsEditing(false);
    } catch (error) {
      // Error - rollback optimistic update
      onUpdateError?.(flashcard.id, error);

      // Show error message
      if (error instanceof ApiError) {
        switch (error.status) {
          case 400:
            toast.error("Nieprawidłowe dane. Sprawdź długość pól.");
            break;
          case 401:
            toast.error("Sesja wygasła. Zaloguj się ponownie.");
            break;
          case 404:
            toast.error("Fiszka nie istnieje lub została usunięta.");
            setIsEditing(false); // Exit edit mode
            break;
          default:
            toast.error("Nie udało się zaktualizować fiszki. Spróbuj ponownie.");
        }
      } else {
        toast.error("Wystąpił nieoczekiwany błąd.");
      }

      console.error("[FlashcardItem] Update failed", {
        flashcardId: flashcard.id,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  // Delete handlers (existing - keep as is)
  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async (flashcardId: FlashcardId) => {
    // ... existing delete logic
  };

  return (
    <Card data-testid="flashcard-item">
      {isEditing ? (
        <FlashcardEditView
          initialFront={flashcard.front}
          initialBack={flashcard.back}
          onSave={handleSave}
          onCancel={handleCancel}
          isSaving={isSaving}
        />
      ) : (
        <FlashcardReadView
          flashcard={flashcard}
          onEditClick={handleEditClick}
          onDeleteClick={handleDeleteClick}
          isDeleting={isDeleting}
        />
      )}

      {/* Delete confirmation modal (existing) */}
      <DeleteFlashcardModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        flashcardId={flashcard.id}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </Card>
  );
}
```

**Commit message:** `feat(flashcards): implement inline editing in FlashcardItem`

### Krok 6: Aktualizacja DashboardView/parent component

**Plik:** `components/dashboard/DashboardView.tsx` (lub gdzie jest zarządzanie listą fiszek)

**Zadania:**

1. Dodać snapshot mechanism dla optimistic update rollback
2. Implementuj `handleUpdate(id, data)` callback
3. Implementuj `handleUpdateError(id, error)` callback
4. Przekaż callbacks do `FlashcardItem` przez props

**Modyfikacje:**

```typescript
const [flashcards, setFlashcards] = useState<FlashcardViewModel[]>([]);
const flashcardsSnapshot = useRef<Map<FlashcardId, FlashcardViewModel>>(new Map());

const handleUpdate = (id: FlashcardId, updatedData: UpdateFlashcardResponseDto) => {
  setFlashcards(prev => {
    // Save snapshot before optimistic update (if not already saved)
    const current = prev.find(f => f.id === id);
    if (current && !flashcardsSnapshot.current.has(id)) {
      flashcardsSnapshot.current.set(id, { ...current });
    }

    // Optimistic update
    return prev.map(f =>
      f.id === id
        ? {
            ...f,
            front: updatedData.flashcard.front,
            back: updatedData.flashcard.back,
            source_type: updatedData.flashcard.source_type,
            status: 'syncing'
          }
        : f
    );
  });

  // Cleanup snapshot after successful update (from server)
  if (updatedData) {
    flashcardsSnapshot.current.delete(id);
  }
};

const handleUpdateError = (id: FlashcardId, error: unknown) => {
  // Rollback from snapshot
  const snapshot = flashcardsSnapshot.current.get(id);
  if (snapshot) {
    setFlashcards(prev => prev.map(f => f.id === id ? snapshot : f));
    flashcardsSnapshot.current.delete(id);
  }

  // If 404, remove from list
  if (error instanceof ApiError && error.status === 404) {
    setFlashcards(prev => prev.filter(f => f.id !== id));
  }
};

// In render:
<FlashcardItem
  flashcard={flashcard}
  onUpdate={handleUpdate}
  onUpdateError={handleUpdateError}
  // ... existing props
/>
```

**Commit message:** `feat(dashboard): add optimistic update handling for flashcard edits`

### Krok 7: Testy jednostkowe

**Pliki:**

- `components/dashboard/CharacterCounter.test.tsx`
- `components/dashboard/FlashcardEditView.test.tsx`

**Zadania:**

1. Testy dla `CharacterCounter`:
   - Wyświetla prawidłowy format "X / MAX"
   - Zmienia kolor na czerwony gdy > max
2. Testy dla `FlashcardEditView`:
   - Renderuje pola z początkowymi wartościami
   - Waliduje puste pola
   - Waliduje za długie pola
   - Wywołuje onSave z poprawnymi wartościami
   - Wywołuje onCancel
   - Obsługuje Escape key
   - Focus na pierwszym polu przy mount

**Commit message:** `test(flashcards): add unit tests for edit components`

### Krok 8: Testy E2E (opcjonalnie)

**Plik:** `e2e/dashboard/edit-flashcard.spec.ts`

**Zadania:**

1. Test: Użytkownik może edytować fiszkę i zapisać zmiany
2. Test: Użytkownik może anulować edycję (dane nie zmieniają się)
3. Test: Walidacja nie pozwala zapisać pustych pól
4. Test: Badge zmienia się z "AI" na "AI (edytowana)" po edycji
5. Test: Toast success pojawia się po zapisaniu

**Commit message:** `test(e2e): add end-to-end tests for flashcard editing`

### Krok 9: Dokumentacja

**Pliki:**

- `CHANGELOG.md`
- Opcjonalnie: User guide / docs

**Zadania:**

1. Dodaj entry do CHANGELOG
2. Zaktualizuj dokumentację użytkownika (jeśli istnieje)

**Commit message:** `docs: document flashcard inline editing feature`

### Krok 10: Final review i merge

**Zadania:**

1. Code review
2. Testy manualne w developerskim środowisku
3. Type check: `npx tsc --noEmit`
4. Linting: `npm run lint`
5. Build: `npm run build`
6. Merge do main branch
7. Deploy

---

## Podsumowanie

Plan implementacji inline editing dla fiszek obejmuje:

- Poprawki w typach (`UpdateFlashcardCommand` i HTTP method)
- 3 nowe komponenty: `CharacterCounter`, `FlashcardEditView`, `FlashcardReadView`
- Modyfikacje `FlashcardItem` z dodaniem logiki edycji
- Optimistic UI updates w parent component
- Kompleksową walidację i error handling
- Focus management dla accessibility
- Testy jednostkowe i E2E

Implementacja zgodna z `US-011`, wymaganiem `F-09`, i REST API endpoint `PUT /api/flashcards/{flashcard_id}`.
