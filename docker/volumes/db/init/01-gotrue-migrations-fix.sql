-- GoTrue Migrations Fix
-- Marks problematic GoTrue migration as completed to avoid startup errors
-- This must run after auth schema is created but before GoTrue starts

-- Wait for auth.schema_migrations table to exist (created by GoTrue migrations)
-- If it doesn't exist yet, this will be a no-op
-- When recreating DB from scratch, GoTrue will create this table first

-- Create schema_migrations table if it doesn't exist
-- (GoTrue will create it anyway, but this ensures it exists for INSERT)
CREATE TABLE IF NOT EXISTS auth.schema_migrations (
    version text PRIMARY KEY
);

-- Mark problematic migration as completed
-- Migration 20221208132122 has a bug: compares uuid = text without casting
-- Error: "operator does not exist: uuid = text (SQLSTATE 42883)"
INSERT INTO auth.schema_migrations (version)
VALUES ('20221208132122')
ON CONFLICT (version) DO NOTHING;

-- Grant ownership to supabase_auth_admin
ALTER TABLE auth.schema_migrations OWNER TO supabase_auth_admin;
