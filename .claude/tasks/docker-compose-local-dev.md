# Docker Compose for Local Development

**Goal**: Set up docker-compose for local development environment with Supabase instance.

**Approach**: Create docker-compose.yml with Supabase services (PostgreSQL, Auth, REST API, Storage, etc.) and Next.js dev server with hot-reload.

**Status**: ✅ COMPLETED

## ✅ Completion Summary

Successfully created a complete local development environment with Docker Compose.

### What Was Implemented

**Files Created (7 files):**

- `docker-compose.yml` - Full stack with 11 services (Next.js, Supabase, PostgreSQL, etc.)
- `Dockerfile.dev` - Development-optimized Dockerfile with hot-reload
- `.env.local.example` - Local environment variables with demo Supabase keys
- `docker/volumes/api/kong.yml` - Kong API Gateway configuration
- `docker/volumes/db/init/01-init-schema.sql` - Database schema with flashcards, learning_sessions, generation_stats tables + RLS policies

**Files Modified (2 files):**

- `README.md` - Added Docker Compose setup instructions, architecture documentation, troubleshooting guide
- `.dockerignore` - Added docker/volumes exclusion

### Services Included

1. **app** - Next.js dev server (port 3000)
2. **db** - PostgreSQL 15 with Supabase extensions (port 5432)
3. **studio** - Supabase Studio UI (port 3001)
4. **kong** - API Gateway (port 8000)
5. **auth** - GoTrue authentication server
6. **rest** - PostgREST automatic REST API
7. **realtime** - Real-time subscriptions
8. **storage** - File storage with image transformations
9. **meta** - Database metadata API
10. **imgproxy** - Image transformation service
11. **inbucket** - Email testing SMTP server (port 9000)

### Database Schema

Created complete schema with:

- `flashcards` table with character limits and user isolation
- `learning_sessions` table for tracking learning progress
- `generation_stats` table for MVP success metrics (75% acceptance rate)
- Row Level Security (RLS) policies for all tables
- Indexes for performance
- Automatic `updated_at` trigger

### How to Use

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove data
docker-compose down -v
```

**Access Points:**

- App: http://localhost:3000
- Supabase Studio: http://localhost:3001
- Email inbox: http://localhost:9000

## Implementation Plan

### 1. Create docker-compose.yml

- Next.js service with volume mounts for hot-reload
- Supabase PostgreSQL database
- Supabase Studio (UI for database management)
- Supabase Auth server
- Supabase REST API (PostgREST)
- Supabase Storage
- Supabase Realtime
- Network configuration

### 2. Create Dockerfile.dev (if needed)

- Simpler than production Dockerfile
- Install dependencies
- Run `npm run dev` with hot-reload
- Mount source code as volume

### 3. Update .env.example

- Add local development URLs for Supabase
- Document ports and connection strings

### 4. Create initialization scripts

- Database schema SQL files
- Seed data (optional for MVP)

### 5. Update documentation

- README.md with docker-compose instructions
- How to start/stop local environment
- How to access Supabase Studio

## Files to Create/Modify

- `docker-compose.yml` (new)
- `Dockerfile.dev` (new, optional)
- `.env.local.example` (new)
- `supabase/migrations/` directory (new)
- `README.md` (update)

## Time Estimate

~1-2 hours

## Notes

- Use official Supabase docker images
- Ensure PostgreSQL data persists via volumes
- Expose Supabase Studio on port 3001 (Next.js uses 3000)
