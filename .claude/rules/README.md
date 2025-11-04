# Claude Code Rules

Minimal guidelines for AI-assisted development in this project.

## Rule Files

### core.md

**Always applies**

- Tech stack
- Project structure
- File naming
- Import conventions
- Basic coding practices

### nextjs-backend.md

**Applies to:** `app/api/**/*.ts`, `lib/services/**/*.ts`, `lib/integrations/**/*.ts`

- API route structure
- Authentication pattern
- Validation approach
- Service layer organization
- Error handling

### frontend.md

**Applies to:** `app/**/*.tsx`, `components/**/*.tsx`

- Server vs Client Components
- shadcn/ui usage
- Styling approach
- Performance patterns

### database.md

**Applies to:** `docker/volumes/db/migrations/*.sql`, database queries

- Migration naming
- RLS policies
- Query patterns

## How to Use

1. **Always read** `core.md`
2. **Read relevant** domain rule based on file you're working on
3. **For implementation details** see `.ai/implementation-rulebook.md`
4. **For design analysis** document in `.claude/thinking/`

## When Rules Are Insufficient

If you need consistency in areas not covered:

1. Create additional rule file
2. Update this README
3. Keep it minimal and structure-focused
