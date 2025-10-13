# Dokument wymagań produktu (PRD) - EduFiszki AI

## 1. Przegląd produktu

EduFiszki AI to aplikacja webowa, która umożliwia użytkownikom szybkie i efektywne tworzenie fiszek edukacyjnych. Aplikacja wspiera dwie metody tworzenia fiszek:

- Generowanie fiszek przy użyciu technologii AI na podstawie wklejonego tekstu.
- Ręczne tworzenie fiszek przez użytkownika.

System oferuje interfejs do przeglądania, edycji i usuwania fiszek, zarządzany przez konta użytkowników. Fiszki są integrowane z istniejącym, otwartoźródłowym algorytmem powtórek, co umożliwia praktykowanie metody spaced repetition. Dodatkowym aspektem rozwiązania są mechanizmy walidacji danych (kontrola długości, poprawności wprowadzanych treści) oraz system logowania błędów, który zapewnia zarówno bezpieczny dostęp, jak i możliwość analizy jakości generowanych fiszek.

## 2. Problem użytkownika

Aktualnie ręczne tworzenie wysokiej jakości fiszek edukacyjnych jest czasochłonne, co zniechęca użytkowników do korzystania z efektywnej metody nauki przez powtórki (spaced repetition). Użytkownicy potrzebują narzędzia:

- Które automatycznie generuje fiszki na podstawie wprowadzanego tekstu.
- Pozwala na ręczne tworzenie oraz edycję fiszek.
- Zapewnia prosty system zarządzania kontami i fiszkami.
- Integruje się z sprawdzonym algorytmem powtórek.
- Dba o walidację danych wejściowych, w tym ograniczenia długości (maksymalnie 300 znaków dla pytania, 600 znaków dla odpowiedzi i przykładu).

## 3. Wymagania funkcjonalne

1. Generowanie fiszek przez AI
   - Użytkownik wkleja tekst (zakres 1000–10 000 znaków).
   - System generuje domyślnie 10 fiszek.
   - Każda fiszka zawiera:
     - Pytanie (maksymalnie 300 znaków)
     - Odpowiedź (maksymalnie 600 znaków)
     - Przykład użycia (maksymalnie 600 znaków)
     - Źródło: "AI"
   - Walidacja długości znaków na poziomie wejścia oraz wyjścia.
   - Przy błędach krytycznych prezentowane są przyjazne, zabawne komunikaty, natomiast przekroczenia limitu znaków komunikowane są prostym komunikatem.

2. Manualne tworzenie fiszek
   - Użytkownik może ręcznie dodać fiszkę poprzez formularz z polami: pytanie, odpowiedź, (opcjonalnie) przykład.
   - Wprowadzone fiszki zawierają metadane: Źródło ustawione na "Manual".
   - Walidacja danych (ograniczenia znaków: 300 znaków dla pytania, 600 znaków dla odpowiedzi i przykładu).

3. Przeglądanie, edycja i usuwanie fiszek
   - Intuicyjny interfejs użytkownika do przeglądania listy fiszek.
   - Możliwość edycji istniejącej fiszki – modyfikacja pól (pytanie, odpowiedź, przykładowe użycie).
   - Usuwanie fiszki z potwierdzeniem akcji.

4. System kont użytkowników
   - Rejestracja i logowanie użytkowników.
   - Edycja danych osobowych oraz zmiana hasła.
   - Autoryzacja i weryfikacja dostępu (mechanizmy RLS).

5. Integracja z algorytmem powtórek
   - Wykorzystanie otwartego rozwiązania do obsługi systemu spaced repetition.
   - Fiszki są integrowane z algorytmem powtórek po stworzeniu.

6. Walidacja danych i obsługa błędów
   - Walidacja zarówno po stronie klienta, jak i serwera.
   - Logowanie błędów w osobnej tabeli w bazie danych (przechowywanie danych wejściowych i wyników generowanych przez LLM).
   - Mechanizmy informujące użytkownika o błędach bez ujawniania szczegółów technicznych.

## 4. Granice produktu

W MVP nie przewiduje się następujących funkcjonalności:

- Własny, zaawansowany algorytm powtórek (np. w stylu SuperMemo lub Anki).
- Import plików w różnych formatach (PDF, DOCX itp.).
- Współdzielenie zestawów fiszek między użytkownikami.
- Integracje z zewnętrznymi platformami edukacyjnymi.
- Aplikacje mobilne – na początek tylko wersja webowa.

Dodatkowo, nie rozwijane są funkcje zaawansowanej analizy danych poza logowaniem dla monitorowania jakości generowanych fiszek.

## 5. Historyjki użytkowników

### US-001

- ID: US-001
- Tytuł: Generowanie fiszek z wykorzystaniem AI
- Opis: Jako użytkownik chcę wkleić tekst do systemu, aby automatycznie wygenerować 10 fiszek za pomocą AI, aby szybko uzyskać przykładowe fiszki do nauki.
- Kryteria akceptacji:
  - Użytkownik wkleja tekst o długości między 1000 a 10 000 znaków.
  - System generuje domyślnie 10 fiszek.
  - Każda fiszka posiada pytanie (max 300 znaków), odpowiedź oraz przykład (każdy max 600 znaków) wraz ze źródłem ustawionym na "AI".
  - Walidacja długości jest przeprowadzana, a w przypadku przekroczenia limitu użytkownik otrzymuje prosty komunikat o błędzie.

### US-002

- ID: US-002
- Tytuł: Ręczne tworzenie fiszki
- Opis: Jako użytkownik chcę móc samodzielnie tworzyć fiszki poprzez wypełnienie formularza, abym mógł dostosować treść fiszki do moich potrzeb.
- Kryteria akceptacji:
  - Formularz umożliwia wpisanie pytania (max 300 znaków), odpowiedzi i opcjonalnie przykładu (każde pole max 600 znaków).
  - Po zapisaniu, fiszka jest dodawana do konta użytkownika, z metadanymi wskazującymi źródło "Manual".
  - System weryfikuje poprawność długości tekstu i wyświetla komunikat o błędzie w przypadku łamania limitów.

### US-003

- ID: US-003
- Tytuł: Przeglądanie, edycja i usuwanie fiszek
- Opis: Jako użytkownik chcę przeglądać listę moich fiszek oraz mieć możliwość ich edycji lub usunięcia, aby móc łatwo zarządzać swoimi materiałami edukacyjnymi.
- Kryteria akceptacji:
  - Użytkownik ma dostęp do listy wszystkich fiszek zapisanych na swoim koncie.
  - Istnieje możliwość otwarcia fiszki w celu edycji (modyfikacja pytania, odpowiedzi i przykładu).
  - Użytkownik może usunąć fiszkę z systemu z potwierdzeniem akcji usunięcia.
  - Zmiany są zapisywane natychmiast, a interfejs aktualizowany w czasie rzeczywistym.

### US-004

- ID: US-004
- Tytuł: Rejestracja, logowanie i zarządzanie kontem użytkownika
- Opis: Jako nowy lub powracający użytkownik chcę mieć możliwość rejestracji, logowania i edycji danych mojego konta, aby zapewnić bezpieczeństwo i personalizację dostępu do moich fiszek.
- Kryteria akceptacji:
  - Użytkownik może założyć nowe konto poprzez podanie niezbędnych danych (np. email, hasło).
  - System umożliwia logowanie i autoryzację użytkownika.
  - Użytkownik ma możliwość edytowania danych osobowych oraz zmiany hasła.
  - Dane użytkownika są chronione standardowymi procedurami bezpieczeństwa (uwierzytelnianie, walidacja, RLS).

### US-005

- ID: US-005
- Tytuł: Obsługa i walidacja błędów
- Opis: Jako użytkownik chcę otrzymywać przyjazne komunikaty błędów podczas korzystania z aplikacji, aby wiedzieć, co należy poprawić w przypadku nieprawidłowego wprowadzenia danych lub wystąpienia problemu systemowego.
- Kryteria akceptacji:
  - W przypadku krytycznych błędów system wyświetla przyjazny, zabawny komunikat.
  - Przekroczenie limitu znaków powoduje wyświetlenie prostego komunikatu błędu.
  - Wszystkie inne błędy są logowane za pomocą generycznego komunikatu błędu.
  - Użytkownik zostanie poinformowany o konieczności rozpoczęcia nowej sesji w przypadku błędu podczas generowania fiszek przez AI.

## 6. Metryki sukcesu

1. Akceptacja fiszek generowanych przez AI:
   - Co najmniej 75% wygenerowanych przez AI fiszek musi zostać zaakceptowanych przez użytkownika.
2. Wykorzystanie AI w tworzeniu fiszek:
   - Użytkownicy powinni korzystać z funkcji generowania fiszek przez AI przy tworzeniu co najmniej 75% wszystkich fiszek.
3. Jakość generowanych fiszek:
   - Analiza logów (przechowywanych w dedykowanej tabeli bazy danych) z danymi wejściowymi i wyjściowymi przez AI pozwoli monitorować jakość generowanych fiszek.
4. Bezpieczeństwo i dostępność:
   - System musi zapewnić bezpieczne zarządzanie kontami użytkowników poprzez poprawne uwierzytelnianie i autoryzację.
5. Wydajność walidacji:
   - Walidacja danych wejściowych musi być szybka i skuteczna, zapobiegając wprowadzeniu nieprawidłowych danych.
