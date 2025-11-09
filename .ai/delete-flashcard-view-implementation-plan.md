# Plan implementacji funkcjonalności usuwania fiszki

## 1. Przegląd

Implementacja funkcjonalności usuwania pojedynczej fiszki z listy w widoku Dashboard (`/dashboard`). Użytkownik będzie mógł usunąć fiszkę poprzez kliknięcie ikony "Usuń" przy pozycji na liście, co spowoduje wyświetlenie modalnego okna potwierdzenia. Po potwierdzeniu akcji fiszka zostanie natychmiast usunięta z interfejsu (optymistyczne UI) i wysłane zostanie żądanie do API. W przypadku błędu, fiszka zostanie przywrócona na liście wraz z wyświetleniem odpowiedniego komunikatu.

Funkcjonalność realizuje wymagania:

- `F-10`: Usuwanie istniejącej fiszki po potwierdzeniu
- `F-16`: Jasne komunikaty o akcjach niszczących
- `US-012`: Pełny przepływ usuwania z modalem potwierdzającym

## 2. Routing widoku

Funkcjonalność jest częścią widoku Dashboard dostępnego pod ścieżką:

- **Ścieżka:** `/dashboard`
- **Ochrona:** Wymaga uwierzytelnienia (chroniony route)

## 3. Struktura komponentów

```
Dashboard (istniejący)
└── FlashcardList (istniejący)
    └── FlashcardItem (rozszerzony)
        ├── FlashcardContent (istniejący)
        ├── FlashcardActions (istniejący/rozszerzony)
        │   ├── EditButton (istniejący)
        │   └── DeleteFlashcardButton (NOWY)
        └── DeleteFlashcardModal (NOWY)
```

### Hierarchia komponentów:

1. **FlashcardItem** - istniejący komponent, wymaga rozszerzenia o:
   - Stan modalu potwierdzenia usunięcia
   - Logikę optymistycznego usuwania
   - Obsługę błędów i rollback

2. **DeleteFlashcardButton** - nowy komponent:
   - Przycisk/ikona usuwania
   - Otwiera modal potwierdzenia

3. **DeleteFlashcardModal** - nowy komponent:
   - Modal z pytaniem potwierdzającym
   - Przyciski: "Usuń" i "Anuluj"
   - Obsługa klawiszy (Escape, Enter)

## 4. Szczegóły komponentów

### DeleteFlashcardButton

**Opis komponentu:**
Przycisk z ikoną kosza, który inicjuje proces usuwania fiszki. Wyświetlany w sekcji akcji każdej fiszki na liście.

**Główne elementy:**

- `<Button>` (shadcn/ui) z wariantem `ghost` i rozmiarem `icon`
- `<Trash2>` ikona z biblioteki `lucide-react`
- Atrybut `aria-label` dla dostępności: "Usuń fiszkę"

**Obsługiwane interakcje:**

- `onClick`: Otwiera modal potwierdzenia usunięcia
- `onKeyDown`: Obsługa klawiatury (Enter, Space)

**Obsługiwana walidacja:**

- Przycisk jest zawsze aktywny (walidacja przeniesiona do modalu)
- Weryfikacja `flashcard.id` przed otwarciem modalu (defensywne programowanie)

**Typy:**

- `FlashcardId` (z `@/lib/dto/types`)

**Propsy:**

```typescript
interface DeleteFlashcardButtonProps {
  flashcardId: FlashcardId;
  onDeleteClick: () => void; // Callback do otwarcia modalu
  disabled?: boolean; // Opcjonalne wyłączenie podczas operacji
}
```

---

### DeleteFlashcardModal

**Opis komponentu:**
Modalowe okno dialogowe z pytaniem potwierdzającym nieodwracalne usunięcie fiszki. Implementuje wzorzec "confirmation dialog" z wyraźnym ostrzeżeniem o konsekwencjach akcji.

**Główne elementy:**

- `<AlertDialog>` (shadcn/ui) - bazowy komponent modalu
  - `<AlertDialogContent>` - kontener zawartości
    - `<AlertDialogHeader>` - nagłówek z tytułem i opisem
      - `<AlertDialogTitle>`: "Czy na pewno chcesz usunąć tę fiszkę?"
      - `<AlertDialogDescription>`: "Ta akcja jest nieodwracalna. Fiszka zostanie trwale usunięta."
    - `<AlertDialogFooter>` - przyciski akcji
      - `<AlertDialogCancel>`: "Anuluj"
      - `<AlertDialogAction>`: "Usuń" (variant="destructive")

**Obsługiwane interakcje:**

- `onConfirm`: Wywołanie funkcji usuwania fiszki
- `onCancel`: Zamknięcie modalu bez zmian
- `onEscapeKeyDown`: Zamknięcie modalu (obsługiwane przez AlertDialog)
- `onOpenAutoFocus`: Ustawienie focusu na przycisku "Anuluj" (bezpieczniejsza opcja)

**Obsługiwana walidacja:**

- Weryfikacja czy `flashcardId` jest prawidłowym UUID przed wywołaniem API
- Blokowanie wielokrotnego kliknięcia podczas oczekiwania na odpowiedź API

**Typy:**

- `FlashcardId` (z `@/lib/dto/types`)

**Propsy:**

```typescript
interface DeleteFlashcardModalProps {
  open: boolean; // Stan otwarcia modalu
  onOpenChange: (open: boolean) => void; // Callback zmiany stanu
  flashcardId: FlashcardId; // ID fiszki do usunięcia
  onConfirm: (flashcardId: FlashcardId) => Promise<void>; // Async callback usuwania
  isDeleting?: boolean; // Stan ładowania podczas usuwania
}
```

---

### FlashcardItem (rozszerzenie istniejącego)

**Opis modyfikacji:**
Rozszerzenie istniejącego komponentu `FlashcardItem` o logikę usuwania fiszki z optymistycznym UI i obsługą błędów.

**Nowe elementy stanu:**

```typescript
const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);
```

**Nowa logika:**

```typescript
const handleDeleteClick = () => {
  setIsDeleteModalOpen(true);
};

const handleDeleteConfirm = async (flashcardId: FlashcardId) => {
  setIsDeleting(true);

  // Optymistyczne usunięcie z UI
  onOptimisticDelete?.(flashcardId);

  try {
    await deleteFlashcard(flashcardId);
    // Sukces - fiszka już usunięta z UI
    // Opcjonalnie: toast notification "Fiszka usunięta"
  } catch (error) {
    // Błąd - rollback optymistycznego usunięcia
    onDeleteError?.(flashcardId, error);

    // Wyświetlenie komunikatu błędu
    if (error instanceof ApiError) {
      if (error.status === 404) {
        // Fiszka już nie istnieje
        toast.error("Fiszka została już usunięta lub nie masz do niej dostępu");
      } else if (error.status === 401) {
        // Brak autoryzacji - przekierowanie do logowania (globalna obsługa)
        toast.error("Sesja wygasła. Zaloguj się ponownie");
      } else {
        toast.error("Nie udało się usunąć fiszki. Spróbuj ponownie");
      }
    } else {
      toast.error("Wystąpił nieoczekiwany błąd");
    }
  } finally {
    setIsDeleting(false);
    setIsDeleteModalOpen(false);
  }
};
```

**Nowe propsy:**

```typescript
interface FlashcardItemProps {
  // ... istniejące propsy ...
  onOptimisticDelete?: (flashcardId: FlashcardId) => void; // Callback dla optymistycznego usunięcia
  onDeleteError?: (flashcardId: FlashcardId, error: unknown) => void; // Callback dla błędu (rollback)
}
```

## 5. Typy

### Istniejące typy (z `@/lib/dto/types.ts`)

```typescript
// Typ ID fiszki (UUID)
export type FlashcardId = Flashcard["flashcard_id"];

// DTO pojedynczej fiszki na liście
export interface FlashcardListItemDto extends FlashcardCoreDto {
  source_type: FlashcardSourceType;
  created_at: string; // ISO-8601
}

// Rdzeń fiszki (id, front, back)
export interface FlashcardCoreDto extends Pick<Flashcard, "front" | "back"> {
  id: FlashcardId;
}
```

### Nowe typy (ViewModel dla komponentów)

```typescript
// ViewModel dla stanu usuwania w FlashcardList
interface FlashcardDeletionState {
  deletingIds: Set<FlashcardId>; // Zbiór ID fiszek będących w trakcie usuwania
  optimisticallyDeletedIds: Set<FlashcardId>; // Zbiór ID optymistycznie usuniętych fiszek
}

// Typ błędu API (istniejący w flashcard-service.client.ts)
class ApiError extends Error {
  status: number;
  message: string;
  code?: string;
}
```

## 6. Zarządzanie stanem

### Stan lokalny w FlashcardItem

```typescript
const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
const [isDeleting, setIsDeleting] = useState<boolean>(false);
```

**Cel:**

- `isDeleteModalOpen`: Kontroluje widoczność modalu potwierdzenia
- `isDeleting`: Informuje o trwającej operacji usuwania (blokuje wielokrotne kliknięcia)

### Stan w FlashcardList (rodzic)

```typescript
const [flashcards, setFlashcards] = useState<FlashcardListItemDto[]>([]);
const [optimisticallyDeleted, setOptimisticallyDeleted] = useState<
  Set<FlashcardId>
>(new Set());
```

**Cel:**

- `flashcards`: Główna lista fiszek
- `optimisticallyDeleted`: Zbiór ID fiszek optymistycznie usuniętych (do rollback w przypadku błędu)

**Logika optymistycznego usuwania:**

```typescript
const handleOptimisticDelete = (flashcardId: FlashcardId) => {
  // Zapamiętaj usuniętą fiszkę (do potencjalnego rollback)
  setOptimisticallyDeleted((prev) => new Set(prev).add(flashcardId));

  // Usuń z UI natychmiast
  setFlashcards((prev) => prev.filter((f) => f.id !== flashcardId));
};

const handleDeleteError = (flashcardId: FlashcardId, error: unknown) => {
  // Znajdź fiszkę w backup (optymisticallyDeleted)
  const deletedFlashcard = flashcards.find((f) => f.id === flashcardId);

  if (deletedFlashcard) {
    // Przywróć fiszkę na liście
    setFlashcards((prev) => [deletedFlashcard, ...prev]);
  }

  // Usuń z zbioru optymistycznie usuniętych
  setOptimisticallyDeleted((prev) => {
    const next = new Set(prev);
    next.delete(flashcardId);
    return next;
  });
};
```

### Custom hook (opcjonalnie)

Możliwe wyodrębnienie logiki do custom hooka `useOptimisticDelete`:

```typescript
function useOptimisticDelete<T extends { id: FlashcardId }>(
  items: T[],
  setItems: React.Dispatch<React.SetStateAction<T[]>>
) {
  const [optimisticallyDeleted, setOptimisticallyDeleted] = useState<
    Map<FlashcardId, T>
  >(new Map());

  const optimisticDelete = useCallback(
    (itemId: FlashcardId) => {
      const item = items.find((i) => i.id === itemId);
      if (item) {
        setOptimisticallyDeleted((prev) => new Map(prev).set(itemId, item));
        setItems((prev) => prev.filter((i) => i.id !== itemId));
      }
    },
    [items, setItems]
  );

  const rollbackDelete = useCallback(
    (itemId: FlashcardId) => {
      const item = optimisticallyDeleted.get(itemId);
      if (item) {
        setItems((prev) => [item, ...prev]);
        setOptimisticallyDeleted((prev) => {
          const next = new Map(prev);
          next.delete(itemId);
          return next;
        });
      }
    },
    [optimisticallyDeleted, setItems]
  );

  return { optimisticDelete, rollbackDelete };
}
```

**Użycie:**

```typescript
const { optimisticDelete, rollbackDelete } = useOptimisticDelete(
  flashcards,
  setFlashcards
);
```

## 7. Integracja API

### Endpoint

**Metoda:** `DELETE /api/flashcards/{flashcard_id}`

**Headers:**

- `Authorization: Bearer <Supabase JWT>` (automatycznie dodawany przez middleware)
- `Content-Type: application/json`

**Request:**

- Path parameter: `flashcard_id` (UUID)
- Body: brak

**Response:**

- **Sukces:** `204 No Content` (brak body)
- **Błędy:**
  - `400 Bad Request`: Nieprawidłowy format UUID
  - `401 Unauthorized`: Brak autoryzacji lub wygasła sesja
  - `404 Not Found`: Fiszka nie istnieje lub nie należy do użytkownika
  - `500 Internal Server Error`: Błąd serwera

### Wywołanie z poziomu komponentu

```typescript
import { deleteFlashcard } from "@/lib/services/flashcard-service.client";
import type { FlashcardId } from "@/lib/dto/types";

// W komponencie FlashcardItem
const handleDeleteConfirm = async (flashcardId: FlashcardId) => {
  setIsDeleting(true);

  // 1. Optymistyczne usunięcie z UI
  onOptimisticDelete?.(flashcardId);

  try {
    // 2. Wywołanie API
    await deleteFlashcard(flashcardId);

    // 3. Sukces - brak dodatkowych akcji (fiszka już usunięta z UI)
    toast.success("Fiszka została usunięta");
  } catch (error) {
    // 4. Błąd - rollback i komunikat
    onDeleteError?.(flashcardId, error);

    if (error instanceof ApiError) {
      switch (error.status) {
        case 404:
          toast.error("Fiszka nie istnieje lub została już usunięta");
          break;
        case 401:
          toast.error("Sesja wygasła. Zaloguj się ponownie");
          // Globalna obsługa przekierowania do /login
          break;
        default:
          toast.error("Nie udało się usunąć fiszki. Spróbuj ponownie");
      }
    } else {
      toast.error("Wystąpił nieoczekiwany błąd");
    }
  } finally {
    setIsDeleting(false);
    setIsDeleteModalOpen(false);
  }
};
```

### Typy żądania i odpowiedzi

```typescript
// Żądanie
type DeleteFlashcardRequest = {
  flashcardId: FlashcardId; // Path parameter
};

// Odpowiedź
type DeleteFlashcardResponse = void; // 204 No Content

// Implementacja w flashcard-service.client.ts (już istnieje):
export async function deleteFlashcard(id: FlashcardId): Promise<undefined> {
  return apiFetch<undefined>(`${API_BASE}/flashcards/${id}`, {
    method: "DELETE",
  });
}
```

## 8. Interakcje użytkownika

### Przepływ usuwania fiszki

1. **Kliknięcie ikony "Usuń"**
   - **Akcja:** Użytkownik klika ikonę kosza przy fiszce na liście
   - **Wynik:** Otwiera się modal potwierdzenia z pytaniem "Czy na pewno chcesz usunąć tę fiszkę?"
   - **Stan UI:** Ikona "Usuń" może zmienić kolor na hover (feedback wizualny)

2. **Wyświetlenie modalu**
   - **Akcja:** Modal pojawia się centralnie na ekranie
   - **Wynik:** Tło przyciemnione (overlay), focus automatycznie na przycisku "Anuluj"
   - **Stan UI:** Modal zawiera:
     - Tytuł: "Czy na pewno chcesz usunąć tę fiszkę?"
     - Opis: "Ta akcja jest nieodwracalna. Fiszka zostanie trwale usunięta."
     - Przycisk "Anuluj" (domyślny focus)
     - Przycisk "Usuń" (wariant destructive, czerwony)

3. **Potwierdzenie usunięcia**
   - **Akcja:** Użytkownik klika przycisk "Usuń"
   - **Wynik:**
     - Modal zamyka się natychmiast
     - Fiszka znika z listy (optymistyczne UI)
     - Wysyłane jest żądanie DELETE do API
     - Pojawia się krótka notyfikacja toast: "Fiszka została usunięta"
   - **Stan UI:** Przycisk "Usuń" pokazuje loader podczas oczekiwania (opcjonalnie)

4. **Anulowanie usunięcia**
   - **Akcja:** Użytkownik klika przycisk "Anuluj" lub klawisz Escape
   - **Wynik:** Modal zamyka się, fiszka pozostaje na liście bez zmian
   - **Stan UI:** Brak zmian w liście fiszek

5. **Błąd usuwania**
   - **Akcja:** API zwraca błąd (404, 500, network error)
   - **Wynik:**
     - Fiszka zostaje przywrócona na liście (rollback)
     - Pojawia się notyfikacja toast z komunikatem błędu
   - **Stan UI:** Fiszka pojawia się z powrotem na swojej pozycji lub na początku listy

### Obsługa klawiatury

- **Escape** w modalu: Zamyka modal (anulowanie)
- **Enter** na przycisku "Usuń": Potwierdza usunięcie
- **Tab**: Nawigacja między przyciskami w modalu
- **Space** na przycisku: Aktywuje przycisk

## 9. Warunki i walidacja

### Warunki pre-wywołania API

**Komponent:** `DeleteFlashcardButton`, `DeleteFlashcardModal`

1. **Weryfikacja ID fiszki:**
   - **Warunek:** `flashcardId` musi być niepustym stringiem w formacie UUID
   - **Implementacja:** Defensywne sprawdzenie przed otwarciem modalu

   ```typescript
   const handleDeleteClick = () => {
     if (!flashcardId || typeof flashcardId !== "string") {
       console.error("[DeleteFlashcard] Invalid flashcard ID");
       toast.error("Nieprawidłowe ID fiszki");
       return;
     }
     setIsDeleteModalOpen(true);
   };
   ```

2. **Weryfikacja autoryzacji:**
   - **Warunek:** Użytkownik musi być zalogowany
   - **Implementacja:** Globalna obsługa w middleware API (automatyczna)
   - **Efekt w UI:** Jeśli 401, przekierowanie do `/login`

3. **Zapobieganie wielokrotnym kliknięciom:**
   - **Warunek:** Nie można wywołać usuwania podczas trwającej operacji
   - **Implementacja:** Blokada przez stan `isDeleting`
   ```typescript
   <AlertDialogAction
     onClick={() => handleDeleteConfirm(flashcardId)}
     disabled={isDeleting}
   >
     {isDeleting ? <Loader2 className="animate-spin" /> : "Usuń"}
   </AlertDialogAction>
   ```

### Warunki post-wywołania API

**Komponent:** `FlashcardItem`, `FlashcardList`

1. **Sukces (204 No Content):**
   - **Warunek:** API zwraca 204
   - **Efekt:** Fiszka pozostaje usunięta z UI, toast sukcesu
   - **Stan:** `optimisticallyDeleted` może być wyczyszczone (fiszka trwale usunięta)

2. **Błąd 404 (Not Found):**
   - **Warunek:** Fiszka nie istnieje lub nie należy do użytkownika
   - **Efekt:** Brak rollback (fiszka i tak nie istnieje), toast informacyjny
   - **Stan:** Fiszka pozostaje usunięta z UI

3. **Błąd 401 (Unauthorized):**
   - **Warunek:** Wygasła sesja lub brak autoryzacji
   - **Efekt:** Przekierowanie do `/login` (globalna obsługa), toast błędu
   - **Stan:** Rollback + wylogowanie

4. **Błąd 500 lub network error:**
   - **Warunek:** Błąd serwera lub problemy z połączeniem
   - **Efekt:** Rollback (przywrócenie fiszki), toast błędu
   - **Stan:** Fiszka wraca na listę, użytkownik może spróbować ponownie

### Warunki dostępności (a11y)

1. **Focus management:**
   - Po otwarciu modalu focus na przycisku "Anuluj" (bezpieczniejszy wybór)
   - Po zamknięciu modalu focus wraca na przycisk "Usuń" w `FlashcardItem`

2. **ARIA labels:**
   - Przycisk "Usuń": `aria-label="Usuń fiszkę: {front}"`
   - Modal: `aria-describedby` wskazuje na opis akcji
   - Stan ładowania: `aria-busy="true"` podczas usuwania

3. **Keyboard navigation:**
   - Modal zamykalny klawiszem Escape
   - Przyciski aktywowalne Enter i Space
   - Tab navigation między przyciskami

## 10. Obsługa błędów

### Scenariusze błędów i rozwiązania

#### 1. Błąd 401 Unauthorized

**Przyczyna:** Wygasła sesja JWT lub brak autoryzacji

**Obsługa:**

```typescript
if (error instanceof ApiError && error.status === 401) {
  toast.error("Sesja wygasła. Zaloguj się ponownie");
  // Globalna obsługa przekierowania w middleware/interceptor
  // Opcjonalnie: router.push('/login')
}
```

**Efekt w UI:**

- Rollback optymistycznego usunięcia (fiszka wraca na listę)
- Toast z komunikatem "Sesja wygasła. Zaloguj się ponownie"
- Przekierowanie do `/login` (globalna obsługa)

---

#### 2. Błąd 404 Not Found

**Przyczyna:** Fiszka nie istnieje (już usunięta) lub nie należy do użytkownika (IDOR)

**Obsługa:**

```typescript
if (error instanceof ApiError && error.status === 404) {
  toast.error("Fiszka nie istnieje lub została już usunięta");
  // Nie robimy rollback - fiszka i tak nie istnieje
  // Opcjonalnie: odświeżenie listy fiszek
}
```

**Efekt w UI:**

- Brak rollback (fiszka pozostaje usunięta z UI)
- Toast informacyjny
- Opcjonalnie: odświeżenie listy z serwera

---

#### 3. Błąd 500 Internal Server Error

**Przyczyna:** Błąd po stronie serwera (błąd bazy danych, timeout, etc.)

**Obsługa:**

```typescript
if (error instanceof ApiError && error.status === 500) {
  onDeleteError?.(flashcardId, error); // Rollback
  toast.error("Wystąpił problem z serwerem. Spróbuj ponownie za chwilę");
}
```

**Efekt w UI:**

- Rollback optymistycznego usunięcia (fiszka wraca na listę)
- Toast z komunikatem błędu
- Użytkownik może spróbować ponownie

---

#### 4. Network Error (brak internetu, timeout)

**Przyczyna:** Problemy z połączeniem internetowym

**Obsługa:**

```typescript
if (!(error instanceof ApiError)) {
  onDeleteError?.(flashcardId, error); // Rollback
  toast.error(
    "Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie"
  );
}
```

**Efekt w UI:**

- Rollback optymistycznego usunięcia
- Toast z komunikatem o problemach z połączeniem
- Użytkownik może spróbować ponownie

---

#### 5. Nieprawidłowy UUID (400 Bad Request)

**Przyczyna:** Błąd walidacji UUID po stronie API

**Obsługa:**

```typescript
if (error instanceof ApiError && error.status === 400) {
  console.error("[DeleteFlashcard] Invalid UUID:", flashcardId);
  toast.error("Nieprawidłowe ID fiszki. Odśwież stronę i spróbuj ponownie");
  // Opcjonalnie: odświeżenie całej listy
}
```

**Efekt w UI:**

- Rollback optymistycznego usunięcia
- Toast z komunikatem błędu
- Sugestia odświeżenia strony

---

### Strategia rollback

**Implementacja w FlashcardList:**

```typescript
const handleDeleteError = useCallback(
  (flashcardId: FlashcardId, error: unknown) => {
    // 1. Znajdź fiszkę w backup (optimisticallyDeleted)
    const backup = optimisticallyDeleted.get(flashcardId);

    if (backup) {
      // 2. Przywróć fiszkę na liście (na początku lub na oryginalnej pozycji)
      setFlashcards((prev) => {
        // Opcja A: Dodaj na początku (prostsze)
        return [backup, ...prev];

        // Opcja B: Przywróć na oryginalną pozycję (bardziej skomplikowane)
        // const index = backup.originalIndex;
        // return [...prev.slice(0, index), backup, ...prev.slice(index)];
      });

      // 3. Usuń z backup
      setOptimisticallyDeleted((prev) => {
        const next = new Map(prev);
        next.delete(flashcardId);
        return next;
      });
    } else {
      // Fiszki nie ma w backup - prawdopodobnie błąd 404
      // Nie robimy nic (fiszka i tak nie istnieje)
      console.warn(
        "[DeleteFlashcard] No backup found for flashcard:",
        flashcardId
      );
    }
  },
  [optimisticallyDeleted, setFlashcards, setOptimisticallyDeleted]
);
```

---

### Logowanie błędów

```typescript
catch (error) {
  // Logowanie szczegółów dla debugowania
  console.error('[DeleteFlashcard] Failed to delete flashcard', {
    flashcardId,
    error: error instanceof Error ? error.message : String(error),
    status: error instanceof ApiError ? error.status : undefined,
    code: error instanceof ApiError ? error.code : undefined,
  });

  // Obsługa błędu...
}
```

## 11. Kroki implementacji

### Krok 1: Utworzenie komponentu DeleteFlashcardButton

**Plik:** `components/dashboard/DeleteFlashcardButton.tsx`

1. Stwórz nowy komponent funkcyjny z propsami `DeleteFlashcardButtonProps`
2. Zaimplementuj przycisk używając `<Button>` z shadcn/ui:
   - Wariant: `ghost`
   - Rozmiar: `icon`
   - Ikona: `<Trash2>` z `lucide-react`
3. Dodaj `aria-label="Usuń fiszkę"` dla dostępności
4. Obsłuż zdarzenie `onClick` → wywołaj `onDeleteClick()`
5. Dodaj hover effect (np. zmiana koloru na czerwony)
6. Wyeksportuj komponent

**Przykładowa implementacja:**

```typescript
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { FlashcardId } from "@/lib/dto/types";

interface DeleteFlashcardButtonProps {
  flashcardId: FlashcardId;
  onDeleteClick: () => void;
  disabled?: boolean;
}

export function DeleteFlashcardButton({
  flashcardId,
  onDeleteClick,
  disabled = false,
}: DeleteFlashcardButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onDeleteClick}
      disabled={disabled}
      aria-label="Usuń fiszkę"
      className="text-muted-foreground hover:text-destructive"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
```

---

### Krok 2: Utworzenie komponentu DeleteFlashcardModal

**Plik:** `components/dashboard/DeleteFlashcardModal.tsx`

1. Stwórz komponent funkcyjny z propsami `DeleteFlashcardModalProps`
2. Zaimplementuj modal używając `<AlertDialog>` z shadcn/ui:
   - `<AlertDialogContent>` jako główny kontener
   - `<AlertDialogHeader>` z tytułem i opisem
   - `<AlertDialogFooter>` z przyciskami akcji
3. Zaimplementuj logikę obsługi potwierdzenia:
   - Wywołaj `onConfirm(flashcardId)` async
   - Obsłuż stan `isDeleting` (pokaż loader)
4. Dodaj obsługę klawiatury (Escape, Enter)
5. Ustaw focus na przycisku "Anuluj" po otwarciu
6. Wyeksportuj komponent

**Przykładowa implementacja:**

```typescript
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import type { FlashcardId } from "@/lib/dto/types";

interface DeleteFlashcardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flashcardId: FlashcardId;
  onConfirm: (flashcardId: FlashcardId) => Promise<void>;
  isDeleting?: boolean;
}

export function DeleteFlashcardModal({
  open,
  onOpenChange,
  flashcardId,
  onConfirm,
  isDeleting = false,
}: DeleteFlashcardModalProps) {
  const handleConfirm = async () => {
    await onConfirm(flashcardId);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Czy na pewno chcesz usunąć tę fiszkę?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Ta akcja jest nieodwracalna. Fiszka zostanie trwale usunięta.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Anuluj
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Usuwanie...
              </>
            ) : (
              "Usuń"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

---

### Krok 3: Rozszerzenie komponentu FlashcardItem

**Plik:** `components/dashboard/FlashcardItem.tsx` (istniejący)

1. Dodaj nowy stan lokalny:

   ```typescript
   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
   const [isDeleting, setIsDeleting] = useState(false);
   ```

2. Zaimportuj `deleteFlashcard` z `@/lib/services/flashcard-service.client`

3. Zaimplementuj handler otwierania modalu:

   ```typescript
   const handleDeleteClick = () => {
     setIsDeleteModalOpen(true);
   };
   ```

4. Zaimplementuj handler potwierdzenia usunięcia (z optymistycznym UI):

   ```typescript
   const handleDeleteConfirm = async (flashcardId: FlashcardId) => {
     setIsDeleting(true);

     // Optymistyczne usunięcie
     onOptimisticDelete?.(flashcardId);

     try {
       await deleteFlashcard(flashcardId);
       toast.success("Fiszka została usunięta");
     } catch (error) {
       onDeleteError?.(flashcardId, error);
       // Obsługa błędów (toast messages)
     } finally {
       setIsDeleting(false);
       setIsDeleteModalOpen(false);
     }
   };
   ```

5. Dodaj `DeleteFlashcardButton` i `DeleteFlashcardModal` do JSX:

   ```typescript
   <div className="flex gap-2">
     {/* Istniejący EditButton */}
     <DeleteFlashcardButton
       flashcardId={flashcard.id}
       onDeleteClick={handleDeleteClick}
       disabled={isDeleting}
     />
   </div>

   <DeleteFlashcardModal
     open={isDeleteModalOpen}
     onOpenChange={setIsDeleteModalOpen}
     flashcardId={flashcard.id}
     onConfirm={handleDeleteConfirm}
     isDeleting={isDeleting}
   />
   ```

6. Dodaj nowe propsy do interfejsu `FlashcardItemProps`:
   ```typescript
   onOptimisticDelete?: (flashcardId: FlashcardId) => void;
   onDeleteError?: (flashcardId: FlashcardId, error: unknown) => void;
   ```

---

### Krok 4: Rozszerzenie FlashcardList o logikę optymistycznego usuwania

**Plik:** `components/dashboard/FlashcardList.tsx` (istniejący)

1. Dodaj stan dla optymistycznie usuniętych fiszek:

   ```typescript
   const [optimisticallyDeleted, setOptimisticallyDeleted] = useState<
     Map<FlashcardId, FlashcardListItemDto>
   >(new Map());
   ```

2. Zaimplementuj handler optymistycznego usuwania:

   ```typescript
   const handleOptimisticDelete = useCallback(
     (flashcardId: FlashcardId) => {
       const flashcard = flashcards.find((f) => f.id === flashcardId);
       if (flashcard) {
         // Zapamiętaj fiszkę (backup)
         setOptimisticallyDeleted((prev) =>
           new Map(prev).set(flashcardId, flashcard)
         );
         // Usuń z UI
         setFlashcards((prev) => prev.filter((f) => f.id !== flashcardId));
       }
     },
     [flashcards]
   );
   ```

3. Zaimplementuj handler błędu (rollback):

   ```typescript
   const handleDeleteError = useCallback(
     (flashcardId: FlashcardId, error: unknown) => {
       const backup = optimisticallyDeleted.get(flashcardId);

       if (backup) {
         // Przywróć fiszkę
         setFlashcards((prev) => [backup, ...prev]);
         // Usuń z backup
         setOptimisticallyDeleted((prev) => {
           const next = new Map(prev);
           next.delete(flashcardId);
           return next;
         });
       }

       // Obsługa toast message na podstawie typu błędu
       if (error instanceof ApiError) {
         // ... (szczegóły w sekcji 10)
       }
     },
     [optimisticallyDeleted]
   );
   ```

4. Przekaż handlery do `FlashcardItem`:
   ```typescript
   <FlashcardItem
     key={flashcard.id}
     flashcard={flashcard}
     onOptimisticDelete={handleOptimisticDelete}
     onDeleteError={handleDeleteError}
   />
   ```

---

### Krok 5: Dodanie notyfikacji toast

**Zależności:** Zainstaluj `sonner` lub użyj istniejącego rozwiązania z shadcn/ui

1. Zainstaluj toast library (jeśli nie istnieje):

   ```bash
   npx shadcn@latest add sonner
   ```

2. Dodaj `<Toaster />` do layout głównego (`app/layout.tsx`):

   ```typescript
   import { Toaster } from "@/components/ui/sonner";

   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           {children}
           <Toaster />
         </body>
       </html>
     );
   }
   ```

3. Użyj `toast` w komponentach:

   ```typescript
   import { toast } from "sonner";

   // Sukces
   toast.success("Fiszka została usunięta");

   // Błąd
   toast.error("Nie udało się usunąć fiszki");
   ```

---

### Krok 6: Testy

#### 6.1 Testy jednostkowe komponentów

**Plik:** `components/dashboard/__tests__/DeleteFlashcardModal.test.tsx`

Scenariusze testowe:

- Renderowanie modalu z prawidłową treścią
- Wywołanie `onConfirm` po kliknięciu "Usuń"
- Zamknięcie modalu po kliknięciu "Anuluj"
- Zamknięcie modalu po naciśnięciu Escape
- Wyświetlanie loadera podczas `isDeleting`
- Blokada przycisków podczas `isDeleting`

**Plik:** `components/dashboard/__tests__/DeleteFlashcardButton.test.tsx`

Scenariusze testowe:

- Renderowanie ikony kosza
- Wywołanie `onDeleteClick` po kliknięciu
- Poprawne aria-label
- Disabled state

---

#### 6.2 Testy integracyjne

**Plik:** `components/dashboard/__tests__/FlashcardItem.integration.test.tsx`

Scenariusze testowe:

- Pełny przepływ usuwania: klik → modal → potwierdzenie → API call → sukces
- Rollback po błędzie API (500)
- Obsługa 404 (brak rollback)
- Obsługa 401 (rollback + przekierowanie)
- Anulowanie usuwania w modalu

---

#### 6.3 Testy E2E

**Plik:** `e2e/dashboard/delete-flashcard.spec.ts` (Playwright)

Scenariusze testowe:

- Użytkownik usuwa fiszkę pomyślnie (204)
- Użytkownik anuluje usuwanie w modalu
- Obsługa błędu 500 (rollback + toast)
- Obsługa błędu 404 (toast informacyjny)

---

### Krok 7: Dokumentacja i cleanup

1. Dodaj dokumentację JSDoc do nowych komponentów
2. Zaktualizuj README.md z informacjami o nowej funkcjonalności
3. Sprawdź dostępność (a11y) za pomocą narzędzi (axe, Lighthouse)
4. Sprawdź responsywność na urządzeniach mobilnych
5. Code review i optymalizacja

---

### Krok 8: Weryfikacja i deployment

1. Uruchom wszystkie testy:

   ```bash
   npm run test
   npm run test:e2e
   ```

2. Sprawdź build produkcyjny:

   ```bash
   npm run build
   ```

3. Przetestuj lokalnie w trybie produkcyjnym:

   ```bash
   npm run start
   ```

4. Deploy na środowisko staging/production

5. Smoke testing na środowisku produkcyjnym

---

## Podsumowanie

Plan implementacji obejmuje:

- **3 nowe komponenty:** `DeleteFlashcardButton`, `DeleteFlashcardModal`, rozszerzenie `FlashcardItem`
- **Optymistyczne UI:** Natychmiastowe usuwanie z rollback w przypadku błędu
- **Obsługa błędów:** 401, 404, 500, network errors
- **Dostępność:** Focus management, ARIA labels, keyboard navigation
- **Testy:** Unit, integracyjne, E2E

Implementacja zgodna z wymaganiami `F-10`, `F-16`, `US-012` oraz wzorcami z `ui-plan.md`.
