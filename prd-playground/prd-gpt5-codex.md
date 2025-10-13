# Dokument wymagań produktu (PRD) - Flashcard AI MVP

## 1. Przegląd produktu

Flashcard AI MVP to webowa aplikacja do tworzenia i nauki fiszek wykorzystująca model `gpt-4o-mini` od OpenAI. Produkt umożliwia użytkownikom wklejenie własnego tekstu, automatyczne wygenerowanie fiszek, ręczne tworzenie i edytowanie kart oraz naukę kart w losowej kolejności. System obejmuje prostą rejestrację i logowanie oraz przechowuje dane zgodnie z wymogami RODO. Wersja MVP jest projektowana i implementowana przez jednego programistę, bez dodatkowych kanałów wsparcia i zaawansowanych funkcji powtórek.

## 2. Problem użytkownika

Użytkownicy, którzy chcą uczyć się metodą fiszek i powtórek, muszą poświęcać dużo czasu na ręczne tworzenie wysokiej jakości kart. Proces ten zniechęca do regularnego korzystania z metody spaced repetition, przez co nauka jest mniej efektywna i bardziej czasochłonna.

## 3. Wymagania funkcjonalne

### 3.1 Zarządzanie kontem

1. Użytkownik może założyć konto za pomocą adresu email i hasła przy użyciu standardowych mechanizmów frameworka.
2. Użytkownik może zalogować się na swoje konto i wylogować w dowolnym momencie.
3. Użytkownik może usunąć konto; działanie usuwa wszystkie dane powiązane z użytkownikiem, w tym fiszki i wpisy audytowe.

### 3.2 Generowanie fiszek przez AI

4. Użytkownik może wkleić dowolny tekst (zalecane 1 000–10 000 znaków) i wysłać go do modułu AI.
5. System wysyła tekst do modelu `gpt-4o-mini`, który zwraca zestaw fiszek (domyślnie kilka–kilkanaście, maksymalnie około 10 w MVP).
6. Wygenerowane fiszki są prezentowane użytkownikowi w tymczasowej liście bez zapisu do bazy danych.
7. Użytkownik może zaakceptować wszystkie, wybrane lub żadnej z wygenerowanych fiszek.
8. Tylko zaakceptowane fiszki są zapisywane w bazie danych konta użytkownika.
9. System zapisuje do tabeli audytowej tekst wejściowy, listę wygenerowanych fiszek oraz liczby zaakceptowanych/odrzuconych pozycji.

### 3.3 Manualne zarządzanie fiszkami

10. Użytkownik może stworzyć pojedynczą fiszkę manualnie, korzystając z pól `przód` (maks. 300 znaków) i `tył` (maks. 600 znaków).
11. Użytkownik może przeglądać listę wszystkich zapisanych fiszek w formie listy.
12. Użytkownik może edytować pojedynczą fiszkę bezpośrednio z listy (otwierany formularz edycji).
13. Użytkownik może usuwać fiszki.

### 3.4 Nauka fiszek

14. Użytkownik może uruchomić tryb nauki, w którym fiszki są prezentowane w losowej kolejności (random, round-robin bez pamięci sesji).
15. Prezentacja fiszki obejmuje `przód`; użytkownik może odsłonić `tył` i przejść do następnej losowo wybranej fiszki.

### 3.5 Zgodność z RODO i audyt

16. System zapewnia, że użytkownik ma dostęp tylko do swoich fiszek.
17. Na żądanie usunięcia konta system usuwa wszystkie powiązane dane, w tym wpisy audytowe.
18. Dane w spoczynku i w tranzycie są przechowywane zgodnie z dobrymi praktykami bezpieczeństwa (szczegóły implementacyjne określane na późniejszym etapie).
19. Zbierane logi systemowe oraz tabela audytowa umożliwiają ręczne wyliczenie metryk akceptacji fiszek.

### 3.6 Monitorowanie i operacje

20. System rejestruje w logach każde wygenerowanie, akceptację, odrzucenie i usunięcie fiszek, a także operacje konta.
21. Nie ma limitów dziennych na generowanie fiszek w ramach MVP.

## 4. Granice produktu

### 4.1 W zakresie

1. Webowa aplikacja dostępna w przeglądarce desktopowej i mobilnej (responsywność podstawowa, bez gwarancji pełnej zgodności).
2. Rejestracja/logowanie `email + hasło`.
3. Generowanie fiszek z wklejonego tekstu przy użyciu `gpt-4o-mini`.
4. Manualne tworzenie, edycja i usuwanie pojedynczych fiszek.
5. Losowa prezentacja fiszek w trybie nauki.
6. Przechowywanie danych w zgodzie z RODO, łącznie z możliwością usunięcia konta.
7. Tabela audytowa służąca do ręcznego raportowania metryk.

### 4.2 Poza zakresem

1. Zaawansowany algorytm powtórek (np. SM-2, adaptacyjne planowanie powtórek).
2. Import plików w formatach PDF, DOCX i innych.
3. Współdzielenie fiszek pomiędzy użytkownikami.
4. Dedykowane aplikacje mobilne.
5. Limity kosztowe i kontrola zużyć API w MVP.
6. Rozbudowane dashboardy, wizualizacje danych i panele administracyjne.

## 5. Historyjki użytkowników

### US-001 Rejestracja konta

Opis: Jako nowy użytkownik chcę założyć konto przy użyciu adresu email i hasła, aby móc korzystać z aplikacji.
Kryteria akceptacji:

1. Formularz rejestracji przyjmuje poprawny adres email i hasło spełniające minimalne wymogi bezpieczeństwa.
2. System tworzy konto i automatycznie loguje użytkownika lub przekierowuje na ekran logowania.
3. Próba rejestracji z istniejącym adresem email zwraca czytelny komunikat o błędzie.

### US-002 Logowanie do aplikacji

Opis: Jako zarejestrowany użytkownik chcę zalogować się na konto, aby uzyskać dostęp do moich fiszek.
Kryteria akceptacji:

1. Formularz logowania weryfikuje adres email i hasło.
2. Po poprawnym zalogowaniu użytkownik trafia na ekran główny z listą opcji tworzenia fiszek.
3. Niepoprawne dane logowania skutkują komunikatem o błędzie bez ujawniania szczegółów.

### US-003 Wylogowanie

Opis: Jako zalogowany użytkownik chcę móc się wylogować, aby zakończyć swoje konto w danej sesji.
Kryteria akceptacji:

1. Akcja wylogowania jest dostępna z dowolnego ekranu wymagającego autoryzacji.
2. Po wylogowaniu użytkownik jest przekierowany na stronę logowania.
3. Sesja użytkownika zostaje zakończona i wymaga ponownego logowania.

### US-004 Generowanie fiszek przez AI

Opis: Jako użytkownik chcę wkleić tekst i otrzymać wygenerowane fiszki, aby zaoszczędzić czas na ich tworzeniu.
Kryteria akceptacji:

1. Formularz przyjmuje tekst wejściowy i umożliwia wysłanie go do modelu.
2. System prezentuje listę wygenerowanych fiszek bez zapisu do bazy.
3. W razie błędu po stronie modelu użytkownik otrzymuje komunikat o niepowodzeniu.

### US-005 Akceptacja wygenerowanych fiszek

Opis: Jako użytkownik chcę wybrać, które z wygenerowanych fiszek zapisać na moje konto.
Kryteria akceptacji:

1. Użytkownik może zaznaczyć pojedyncze fiszki lub wybrać opcję akceptacji całego zestawu.
2. Tylko zaakceptowane fiszki są zapisywane w bazie danych.
3. Odrzucone fiszki nie są przechowywane; po zakończeniu procesu nie ma do nich dostępu.

### US-006 Manualne tworzenie fiszki

Opis: Jako użytkownik chcę samodzielnie dodać fiszkę, aby mieć kontrolę nad treścią.
Kryteria akceptacji:

1. Formularz manualnej fiszki zawiera pola `przód` (maks. 300 znaków) i `tył` (maks. 600 znaków).
2. Po zapisaniu fiszka pojawia się na liście użytkownika.
3. Próba przekroczenia limitów znaków wyświetla komunikat o błędzie.

### US-007 Edycja fiszki

Opis: Jako użytkownik chcę edytować istniejącą fiszkę, aby poprawić jej treść.
Kryteria akceptacji:

1. Na liście fiszek przy każdej pozycji dostępny jest przycisk edycji.
2. Edycja umożliwia zmianę pól `przód` i `tył` z zachowaniem limitów znaków.
3. Po zapisaniu zmian fiszka na liście jest aktualizowana.

### US-008 Usunięcie fiszki

Opis: Jako użytkownik chcę usunąć fiszkę, która jest mi niepotrzebna.
Kryteria akceptacji:

1. Na liście fiszek dostępna jest akcja usunięcia.
2. System prosi o potwierdzenie przed trwałym usunięciem fiszki.
3. Usunięta fiszka nie pojawia się ponownie na liście ani w trybie nauki.

### US-009 Nauka fiszek

Opis: Jako użytkownik chcę uczyć się z moich fiszek, aby utrwalać wiedzę.
Kryteria akceptacji:

1. Tryb nauki losowo wybiera fiszki z puli zaakceptowanych kart.
2. Użytkownik widzi `przód` fiszki i może odsłonić `tył`.
3. Przejście do kolejnej fiszki wybiera ponownie losową kartę (z możliwością powtórzeń w sesji).

### US-010 Usuwanie konta

Opis: Jako użytkownik chcę usunąć swoje konto i wszystkie dane, aby kontrolować swoją prywatność.
Kryteria akceptacji:

1. Użytkownik uruchamia akcję usunięcia konta z poziomu ustawień.
2. System prosi o potwierdzenie usunięcia konta.
3. Po potwierdzeniu konto, fiszki i wpisy audytowe są permanentnie usuwane, a użytkownik jest wylogowywany.

### US-011 Zgodność z RODO i prywatnością

Opis: Jako użytkownik chcę mieć pewność, że moje dane są widoczne tylko dla mnie i mogą zostać usunięte na żądanie.
Kryteria akceptacji:

1. Użytkownik nie ma dostępu do fiszek innych kont.
2. Żądanie usunięcia konta skutkuje usunięciem wszystkich danych użytkownika.
3. System dokumentuje (w logach) wykonanie operacji usunięcia w sposób pozwalający na audyt.

### US-012 Logowanie zdarzeń audytowych

Opis: Jako właściciel produktu chcę mieć dane audytowe, aby ręcznie obliczać wskaźniki sukcesu.
Kryteria akceptacji:

1. Dla każdego generowania fiszek zapisywany jest tekst wejściowy, lista wygenerowanych fiszek i liczba zaakceptowanych.
2. Każde tworzenie, edycja, usunięcie fiszki i konta generuje wpis w logach zawierający identyfikator użytkownika i znacznik czasu.
3. Wpisy audytowe można wyeksportować w celu ręcznej analizy (np. poprzez zapytanie do bazy danych).

## 6. Metryki sukcesu

1. Wskaźnik akceptacji fiszek: odsetek fiszek wygenerowanych przez AI zaakceptowanych przez użytkowników. Cel: minimum 75%. Źródło danych: tabela audytowa (liczba fiszek zaakceptowanych / liczba fiszek wygenerowanych).
2. Wskaźnik udziału AI: odsetek fiszek tworzonych przy użyciu AI względem wszystkich fiszek zapisanych przez użytkownika. Cel: minimum 75%. Źródło danych: tabela audytowa i logi tworzenia fiszek.
3. Aktywność użytkowników: liczba użytkowników, którzy przynajmniej raz skorzystali z trybu generowania AI i trybu nauki w danym okresie (np. tydzień). Źródło danych: logi zdarzeń.
4. Czas realizacji żądań usunięcia danych: czas od zgłoszenia do potwierdzenia usunięcia konta. Cel: zgodność z RODO (np. wstępny cel do 30 dni). Źródło danych: logi audytowe.
