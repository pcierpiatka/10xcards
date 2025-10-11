<conversation_summary>
<decisions>
1. Fiszka powinna zawierać dwie strony: pytanie (max 300 znaków) i odpowiedź (max 600 znaków), wraz z przykładem użycia oraz źródłem (`Manual`, `AI`).
2. Weryfikacja długości znaków: pytanie maksymalnie 300 znaków, odpowiedź i przykład maksymalnie 600 znaków. Tekst przekazywany do LLM powinien mieścić się w zakresie 1000-10,000 znaków.
3. Obsługa błędów: Przyjazne, zabawne komunikaty dla błędów krytycznych, prosty komunikat dla przekroczenia limitu znaków, a wszystkie inne błędy będą generowane generycznym komunikatem i logowane.
4. Bezpieczeństwo danych: Standardowe praktyki bezpieczeństwa, uwierzytelnianie, weryfikacja dostępności do zasobów (RLS), walidacja.
5. Skalowalność: Na poziomie MVP stosowanie dobrych praktyk programistycznych umożliwiających przyszłą skalowalność.
6. Wybór rozwiązań open-source: Znalezienie dwóch rozwiązań i użycie odpowiedniej abstrakcji umożliwiającej zmianę algorytmów w przyszłości.
7. Generowanie fiszek: Na start zawsze generowanie 10 fiszek, z możliwością definiowania liczby fiszek w późniejszym etapie.
8. Analiza logów: Stworzenie dodatkowej tabeli w bazie danych do przechowywania danych wejściowych i zwróconych przez LLM, analiza na podstawie tej tabeli.
9. Funkcje edycji w MVP: Dodanie fiszki (AI lub ręczne), edycja (pytanie, odpowiedź, przykład - opcjonalnie), usuwanie.
10. Obsługa kont użytkowników: Możliwość tworzenia konta, drobna edycja danych osobowych, zmiana hasła.
    </decisions>

<matched_recommendations>
1. **Jakie są dokładne formaty i struktura danych dla fiszek tworzonych manualnie i generowanych przez AI?**

   **Rekomendacja:** Zdefiniować schemat danych dla obu rodzajów fiszek, uwzględniając pola takie jak `pytanie`, `odpowiedź`, `przykład`, a także metadane dotyczące źródła (`Manual` vs. `AI`), co ułatwi zarządzanie i przechowywanie informacji.

2. **Jakie ograniczenia techniczne dotyczące długości pytań i odpowiedzi mogą wpływać na proces generowania fiszek przez AI?**

   **Rekomendacja:** Przeprowadzić analizę wydajności algorytmów AI przy założonych limitach znaków (300 dla pytania, 600 dla odpowiedzi) oraz wprowadzić mechanizmy walidacji, aby zapewnić zgodność generowanych treści z wymaganiami znaków.

3. **Jakie mechanizmy walidacji będą implementowane, aby zapewnić zgodność wprowadzonych danych z ograniczeniami znaków?**

   **Rekomendacja:** Zaimplementować zarówno walidację po stronie klienta, jak i serwera, aby natychmiast informować użytkowników o przekroczeniu limitów znaków oraz zabezpieczyć system przed nieprawidłowymi danymi wejściowymi.

4. **Jak zamierzamy obsługiwać błędy lub nieprawidłowości w procesie generowania fiszek przez AI?**

   **Rekomendacja:** Informacja dla użytkownika, że wystąpił problem. Rekomendacja to rozpoczęcie nowej sesji tworzenia fiszek.
   </matched_recommendations>

<prd_planning_summary>
**a. Główne wymagania funkcjonalne produktu:**
- **Generowanie fiszek przez AI:** Automatyczne tworzenie fiszek na podstawie wprowadzonego tekstu (kopiuj-wklej) z ograniczeniami znaków (pytanie: max 300, odpowiedź i przykład: max 600).
- **Manualne tworzenie fiszek:** Umożliwienie użytkownikom tworzenia własnych fiszek z podstawowymi funkcjami edycji i usuwania.
- **Przeglądanie, edycja i usuwanie fiszek:** Prosty i czytelny interfejs do zarządzania fiszkami.
- **System kont użytkowników:** Możliwość tworzenia konta, edycji danych osobowych i zmiany hasła.
- **Integracja z algorytmem powtórek:** Wykorzystanie istniejącego rozwiązania open-source do zarządzania powtórkami fiszek.
- **Walidacja danych:** Kontrola długości znaków oraz poprawności danych wejściowych.
- **Obsługa błędów:** Przyjazne komunikaty dla użytkowników oraz logowanie błędów.

**b. Kluczowe historie użytkownika i ścieżki korzystania:**
- **Tworzenie fiszki przez AI:** Użytkownik wkleja tekst, system generuje 10 fiszek, użytkownik wybiera te, które chce zapisać.
- **Ręczne tworzenie fiszki:** Użytkownik wprowadza pytanie, odpowiedź, ewentualny przykład i zapisuje fiszkę.
- **Zarządzanie fiszkami:** Użytkownik przegląda listę fiszek, edytuje lub usuwa wybrane fiszki.
- **Korzystanie z konta:** Użytkownik rejestruje się, loguje, edytuje dane osobowe i resetuje hasło.

**c. Ważne kryteria sukcesu i sposoby ich mierzenia:**
- **Akceptacja fiszek generowanych przez AI:** 75% fiszek musi być zaakceptowanych przez użytkowników.
- **Wykorzystanie AI w tworzeniu fiszek:** 75% fiszek powinno być tworzonych przy użyciu AI.
- **Monitorowanie jakości fiszek:** Analiza logów z bazy danych dotyczących danych wejściowych i wyników AI.

**d. Wszelkie nierozwiązane kwestie lub obszary wymagające dalszego wyjaśnienia:**
- Na poziomie MVP nie są planowane funkcje takie jak zaawansowane algorytmy powtórek, import wielu formatów czy integracje z innymi platformami, ale należy monitorować potrzeby użytkowników na przyszłość.
  </prd_planning_summary>

<unresolved_issues>
Brak nierozwiązanych kwestii na obecnym etapie planowania PRD dla MVP.
</unresolved_issues>
</conversation_summary>