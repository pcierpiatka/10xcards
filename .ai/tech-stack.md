Frontend - Next.js z React:

- Next.js 15 zapewnia szybkie, wydajne aplikacje z Server-Side Rendering i App Router
- React 19 zapewnia interaktywność i nowoczesne funkcjonalności
- TypeScript 5 dla statycznego typowania kodu i lepszego wsparcia IDE
- Tailwind 4 pozwala na wygodne stylowanie aplikacji
- Shadcn/ui zapewnia bibliotekę dostępnych komponentów React, na których oprzemy UI

Backend - Supabase jako kompleksowe rozwiązanie backendowe:

- Zapewnia bazę danych PostgreSQL
- Zapewnia SDK w wielu językach, które posłużą jako Backend-as-a-Service
- Jest rozwiązaniem open source, które można hostować lokalnie lub na własnym serwerze
- Posiada wbudowaną autentykację użytkowników

AI - Komunikacja z modelami przez usługę Openrouter.ai:

- Dostęp do szerokiej gamy modeli (OpenAI, Anthropic, Google i wiele innych), które pozwolą nam znaleźć rozwiązanie zapewniające wysoką efektywność i niskie koszta
- Pozwala na ustawianie limitów finansowych na klucze API

Testing - Kompleksowa strategia testowania:

- Vitest 2.0 jako framework do testów jednostkowych i integracyjnych (fast, TypeScript-native)
- Playwright 1.48 do testów end-to-end (cross-browser: Chromium, Firefox, WebKit)
- React Testing Library 16.1 do testowania komponentów React
- MSW (Mock Service Worker) 2.6 do mockowania API requests (network-level interception)
- k6 do testów wydajnościowych i load testing
- playwright-lighthouse do audytów performance (Lighthouse w Playwright)

CI/CD i Hosting:

- Github Actions do tworzenia pipeline'ów CI/CD i automatycznego uruchamiania testów
- DigitalOcean do hostowania aplikacji za pośrednictwem obrazu docker
- Codecov do raportowania pokrycia testami (code coverage)
