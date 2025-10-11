# Dokumegitnt wymagań produktu (PRD) - Fiszkomat AI
## 1. Przegląd produktu

Fiszkomat AI to aplikacja internetowa (webowa) zaprojektowana w celu usprawnienia procesu tworzenia cyfrowych fiszek edukacyjnych. Główną propozycją wartości produktu jest wykorzystanie sztucznej inteligencji (AI) do automatycznego generowania wysokiej jakości fiszek na podstawie tekstu dostarczonego przez użytkownika. Celem jest drastyczne skrócenie czasu potrzebnego na przygotowanie materiałów do nauki, a tym samym zachęcenie większej liczby osób do korzystania z efektywnej metody powtórek w odstępach (spaced repetition). Oprócz generowania fiszek przez AI, aplikacja oferuje podstawowe funkcje do manualnego tworzenia, edycji, usuwania i przeglądania fiszek w prostym trybie nauki. Wersja MVP (Minimum Viable Product) skupia się na walidacji kluczowej hipotezy: czy użytkownicy uznają automatyczne generowanie fiszek za wystarczająco wartościowe, aby regularnie korzystać z narzędzia.

## 2. Problem użytkownika

Manualne tworzenie wysokiej jakości fiszek edukacyjnych na podstawie notatek, artykułów czy rozdziałów z podręczników jest procesem żmudnym i czasochłonnym. Użytkownicy muszą samodzielnie identyfikować kluczowe informacje, formułować zwięzłe pytania i odpowiedzi, a następnie przepisywać je do wybranego systemu. Ta bariera wejścia często zniechęca do regularnego stosowania fiszek, mimo ich udowodnionej skuteczności w procesie uczenia się i zapamiętywania. Fiszkomat AI ma na celu rozwiązanie tego problemu poprzez automatyzację najbardziej pracochłonnego etapu, pozwalając użytkownikom skupić się na nauce, a nie na tworzeniu narzędzi do niej.

## 3. Wymagania funkcjonalne

### 3.1. Zarządzanie kontem użytkownika
-   `F-01:` Użytkownik musi mieć możliwość rejestracji w systemie przy użyciu adresu e-mail i hasła.
-   `F-02:` Zarejestrowany użytkownik musi mieć możliwość zalogowania się do systemu.
-   `F-03:` Użytkownik musi mieć możliwość trwałego usunięcia swojego konta wraz ze wszystkimi powiązanymi danymi (fiszkami).

### 3.2. Zarządzanie fiszkami
-   `F-04:` Użytkownik musi mieć możliwość wygenerowania do 10 fiszek za pomocą AI na podstawie wklejonego tekstu (od 1000 do 10000 znaków).
-   `F-05:` Użytkownik musi mieć możliwość przejrzenia wygenerowanych przez AI propozycji fiszek przed ich zapisaniem.
-   `F-06:` Użytkownik musi mieć możliwość zaakceptowania (zapisania) wybranych lub wszystkich wygenerowanych propozycji.
-   `F-07:` Użytkownik musi mieć możliwość manualnego stworzenia nowej fiszki (składającej się z "przodu" i "tyłu").
-   `F-08:` Użytkownik musi mieć możliwość wyświetlenia wszystkich swoich zapisanych fiszek na jednej liście.
-   `F-09:` Użytkownik musi mieć możliwość edycji treści istniejącej, zapisanej fiszki.
-   `F-10:` Użytkownik musi mieć możliwość usunięcia istniejącej fiszki (po potwierdzeniu).

### 3.3. Tryb nauki
-   `F-11:` Użytkownik musi mieć możliwość uruchomienia sesji nauki opartej na wszystkich jego zapisanych fiszkach.
-   `F-12:` W trakcie sesji fiszki muszą być prezentowane pojedynczo, pokazując najpierw "przód".
-   `F-13:` Użytkownik musi mieć możliwość odkrycia "tyłu" fiszki poprzez interakcję (np. kliknięcie).
-   `F-14:` Użytkownik musi mieć możliwość przejścia do następnej (losowej) fiszki.

### 3.4. Interfejs i doświadczenie użytkownika
-   `F-15:` Wszystkie interakcje związane z zarządzaniem fiszkami i uruchamianiem nauki muszą być dostępne z jednego głównego ekranu.
-   `F-16:` Aplikacja musi zapewniać jasne komunikaty o błędach (np. problem z generowaniem AI) oraz akcjach niszczących (np. usuwanie fiszki/konta).
-   `F-17:` Interfejs dla nowego użytkownika (bez fiszek) musi jasno wskazywać, jak wykonać pierwszą akcję (wygenerować lub dodać fiszkę).

## 4. Granice produktu

### 4.1. W zakresie MVP
-   Generowanie fiszek AI wyłącznie z wklejonego tekstu.
-   Manualne tworzenie, edycja i usuwanie fiszek.
-   Prosty system kont (e-mail/hasło) zapewniający izolację danych użytkowników.
-   Podstawowy tryb nauki (odkrywanie przód/tył, losowa kolejność).
-   Wyświetlanie wszystkich fiszek na pojedynczej, nieskategoryzowanej liście.
-   Wykorzystanie modelu `gpt-4o-mini` do generowania treści.

### 4.2. Poza zakresem MVP
-   Zaawansowane algorytmy powtórek w odstępach (np. SuperMemo, Anki). Zamiast tego stosowana jest prosta, losowa kolejność.
-   Import plików w formatach `PDF`, `DOCX`, `PPT`, itp.
-   Organizowanie fiszek w talie, kategorie lub za pomocą tagów.
-   Wyszukiwanie i filtrowanie na liście fiszek.
-   Współdzielenie zestawów fiszek między użytkownikami.
-   Integracje z zewnętrznymi platformami (np. LMS, aplikacje do notatek).
-   Dedykowane aplikacje mobilne (iOS, Android).
-   Funkcje monetyzacji i limity użytkowania.
-   Onboarding i samouczki wewnątrz aplikacji.

## 5. Historyjki użytkowników

### ID: US-001
-   Tytuł: Rejestracja nowego użytkownika
-   Opis: Jako nowy użytkownik, chcę móc założyć konto w aplikacji przy użyciu mojego adresu e-mail i hasła, aby móc zapisywać swoje fiszki.
-   Kryteria akceptacji:
    1.  Istnieje strona/formularz rejestracji z polami na e-mail i hasło.
    2.  System waliduje poprawność formatu adresu e-mail.
    3.  System wymaga ustawienia hasła o minimalnej złożoności (np. 8 znaków).
    4.  Po pomyślnej rejestracji jestem automatycznie zalogowany i przekierowany na główny ekran aplikacji.
    5.  W przypadku, gdy e-mail jest już zajęty, wyświetlany jest odpowiedni komunikat.

### ID: US-002
-   Tytuł: Logowanie użytkownika
-   Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się na swoje konto, aby uzyskać dostęp do moich fiszek.
-   Kryteria akceptacji:
    1.  Istnieje strona/formularz logowania z polami na e-mail i hasło.
    2.  Po podaniu poprawnych danych jestem zalogowany i przekierowany na główny ekran.
    3.  Po podaniu błędnych danych wyświetlany jest komunikat "Nieprawidłowy e-mail lub hasło".

### ID: US-003
-   Tytuł: Usunięcie konta
-   Opis: Jako użytkownik, chcę mieć możliwość trwałego usunięcia mojego konta i wszystkich moich danych z aplikacji.
-   Kryteria akceptacji:
    1.  W ustawieniach konta znajduje się opcja "Usuń konto".
    2.  Po kliknięciu tej opcji pojawia się okno dialogowe z prośbą o ostateczne potwierdzenie akcji.
    3.  Po potwierdzeniu, moje konto oraz wszystkie moje fiszki są trwale usuwane z bazy danych.
    4.  Zostaję wylogowany i przekierowany na stronę główną.

### ID: US-004
-   Tytuł: Ekran główny dla nowego użytkownika
-   Opis: Jako nowy, zalogowany użytkownik, który nie ma jeszcze żadnych fiszek, chcę zobaczyć ekran, który zachęci mnie do stworzenia pierwszej fiszki.
-   Kryteria akceptacji:
    1.  Na ekranie głównym, w miejscu listy fiszek, wyświetlany jest specjalny komunikat (tzw. empty state).
    2.  Komunikat ten zawiera wyraźny przycisk/link z wezwaniem do działania, np. "Wygeneruj swoje pierwsze fiszki".
    3.  Widoczne jest pole tekstowe do wklejenia tekstu dla AI.

### ID: US-005
-   Tytuł: Ekran główny z istniejącymi fiszkami
-   Opis: Jako użytkownik, który ma już zapisane fiszki, chcę je wszystkie widzieć na ekranie głównym.
-   Kryteria akceptacji:
    1.  Pod polem do generowania fiszek wyświetlana jest lista wszystkich moich zapisanych kart.
    2.  Każdy element listy pokazuje treść "przodu" i "tyłu" fiszki.
    3.  Przy każdym elemencie listy znajdują się ikony do edycji i usunięcia fiszki.

### ID: US-006
-   Tytuł: Generowanie fiszek przy pomocy AI
-   Opis: Jako użytkownik, chcę wkleić tekst i kliknąć przycisk, aby AI wygenerowało dla mnie propozycje fiszek.
-   Kryteria akceptacji:
    1.  Po wklejeniu tekstu (1000-10000 znaków) i kliknięciu "Generuj", aplikacja wysyła zapytanie do AI.
    2.  W trakcie generowania wyświetlany jest wskaźnik ładowania.
    3.  Po zakończeniu procesu, pod formularzem pojawia się lista do 10 propozycji fiszek.
    4.  Każda propozycja ma pole do zaznaczenia (checkbox) i widoczną treść przodu/tyłu.
    5.  Dostępne są przyciski "Akceptuj zaznaczone" i "Odrzuć wszystko".

### ID: US-007
-   Tytuł: Obsługa błędów generowania AI
-   Opis: Jako użytkownik, chcę otrzymać zrozumiały komunikat, jeśli proces generowania fiszek przez AI nie powiedzie się.
-   Kryteria akceptacji:
    1.  W przypadku błędu API lub problemu z siecią, wskaźnik ładowania znika.
    2.  W miejscu propozycji fiszek pojawia się przyjazny komunikat, np. "Niestety, w tym momencie nie udało się wygenerować fiszek. Spróbuj ponownie za chwilę".
    3.  Komunikat nie zawiera technicznego żargonu.

### ID: US-008
-   Tytuł: Walidacja tekstu wejściowego dla AI
-   Opis: Jako użytkownik, chcę wiedzieć, jakie są ograniczenia co do długości tekstu, który mogę wkleić.
-   Kryteria akceptacji:
    1.  Pod polem tekstowym widoczny jest licznik znaków działający w czasie rzeczywistym.
    2.  Obok licznika znajduje się informacja o wymaganym zakresie (1000-10000 znaków).
    3.  Przycisk "Generuj" jest nieaktywny (wyszarzony), jeśli długość tekstu nie mieści się w zadanym zakresie.

### ID: US-009
-   Tytuł: Akceptacja wygenerowanych fiszek
-   Opis: Jako użytkownik, chcę wybrać, które z propozycji AI mają zostać zapisane na moim koncie.
-   Kryteria akceptacji:
    1.  Po zaznaczeniu wybranych fiszek i kliknięciu "Akceptuj zaznaczone", tylko te fiszki są zapisywane w mojej głównej kolekcji.
    2.  Po pomyślnym zapisaniu, lista propozycji znika, a ja zostaję na ekranie głównym.
    3.  Nowo dodane fiszki są widoczne na górze mojej głównej listy fiszek.

### ID: US-010
-   Tytuł: Ręczne tworzenie fiszki
-   Opis: Jako użytkownik, chcę mieć możliwość szybkiego dodania własnej fiszki bez korzystania z AI.
-   Kryteria akceptacji:
    1.  Na ekranie głównym znajduje się przycisk "Dodaj nową fiszkę".
    2.  Po jego kliknięciu pojawia się formularz z polami "Przód" i "Tył".
    3.  Po wypełnieniu pól i kliknięciu "Zapisz", nowa fiszka jest dodawana do mojej kolekcji i widoczna na liście.
    4.  Długość przodu fiszki jest ograniczona do 300 znaków, a tyłu do 600 znaków.

### ID: US-011
-   Tytuł: Edycja istniejącej fiszki
-   Opis: Jako użytkownik, chcę móc poprawić literówkę lub zmienić treść zapisanej fiszki.
-   Kryteria akceptacji:
    1.  Kliknięcie ikony "Edytuj" przy fiszce na liście zamienia jej statyczny tekst w edytowalne pola tekstowe (inline editing).
    2.  Pojawiają się przyciski "Zapisz" i "Anuluj".
    3.  Kliknięcie "Zapisz" aktualizuje treść fiszki w bazie danych.
    4.  Kliknięcie "Anuluj" przywraca pierwotną treść fiszki.

### ID: US-012
-   Tytuł: Usuwanie istniejącej fiszki
-   Opis: Jako użytkownik, chcę usunąć fiszkę, której już nie potrzebuję.
-   Kryteria akceptacji:
    1.  Kliknięcie ikony "Usuń" przy fiszce na liście powoduje wyświetlenie okna modalnego z pytaniem potwierdzającym.
    2.  Potwierdzenie akcji trwale usuwa fiszkę z mojej kolekcji i listy.
    3.  Anulowanie akcji zamyka okno modalne i nie powoduje żadnych zmian.

### ID: US-013
-   Tytuł: Rozpoczęcie sesji nauki
-   Opis: Jako użytkownik, chcę móc rozpocząć sesję nauki ze wszystkimi moimi fiszkami.
-   Kryteria akceptacji:
    1.  Na ekranie głównym znajduje się przycisk "Rozpocznij naukę".
    2.  Kliknięcie przycisku przenosi mnie do dedykowanego widoku nauki.
    3.  W widoku nauki wyświetlana jest pierwsza, losowo wybrana fiszka (tylko jej "przód").
    4.  Jeśli nie mam żadnych fiszek, przycisk "Rozpocznij naukę" jest nieaktywny.

### ID: US-014
-   Tytuł: Interakcja w trybie nauki
-   Opis: Jako użytkownik, w trakcie sesji nauki chcę móc odkrywać odpowiedzi i przechodzić do kolejnych fiszek.
-   Kryteria akceptacji:
    1.  Kliknięcie na wyświetlaną fiszkę (lub dedykowany przycisk) odkrywa jej "tył".
    2.  W widoku nauki zawsze widoczny jest przycisk "Następna".
    3.  Kliknięcie "Następna" powoduje wyświetlenie kolejnej, losowo wybranej fiszki.
    4.  W widoku nauki zawsze widoczny jest przycisk "Zakończ", który pozwala wrócić do ekranu głównego.

### ID: US-015
-   Tytuł: Zakończenie sesji nauki
-   Opis: Jako użytkownik, chcę otrzymać informację zwrotną po przejrzeniu wszystkich moich fiszek w danej sesji.
-   Kryteria akceptacji:
    1.  Gdy zobaczę ostatnią unikalną fiszkę w losowej sekwencji, po kliknięciu "Następna" wyświetlany jest komunikat końcowy, np. "Gratulacje, powtórzyłeś wszystkie fiszki!".
    2.  Na ekranie końcowym znajdują się przyciski "Zacznij od nowa" (rozpoczyna nową, losową sesję) oraz "Wróć do listy" (przenosi na ekran główny).

## 6. Metryki sukcesu

-   Kryterium 1: Adopcja funkcji AI przy tworzeniu
    -   Cel: 75% fiszek wygenerowanych przez AI jest akceptowane przez użytkownika.
    -   Pomiar: System będzie zapisywał każdą sesję generowania, śledząc liczbę fiszek zaproponowanych przez AI oraz liczbę fiszek faktycznie zaakceptowanych przez użytkownika w tej sesji. Metryka będzie liczona jako `(suma_zaakceptowanych_fiszek / suma_wygenerowanych_propozycji) * 100%`.

-   Kryterium 2: Dominacja AI jako metody tworzenia
    -   Cel: Użytkownicy tworzą 75% wszystkich swoich fiszek z wykorzystaniem AI.
    -   Pomiar: System będzie rozróżniał fiszki stworzone manualnie od tych zaakceptowanych po sugestii AI. Metryka będzie liczona w skali całego produktu jako `(łączna_liczba_fiszek_z_AI / (łączna_liczba_fiszek_z_AI + łączna_liczba_fiszek_manualnych)) * 100%`.