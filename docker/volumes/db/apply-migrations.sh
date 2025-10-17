#!/bin/bash
# Apply application migrations after Supabase services are initialized
# This runs after GoTrue has created auth.users table

set -e

echo "Waiting for database to be ready..."
sleep 5

echo "Applying application migrations..."

# Get the script's directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="${SCRIPT_DIR}/migrations"

docker exec -i 10xcards-db-1 psql -U postgres -d postgres < "${MIGRATIONS_DIR}/20241122131530_create_ai_flashcards_schema.sql"
docker exec -i 10xcards-db-1 psql -U postgres -d postgres < "${MIGRATIONS_DIR}/20241122140000_accept_ai_generation_rpc.sql"

echo "Migrations applied successfully!"
