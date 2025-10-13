# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**10xCards** is an AI-powered flashcard generator built as an MVP for the 10xDevs certification project. The application allows users to generate flashcards automatically using AI from pasted text, or create them manually. It includes user authentication, flashcard management (CRUD operations), and a simple learning mode.

### Product Requirements

This is an MVP focused on validating whether users find AI-generated flashcards valuable enough to use regularly. Key success metrics:

- **75% AI acceptance rate**: 75% of AI-generated flashcards should be accepted by users
- **75% AI creation rate**: Users should create 75% of their flashcards using AI vs manual creation

Refer to `.ai/prd.md` for detailed product requirements document (in Polish), including all user stories (US-001 through US-015) and functional requirements.

## Tech Stack

- **Next.js 15** - React framework with App Router (SSR enabled)
- **React 19** - UI library
- **TypeScript 5** - Strict mode enabled
- **Tailwind CSS 4** - Utility-first styling with custom color variables
- **shadcn/ui** - Accessible React components built on Radix UI
- **Supabase** - PostgreSQL database, authentication, and BaaS (planned, not yet implemented)
- **OpenRouter** - AI model access (planned to use `gpt-4o-mini`)

See `.ai/tech-stack.md` for the complete stack documentation.

### Before starting work

- Write a plan to .claude/tasks/TASK_NAME.md
- The plan should include your approach and broken-down tasks
- Think MVP - don't over-plan it
- **Ask me to review before coding. Wait for approval.**

### While implementing

- Update the plan as you work
- Document what you actually did vs. what you planned
- **If the plan needs significant changes, flag it and get re-approval**

## Development Commands

```bash
# Development
npm run dev          # Start dev server on http://localhost:3000

# Building
npm run build        # Production build (includes linting and type checking)
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Format code with Prettier
npx tsc --noEmit     # Type check without emitting files

# Package Management
npm install          # Install dependencies
npm ci               # Clean install (use in CI/CD)
```

**Node.js version**: v22 (specified in `.nvmrc`)

## Architecture

### File Structure

```
app/
  ├── api/           # API routes (empty - backend not yet implemented)
  ├── layout.tsx     # Root layout with metadata
  ├── page.tsx       # Home page (renders Welcome component)
  └── globals.css    # Global styles and CSS variables

components/
  ├── Welcome.tsx    # Landing page component showing tech stack
  └── ui/            # shadcn/ui components
      └── button.tsx # Button component with variants

lib/
  └── utils.ts       # Utilities (cn() for className merging)

.ai/
  ├── prd.md         # Product Requirements Document (Polish)
  └── tech-stack.md  # Tech stack documentation (Polish)
```

### Import Aliases

Use `@/*` for absolute imports from project root:

```typescript
import { cn } from "@/lib/utils";
import Welcome from "@/components/Welcome";
```

### Styling System

Tailwind CSS 4 with custom design tokens defined in `app/globals.css`:

- CSS variables for theming: `--background`, `--foreground`, `--primary`, `--card`, etc.
- Dark mode: class-based (`darkMode: "class"` in `tailwind.config.ts`)
- Component variants: Use `class-variance-authority` (see `components/ui/button.tsx`)
- Utility: `cn()` helper in `lib/utils.ts` merges Tailwind classes correctly

### Component Patterns

- Use shadcn/ui components from `components/ui/` for consistent, accessible UI
- Server components by default (Next.js App Router)
- Client components: Add `"use client"` directive when needed
- TypeScript: Strict typing required for all components

## CI/CD

GitHub Actions workflow (`.github/workflows/deploy.yml`):

1. **Test job**: Runs on all PRs and pushes
   - Linting (`npm run lint`)
   - Type checking (`npx tsc --noEmit`)
   - Build verification (`npm run build`)

2. **Build Docker job**: Only on main branch pushes
   - Builds Docker image
   - Pushes to Docker Hub (requires `DOCKER_USERNAME` and `DOCKER_PASSWORD` secrets)
   - Tagged as `latest`

Target deployment: DigitalOcean with Docker containers

## Implementation Status

### ✅ Completed

- Next.js 15 App Router setup
- TypeScript configuration with strict mode
- Tailwind CSS 4 with design system
- shadcn/ui component library integration
- ESLint + Prettier with pre-commit hooks (husky + lint-staged)
- Welcome page displaying tech stack
- GitHub Actions CI/CD pipeline

### 🚧 Not Yet Implemented

- Supabase integration (database, auth)
- OpenRouter AI integration
- User authentication (registration, login)
- Flashcard CRUD operations
- AI flashcard generation
- Learning mode
- API routes
- Environment variables setup (no `.env.example`)
- Docker configuration (no `Dockerfile`)

## Key Development Notes

- **Pre-commit hooks**: Configured via husky and lint-staged. Automatically runs ESLint on `.ts`/`.tsx` files and Prettier on `.json`/`.css`/`.md` files before commit.
- **Type safety**: All code must pass TypeScript strict checks. Use `npx tsc --noEmit` to verify.
- **Styling**: Prefer Tailwind utilities over custom CSS. Use `cn()` for conditional classes.
- **shadcn/ui**: Install new components with `npx shadcn@latest add <component>` (though this may need Supabase setup first).

## Important Constraints (MVP Scope)

Out of scope for MVP:

- Advanced spaced repetition algorithms (simple random order only)
- File uploads (PDF, DOCX, etc.)
- Flashcard organization (decks, categories, tags)
- Search and filtering
- Sharing flashcards between users
- Mobile apps
- Monetization features
- In-app onboarding/tutorials
