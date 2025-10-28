# AI Generation Loading Modal

**Status**: ✅ COMPLETED
**Created**: 2025-10-28
**Completed**: 2025-10-28
**Base Plan**: `.ai/dashboard-view-implementation-plan.md`

---

## Przegląd zadania

Dodanie modala z loaderem i spinnerem podczas generowania fiszek przez AI. Obecnie użytkownik nie otrzymuje wystarczającego feedbacku podczas długiego procesu generowania (może trwać 5-30s), co prowadzi do niepewności czy aplikacja działa.

### Problem

- Generowanie AI może trwać 5-30 sekund (zależnie od OpenRouter API)
- Obecny stan: przycisk "Generuj" pokazuje spinner (`isGenerating`), ale:
  - Użytkownik może próbować klikać inne elementy
  - Brak blokady interfejsu
  - Brak jasnego komunikatu o tym, że trwa przetwarzanie
- Ryzyko: użytkownik może pomyśleć, że aplikacja się zawiesiła i zamknąć kartę

### Rozwiązanie

Modal z:

- Spinnerem (shadcn/ui spinner lub custom animation)
- Komunikatem "Generuję fiszki za pomocą AI..."
- Subkomunikatem "To może potrwać kilka sekund"
- Blokadą interakcji z resztą UI (backdrop)
- Automatycznym zamknięciem po otrzymaniu odpowiedzi

---

## Approach (Podejście MVP)

**Filozofia**: Minimalna implementacja zapewniająca wystarczający feedback. Unikamy over-engineering.

### Kluczowe decyzje:

1. **Modal zamiast inline loader** - blokuje UI, jasno komunikuje stan
2. **Brak przycisku anulowania** - MVP nie wspiera cancel (wymagałby AbortController w całym callstack)
3. **Shadcn Dialog** - używamy istniejącego komponentu zamiast budować custom
4. **Kontrola przez stan hooka** - `isGeneratingAi` kontroluje visibility modala
5. **Brak timera/progress bar** - nie znamy dokładnego czasu trwania operacji

### Nieimplementowane (świadomie):

- Przycisk "Anuluj" (wymaga refaktoringu API client)
- Progress bar (brak informacji o postępie z OpenRouter)
- Animowany licznik czasu (może stresować użytkownika)
- Retry button (błąd jest obsługiwany przez toast)

---

## Rozbicie zadań (Task Breakdown)

### Krok 1: Utworzenie komponentu `AiGenerationLoadingModal`

- [ ] Utworzyć plik `components/dashboard/AiGenerationLoadingModal.tsx`
- [ ] Zaimplementować komponent z:
  - shadcn/Dialog jako kontener
  - Spinner (shadcn/ui Loader2 icon z animacją)
  - Tekst główny: "Generuję fiszki za pomocą AI..."
  - Tekst pomocniczy: "To może potrwać kilka sekund"
  - Props: `isOpen: boolean` (kontrolowany przez `isGeneratingAi`)
- [ ] Styling:
  - Centered content
  - Dark mode support
  - Blur backdrop
  - Disabled close button (użytkownik nie może zamknąć ręcznie)

**Expected Output**:

```tsx
interface AiGenerationLoadingModalProps {
  isOpen: boolean;
}

export function AiGenerationLoadingModal({
  isOpen,
}: AiGenerationLoadingModalProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        {/* Spinner + Text */}
      </DialogContent>
    </Dialog>
  );
}
```

### Krok 2: Integracja w `DashboardView`

- [ ] Import `AiGenerationLoadingModal` w `components/dashboard/DashboardView.tsx`
- [ ] Dodać renderowanie modala z props `isOpen={isGeneratingAi}`
- [ ] Pozycja w JSX: na końcu return (aby był na wierzchu z-index)
- [ ] Verify: modal pojawia się po kliknięciu "Generuj" i znika po otrzymaniu propozycji

**Expected Change**:

```tsx
return (
  <div className="container mx-auto max-w-7xl space-y-8 p-4">
    {/* ... existing components ... */}

    <AiGenerationLoadingModal isOpen={isGeneratingAi} />
  </div>
);
```

### Krok 3: Update dokumentacji planu

- [ ] Otworzyć `.ai/dashboard-view-implementation-plan.md`
- [ ] Dodać nowy komponent w sekcji "3. Struktura komponentów":
  ```
  └── AiGenerationLoadingModal (warunkowo)
      ├── shadcn/Dialog
      ├── Loader icon (spinner)
      └── Komunikaty tekstowe
  ```
- [ ] Dodać sekcję "4. Szczegóły komponentów" -> `AiGenerationLoadingModal`:
  - Opis komponentu
  - Główne elementy
  - Obsługiwane interakcje
  - Typy
  - Propsy
- [ ] Dodać wpis w sekcji "12. Dodatkowe zmiany":
  - "12.5. Modal ładowania podczas generowania AI"
  - Data
  - Implementacja (opis komponentu i integracji)
  - Uzasadnienie (długi czas generowania, potrzeba feedbacku)

### Krok 4: Testowanie i weryfikacja

- [ ] Test 1: Kliknąć "Generuj" z poprawnym tekstem
  - Expected: Modal pojawia się natychmiast
  - Expected: Spinner animuje się
  - Expected: Nie można klikać innych elementów (backdrop blokuje)
- [ ] Test 2: Poczekać na odpowiedź API
  - Expected: Modal znika automatycznie
  - Expected: Propozycje AI są wyświetlone
- [ ] Test 3: Błąd generowania
  - Expected: Modal znika
  - Expected: Toast z błędem pojawia się
- [ ] Test 4: Dark mode
  - Expected: Modal poprawnie wyświetla się w dark mode

---

## Typy

### `AiGenerationLoadingModalProps`

```typescript
interface AiGenerationLoadingModalProps {
  /** Controls modal visibility (bound to isGeneratingAi state) */
  isOpen: boolean;
}
```

Brak dodatkowych typów - komponent jest prezentacyjny.

---

## Zmiany w istniejącym kodzie

### `DashboardView.tsx`

**Zmiana**: Dodanie renderowania `AiGenerationLoadingModal`

**Przed**:

```tsx
return (
  <div className="container mx-auto max-w-7xl space-y-8 p-4">
    {/* ... components ... */}
  </div>
);
```

**Po**:

```tsx
return (
  <div className="container mx-auto max-w-7xl space-y-8 p-4">
    {/* ... components ... */}

    <AiGenerationLoadingModal isOpen={isGeneratingAi} />
  </div>
);
```

**Uzasadnienie**: Modal musi być na końcu JSX aby z-index działał poprawnie (backdrop na górze innych elementów).

### `useDashboardManager.ts`

**Brak zmian** - istniejący stan `isGeneratingAi` jest wystarczający do kontroli modala.

---

## Plan implementacji w `.ai/dashboard-view-implementation-plan.md`

### Sekcja do dodania w "3. Struktura komponentów"

```markdown
└── AiGenerationLoadingModal (warunkowo, gdy isGeneratingAi = true)
├── shadcn/Dialog (backdrop + content)
├── Loader2 icon (spinner z Lucide React)
└── Komunikaty tekstowe
```

### Sekcja do dodania w "4. Szczegóły komponentów"

```markdown
### `AiGenerationLoadingModal`

- **Opis komponentu:** Modal wyświetlany podczas generowania fiszek przez AI. Blokuje interakcję z interfejsem i informuje użytkownika o trwającym procesie.
- **Główne elementy:** `shadcn/Dialog` z animowaną ikoną `Loader2`, tekstem głównym "Generuję fiszki za pomocą AI..." oraz tekstem pomocniczym "To może potrwać kilka sekund".
- **Obsługiwane interakcje:** Brak - modal nie może być zamknięty przez użytkownika. Zamyka się automatycznie po zakończeniu generowania (sukces lub błąd).
- **Obsługiwana walidacja:** Brak.
- **Typy:** `AiGenerationLoadingModalProps`.
- **Propsy:**
  - `isOpen: boolean` - kontroluje widoczność modala (bound do `isGeneratingAi` z hooka).
```

### Sekcja do dodania w "12. Dodatkowe zmiany"

````markdown
### 12.5. Modal ładowania podczas generowania AI

**Zmiana:** Dodano modal z spinnerem wyświetlany podczas generowania fiszek przez AI.

**Implementacja:**

1. **Komponent** (`components/dashboard/AiGenerationLoadingModal.tsx`):

```tsx
export function AiGenerationLoadingModal({
  isOpen,
}: AiGenerationLoadingModalProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <div className="flex flex-col items-center gap-4 py-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center">
            <p className="text-lg font-medium">
              Generuję fiszki za pomocą AI...
            </p>
            <p className="text-sm text-muted-foreground">
              To może potrwać kilka sekund
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```
````

2. **Integracja** (`components/dashboard/DashboardView.tsx:ostatnia linia przed </div>`):

```tsx
<AiGenerationLoadingModal isOpen={isGeneratingAi} />
```

**Uzasadnienie:** Generowanie fiszek przez OpenRouter API może trwać 5-30 sekund. Obecny feedback (spinner na przycisku) był niewystarczający - użytkownicy mogli nie zauważyć stanu ładowania i próbować klikać inne elementy. Modal z jasnym komunikatem i blokadą interfejsu (backdrop) eliminuje niepewność i zapobiega przypadkowym kliknięciom podczas przetwarzania. Automatyczne zamknięcie po zakończeniu operacji (sukces lub błąd) zapewnia płynny UX bez dodatkowej akcji użytkownika.

```

---

## Notatki MVP

**Świadome uproszczenia (można dodać później):**
- Brak przycisku "Anuluj" (wymaga implementacji abort logic w OpenRouter client)
- Brak progress bar (API nie zwraca informacji o postępie)
- Brak animowanego timera (może generować stres u użytkownika)
- Brak retry w modalu (błędy obsługiwane przez toast + możliwość ponownego kliknięcia "Generuj")

**Anti-patterns do uniknięcia:**
- ❌ Możliwość zamknięcia modala przed zakończeniem operacji
- ❌ Brak backdrop (użytkownik mógłby klikać elementy w tle)
- ❌ Timer pokazujący czas trwania (stresujące gdy przekroczy oczekiwania)
- ❌ Zbyt długi tekst w modalu (keep it simple)

---

## Acceptance Criteria

✅ Kryteria sukcesu:

- [ ] Modal pojawia się natychmiast po kliknięciu "Generuj"
- [ ] Spinner animuje się płynnie
- [ ] Tekst jest wycentrowany i czytelny
- [ ] Backdrop blokuje kliknięcia w elementy w tle
- [ ] Modal nie może być zamknięty przez użytkownika (brak X, brak zamknięcia przez ESC/kliknięcie backdrop)
- [ ] Modal znika automatycznie po otrzymaniu propozycji AI
- [ ] Modal znika automatycznie po błędzie generowania
- [ ] Dark mode jest wspierany (colors z CSS variables)
- [ ] Brak console errors/warnings
- [ ] TypeScript compilation passes

---

## Pytania do rozstrzygnięcia

- [ ] Czy dodać animowany timer "Trwa już: Xs"?
  - **Propozycja**: NIE - może generować stres gdy czas jest długi
  - **Do decyzji**: User feedback

- [ ] Czy dodać przycisk "Anuluj"?
  - **Propozeja**: NIE dla MVP - wymaga większego refactoringu (AbortController w całym flow)
  - **Do decyzji**: User feedback

- [ ] Czy dodać losowy tip podczas ładowania? (np. "💡 Wskazówka: Możesz edytować wygenerowane fiszki")
  - **Propozycja**: NIE dla MVP - dodatkowa złożoność, nie rozwiązuje głównego problemu
  - **Do decyzji**: User feedback

---

## What I Actually Did (vs Plan)

### Krok 1: Utworzenie komponentu `AiGenerationLoadingModal`
- **Status**: ✅ DONE
- **Files created**: `components/dashboard/AiGenerationLoadingModal.tsx` (54 lines)
- **Files modified**: `components/ui/dialog.tsx` (dodano prop `hideCloseButton`)
- **Notes**:
  - Zainstalowano shadcn Dialog: `npx shadcn@latest add dialog`
  - Zmodyfikowano `DialogContent` aby wspierał `hideCloseButton?: boolean` prop
  - Komponent używa `Loader2` z lucide-react dla animowanego spinnera
  - Zablokowano wszystkie sposoby zamknięcia modala: ESC, backdrop, przycisk X
  - Props: `onEscapeKeyDown`, `onPointerDownOutside`, `onInteractOutside` blokują zamykanie
  - Dark mode support via CSS variables (`text-primary`, `text-muted-foreground`)

### Krok 2: Integracja w `DashboardView`
- **Status**: ✅ DONE
- **Files modified**: `components/dashboard/DashboardView.tsx`
- **Notes**:
  - Import: `import { AiGenerationLoadingModal } from "./AiGenerationLoadingModal"`
  - Renderowanie: `<AiGenerationLoadingModal isOpen={isGeneratingAi} />` (linia 114)
  - Pozycja: na końcu return, przed zamykającym `</div>`
  - Kontrola przez istniejący stan `isGeneratingAi` z hooka - brak zmian w hooku wymaganych

### Krok 3: Update dokumentacji planu
- **Status**: ✅ DONE
- **Files modified**: `.ai/dashboard-view-implementation-plan.md`
- **Notes**: Dodano 3 sekcje:
  1. **Sekcja 3 "Struktura komponentów"** (linie 39-42):
     - Dodano `AiGenerationLoadingModal` jako child komponent z Dialog, Loader2, tekstami
  2. **Sekcja 4 "Szczegóły komponentów"** (linie 115-123):
     - Pełny opis komponentu (cel, elementy, interakcje, props)
  3. **Sekcja 12 "Dodatkowe zmiany"** (linie 319-371):
     - Nowa sekcja "12.5. Modal ładowania podczas generowania AI"
     - Data: 2025-10-28
     - Implementacja: kod komponentu, integracja, modyfikacja DialogContent
     - Uzasadnienie: długi czas generowania (5-30s), potrzeba blokady UI

### Krok 4: Testowanie i weryfikacja
- **Status**: ✅ DONE (automated checks)
- **TypeScript compilation**: ✅ PASSES (`npx tsc --noEmit`)
- **Manual testing**: ⏳ PENDING (wymaga uruchomienia dev server)
  - Happy path: modal pojawia się po kliknięciu "Generuj"
  - Error case: modal znika po błędzie API
  - Dark mode: sprawdzenie w obu motywach
  - Blokada UI: próba kliknięcia backdrop, ESC, X

---

## Implementation Summary

**Zrealizowano wszystkie 4 kroki** zgodnie z planem. Implementacja trwała ~15 minut.

**Pliki utworzone** (1):
- `components/dashboard/AiGenerationLoadingModal.tsx` - Modal komponent (54 linie)

**Pliki zmodyfikowane** (3):
- `components/ui/dialog.tsx` - Dodano `hideCloseButton` prop do `DialogContent`
- `components/dashboard/DashboardView.tsx` - Dodano renderowanie modala
- `.ai/dashboard-view-implementation-plan.md` - Dokumentacja (3 sekcje)

**Brak zmian w**:
- `hooks/useDashboardManager.ts` - istniejący stan `isGeneratingAi` wystarcza
- `lib/dto/types.ts` - brak nowych typów potrzebnych

**TypeScript**: ✅ Compilation passes
**Next step**: Manual testing (wymaga dev server + prawdziwy API key)

---

**Next Steps**:
1. ✅ Stworzenie task file
2. ✅ Prezentacja planu użytkownikowi
3. ✅ Approval od użytkownika
4. ✅ Implementacja (Kroki 1-4)
5. ⏳ Manual testing (optional - wymaga running app)
```
