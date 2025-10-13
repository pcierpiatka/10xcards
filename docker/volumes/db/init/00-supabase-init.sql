-- Supabase Initialization Script
-- Creates required system users and schemas for local Supabase development
-- This must run before any application migrations

-- Create Supabase system roles if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_auth_admin') THEN
        CREATE USER supabase_auth_admin WITH PASSWORD 'postgres_dev_password_2024_secure_local_only';
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticator') THEN
        CREATE USER authenticator WITH PASSWORD 'postgres_dev_password_2024_secure_local_only' NOINHERIT;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN;
    END IF;
END
$$;

-- Grant roles to authenticator
GRANT anon, authenticated, service_role TO authenticator;

-- Create auth schema for Supabase Auth (GoTrue will populate it with tables)
CREATE SCHEMA IF NOT EXISTS auth;

-- Grant ownership of auth schema to supabase_auth_admin so GoTrue can create tables
ALTER SCHEMA auth OWNER TO supabase_auth_admin;

-- Note: GoTrue will create auth.users, auth.sessions, and other tables
-- Note: GoTrue will also create the auth.uid() function
-- Our application tables will reference auth.users(id) via foreign keys

-- Grant necessary permissions on auth schema
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO anon, authenticated, service_role;

-- Grant permissions on public schema to supabase_auth_admin
GRANT ALL ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO supabase_auth_admin;

-- Grant permissions on public schema to service roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- Set default privileges for future objects created by postgres
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA auth GRANT ALL ON TABLES TO supabase_auth_admin, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA auth GRANT ALL ON SEQUENCES TO supabase_auth_admin, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA auth GRANT ALL ON ROUTINES TO supabase_auth_admin, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO supabase_auth_admin, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO supabase_auth_admin, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO supabase_auth_admin, anon, authenticated, service_role;

-- Set default privileges for future objects created by supabase_auth_admin
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
