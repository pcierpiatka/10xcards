#!/bin/bash
# Create database structure after Supabase services are ready
# This applies application migrations after GoTrue has created auth tables
# Run this after: docker-compose up -d

set -e

echo "Waiting for services to be healthy..."
sleep 6

# Wait for auth service to be healthy (means GoTrue migrations are done)
echo "Checking auth service health..."
until docker-compose ps auth | grep -q "healthy"; do
    echo "Waiting for auth service..."
    sleep 2
done

echo "✓ Auth service is healthy"
echo "Applying application migrations..."
../docker/volumes/db/apply-migrations.sh

echo "✓ Done! Database structure created successfully."
