#!/bin/bash
# Re-enable Row Level Security (RLS) after development/testing
# This restores security enforcement on all application tables
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
echo "Enabling RLS on all tables..."

# Enable RLS
docker exec -i 10xcards-db-1 psql -U postgres -d postgres <<EOF
-- Enable Row Level Security on all application tables
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations_acceptance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- Verify RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('ai_generations', 'ai_generations_acceptance', 'flashcard_sources', 'flashcards')
ORDER BY tablename;
EOF

echo "✓ Done! RLS has been enabled on all tables."
echo "✓ Security policies are now enforced."
