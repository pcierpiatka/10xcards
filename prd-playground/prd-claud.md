# Dokument wymagań produktu (PRD) - Aplikacja Fiszek AI

## 1. Przegląd produktu

Aplikacja Fiszek AI to webowa platforma edukacyjna, która wykorzystuje sztuczną inteligencję do automatycznego generowania fiszek edukacyjnych na podstawie materiałów dostarczonych przez użytkownika. Aplikacja umożliwia użytkownikom szybkie tworzenie wysokiej jakości fiszek bez czasochłonnej pracy manualnej, a następnie naukę metodą powtórek rozłożonych w czasie (spaced repetition).

Główne funkcjonalności MVP obejmują:

- Generowanie 8-12 fiszek z tekstu wejściowego (1000-10000 znaków) przy użyciu OpenAI GPT-4o-mini
- System preview i selekcji wygenerowanych fiszek przed zapisem
- Manualne tworzenie, edycję i usuwanie fiszek
- Prosty system kont użytkowników z autentykacją JWT
- Sesje nauki z algorytmem round-robin (z warstwą abstrakcji umożliwiającą przyszłą podmianę na SM-2 lub FSRS)
- Responsywny interfejs webowy

Produkt dedykowany jest wszystkim osobom pragnącym utrwalić wiedzę za pomocą fiszek, z naciskiem na prostotę użytkowania i funkcjonalność. Rozwój prowadzony jest przez solo developera z wykorzystaniem narzędzi AI, zgodnie z filozofią KISS (Keep It Simple Stupid).

## 2. Problem użytkownika

Osoby uczące się nowych umiejętności lub wiedzy często znają efektywność metody powtórek rozłożonych w czasie (spaced repetition) z wykorzystaniem fiszek. Jednak główną barierą w adopcji tej metody jest czasochłonny proces tworzenia wysokiej jakości fiszek.

Kluczowe problemy:

- Manualne tworzenie fiszek wymaga znacznego nakładu czasu i wysiłku
- Formulowanie dobrych pytań i odpowiedzi wymaga umiejętności pedagogicznych
- Przekształcanie materiałów źródłowych (notatek, artykułów, podręczników) w format fiszek jest żmudne
- Użytkownicy często rezygnują z nauki fiszkami mimo świadomości jej efektywności

Konsekwencje:

- Mniejsza efektywność nauki
- Rezygnacja z narzędzi opartych na spaced repetition
- Frustracja związana z czasem potrzebnym na przygotowanie materiałów

Aplikacja Fiszek AI rozwiązuje ten problem poprzez automatyzację procesu tworzenia fiszek, umożliwiając użytkownikom wygenerowanie zestawu 8-12 fiszek w ciągu 5-15 sekund z dowolnego tekstu źródłowego, przy zachowaniu kontroli nad finalną treścią poprzez system preview i selekcji.

## 3. Wymagania funkcjonalne

### 3.1 Autentykacja i zarządzanie kontem

3.1.1 Rejestracja użytkownika

- Formularz rejestracji z polami: email i hasło
- Walidacja formatu email
- Walidacja wymagań hasła (minimalna długość)
- Brak weryfikacji email w MVP
- Automatyczne logowanie po rejestracji
- Przekierowanie do Dashboard po pomyślnej rejestracji

  3.1.2 Logowanie użytkownika

- Formularz logowania z polami: email i hasło
- Generowanie JWT token przy pomyślnym logowaniu
- Przekierowanie do Dashboard po zalogowaniu
- Komunikat błędu przy nieprawidłowych danych

  3.1.3 Wylogowanie

- Przycisk wylogowania dostępny w navbar na Dashboard
- Usunięcie JWT token
- Przekierowanie do strony logowania

  3.1.4 Bezpieczeństwo

- Implementacja Row Level Security (RLS) - użytkownik ma dostęp tylko do własnych fiszek
- Autentykacja oparta na JWT token
- Połączenia tylko przez HTTPS

### 3.2 Generowanie fiszek przez AI

3.2.1 Wprowadzanie tekstu źródłowego

- Pole textarea z walidacją zakresu 1000-10000 znaków
- Live counter wyświetlający "X/10000 znaków"
- Przycisk "Generuj fiszki z AI" disabled i wyszarzony gdy liczba znaków poza zakresem
- Komunikat walidacji wyświetlany gdy liczba znaków nieprawidłowa
- Enter i nowe linie liczone jako znaki

  3.2.2 Proces generowania

- Loading state z komunikatem "Generuję fiszki..." i spinnerem/animacją CSS
- Wykorzystanie OpenAI GPT-4o-mini
- Generowanie 8-12 fiszek w formacie JSON
- Czas generowania: 5-15 sekund
- Brak możliwości anulowania podczas generowania

  3.2.3 Struktura promptu AI

- Rola: Ekspert tworzenia fiszek edukacyjnych
- Zadanie: Generowanie 8-12 fiszek na podstawie tekstu
- Format: JSON array z obiektami zawierającymi pola "front" i "back"
- Zasady:
  - Przód maksymalnie 300 znaków - konkretne, zamknięte pytanie
  - Tył maksymalnie 600 znaków - pełna odpowiedź
  - Unikanie pytań otwartych typu "Co to jest...", "Wymień..."
  - Brak duplikatów
- Output: czysty JSON bez markdown

  3.2.4 Tracking generowania

- Zapis każdego generowania do tabeli ai_generation_sessions:
  - user_id
  - input_text
  - output_json
  - created_at
  - generated_count (liczba wygenerowanych fiszek)
  - accepted_count (liczba zaakceptowanych przez użytkownika)

### 3.3 Preview i akceptacja fiszek AI

3.3.1 Ekran Preview

- Lista 8-12 wygenerowanych fiszek
- Każda fiszka wyświetla przód i tył
- Checkbox przy każdej fiszcze (domyślnie wszystkie zaznaczone)
- Checkbox "Zaznacz wszystkie" na górze listy
- Przycisk "Wróć" w górnym rogu ekranu
- Brak navbar

  3.3.2 Akcje użytkownika

- Możliwość odznaczania/zaznaczania poszczególnych fiszek
- Przycisk "Zaakceptuj zaznaczone" - zapisuje wybrane fiszki do bazy danych
- Przycisk "Anuluj" - powrót do Dashboard bez zapisywania
- Tylko zaakceptowane fiszki trafiają do bazy z oznaczeniem source='ai'

### 3.4 Manualne tworzenie fiszek

3.4.1 Dodawanie fiszki

- Przycisk "+ Dodaj fiszkę ręcznie" umieszczony na górze listy fiszek
- Modal z dwoma polami tekstowymi:
  - Przód (required, min 1 znak, max 300 znaków)
  - Tył (required, min 1 znak, max 600 znaków)
- Live counter znaków pod każdym polem
- Przyciski: "Zapisz" i "Anuluj"
- Po zapisaniu: zamknięcie modala i wyświetlenie fiszki na liście
- Fiszka zapisywana z oznaczeniem source='manual'

### 3.5 Przeglądanie fiszek

3.5.1 Dashboard - struktura

- Navbar zawierający:
  - Logo aplikacji
  - Link "Moje Fiszki"
  - Przycisk "Rozpocznij naukę"
  - Przycisk wylogowania
- Pole textarea z przyciskiem "Generuj fiszki z AI"
- Lista fiszek poniżej

  3.5.2 Lista fiszek - wyświetlanie

- Format: karty/kafelki
- Każda karta wyświetla:
  - Przód fiszki (większy font)
  - Tył fiszki (mniejszy font)
  - Ikony w prawym górnym rogu: edycja i usunięcie
- Sortowanie: created_at ASC (najstarsze pierwsze)
- Paginacja: 20 fiszek na stronę (bez możliwości zmiany)
- Kontrolki paginacji: przyciski "Poprzednia"/"Następna" oraz numer strony

  3.5.3 Empty state

- Wyświetlany gdy użytkownik ma 0 fiszek
- Zawiera: pole textarea, przycisk "Wygeneruj fiszki z AI" i komunikat "Nie masz jeszcze żadnych fiszek"

### 3.6 Edycja fiszek

3.6.1 Proces edycji

- Kliknięcie ikony edycji otwiera modal
- Modal zawiera dwa pola tekstowe wypełnione aktualnymi wartościami
- Walidacja:
  - Oba pola required
  - Przód: max 300 znaków
  - Tył: max 600 znaków
  - Live counter znaków
- Przyciski: "Zapisz" i "Anuluj"
- Po zapisaniu: toast notification "Fiszka zaktualizowana" (znika po 1 sekundzie)
- Brak wsparcia AI przy edycji

### 3.7 Usuwanie fiszek

3.7.1 Proces usuwania

- Kliknięcie ikony usunięcia otwiera modal potwierdzenia
- Modal zawiera:
  - Komunikat: "Czy na pewno chcesz usunąć tę fiszkę?"
  - Podgląd przodu fiszki
  - Przyciski: "Usuń" (czerwony) i "Anuluj"
- Po potwierdzeniu:
  - Hard delete z bazy danych (brak możliwości cofnięcia)
  - Toast notification "Fiszka usunięta"
  - Natychmiastowe usunięcie z listy

### 3.8 Sesja nauki

3.8.1 Rozpoczęcie sesji

- Przycisk "Rozpocznij naukę" w headerze Dashboard
- Gdy użytkownik ma 0 fiszek: przycisk disabled z tooltipem "Dodaj fiszki aby rozpocząć naukę"
- Sesja obejmuje wszystkie zaakceptowane fiszki użytkownika

  3.8.2 Interfejs sesji nauki

- Pełnoekranowy widok (bez navbar)
- Progress bar na górze: "Fiszka X/Y"
- Przycisk "Zakończ" (red outline) w górnym rogu - zawsze dostępny
- Wyświetlanie przodu fiszki
- Przycisk "Pokaż tył"
- Po kliknięciu: wyświetlenie tyłu fiszki
- Przyciski na dole: - "Zakończ" - powrót do Dashboard - "Następna" - przejście do następnej fiszki

  3.8.3 Algorytm kolejności (Round-robin MVP)

- Pobranie wszystkich fiszek użytkownika
- Sortowanie po created_at ASC
- Wyświetlanie po kolei od najstarszej
- Brak stanu między sesjami - każda nowa sesja zaczyna od początku
- Przyciski "Pamiętam"/"Nie pamiętam" nie wpływają na kolejność w MVP

  3.8.4 Zakończenie sesji

- Po ostatniej fiszcze + kliknięcie "Następna": automatyczne zakończenie
- Ekran: "Ukończono! Przejrzałeś X fiszek"
- Przycisk "Wróć do listy"
- Przy jednej fiszcze: również kończymy po "Następna" (bez zapętlania)

  3.8.5 Przerwanie sesji

- Kliknięcie "Zakończ" w trakcie sesji otwiera modal potwierdzenia
- Modal: "Zakończyć naukę? Postęp nie zostanie zapisany"
- Przyciski: "Tak, zakończ" i "Kontynuuj"

### 3.9 Obsługa błędów i stanów ładowania

3.9.1 Komunikaty błędów

- Wszystkie błędy prezentowane jako generyczne komunikaty przyjazne użytkownikowi
- Przykład: "Nie udało się wygenerować fiszek, spróbuj ponownie"
- Brak technicznych szczegółów (stacktrace, error codes) dla użytkownika
- Wszystkie błędy logowane do systemu logów na backendzie

  3.9.2 Loading states

- Spinner z komunikatem podczas generowania AI
- Opcjonalnie: zabawna animacja CSS
- Loading indicator przy wszystkich operacjach asynchronicznych

  3.9.3 Notyfikacje

- Toast notifications znikające po 1 sekundzie
- Przykłady: "Fiszka zaktualizowana", "Fiszka usunięta"
- Pozycjonowanie: konsystentne w aplikacji

### 3.10 Responsive design

- Natywne wsparcie przez wybraną technologię stylowania
- Prawidłowe wyświetlanie na urządzeniach mobilnych, tabletach i desktopach
- Zachowanie funkcjonalności na wszystkich rozmiarach ekranów

## 4. Granice produktu

### 4.1 Poza zakresem MVP

4.1.1 Algorytmy powtórek

- Własny, zaawansowany algorytm powtórek (jak SuperMemo, Anki)
- MVP wykorzystuje prosty round-robin z warstwą abstrakcji dla przyszłej rozbudowy

  4.1.2 Import i formaty plików

- Import wielu formatów (PDF, DOCX, itp.)
- Na MVP tylko kopiuj-wklej tekstu

  4.1.3 Funkcje społecznościowe

- Współdzielenie zestawów fiszek między użytkownikami
- Publiczne biblioteki fiszek
- Komentarze i oceny

  4.1.4 Integracje

- Integracje z innymi platformami edukacyjnymi
- API dla zewnętrznych aplikacji

  4.1.5 Aplikacje natywne

- Aplikacje mobilne (iOS, Android)
- Na początek tylko web

## 5. Historyjki użytkowników

### US-001: Rejestracja nowego użytkownika

Opis:
Jako nowy użytkownik chcę zarejestrować konto za pomocą adresu email i hasła, aby móc korzystać z aplikacji i przechowywać swoje fiszki.

Kryteria akceptacji:

- Formularz rejestracji zawiera pola: email i hasło
- Email jest walidowany pod kątem poprawnego formatu
- Hasło jest walidowane pod kątem minimalnej długości
- Po pomyślnej rejestracji użytkownik jest automatycznie zalogowany
- Po rejestracji następuje przekierowanie do Dashboard
- System tworzy JWT token dla nowego użytkownika
- Komunikat błędu wyświetla się gdy email jest już zajęty
- Komunikat błędu wyświetla się gdy dane są nieprawidłowe

### US-002: Logowanie istniejącego użytkownika

Opis:
Jako zarejestrowany użytkownik chcę zalogować się do aplikacji przy użyciu mojego emaila i hasła, aby uzyskać dostęp do moich fiszek.

Kryteria akceptacji:

- Formularz logowania zawiera pola: email i hasło
- Po pomyślnym logowaniu generowany jest JWT token
- Po zalogowaniu następuje przekierowanie do Dashboard
- Komunikat błędu wyświetla się przy nieprawidłowych danych logowania
- Token JWT jest przechowywany i używany do autoryzacji kolejnych żądań
- Sesja pozostaje aktywna do momentu wylogowania

### US-003: Wylogowanie z aplikacji

Opis:
Jako zalogowany użytkownik chcę móc się wylogować z aplikacji, aby zabezpieczyć swoje konto przy korzystaniu z urządzenia współdzielonego.

Kryteria akceptacji:

- Przycisk wylogowania jest widoczny w navbar na Dashboard
- Po kliknięciu przycisku JWT token jest usuwany
- Następuje przekierowanie do strony logowania
- Użytkownik traci dostęp do chronionych zasobów po wylogowaniu

### US-004: Wprowadzenie tekstu do generowania fiszek

Opis:
Jako użytkownik chcę wkleić tekst źródłowy do pola tekstowego i zobaczyć walidację, aby upewnić się, że tekst ma odpowiednią długość przed wygenerowaniem fiszek.

Kryteria akceptacji:

- Pole textarea jest dostępne na Dashboard
- Live counter wyświetla aktualną liczbę znaków w formacie "X/10000 znaków"
- Counter aktualizuje się w czasie rzeczywistym podczas wpisywania
- Enter i nowe linie są liczone jako znaki
- Komunikat walidacji wyświetla się gdy liczba znaków jest poniżej 1000
- Komunikat walidacji wyświetla się gdy liczba znaków przekracza 10000
- Przycisk "Generuj fiszki z AI" jest disabled gdy liczba znaków poza zakresem 1000-10000
- Przycisk "Generuj fiszki z AI" jest wyszarzony wizualnie gdy disabled

### US-005: Generowanie fiszek przez AI

Opis:
Jako użytkownik chcę wygenerować fiszki z mojego tekstu za pomocą AI, aby zaoszczędzić czas na manualnym tworzeniu.

Kryteria akceptacji:

- Po kliknięciu "Generuj fiszki z AI" wyświetla się loading state
- Loading state zawiera komunikat "Generuję fiszki..." i spinner/animację
- Żądanie jest wysyłane do OpenAI GPT-4o-mini
- System generuje 8-12 fiszek w formacie JSON
- Każda fiszka zawiera pole "front" (max 300 znaków) i "back" (max 600 znaków)
- Generowanie trwa 5-15 sekund
- Brak możliwości anulowania podczas generowania
- Po zakończeniu następuje przekierowanie do ekranu Preview
- Generowanie jest zapisywane w tabeli ai_generation_sessions z polami: user_id, input_text, output_json, generated_count, created_at

### US-006: Preview i akceptacja wygenerowanych fiszek

Opis:
Jako użytkownik chcę przejrzeć wygenerowane przez AI fiszki i wybrać tylko te, które chcę zapisać, aby mieć kontrolę nad jakością mojej kolekcji.

Kryteria akceptacji:

- Ekran Preview wyświetla listę 8-12 wygenerowanych fiszek
- Każda fiszka pokazuje zarówno przód jak i tył
- Każda fiszka ma checkbox (domyślnie zaznaczony)
- Na górze listy jest checkbox "Zaznacz wszystkie"
- Checkbox "Zaznacz wszystkie" zaznacza/odznacza wszystkie fiszki jednocześnie
- Przycisk "Wróć" w górnym rogu pozwala wrócić do Dashboard
- Przycisk "Zaakceptuj zaznaczone" zapisuje tylko zaznaczone fiszki do bazy
- Przycisk "Anuluj" wraca do Dashboard bez zapisywania
- Zapisane fiszki mają pole source='ai'
- Po akceptacji pole accepted_count w ai_generation_sessions jest aktualizowane
- Po akcji następuje powrót do Dashboard z wyświetlonymi zapisanymi fiszkami

### US-007: Manualne dodanie fiszki

Opis:
Jako użytkownik chcę ręcznie utworzyć fiszkę, aby mieć możliwość dodania specyficznych pytań, których AI nie wygenerowało.

Kryteria akceptacji:

- Przycisk "+ Dodaj fiszkę ręcznie" jest widoczny na górze listy fiszek
- Po kliknięciu otwiera się modal z dwoma polami tekstowymi
- Pole "Przód" ma walidację: required, min 1 znak, max 300 znaków
- Pole "Tył" ma walidację: required, min 1 znak, max 600 znaków
- Live counter znaków jest wyświetlany pod każdym polem
- Przycisk "Zapisz" jest dostępny
- Przycisk "Anuluj" zamyka modal bez zapisywania
- Po zapisaniu modal się zamyka
- Nowa fiszka pojawia się na liście
- Fiszka jest zapisana z polem source='manual'
- Po zapisaniu wyświetla się toast notification

### US-008: Przeglądanie listy fiszek

Opis:
Jako użytkownik chcę przeglądać moją kolekcję fiszek w czytelny sposób, aby łatwo znajdować i zarządzać nimi.

Kryteria akceptacji:

- Dashboard wyświetla listę fiszek w formacie kart/kafelków
- Każda karta pokazuje przód fiszki (większy font) i tył fiszki (mniejszy font)
- Ikony edycji i usunięcia są widoczne w prawym górnym rogu każdej karty
- Fiszki są sortowane po created_at ASC (najstarsze pierwsze)
- Lista wyświetla maksymalnie 20 fiszek na stronę
- Kontrolki paginacji zawierają przyciski "Poprzednia" i "Następna"
- Numer aktualnej strony jest wyświetlony
- Przycisk "Poprzednia" jest disabled na pierwszej stronie
- Przycisk "Następna" jest disabled na ostatniej stronie
- Lista automatycznie odświeża się po dodaniu, edycji lub usunięciu fiszki

### US-009: Wyświetlenie empty state

Opis:
Jako nowy użytkownik bez fiszek chcę zobaczyć informacyjny ekran, który zachęci mnie do utworzenia pierwszych fiszek.

Kryteria akceptacji:

- Gdy użytkownik ma 0 fiszek, wyświetla się empty state
- Empty state zawiera pole textarea
- Empty state zawiera przycisk "Wygeneruj fiszki z AI"
- Wyświetlany jest komunikat "Nie masz jeszcze żadnych fiszek"
- Wszystkie elementy są czytelnie zaprezentowane
- Po wygenerowaniu pierwszych fiszek empty state znika

### US-010: Edycja istniejącej fiszki

Opis:
Jako użytkownik chcę edytować treść mojej fiszki, aby poprawić błędy lub zaktualizować informacje.

Kryteria akceptacji:

- Kliknięcie ikony edycji otwiera modal
- Modal zawiera dwa pola tekstowe: "Przód" i "Tył"
- Pola są wypełnione aktualnymi wartościami fiszki
- Oba pola mają walidację: required, przód max 300 znaków, tył max 600 znaków
- Live counter znaków jest wyświetlany pod każdym polem
- Przycisk "Zapisz" zapisuje zmiany
- Przycisk "Anuluj" zamyka modal bez zapisywania
- Po zapisaniu modal się zamyka
- Zaktualizowana fiszka natychmiast wyświetla nowe wartości na liście
- Toast notification "Fiszka zaktualizowana" pojawia się i znika po 1 sekundzie
- Edycja dostępna tylko dla zaakceptowanych fiszek

### US-011: Usunięcie fiszki

Opis:
Jako użytkownik chcę usunąć niepotrzebną fiszkę z możliwością potwierdzenia akcji, aby uniknąć przypadkowego usunięcia.

Kryteria akceptacji:

- Kliknięcie ikony usunięcia otwiera modal potwierdzenia
- Modal wyświetla komunikat "Czy na pewno chcesz usunąć tę fiszkę?"
- Modal pokazuje podgląd przodu fiszki
- Przycisk "Usuń" jest czerwony i wyraźnie oznaczony
- Przycisk "Anuluj" zamyka modal bez usuwania
- Po potwierdzeniu fiszka jest usuwana z bazy danych (hard delete)
- Fiszka natychmiast znika z listy
- Toast notification "Fiszka usunięta" pojawia się i znika po 1 sekundzie
- Brak możliwości cofnięcia usunięcia

### US-012: Rozpoczęcie sesji nauki

Opis:
Jako użytkownik z fiszkami chcę rozpocząć sesję nauki, aby przećwiczyć materiał metodą powtórek.

Kryteria akceptacji:

- Przycisk "Rozpocznij naukę" jest widoczny w headerze Dashboard
- Gdy użytkownik ma 0 fiszek, przycisk jest disabled
- Tooltip "Dodaj fiszki aby rozpocząć naukę" wyświetla się po najechaniu na disabled button
- Kliknięcie przycisku (gdy aktywny) przekierowuje do pełnoekranowego widoku sesji
- Navbar znika w trybie sesji nauki
- Sesja obejmuje wszystkie zaakceptowane fiszki użytkownika
- Fiszki są pobierane i sortowane po created_at ASC
- Wyświetlana jest pierwsza fiszka z kolejki

### US-013: Przeglądanie fiszki w sesji nauki

Opis:
Jako użytkownik w sesji nauki chcę zobaczyć przód fiszki, spróbować odpowiedzieć, a następnie sprawdzić tył, aby uczyć się aktywnie.

Kryteria akceptacji:

- Na górze ekranu wyświetlany jest progress "Fiszka X/Y"
- Przycisk "Zakończ" (red outline) jest widoczny w górnym rogu
- Wyświetlany jest przód aktualnej fiszki
- Przycisk "Pokaż tył" jest widoczny i aktywny
- Po kliknięciu "Pokaż tył" wyświetla się tył fiszki
- Przód fiszki pozostaje widoczny po pokazaniu tyłu
- Na dole pojawiają się przyciski "Zakończ" i "Następna"
- Przycisk "Zakończ" jest dostępny przez cały czas

### US-014: Przejście do następnej fiszki

Opis:
Jako użytkownik w sesji nauki chcę przejść do następnej fiszki po przejrzeniu bieżącej, aby kontynuować naukę.

Kryteria akceptacji:

- Przycisk "Następna" jest aktywny po pokazaniu tyłu fiszki
- Kliknięcie "Następna" ładuje następną fiszkę z kolejki (round-robin)
- Progress "Fiszka X/Y" aktualizuje się
- Nowa fiszka pokazuje tylko przód (tył ukryty)
- Przycisk "Pokaż tył" jest ponownie dostępny
- Po przejrzeniu wszystkich fiszek następuje automatyczne zakończenie sesji

### US-015: Zakończenie sesji nauki

Opis:
Jako użytkownik kończący sesję nauki chcę zobaczyć podsumowanie i wrócić do Dashboard, aby mieć poczucie ukończenia.

Kryteria akceptacji:

- Po ostatniej fiszcze i kliknięciu "Następna" sesja kończy się automatycznie
- Wyświetla się ekran "Ukończono! Przejrzałeś X fiszek"
- Przycisk "Wróć do listy" jest widoczny
- Kliknięcie przycisku przekierowuje do Dashboard
- Navbar pojawia się ponownie po powrocie do Dashboard
- Przy jednej fiszcze sesja również kończy się po "Następna" (bez zapętlania)

### US-016: Przerwanie sesji nauki

Opis:
Jako użytkownik w trakcie sesji nauki chcę móc przerwać naukę w dowolnym momencie, z potwierdzeniem aby uniknąć przypadkowego przerwania.

Kryteria akceptacji:

- Przycisk "Zakończ" (red outline) jest dostępny przez cały czas sesji
- Kliknięcie "Zakończ" otwiera modal potwierdzenia
- Modal wyświetla komunikat "Zakończyć naukę? Postęp nie zostanie zapisany"
- Przycisk "Tak, zakończ" kończy sesję i wraca do Dashboard
- Przycisk "Kontynuuj" zamyka modal i kontynuuje sesję
- Po przerwaniu navbar pojawia się ponownie
- Brak zapisywania postępu między sesjami

### US-017: Obsługa błędu generowania AI

Opis:
Jako użytkownik chcę zobaczyć przyjazny komunikat gdy generowanie fiszek przez AI nie powiedzie się, aby zrozumieć problem i wiedzieć co dalej.

Kryteria akceptacji:

- Gdy żądanie do API OpenAI zawiedzie, wyświetla się komunikat błędu
- Komunikat błędu jest generyczny i przyjazny: "Nie udało się wygenerować fiszek, spróbuj ponownie"
- Brak technicznych szczegółów (stacktrace, error codes) dla użytkownika
- Błąd jest logowany do systemu logów na backendzie
- Użytkownik pozostaje na Dashboard (nie jest przekierowywany)
- Może ponownie spróbować wygenerować fiszki
- Loading state znika po wystąpieniu błędu

### US-018: Walidacja długości pól w formularzach

Opis:
Jako użytkownik wypełniający formularz (dodawanie/edycja fiszki) chcę widzieć na bieżąco czy nie przekraczam limitu znaków, aby uniknąć błędów przy zapisie.

Kryteria akceptacji:

- Live counter znaków wyświetla się pod polami "Przód" i "Tył"
- Counter aktualizuje się w czasie rzeczywistym podczas wpisywania
- Counter pokazuje format "X/300" dla przodu i "X/600" dla tyłu
- Przycisk "Zapisz" jest disabled gdy pola są puste
- Komunikat walidacji wyświetla się gdy przekroczono limit znaków
- Komunikat walidacji wyświetla się gdy pole jest puste a jest required
- Walidacja działa zarówno przy dodawaniu jak i edycji fiszki

### US-019: Dostęp do własnych fiszek (RLS)

Opis:
Jako użytkownik chcę mieć pewność, że widzę tylko swoje fiszki i nikt inny nie ma dostępu do mojej kolekcji, aby zachować prywatność danych.

Kryteria akceptacji:

- Użytkownik widzi tylko fiszki powiązane z jego user_id
- Zapytania do bazy danych automatycznie filtrują po user_id
- Row Level Security (RLS) jest aktywne w bazie danych
- Próba dostępu do fiszki innego użytkownika jest blokowana
- Sesja nauki obejmuje tylko fiszki aktualnego użytkownika
- Generowanie AI zapisuje fiszki z poprawnym user_id

### US-020: Paginacja listy fiszek

Opis:
Jako użytkownik z dużą liczbą fiszek chcę nawigować między stronami, aby przeglądać całą kolekcję w wygodny sposób.

Kryteria akceptacji:

- Lista fiszek wyświetla maksymalnie 20 fiszek na stronę
- Kontrolki paginacji są widoczne gdy liczba fiszek przekracza 20
- Przycisk "Poprzednia" pozwala przejść do poprzedniej strony
- Przycisk "Następna" pozwala przejść do następnej strony
- Numer aktualnej strony jest wyświetlony między przyciskami
- Przycisk "Poprzednia" jest disabled na pierwszej stronie
- Przycisk "Następna" jest disabled na ostatniej stronie
- Po przejściu na inną stronę lista przewija się do góry
- Po dodaniu/edycji/usunięciu fiszki użytkownik pozostaje na tej samej stronie (jeśli możliwe)

## 6. Metryki sukcesu

### 6.1 Wskaźnik akceptacji fiszek AI

Definicja: Procent wygenerowanych przez AI fiszek, które użytkownicy zaznaczają i akceptują do zapisu

Formuła: (suma accepted_count / suma generated_count) × 100%

Cel: 75% lub więcej

Źródło danych: Tabela ai_generation_sessions (pola: accepted_count, generated_count)

### 6.2 Wykorzystanie generowania AI

Definicja: Procent fiszek w systemie utworzonych przez AI vs. manualnie

Formuła: (liczba fiszek z source='ai' / całkowita liczba fiszek) × 100%

Cel: 75% lub więcej

Źródło danych: Tabela flashcards (pole: source)
