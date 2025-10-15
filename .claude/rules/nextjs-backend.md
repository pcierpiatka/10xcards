# Next.js Backend Rules

**Applies to:** `app/api/**/*.ts`, `lib/services/**/*.ts`, `lib/integrations/**/*.ts`

## API Routes

- File must be named `route.ts` in `app/api/[resource]/` directory
- Export named functions: `GET`, `POST`, `PATCH`, `DELETE`
- Return `NextResponse.json(data, { status })`

## Authentication

- Use `createRouteHandlerClient` from `@supabase/auth-helpers-nextjs`
- Call `supabase.auth.getUser()` to verify JWT
- Return 401 for unauthorized requests

## Validation

- Use Zod schemas from `lib/validation/`
- Use `.safeParse()` (not `.parse()`)
- Return 400 for validation errors

## Services

- Create services in `lib/services/` as classes
- Constructor accepts `SupabaseClient<Database>`
- Methods: `async method(userId: string, input: CommandDto): Promise<ResponseDto>`
- Services handle business logic, not route handlers

## Authorization

- Use Supabase RLS policies (single source of truth)
- Don't implement authorization in app code
- Return 404 (not 403) for unauthorized access

## Error Handling

- Create custom error classes in `lib/errors/`
- Catch and transform errors in route handlers
- Never expose internal errors to users
- Log errors with context: `console.error("[Service] Failed", { context })`

## External APIs

- Create clients in `lib/integrations/` as classes
- Implement timeouts (default 30s)
- Use `AbortController` for cancellation
