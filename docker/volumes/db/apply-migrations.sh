#!/bin/bash
# Apply application migrations after Supabase services are initialized
# This runs after GoTrue has created auth.users table

set -e

echo "Waiting for database to be ready..."
sleep 5

echo "Applying application migrations..."
docker exec -i 10xcards-db-1 psql -U postgres -d postgres < docker/volumes/db/migrations/20241122131530_create_ai_flashcards_schema.sql

echo "Migrations applied successfully!"
