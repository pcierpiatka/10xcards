# Gumowa Kaczka: Uproszczenie DTO dla MVP

**Data:** 2025-10-15
**Problem:** Wstępny API plan zawierał zbyt wiele pól technicznych i endpointów, które nie są używane przez UI w MVP.

## Problem

Po wygenerowaniu typów DTO z planu API (@api-plan.md) i modeli bazy danych (@database.types.ts), zauważono potencjalne nadmiarowe pola:

1. `flashcard_source_id` w response DTO - pole techniczne z bazy, które nie jest używane przez UI
2. Nested `flashcard_source` object vs flat structure - niespójność między różnymi endpointami
3. `updated_at` w response - czy UI to pokazuje?
4. Zbyt wiele endpointów - czy wszystkie są potrzebne w MVP?

## Założenia

### Kontekst MVP

- **Cel:** Walidacja czy użytkownicy znajdują AI-generated flashcards użytecznymi (75% acceptance rate, 75% AI creation rate)
- **Użytkownik:** API będzie używane **tylko przez UI** (nie ma publicznego API, nie ma integracji zewnętrznych)
- **Scope:** Bez zaawansowanych features (decks, tags, search, spaced repetition)

### Zasady projektowania API

1. **KISS (Keep It Simple, Stupid)** - zwracaj tylko to, co używane
2. **YAGNI (You Aren't Gonna Need It)** - nie dodawaj "na przyszłość"
3. **Information Hiding** - nie exposuj internal DB structure bez powodu
4. **Pragmatyzm** - łatwo dodać pole (non-breaking), trudno usunąć (breaking)

## Proces Analizy

### Metodologia: Endpoint → UI Screen Mapping

Dla każdego endpointu zadano pytania:

1. **Który ekran** używa tego API?
2. **Co konkretnie** UI pokazuje użytkownikowi?
3. **Które pola** są używane w renderowaniu?
4. **Czy endpoint jest w ogóle potrzebny** w MVP?

---

### 1. POST /api/ai/generations

**Ekran:** AI Generation Form

```
┌────────────────────────────────────┐
│ [Paste długi tekst (1000-10k)]    │
│ [Generuj fiszki AI]                │
└────────────────────────────────────┘
         ↓
┌────────────────────────────────────┐
│ Propozycje do zaakceptowania:      │
│ ☐ Q: Co to TypeScript?             │
│    A: Superset JavaScriptu...      │
│ ☐ Q: Czym jest interface?          │
│    A: Kontrakt dla obiektów...     │
│ [Akceptuj zaznaczone]              │
└────────────────────────────────────┘
```

**Request:**

```typescript
{
  input_text: string;
}
```

**Response:**

```typescript
{
  generation_id: string,      // ✅ Potrzebne - do POST accept
  proposals: [{               // ✅ Potrzebne - wyświetlanie checkboxów
    front: string,
    back: string
  }]
}
```

**Niepotrzebne pola:**

- ❌ `model_name` - user nie widzi
- ❌ `duration_ms` - analytics backend-side
- ❌ `generated_count` - widać po proposals.length

**Decyzja:** ✅ Zostaw jak jest

---

### 2. POST /api/ai/generations/accept

**Ekran:** Po kliknięciu "Akceptuj zaznaczone"

```
[Akceptuj] → Toast "Dodano 5 fiszek" → Redirect /flashcards
```

**Request:**

```typescript
{
  generation_id: string,
  proposals: [{ front, back }]
}
```

**Response:** 204 No Content

**Dlaczego nie 201 + created flashcards?**

- Frontend nie potrzebuje synchronicznego ID - zrobi refetch listy po redirect
- Upraszcza logikę (bulk insert może być transakcyjny bez streama response)

**Decyzja:** ✅ 204 OK

---

### 3. POST /api/flashcards

**Ekran:** Formularz "Dodaj fiszkę ręcznie"

```
┌────────────────────────────────────┐
│ Front: [________________]          │
│ Back:  [________________]          │
│        [Zapisz]                    │
└────────────────────────────────────┘
```

**Request:**

```typescript
{ front: string, back: string }
```

**Response options:**

- A) **204** - frontend sam wie co dodał
- B) **201 + minimal object** - frontend dostaje ID do local state update

**Analiza:**
Po zapisaniu możliwe scenariusze:

1. Redirect do listy → 204 wystarcza (zrobi fetch)
2. Stay on form + clear inputs → 204 wystarcza
3. **Stay on form + dodaj do listy w tle** → potrzeba {id, front, back, source_type}

Scenariusz 3 daje lepszy UX (instant feedback bez refetch).

**Oryginalne DTO:**

```typescript
{
  flashcard: {
    id: string,
    front: string,
    back: string,
    flashcard_source_id: string,  // ❌ Po co?
    source_type: "manual",        // ✅ Badge
    created_at: string            // ❌ UI pokazuje "dodano teraz"?
  }
}
```

**Analiza pól:**

- `flashcard_source_id` ❌ - Czy UI robi GET /api/flashcard-sources/{id}? **NIE w MVP**
- `created_at` ❌ - Czy UI pokazuje timestamp na fresh created item? **NIE**

**Decyzja:** Uproszczone DTO

```typescript
{
  id: string,
  front: string,
  back: string,
  source_type: "manual"
}
```

---

### 4. GET /api/flashcards

**Ekran:** Lista fiszek

```
┌────────────────────────────────────┐
│ Moje Fiszki                        │
├────────────────────────────────────┤
│ Co to TypeScript?          [AI]    │ ← badge
│ Superset JavaScriptu...            │ ← truncated back
│                  [Edit] [Delete]   │ ← potrzeba id
├────────────────────────────────────┤
│ Interface w TS          [Manual]   │
│ Kontrakt dla obiektów...           │
│                  [Edit] [Delete]   │
└────────────────────────────────────┘
Strona 1/5  [<] [>]
```

**Oryginalne DTO:**

```typescript
{
  data: [{
    id: string,
    front: string,
    back: string,
    flashcard_source: {           // ❌ Nested object
      id: string,                 // ❌ Do czego?
      source_type: string,        // ✅ Badge
      created_at: string          // ❌ "Źródło z 2 dni temu"?
    },
    created_at: string,           // ? "Dodano 2 dni temu"
    updated_at: string            // ❌ "Edytowano"?
  }],
  pagination: {...}
}
```

**Analiza UI:**

- Sortowanie "najnowsze" → **potrzeba created_at na top-level**
- Badge "AI"/"Manual" → **potrzeba source_type**
- Link "Zobacz źródło" → **NIE w MVP** (out of scope: organization)
- Informacja "edytowano" → **NIE pokazujemy**

**Decyzja:** Flatten structure

```typescript
{
  data: [{
    id: string,
    front: string,
    back: string,
    source_type: "ai" | "manual" | "ai-edited",
    created_at: string  // dla sortowania
  }],
  pagination: {...}
}
```

**Benefit:**

- Usuwa leaky abstraction (flashcard_source.id nie ma użycia)
- Prostszy kontrakt
- Wciąż można dodać nested object w przyszłości (non-breaking)

---

### 5. GET /api/flashcards/{id}

**Kiedy używany?** Przed edycją fiszki

**Analiza:**

```
Klik [Edit] → Open modal/form → Załaduj dane
```

**Opcje:**

- A) **GET /api/flashcards/{id}** → fetch fresh data
- B) **Use local state** → dane już są w liście

Dla MVP:

- Lista ma już {id, front, back} → wystarczy do edycji
- Jeśli potrzeba fresh data (optimistic UI issue) → dodaj endpoint później

**Decyzja:** ❌ **Usuń endpoint** (YAGNI)

---

### 6. PATCH /api/flashcards/{id}

**Ekran:** Modal edycji

```
┌────────────────────────────────────┐
│ Edytuj fiszkę                      │
│ Front: [Co to TypeScript?___]      │
│ Back:  [Superset JS...______]      │
│        [Zapisz]                    │
└────────────────────────────────────┘
```

**Request:**

```typescript
{ front?: string, back?: string }
```

**Response options:**

- A) **204** - frontend wie co wysłał, sam zaktualizuje local state
- B) **200 + DTO** - server zwraca zaktualizowany obiekt

**Analiza:**

- Czy server zmienia dane (compute)? **NIE** - tylko update front/back
- Czy server zmienia source_type? **TAK** - ai → ai-edited

**Problem:** Frontend nie wie czy source_type się zmienił!

**Rozwiązanie:**

```typescript
// Response 200
{
  id: string,
  front: string,
  back: string,
  source_type: "ai-edited"  // ← może się zmienić
}
```

**Decyzja:** 200 + minimal DTO (nie 204)

---

### 7. DELETE /api/flashcards/{id}

**Ekran:** Lista z buttonem Delete

```
[Delete] → Modal "Czy na pewno?" → DELETE API → Usuń z local state
```

**Response:** 204

**Decyzja:** ✅ OK

---

### 8. DELETE /api/flashcards (bulk)

**Kiedy używany?** Multi-select + "Usuń zaznaczone"

**Czy to MVP?**

- PRD nie wymienia bulk operations
- Out of scope: advanced management features
- Single delete wystarcza do walidacji MVP

**Decyzja:** ❌ **Usuń z MVP**

---

### 9-10. GET /api/flashcard-sources

**Kiedy używany?**

- "Zobacz wszystkie fiszki z tego źródła (AI generation)"
- Analytics "ile źródeł utworzyłeś"

**PRD scope:**

> Out of scope: organizacja (decks, categories, tags)

Grupowanie po źródle = organizacja.

**Decyzja:** ❌ **Usuń oba endpointy**

---

### 11. GET /api/study/flashcards

**Ekran:** Tryb nauki

```
┌──────────────────────────────────┐
│         Pytanie 1/20             │
│                                  │
│   Co to jest TypeScript?         │
│                                  │
│   [Pokaż odpowiedź]              │
└──────────────────────────────────┘
```

**Oryginalne DTO:**

```typescript
{
  cards: [{
    id: string,
    front: string,
    back: string,
    source_type: "ai"  // ❌ Pokazujemy badge w trybie nauki?
  }],
  total_available: number
}
```

**Analiza UI:**

- Czy pokazujemy badge "AI" podczas nauki? **NIE** - to dystraktuje
- Czy pokazujemy timestamp? **NIE**

**Potrzebne:**

- `id` ✅ - dla `exclude_ids` (tracking seen cards)
- `front` ✅
- `back` ✅
- `total_available` ✅ - counter "1/20"

**Decyzja:** Usuń `source_type` ze StudyCardDto

```typescript
{
  (id, front, back);
}
```

---

### 12. POST /api/study/summary

**Kiedy używany?** Po zakończeniu sesji nauki

```
Session completed → POST { cards_seen: 20, duration: 600 }
```

**Analiza:**

- Czy to UI feature (pokazanie "Ukończyłeś 20/20")? **TAK** - frontend może sam
- Czy to backend analytics? **Może być** - ale...

**Problem:** Over-engineering dla MVP

- Backend może logować metrics z GET /api/study/flashcards (counter)
- Osobny POST to dodatkowa złożoność

**Decyzja:** ❌ **Opcjonalny, usuń na razie** (można dodać w przyszłości)

---

## Podsumowanie Decyzji

### ❌ Usunięte endpointy (5)

1. `GET /api/flashcards/{id}` - frontend ma dane w local state
2. `DELETE /api/flashcards` (bulk) - nie MVP
3. `GET /api/flashcard-sources` - nie MVP (organizacja)
4. `GET /api/flashcard-sources/{id}` - nie MVP
5. `POST /api/study/summary` - analytics może być w GET endpoint

### 🔧 Uproszczone DTOs

#### POST /api/flashcards Response

```diff
- {
-   flashcard: {
-     id, front, back,
-     flashcard_source_id,  // ❌ unused
-     source_type,
-     created_at            // ❌ unused in fresh item
-   }
- }
+ { id, front, back, source_type }
```

#### GET /api/flashcards Response

```diff
  {
    data: [{
      id, front, back,
-     flashcard_source: {     // ❌ nested unused
-       id,                   // ❌ no use case
-       source_type,
-       created_at            // ❌ unused
-     },
+     source_type,            // ✅ flat, only what's needed
      created_at,             // ✅ for sorting
-     updated_at              // ❌ not displayed
    }]
  }
```

#### PATCH /api/flashcards/{id} Response

```diff
- 204 No Content
+ 200 + { id, front, back, source_type }
```

**Reason:** Server mutuje `source_type` (ai → ai-edited), frontend musi wiedzieć

#### GET /api/study/flashcards Response

```diff
  {
    cards: [{
      id, front, back,
-     source_type  // ❌ nie pokazujemy badge w nauce
    }]
  }
```

---

## Wnioski

### Zmniejszenie kompleksności

- **Było:** 14 endpointów, 20+ typów DTO
- **Jest:** 9 endpointów, 13 typów DTO
- **Redukcja:** ~36% endpointów, ~35% typów

### Zasady które się sprawdziły

1. **UI-first thinking** - każde pole musi mieć konkretne miejsce w UI
2. **YAGNI** - "może się przyda" = usuń
3. **Information hiding** - nie leakuj DB structure (`flashcard_source_id`)
4. **Flat when possible** - nested objects tylko gdy reprezentują relację używaną przez UI

### Red flags w pierwotnym designie

- **Inconsistency:** POST zwracał flat, GET zwracał nested → confusion
- **Technical leakage:** `flashcard_source_id` w API bez use case
- **Premature optimization:** bulk delete, źródła, analytics przed MVP validation

### Non-breaking evolution path

Wszystkie decyzje pozwalają na bezpieczną ewolucję:

- Dodanie pola (np. `updated_at`) → non-breaking
- Zmiana flat → nested (np. `source: {id, type}`) → additive
- Przywrócenie endpoint → nowy routing

---

## Finalne API dla MVP

### AI Generation

- `POST /api/ai/generations` → `{generation_id, proposals}`
- `POST /api/ai/generations/accept` → `204`

### Flashcard CRUD

- `POST /api/flashcards` → `{id, front, back, source_type}`
- `GET /api/flashcards` → `{data: [{id, front, back, source_type, created_at}], pagination}`
- `PATCH /api/flashcards/{id}` → `{id, front, back, source_type}`
- `DELETE /api/flashcards/{id}` → `204`

### Study Mode

- `GET /api/study/flashcards` → `{cards: [{id, front, back}], total_available}`

### Auth

- `DELETE /api/users/me` → `204` (optional password)

**Total:** 8 endpointów (było 14)

---

## Next Steps

1. ✅ Zaktualizować `lib/dto/types.ts` z uproszczonymi typami
2. ⏳ Zaktualizować `api-plan.md` z finalnymi decyzjami
3. ⏳ Zaktualizować testy API (gdy powstaną) zgodnie z nowymi DTO
4. ⏳ Zaimplementować API routes z nowymi kontraktami
