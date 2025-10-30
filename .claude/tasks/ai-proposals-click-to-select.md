# Task: Click-to-Select dla Propozycji AI

## Cel

Ulepszyć UX zaznaczania propozycji AI poprzez zamianę checkboxów na kliknięcie całej karty oraz przeniesienie przycisków akcji na górę.

## Kontekst

Obecna implementacja wymaga celowania w mały checkbox (16-20px), co jest problematyczne zwłaszcza na urządzeniach mobilnych. Użytkownicy również muszą scrollować do dołu żeby zobaczyć przyciski akcji.

## Zmiany UX/UI

### 1. Click-to-select (card-based selection)

- **Target area**: Z małego checkboxa (16-20px) na całą kartę (min. 44x44px touch target)
- **Pattern**: Znany z Gmail, Google Photos, File Managers
- **Benefits**: Prawo Fittsa, mobile-friendly, mniej visual clutter

### 2. Przyciski na górze

- **Visibility**: Od razu widoczne bez scrollowania
- **Flow**: Instrukcja → Akcje → Wybór (natural top-to-bottom)
- **Context**: Użytkownik najpierw widzi "co może zrobić"

## Plan implementacji (Format 3x3)

### FAZA 1: Refaktoryzacja AiProposalItem (UI Component)

**Zadanie 1.1: Usunięcie checkbox i dodanie onClick** ⏱️ 10 min

- Usuń import `Checkbox` z `components/dashboard/AiProposalItem.tsx`
- Usuń `<Checkbox>` element i jego wrapper `<div className="flex gap-4">`
- Dodaj `onClick={onToggle}` handler na `<Card>` element
- Zmień layout z `flex` na prosty `space-y-2` (bez checkbox nie potrzeba flexbox)
- **Test**: Kliknięcie na kartę powinno wywołać `onToggle` (sprawdź w console.log)

**Zadanie 1.2: Dodanie visual feedback i affordance** ⏱️ 15 min

- Dodaj `cursor-pointer` do className karty
- Dodaj `transition-all` dla smooth animations
- Dodaj `hover:shadow-md` dla hover effect
- Dodaj warunkowe `hover:border-primary/50` dla niezaznaczonych kart
- Zachowaj istniejące zielone style dla zaznaczonych
- Import `cn` z `@/lib/utils` jeśli jeszcze nie używany
- **Test**: Hover na karcie powinien pokazać shadow i border, smooth transition

**Zadanie 1.3: Accessibility - keyboard + ARIA** ⏱️ 15 min

- Dodaj `role="button"` do karty
- Dodaj `tabIndex={0}` dla keyboard focus
- Dodaj `onKeyDown` handler dla Enter i Space:
  ```tsx
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle();
    }
  }}
  ```
- Dodaj `aria-pressed={isSelected}` dla screen readers
- Dodaj dynamiczny `aria-label`:
  ```tsx
  aria-label={`${isSelected ? "Odznacz" : "Zaznacz"} propozycję: ${proposal.front}`}
  ```
- **Test**: Tab navigation działa, Enter/Space toggle karty, screen reader announce

### FAZA 2: Refaktoryzacja AiProposalsList (Layout & Ordering)

**Zadanie 2.1: Przeniesienie przycisków na górę** ⏱️ 5 min

- W `components/dashboard/AiProposalsList.tsx` przenieś sekcję `<div className="flex gap-3">` z przyciskami
- Umieść ją PRZED gridem (po headerze z licznikiem)
- Zachowaj wszystkie classes i logikę (`disabled`, `onClick`, counters)
- **Test**: Przyciski są widoczne na górze, działają tak samo jak wcześniej

**Zadanie 2.2: Dodanie nagłówka i tekstu pomocniczego** ⏱️ 10 min

- W headerze dodaj `<h3 className="text-lg font-semibold">Propozycje AI</h3>`
- Zmień strukturę na nested `<div>` z h3 + paragraph
- Po przyciskach, przed gridem dodaj tekst pomocniczy:
  ```tsx
  <p className="text-sm text-muted-foreground">
    Kliknij na fiszkę aby ją zaznaczyć lub odznaczyć
  </p>
  ```
- **Test**: Header ma lepszą hierarchię, tekst pomocniczy jest widoczny

**Zadanie 2.3: Weryfikacja responsywności** ⏱️ 10 min

- Sprawdź layout na mobile (375px), tablet (768px), desktop (1024px+)
- Upewnij się że przyciski nie zawijają się dziwnie na mobile
- Sprawdź czy grid nadal działa (1-col mobile, 2-col tablet, 3-col desktop)
- Sprawdź czy touch targets są min. 44x44px na mobile
- **Test**: DevTools responsive mode, sprawdź wszystkie breakpointy

### FAZA 3: Testing & Polish

**Zadanie 3.1: Manual testing - happy paths** ⏱️ 15 min

- [ ] Kliknięcie na kartę zaznacza/odznacza (visual feedback działa)
- [ ] Hover pokazuje cień i border (smooth transitions)
- [ ] Zaznaczenie wielu kart i klik "Akceptuj" działa
- [ ] Counter w przycisku aktualizuje się poprawnie
- [ ] "Odrzuć wszystko" czyści zaznaczenie
- [ ] Keyboard navigation (Tab, Enter, Space) działa
- [ ] Mobile touch targets są wygodne

**Zadanie 3.2: Edge cases & accessibility** ⏱️ 10 min

- [ ] Screen reader announce: NVDA/VoiceOver (jeśli dostępne)
- [ ] Focus visible ring jest widoczny przy keyboard navigation
- [ ] Rapid clicking nie powoduje bugów (debouncing nie potrzebny - React batching)
- [ ] Double-click nie zaznacza tekstu wewnątrz karty (sprawdź)
- [ ] Dark mode wygląda dobrze (szczególnie zielona obwódka)

**Zadanie 3.3: Cleanup & documentation** ⏱️ 5 min

- Usuń nieużywane importy (Checkbox)
- Dodaj komentarz w AiProposalItem: `// Card acts as button - click to toggle selection`
- Dodaj komentarz w AiProposalsList: `// Action buttons at top for better visibility`
- Update `.ai/dashboard-view-implementation-plan.md` z actual implementation details (jeśli coś się zmieniło)
- **Test**: `npx tsc --noEmit` i `npm run lint` przechodzą

## Acceptance Criteria

### Must Have

- [x] Kliknięcie na kartę zaznacza/odznacza propozycję
- [x] Checkbox został usunięty
- [x] Przyciski akcji są na górze (przed gridem)
- [x] Visual feedback: hover shadow, border, smooth transitions
- [x] Zielona obwódka dla zaznaczonych (zachowana z poprzedniej implementacji)
- [x] Accessibility: keyboard navigation (Tab/Enter/Space)
- [x] Accessibility: ARIA attributes (role, aria-pressed, aria-label)
- [x] Counter zaznaczonych działa poprawnie
- [x] Mobile touch targets min. 44x44px
- [x] TypeScript i ESLint bez błędów

### Nice to Have (poza MVP)

- [ ] Ripple effect na kliknięciu (Material Design style)
- [ ] Keyboard shortcuts: Ctrl+A (zaznacz wszystkie)
- [ ] Animacja zaznaczenia (scale/bounce)
- [ ] Tooltips na przyciskach

## Ryzyka i mitygacje

**Ryzyko 1: Double-click zaznacza tekst**

- **Mitygacja**: Dodaj `user-select: none` jeśli problem występuje
- **CSS**: `<Card className="select-none ...">` lub `onMouseDown={(e) => e.preventDefault()}`

**Ryzyko 2: Accidental clicks podczas scrollowania**

- **Mitygacja**: React synthetic events nie triggują onClick podczas scroll-drag
- **Test**: Przetestuj scroll touch gestures na telefonie

**Ryzyko 3: Focus ring może być brzydki**

- **Mitygacja**: Dostosuj style focus ring jeśli domyślny nie pasuje:
  ```tsx
  className =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";
  ```

## Podsumowanie czasu

- Faza 1: 40 min (refactor component)
- Faza 2: 25 min (layout changes)
- Faza 3: 30 min (testing & polish)
- **Total: ~1.5h** (MVP quality)

## Metryki sukcesu

- 📊 **Przed**: Checkbox 16-20px target area
- 📊 **Po**: Card ~200-300px target area (10-15x większy)
- 🎯 **Cel**: Zwiększenie 75% acceptance rate dla AI proposals
- ⚡ **Performance**: Brak regresu (onClick jest lightweight)

## Related

- PRD: `.ai/prd.md` (US-006: Akceptacja propozycji AI)
- Architecture: `.ai/dashboard-view-implementation-plan.md` (Section 12.6)
- Components: `components/dashboard/AiProposalsList.tsx`, `AiProposalItem.tsx`
