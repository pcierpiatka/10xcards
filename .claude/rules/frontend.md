# Frontend Rules

**Applies to:** `app/**/*.tsx`, `components/**/*.tsx`

## Server vs Client Components

- Default: Server Component (no directive)
- Add `"use client"` only when needed:
  - Event handlers (onClick, onChange, onSubmit)
  - React hooks (useState, useEffect, useContext)
  - Browser APIs (localStorage, window, document)

## Component Files

- Functional components with TypeScript
- Props interface: `interface ComponentNameProps { ... }`
- Use Server Components for data fetching

## shadcn/ui

- Installed components are in `components/ui/`
- Import: `import { Button } from "@/components/ui/button"`
- Install new: `npx shadcn@latest add [component]`

## Styling

- Use Tailwind utilities (no inline styles)
- Use `cn()` from `@/lib/utils` for conditional classes
- CSS variables from `app/globals.css` (--background, --foreground, etc.)

## Performance

- Use `React.memo()` for expensive components
- Use `useCallback()` for event handlers passed to children
- Use `useMemo()` for expensive calculations

## Accessibility

- Use semantic HTML (`<button>`, `<nav>`, etc.)
- Add `aria-label` for icon-only buttons
- Add `aria-expanded`, `aria-controls` for expandable content

## Forms

- Use `react-hook-form` with `zodResolver`
- Import form components from `@/components/ui/form`
- Validate with Zod schemas
