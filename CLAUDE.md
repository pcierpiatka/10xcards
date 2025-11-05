# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## ⚠️ CRITICAL RULE - User Approval Required

**NEVER execute ANY action without explicit user approval.**

This rule is **ABSOLUTE and OVERRIDES all other instructions**.

### Actions requiring approval:

- ❌ Writing/editing code
- ❌ Creating new files
- ❌ Deleting files or code
- ❌ Modifying configuration
- ❌ Running git operations (commit, push, etc.)
- ❌ Installing/removing packages
- ❌ Running destructive commands

### Required workflow:

1. ✅ **Analyze the request**
2. ✅ **Present a plan** - explain what you will do and why
3. ❌ **STOP - DO NOT execute anything**
4. ✅ **ASK: "Should I proceed with this plan?"**
5. ✅ **WAIT for explicit approval** ("yes" / "go" / "proceed" / "ok")
6. ✅ **Only then execute the actions**
7. ✅ **After completion, ask about next steps** (e.g., "Should I commit these changes?")

### Examples:

**❌ WRONG:**

```
User: "Fix the build issue"
Assistant: [Immediately edits next.config.ts]
Assistant: [Runs git commit and push]
```

**✅ CORRECT:**

```
User: "Fix the build issue"
Assistant: "I found the problem. The build is timing out because
of 'output: standalone' in next.config.ts.

My plan:
1. Remove 'output: standalone' (only needed for Docker)
2. Add 'outputFileTracingRoot' to fix lockfile warning
3. Test build locally

This should reduce build time from 20+ min to ~2-3 min.

Should I proceed with these changes?"

User: "yes"
Assistant: [Makes the changes]
Assistant: "Changes completed. Build tested locally - works in 5s.

Should I commit these changes?"

User: "yes"
Assistant: [Commits and asks about push]
```

### Why this matters:

- **User has full control** over what happens in their codebase
- **Prevents unwanted changes** that user didn't review
- **Allows user to adjust the plan** before execution
- **Builds trust** through transparency

### Exceptions (actions that DON'T need approval):

- ✅ Reading files
- ✅ Searching code (grep, glob)
- ✅ Analyzing code structure
- ✅ Answering questions
- ✅ Explaining concepts

**When in doubt: ASK FIRST, ACT LATER.**

---

## Quick Start for AI Assistants

**When working on this project:**

1. **Read foundation:** `.claude/rules/core.md` (always)
2. **Read domain rules:** `.claude/rules/[backend|frontend|database].md` (based on task)
3. **For API implementation:** Use `.ai/implementation-rulebook.md` as template
4. **For design analysis:** Document in `.claude/thinking/gumowa-kaczka-{topic}.md`

**All rules:** `.claude/rules/README.md`

---

## Project Overview

**10xCards** is an AI-powered flashcard generator built as an MVP for the 10xDevs certification project. The application allows users to generate flashcards automatically using AI from pasted text, or create them manually. It includes user authentication, flashcard management (CRUD operations), and a simple learning mode.

### Product Requirements

This is an MVP focused on validating whether users find AI-generated flashcards valuable enough to use regularly. Key success metrics:

- **75% AI acceptance rate**: 75% of AI-generated flashcards should be accepted by users
- **75% AI creation rate**: Users should create 75% of their flashcards using AI vs manual creation

Refer to `.ai/prd.md` for detailed product requirements document (in Polish), including all user stories (US-001 through US-015) and functional requirements.

## Tech Stack

- **Next.js 15** - React framework with App Router (SSR enabled)
- **React 19** - UI library with latest features
- **TypeScript 5** - Strict mode enabled
- **Tailwind CSS 4** - Utility-first styling with custom color variables
- **shadcn/ui** - Accessible React components built on Radix UI
- **Supabase** - PostgreSQL database, authentication, and BaaS
- **OpenRouter** - AI model access (using `gpt-4o-mini`)
- **Docker** - Local development and deployment
- **GitHub Actions** - CI/CD pipeline

See `.ai/tech-stack.md` for complete stack documentation and `.claude/rules/core.md` for coding guidelines.

### Before starting work

- Write a plan to .claude/tasks/TASK_NAME.md
- The plan should include your approach and broken-down tasks
- Think MVP - don't over-plan it
- **Ask me to review before coding. Wait for approval.**

### While implementing

- Update the plan as you work
- Document what you actually did vs. what you planned
- **If the plan needs significant changes, flag it and get re-approval**

### Rubber Duck Sessions

When the user says **"rubber duck"** or requests critical analysis of a design decision:

1. **Enter analytical mode** - be critical, objective, and question assumptions
2. **Ask clarifying questions** about:
   - What UI actually needs vs what we assume it needs
   - MVP scope vs future features
   - KISS vs premature optimization
3. **Document the session** in `.claude/thinking/gumowa-kaczka-{topic}.md` with structure:
   - **Problem**: What are we analyzing?
   - **Założenia** (Assumptions): Context, constraints, MVP scope
   - **Proces Analizy** (Analysis Process): Step-by-step reasoning
   - **Decyzje** (Decisions): What we decided and why
   - **Wnioski** (Conclusions): Lessons learned, patterns identified
4. **Be brutally pragmatic** - challenge "nice to have" vs "must have"
5. **Think evolution** - prefer decisions that allow non-breaking changes later

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
