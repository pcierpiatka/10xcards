Plan Wdrożenia Usługi OpenRouter

Niniejszy dokument stanowi kompleksowy plan implementacji usługi OpenRouterService w aplikacji opartej na Next.js i Supabase. Jego celem jest stworzenie solidnej, bezpiecznej i łatwej w utrzymaniu abstrakcji do komunikacji z API OpenRouter.

1. Opis usługi

OpenRouterService będzie klasą po stronie serwera (server-side), odpowiedzialną za całą logikę komunikacji z API OpenRouter. Będzie ona enkapsulować tworzenie zapytań, wysyłanie ich do API, obsługę odpowiedzi oraz zarządzanie błędami i bezpieczeństwem. Usługa będzie działać wyłącznie w środowisku serwerowym Next.js (np. w ramach Server Actions lub API Routes), aby chronić klucz API.

Główne zadania usługi:

    Abstrakcja złożoności API OpenRouter.
    Bezpieczne zarządzanie kluczem API.
    Dynamiczne budowanie payloadu zapytania, w tym formatowanie wiadomości, parametrów modelu i żądania ustrukturyzowanej odpowiedzi.
    Walidacja i parsowanie odpowiedzi, w tym obsługa formatu JSON.
    Implementacja spójnej strategii obsługi błędów.

2. Opis konstruktora

Konstruktor klasy OpenRouterService będzie odpowiedzialny za inicjalizację usługi i weryfikację jej podstawowej konfiguracji.

// Przykład w lib/services/OpenRouterService.ts

class OpenRouterService {
/\*\*

- @param apiKey Klucz API OpenRouter. Powinien być odczytany ze zmiennych środowiskowych po stronie serwera.
- @throws {Error} Jeśli klucz API nie zostanie dostarczony.
  \*/
  constructor(private readonly apiKey: string) {
  if (!apiKey) {
  throw new Error("OpenRouter API key is missing. Check your server environment variables.");
  }
  }

// ... metody
}

    Cel: Zapewnienie, że usługa jest tworzona tylko wtedy, gdy klucz API jest dostępny. Wstrzykiwanie klucza przez konstruktor ułatwia testowanie i zarządzanie konfiguracją.
    Użycie: Instancja usługi będzie tworzona w miejscu jej wykorzystania (np. w Server Action), pobierając klucz z process.env.OPENROUTER_API_KEY.

3. Publiczne metody i pola

Usługa będzie eksponować jedną główną metodę publiczną do generowania uzupełnień czatu.
public async getChatCompletion<T>(options: ChatCompletionOptions): Promise<ChatCompletionResult<T>>

Metoda ta jest głównym punktem wejścia do usługi. Przyjmuje obiekt konfiguracyjny i zwraca przetworzoną odpowiedź od modelu językowego.

Parametry (ChatCompletionOptions):
Nazwa pola Typ Wymagane Opis
model string Tak Identyfikator modelu do użycia, np. google/gemini-pro lub anthropic/claude-3-opus.
messages ChatMessage[] Tak Tablica obiektów wiadomości ({ role: 'system' | 'user' | 'assistant', content: string }) reprezentująca historię konwersacji.
jsonSchema object (JSON Schema) Nie Opcjonalny schemat JSON do wymuszenia ustrukturyzowanej odpowiedzi. Usługa automatycznie opakuje go w poprawny format response_format.
params object (np. { temperature, max_tokens }) Nie Opcjonalne parametry modelu, takie jak temperature, max_tokens, top_p itp.

Zwracana wartość (Promise<ChatCompletionResult<T>>):

Obiekt ChatCompletionResult będzie miał następującą strukturę:

type ChatCompletionResult<T> = {
success: true;
content: T; // Jeśli użyto jsonSchema, będzie to sparsowany obiekt typu T. W przeciwnym razie string.
rawContent: string; // Surowa odpowiedź tekstowa od modelu.
} | {
success: false;
error: OpenRouterError; // Obiekt błędu.
};

Przykład użycia:

// Server Action w pliku app/actions.ts

'use server';

import { OpenRouterService } from '@/lib/services/OpenRouterService';
// Załóżmy, że zdefiniowaliśmy schemat walidacji Zod
import { userDetailsSchema, UserDetails } from '@/lib/schemas/user-details';
import { zodToJsonSchema } from 'zod-to-json-schema';

export async function extractUserDetails(prompt: string) {
const service = new OpenRouterService(process.env.OPENROUTER_API_KEY!);
const jsonSchema = zodToJsonSchema(userDetailsSchema, "userDetails");

const result = await service.getChatCompletion<UserDetails>({
model: 'GPT-4.1 mini',
messages: [
{ role: 'system', content: 'Extract user details from the following text and provide a JSON response.' },
{ role: 'user', content: prompt }
],
jsonSchema: jsonSchema.definitions.userDetails, // Przekazujemy właściwy obiekt schematu
params: {
temperature: 0.7,
}
});

if (result.success) {
// result.content jest teraz w pełni typowanym obiektem UserDetails
console.log('Extracted name:', result.content.name);
return result.content;
} else {
// Obsłuż błąd
console.error(`Error: ${result.error.message}`);
return null;
}
}

4. Prywatne metody i pola

Wewnętrzna implementacja usługi będzie rozbita na mniejsze, prywatne metody, aby zwiększyć czytelność i łatwość utrzymania.

    #apiBaseUrl: string = 'https://openrouter.ai/api/v1'
        Prywatne pole przechowujące bazowy URL API OpenRouter.

    #buildRequestBody(options: ChatCompletionOptions): object
        Odpowiedzialna za tworzenie ciała zapytania POST na podstawie opcji przekazanych do metody publicznej.
        Logika tej metody będzie:
            Mapować options.model, options.messages i options.params na odpowiednie pola.
            Obsługa response_format: Jeśli options.jsonSchema jest zdefiniowane, metoda skonstruuje obiekt response_format zgodnie ze specyfikacją OpenRouter:

            {
              "type": "json_schema",
              "json_schema": {
                "name": "extracted_data", // Nazwa może być statyczna lub dynamiczna
                "strict": true,
                "schema": options.jsonSchema
              }
            }

    #executeRequest(body: object): Promise<Response>
        Wykonuje zapytanie fetch do endpointu /chat/completions.
        Ustawia nagłówki: Authorization: Bearer ${this.#apiKey} i Content-Type: application/json.
        Obsługuje podstawowe błędy sieciowe i rzuca wyjątki, które będą przechwytywane wyżej.

    #parseResponse<T>(response: Response, jsonSchema?: object): Promise<ChatCompletionResult<T>>
        Przetwarza surową odpowiedź HTTP.
        Sprawdza status HTTP; jeśli nie jest to 200 OK, tworzy i zwraca odpowiedni obiekt błędu OpenRouterError.
        Jeśli odpowiedź jest poprawna, parsuje jej JSON.
        Wyodrębnia treść wiadomości z response.choices[0].message.content.
        Jeśli jsonSchema było użyte:
            Próbuje sparsować content za pomocą JSON.parse() w bloku try...catch.
            Jeśli parsowanie się powiedzie, waliduje obiekt przy użyciu biblioteki Zod (lub innej) na podstawie wejściowego schematu.
            Jeśli parsowanie lub walidacja się nie powiedzie, zwraca błąd ParsingError.
        Zwraca finalny obiekt ChatCompletionResult.

5. Obsługa błędów

Błędy będą reprezentowane przez niestandardowe klasy dziedziczące po Error, co ułatwi ich obsługę w logice aplikacji.
Kod HTTP Nazwa Błędu Opis Sugerowana akcja
401 OpenRouterAuthError Nieprawidłowy lub brakujący klucz API. Przerwij. Zaloguj błąd krytyczny.
429 OpenRouterRateLimitError Przekroczono limit zapytań. Zaimplementuj logikę ponawiania (exponential backoff).
400 OpenRouterInvalidRequestError Nieprawidłowa składnia zapytania (np. zły model). Przerwij. Zaloguj ciało zapytania do debugowania.
5xx OpenRouterServiceUnavailableError Błąd po stronie serwerów OpenRouter. Ponów próbę 2-3 razy z opóźnieniem.

- NetworkError Błąd połączenia sieciowego z serwera aplikacji do OpenRouter. Ponów próbę 2-3 razy z opóźnieniem.
- ParsingError Odpowiedź modelu nie jest poprawnym JSON-em, mimo że go zażądano. Zaloguj surową odpowiedź. Zwróć błąd do UI.
- ValidationError Struktura JSON-a jest poprawna, ale nie zgadza się z oczekiwanym schematem. Zaloguj obiekt i błędy walidacji. Zwróć błąd.

// Przykładowa definicja błędu
class OpenRouterError extends Error {
constructor(message: string, public readonly statusCode?: number) {
super(message);
this.name = this.constructor.name;
}
}

class OpenRouterAuthError extends OpenRouterError {}
// ... i tak dalej dla pozostałych błędów

6. Kwestie bezpieczeństwa

   Zarządzanie kluczem API: Klucz OPENROUTER*API_KEY musi być przechowywany jako zmienna środowiskowa dostępna wyłącznie po stronie serwera.
   W środowisku lokalnym: w pliku .env.local.
   W środowisku produkcyjnym (DigitalOcean): jako zmienna środowiskowa na poziomie aplikacji. Nigdy nie należy go umieszczać w kodzie źródłowym ani poprzedzać prefiksem NEXT_PUBLIC*.

   Ochrona przed Prompt Injection: Cała zawartość pochodząca od użytkownika (np. prompt w extractUserDetails) musi być traktowana jako niezaufana. Należy unikać konstruowania promptów systemowych przez prostą konkatenację stringów z danymi od użytkownika. Zamiast tego, należy jasno oddzielić instrukcje systemowe od danych użytkownika w tablicy messages.

   Walidacja wejścia: Wszystkie dane wejściowe do publicznych metod usługi powinny być walidowane, aby zapobiec nieoczekiwanym błędom w zapytaniach do API.

7. Plan wdrożenia krok po kroku

   Konfiguracja środowiska:
   a. Dodaj plik .env.local do katalogu głównego projektu.
   b. Dodaj w nim zmienną OPENROUTER*API_KEY="sk_or*...".
   c. Dodaj .env.local do pliku .gitignore.
   d. W panelu DigitalOcean App Platform, w ustawieniach aplikacji, dodaj zmienną środowiskową OPENROUTER_API_KEY z wartością produkcyjnego klucza.

   Definicja typów i schematów:
   a. Utwórz plik lib/types/openrouter.ts i zdefiniuj w nim interfejsy ChatMessage, ChatCompletionOptions, ChatCompletionResult oraz klasy błędów (OpenRouterError etc.).
   b. Utwórz plik lib/schemas/zod-schemas.ts (lub podobny) do definiowania schematów zod dla danych, które chcesz ekstrahować (np. userDetailsSchema). Zainstaluj zod i zod-to-json-schema: npm install zod zod-to-json-schema.

   Implementacja klasy OpenRouterService:
   a. Utwórz plik lib/services/OpenRouterService.ts.
   b. Zaimplementuj szkielet klasy z konstruktorem i publiczną metodą getChatCompletion.
   c. Zaimplementuj logikę prywatnych metod krok po kroku:
   - #buildRequestBody: Upewnij się, że poprawnie przetwarza wszystkie opcje, zwłaszcza warunkowe dodawanie response_format.
   - #executeRequest: Użyj fetch do wysłania zapytania, przekazując body i nagłówki.
   - #parseResponse: Zaimplementuj logikę sprawdzania statusu odpowiedzi, parsowania JSON i walidacji schematu przy użyciu Zod.

   Integracja z Next.js (Server Actions):
   a. Utwórz plik app/actions.ts.
   b. Dodaj dyrektywę 'use server'; na górze pliku.
   c. Zaimplementuj Server Action (np. extractUserDetails), która:
   i. Importuje OpenRouterService.
   ii. Tworzy nową instancję usługi, przekazując process.env.OPENROUTER_API_KEY.
   iii. Wywołuje service.getChatCompletion z odpowiednimi parametrami.
   iv. Obsługuje zwrócony obiekt result (zarówno success: true, jak i success: false).

   Integracja z Frontendem (React):
   a. W komponencie React (np. app/page.tsx), użyj hooka useTransition do obsługi stanu ładowania podczas wywoływania Server Action.
   b. Stwórz formularz (<form>) lub przycisk, którego akcja (action lub onClick) wywołuje Server Action.
   c. Wyświetlaj dane użytkownikowi w przypadku sukcesu. W przypadku błędu, wyświetl odpowiedni komunikat (np. używając komponentu Toast z biblioteki shadcn/ui).

   Konfiguracja CI/CD i wdrożenia:
   a. Upewnij się, że Twój Dockerfile poprawnie kopiuje cały kod aplikacji i instaluje zależności.
   b. W pliku workflow GitHub Actions (.github/workflows/deploy.yml), upewnij się, że proces budowania obrazu Docker ma dostęp do zmiennych build-time, jeśli są potrzebne.
   c. Skonfiguruj DigitalOcean App Platform do automatycznego wdrażania z Twojego repozytorium GitHub po każdym pushu do gałęzi main. Platforma automatycznie pobierze zdefiniowane zmienne środowiskowe.
