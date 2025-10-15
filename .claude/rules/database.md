# Database Rules

**Applies to:** `docker/volumes/db/migrations/*.sql`, database queries

## Migration Files

- Naming: `YYYYMMDDHHmmss_description.sql`
- UTC timestamp
- Lowercase snake_case description

## SQL Style

- All SQL in lowercase
- Add header comments (purpose, affected tables)
- Add copious comments for destructive operations

## Row Level Security

- Always enable RLS: `alter table table_name enable row level security;`
- Create separate policies per operation (select, insert, update, delete)
- Policy pattern: `create policy "Users access own data" on table_name for select using (auth.uid() = user_id);`

## Queries

- Use typed Supabase client: `SupabaseClient<Database>`
- Import types: `import type { Database } from "@/lib/db/database.types"`
- Select specific columns: `.select("id, name, created_at")`
- Use pagination: `.range(offset, offset + limit - 1)`
- Use `.single()` for one row, `.maybeSingle()` for nullable

## Error Handling

- Check `error` after every query
- Handle specific codes: `23505` (unique), `23503` (foreign key)
- Log with context, don't expose internal errors

## Performance

- Create indexes for user_id and foreign keys
- Use composite indexes for common query patterns
- Filter early in database, not in JavaScript
