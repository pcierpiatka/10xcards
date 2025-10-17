#!/bin/bash
# Temporarily disable Row Level Security (RLS) for development/testing
# WARNING: This removes security enforcement! Use only in local development.
# Run this after: docker-compose up -d

set -e

echo "Waiting for services to be healthy..."
sleep 6

# Wait for auth service to be healthy
echo "Checking auth service health..."
until docker-compose ps auth | grep -q "healthy"; do
    echo "Waiting for auth service..."
    sleep 2
done

echo "✓ Auth service is healthy"
echo "Disabling RLS on all tables..."

# Disable RLS
docker exec -i 10xcards-db-1 psql -U postgres -d postgres <<EOF
-- Disable Row Level Security on all application tables
ALTER TABLE public.ai_generations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations_acceptance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_sources DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards DISABLE ROW LEVEL SECURITY;

-- Verify RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('ai_generations', 'ai_generations_acceptance', 'flashcard_sources', 'flashcards')
ORDER BY tablename;
EOF

echo "✓ Done! RLS has been disabled on all tables."
echo "⚠️  WARNING: Security policies are not enforced. Use only in development!"
echo "To re-enable RLS, run: ./local-dev-scripts/enable-rls.sh"
