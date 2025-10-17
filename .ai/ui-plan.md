# Architektura UI dla Fiszkomat AI

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika dla Fiszkomat AI zostanie zaimplementowana jako Aplikacja Jednostronicowa (SPA - Single Page Application), oparta na bibliotece React. Centralnym punktem aplikacji dla zalogowanego użytkownika będzie widok `/dashboard`, który skupia wszystkie kluczowe funkcje zarządzania fiszkami, zgodnie z wymaganiem `F-15`. Architektura kładzie nacisk na minimalizację nawigacji i zapewnienie natychmiastowej informacji zwrotnej poprzez zastosowanie strategii **optymistycznego UI** dla wszystkich operacji CRUD.

Struktura opiera się na kilku głównych widokach (trasach), z których większość jest chroniona i wymaga uwierzytelnienia:

- **Widoki publiczne:** Logowanie (`/login`) i Rejestracja (`/register`).
- **Widoki chronione:** Główny widok (`/dashboard`), Tryb nauki (`/study`) i Ustawienia (`/settings`).

Zarządzanie stanem aplikacji w zakresie MVP będzie realizowane przy użyciu wbudowanych mechanizmów React (hooki `useState`, `useEffect`, `useContext`), co jest zgodne z decyzjami z sesji planowania. Centralny mechanizm obsługi zapytań do API zapewni globalną obsługę błędów, w tym automatyczne wylogowanie użytkownika przy odpowiedzi `401 Unauthorized`.

## 2. Lista widoków

### Widok: Logowanie

- **Ścieżka widoku:** `/login`
- **Główny cel:** Umożliwienie istniejącemu użytkownikowi zalogowania się do aplikacji (zgodnie z `F-02`, `US-002`).
- **Kluczowe informacje do wyświetlenia:**
  - Formularz z polami na adres e-mail i hasło.
  - Komunikaty walidacyjne i błędy logowania ("Nieprawidłowy e-mail lub hasło").
  - Link do widoku rejestracji.
- **Kluczowe komponenty widoku:**
  - `LoginForm`: Komponent zawierający logikę formularza, walidację i komunikację z endpointem Supabase Auth.
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Prosty, jednoznaczny formularz. Po pomyślnym zalogowaniu, użytkownik jest automatycznie przekierowywany do `/dashboard`.
  - **Dostępność:** Poprawne etykiety dla pól formularza, obsługa walidacji za pomocą atrybutów `aria`.
  - **Bezpieczeństwo:** Komunikacja z API odbywa się przez HTTPS. Token JWT jest bezpiecznie obsługiwany przez bibliotekę kliencką Supabase.

### Widok: Rejestracja

- **Ścieżka widoku:** `/register`
- **Główny cel:** Umożliwienie nowemu użytkownikowi założenia konta (zgodnie z `F-01`, `US-001`).
- **Kluczowe informacje do wyświetlenia:**
  - Formularz z polami na adres e-mail i hasło.
  - Informacje o wymaganiach dotyczących hasła (np. min. 8 znaków).
  - Komunikaty o błędach (np. "Ten adres e-mail jest już zajęty").
  - Link do widoku logowania.
- **Kluczowe komponenty widoku:**
  - `RegisterForm`: Komponent z logiką formularza, walidacją po stronie klienta (format e-mail, złożoność hasła) i komunikacją z Supabase Auth.
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Po pomyślnej rejestracji użytkownik jest automatycznie logowany i przekierowywany na `/dashboard`.
  - **Dostępność:** Taka sama jak w widoku logowania.
  - **Bezpieczeństwo:** Komunikacja z API przez HTTPS.

### Widok: Główny (Dashboard)

- **Ścieżka widoku:** `/dashboard`
- **Główny cel:** Centralny hub do zarządzania wszystkimi fiszkami, obejmujący generowanie przez AI, tworzenie manualne, przeglądanie, edycję i usuwanie (`F-04` do `F-10`, `F-15`).
- **Kluczowe informacje do wyświetlenia:**
  - Formularz do generowania fiszek przez AI.
  - Licznik znaków w czasie rzeczywistym dla pola tekstowego AI (`US-008`).
  - Tymczasowa lista propozycji fiszek wygenerowanych przez AI (po udanej operacji).
  - Główna lista wszystkich zapisanych fiszek użytkownika (`F-08`, `US-005`).
  - Komunikat "stanu pustego" (empty state), jeśli użytkownik nie ma żadnych fiszek (`F-17`, `US-004`).
- **Kluczowe komponenty widoku:**
  - `AiGeneratorForm`: Pole `textarea` z licznikiem znaków i przyciskiem "Generuj". Obsługuje stany ładowania i błędu.
  - `AiProposalsList`: Dynamicznie pojawiająca się lista propozycji od AI z checkboxami i przyciskami akcji ("Akceptuj", "Odrzuć").
  - `FlashcardList`: Lista fiszek użytkownika, która implementuje mechanizm "Załaduj więcej" (paginacja `GET /api/flashcards`).
  - `FlashcardItem`: Reprezentuje pojedynczą fiszkę na liście, umożliwia edycję "inline" (`US-011`) oraz usunięcie. Treść może być skracana z opcją "pokaż więcej".
  - `EmptyState`: Komponent wyświetlany, gdy lista fiszek jest pusta, z wyraźnym wezwaniem do działania.
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Wszystkie operacje (dodawanie, edycja, usuwanie) są optymistyczne, co daje natychmiastowe poczucie responsywności. Nowe fiszki pojawiają się na górze listy.
  - **Dostępność:** Edycja "inline" musi prawidłowo zarządzać fokusem. Ikony akcji (edycja, usuń) muszą mieć tekstowe etykiety (`aria-label`).
  - **Bezpieczeństwo:** Wszystkie dane są pobierane i modyfikowane za pośrednictwem chronionych endpointów API, które weryfikują token JWT.

### Widok: Tryb nauki

- **Ścieżka widoku:** `/study`
- **Główny cel:** Przeprowadzenie sesji nauki z wykorzystaniem zapisanych fiszek (`F-11` do `F-14`).
- **Kluczowe informacje do wyświetlenia:**
  - Pojedyncza fiszka (najpierw przód, po kliknięciu odsłaniany jest tył).
  - Licznik postępu (np. "Karta 5 z 87").
  - Ekran podsumowania po przejrzeniu wszystkich fiszek (`US-015`).
- **Kluczowe komponenty widoku:**
  - `StudyCard`: Komponent wyświetlający jedną fiszkę z logiką odkrywania odpowiedzi.
  - `StudyControls`: Przyciski "Następna" i "Zakończ" do nawigacji w sesji.
  - `StudyCompletionScreen`: Ekran wyświetlany na koniec sesji z przyciskami "Zacznij od nowa" i "Wróć do listy".
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Minimalistyczny interfejs skupiony na nauce, bez rozpraszaczy.
  - **Dostępność:** Interakcja z kartą (odkrywanie tyłu) musi być możliwa z klawiatury. Zmiana treści powinna być komunikowana przez czytniki ekranu (np. `aria-live`).
  - **Bezpieczeństwo:** Dane do sesji są pobierane z dedykowanego endpointu `GET /api/study/flashcards`.

### Widok: Ustawienia

- **Ścieżka widoku:** `/settings`
- **Główny cel:** Umożliwienie użytkownikowi zarządzania kontem, w tym jego usunięcia (`F-03`, `US-003`).
- **Kluczowe informacje do wyświetlenia:**
  - Sekcja "Strefa zagrożenia" z przyciskiem "Usuń konto".
- **Kluczowe komponenty widoku:**
  - `DeleteAccountSection`: Komponent zawierający przycisk inicjujący proces usuwania konta.
  - `ConfirmationModal`: Okno dialogowe wymagające od użytkownika ostatecznego potwierdzenia nieodwracalnej akcji usunięcia konta.
- **UX, dostępność i względy bezpieczeństwa:**
  - **UX:** Jasne ostrzeżenie przed wykonaniem akcji niszczącej. Po usunięciu konta użytkownik jest wylogowywany i przekierowywany na stronę główną.
  - **Dostępność:** Okno modalne musi być w pełni dostępne, tzn. trapić fokus i być zamykalne klawiszem `Escape`.
  - **Bezpieczeństwo:** Akcja wywołuje endpoint `DELETE /api/users/me` po stronie serwera. Zgodnie z decyzjami MVP, uproszczono proces i nie jest wymagane ponowne uwierzytelnienie w UI.

## 3. Mapa podróży użytkownika

Główna ścieżka użytkownika koncentruje się na cyklu generowania i nauki, co rozwiązuje kluczowy problem zdefiniowany w PRD.

**Przepływ: Od tekstu do nauki**

1.  **Rejestracja/Logowanie:** Użytkownik tworzy konto (`/register`) lub loguje się (`/login`) i zostaje przekierowany do `Głównego Widoku` (`/dashboard`).
2.  **Generowanie fiszek:**
    - W widoku `/dashboard` użytkownik wkleja tekst do formularza `AiGeneratorForm` (`F-04`).
    - Klika "Generuj". UI wyświetla wskaźnik ładowania, a w tle wysyłane jest zapytanie `POST /api/ai/generations`.
    - Po otrzymaniu odpowiedzi, pod formularzem pojawia się `AiProposalsList` z propozycjami fiszek (`F-05`).
    - Użytkownik zaznacza wybrane propozycje i klika "Akceptuj zaznaczone" (`F-06`).
    - UI **optymistycznie** dodaje nowe fiszki do komponentu `FlashcardList` i czyści listę propozycji, wysyłając w tle zapytanie `POST /api/ai/generations/accept`.
3.  **Zarządzanie manualne (opcjonalnie):**
    - Użytkownik klika "Dodaj nową fiszkę" w nawigacji. Na górze `FlashcardList` pojawia się formularz "inline" (`US-010`).
    - Po zapisaniu nowa fiszka **optymistycznie** dodawana jest do listy (wywołując `POST /api/flashcards`).
    - Użytkownik może edytować (`PATCH /api/flashcards/{id}`) lub usuwać (`DELETE /api/flashcards/{id}`) istniejące fiszki bezpośrednio na liście (`US-011`, `US-012`).
4.  **Rozpoczęcie nauki:**
    - Gdy użytkownik jest gotowy, klika "Rozpocznij naukę" w nawigacji (`F-11`). Przycisk jest aktywny, ponieważ istnieją już fiszki.
    - Następuje przekierowanie do `Widoku Nauki` (`/study`).
    - Aplikacja pobiera losowy zestaw fiszek (`GET /api/study/flashcards`) i wyświetla pierwszą z nich (`F-12`).
5.  **Sesja nauki:**
    - Użytkownik klika kartę, aby odkryć odpowiedź (`F-13`), a następnie klika "Następna", aby załadować kolejną losową kartę (`F-14`).
    - Po przejrzeniu wszystkich kart wyświetlany jest `StudyCompletionScreen` (`US-015`).
6.  **Zakończenie:** Użytkownik wraca do głównego widoku (`/dashboard`), aby zarządzać fiszkami lub rozpocząć nową sesję.

## 4. Układ i struktura nawigacji

Struktura nawigacyjna została zaprojektowana z myślą o prostocie i stałym dostępie do kluczowych akcji.

- **Routing:** Aplikacja wykorzystuje routing po stronie klienta. Dostęp do tras `/dashboard`, `/study`, `/settings` jest chroniony. Niezalogowany użytkownik próbujący uzyskać do nich dostęp jest przekierowywany do `/login`.
- **Globalny Pasek Nawigacyjny (`GlobalHeader`):** Jest to stały element interfejsu widoczny na wszystkich chronionych stronach. Zawiera:
  - **Logo/Nazwa Aplikacji:** Link prowadzący zawsze do `/dashboard`.
  - **Przycisk "Rozpocznij naukę":** Link do `/study`, aktywny tylko wtedy, gdy użytkownik posiada co najmniej jedną fiszkę.
  - **Przycisk "Dodaj nową fiszkę":** Wyzwala pojawienie się formularza "inline" na widoku `/dashboard`. Na innych widokach może być nieaktywny lub przekierowywać do dashboardu.
  - **Menu Użytkownika (Dropdown):** Ikona z awatarem lub inicjałami użytkownika, która po kliknięciu rozwija menu z opcjami:
    - Link do `Ustawień` (`/settings`).
    - Przycisk "Wyloguj" (kończy sesję i przekierowuje do `/login`).

Ten układ zapewnia, że główne akcje (`F-11`, `F-07`) są zawsze dostępne, a jednocześnie główna przestrzeń robocza na `/dashboard` pozostaje czytelna i skoncentrowana na zarządzaniu fiszkami.

## 5. Kluczowe komponenty

Poniższe komponenty są kluczowe dla architektury i będą reużywane w różnych częściach aplikacji.

- `GlobalHeader`: Stały pasek nawigacyjny widoczny na stronach chronionych, zapewniający spójną nawigację.
- `FlashcardItem`: Komponent reprezentujący pojedynczą fiszkę. Zawiera logikę dla trybu wyświetlania, trybu edycji "inline" oraz akcji (edycja, usuwanie).
- `ConfirmationModal`: Generyczne okno dialogowe używane do potwierdzania akcji niszczących (usuwanie fiszki, usuwanie konta), zapewniając spójne doświadczenie (`F-10`, `F-16`).
- `ToastNotification`: Komponent do wyświetlania krótkich, nieblokujących komunikatów o powodzeniu, błędzie lub informacyjnych (np. po zapisaniu fiszki, w przypadku błędu API).
- `LoadMoreButton`: Przycisk używany w `FlashcardList` do doładowywania kolejnych partii danych z spaginowanego endpointu API (`GET /api/flashcards`).
- `EmptyState`: Komponent wyświetlany w miejscach list (głównie `FlashcardList`), gdy brak jest danych do wyświetlenia, kierujący użytkownika do wykonania pierwszej akcji.
