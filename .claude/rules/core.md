# Core Rules

**Always applies**

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript 5 (strict mode)
- Tailwind CSS 4
- shadcn/ui
- Supabase (PostgreSQL + Auth)
- Zod (validation)
- OpenRouter (AI)

## Project Structure

When introducing changes, follow this structure:

- `app/` - Next.js App Router
- `app/api/[resource]/` - API routes (route.ts)
- `app/layout.tsx` - Root layout
- `app/page.tsx` - Pages
- `components/` - React components
- `components/ui/` - shadcn/ui components
- `lib/` - Business logic and utilities
- `lib/db/database.types.ts` - Generated Supabase types
- `lib/dto/types.ts` - API DTOs (Request/Response)
- `lib/services/` - Service layer (business logic)
- `lib/integrations/` - External API clients
- `lib/validation/` - Zod schemas
- `lib/errors/` - Custom error classes
- `.ai/` - Documentation (PRD, API plan, tech stack)
- `.claude/thinking/` - Design analysis sessions

When modifying structure, update this section.

## File Naming

- API routes: `route.ts` (Next.js convention)
- Components: `PascalCase.tsx` (e.g., `UserProfile.tsx`)
- Services: `kebab-case-service.ts` (e.g., `flashcard-service.ts`)
- Utilities: `kebab-case.ts`
- Types: `types.ts`

## Import Aliases

Always use `@/` for imports:

```typescript
import { Button } from "@/components/ui/button";
import type { FlashcardId } from "@/lib/dto/types";
import { FlashcardService } from "@/lib/services/flashcard-service";
```

## Coding Practices

- Use linter feedback to improve code
- Handle errors at the beginning of functions
- Use early returns for error conditions
- Avoid unnecessary else statements (if-return pattern)
- Use guard clauses for preconditions
- Explicit return types on all functions
- Use `import type { ... }` for type-only imports
