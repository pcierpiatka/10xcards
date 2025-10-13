# Project Structure Improvements

**Goal**: Apply software best practices to make the project production-ready while maintaining MVP focus.

**Approach**: Focus on CRITICAL items first (Docker, environment setup, error handling). Skip over-engineering. Implement only what's needed for a working MVP that can be deployed and tested.

## ✅ COMPLETED - Implementation Summary

**Date**: October 13, 2025
**Status**: Phase 1 & Phase 2 COMPLETED successfully
**Build Status**: ✅ All builds passing
**Time Taken**: ~3 hours

### What Was Implemented

**Phase 1: CRITICAL (MVP Blockers)**

- ✅ Multi-stage Dockerfile with health checks
- ✅ Updated .dockerignore with proper exclusions
- ✅ .env.example with comprehensive environment variables
- ✅ public/ directory with favicon.svg and robots.txt
- ✅ Error handling pages (error.tsx, global-error.tsx, not-found.tsx, loading.tsx)
- ✅ Security headers in next.config.ts
- ✅ Husky git hooks initialized with lint-staged pre-commit

**Phase 2: HIGH Priority**

- ✅ .prettierrc and .prettierignore configuration
- ✅ Health check API endpoint at /api/health
- ✅ TypeScript types structure (lib/types/{index,api,database}.ts)
- ✅ Application constants (lib/constants.ts)

### Files Created/Modified

**Created (19 files)**:

- `Dockerfile`
- `.env.example`
- `.prettierrc`, `.prettierignore`
- `public/favicon.svg`, `public/robots.txt`
- `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx`, `app/loading.tsx`
- `app/api/health/route.ts`
- `lib/constants.ts`
- `lib/types/index.ts`, `lib/types/api.ts`, `lib/types/database.ts`
- `.husky/pre-commit`

**Modified (3 files)**:

- `.dockerignore`
- `next.config.ts` (added security headers)
- `app/layout.tsx` (updated favicon path)

### Next Steps

**Phase 3 (Deferred to Post-MVP)**:

- Testing framework setup (Vitest)
- Middleware for auth and rate limiting
- Monitoring and logging infrastructure

**Ready For**:

- Supabase integration
- OpenRouter AI integration
- Feature development (auth, flashcards, learning mode)

---

## Phase 1: CRITICAL - MVP Blockers (Do Now)

### 1.1 Docker Setup

**Why**: CI/CD pipeline references Docker but no Dockerfile exists - build will fail.

**Tasks**:

- [ ] Create multi-stage Dockerfile (Node 22 Alpine)
  - deps stage: Install dependencies only
  - builder stage: Build Next.js app
  - runner stage: Production image with standalone output
- [ ] Update .dockerignore (keep README, remove unnecessary exclusions)
- [ ] Test Docker build locally
- [ ] Verify standalone output works

**Files to create/modify**:

- `Dockerfile` (new)
- `.dockerignore` (update)

---

### 1.2 Environment Variables

**Why**: No documentation of required env vars. New developers and deployment will fail.

**Tasks**:

- [ ] Create `.env.example` with all required variables:
  - Supabase: URL, anon key, service role key
  - OpenRouter: API key
  - App: public URL, environment
- [ ] Add comment documentation for each variable
- [ ] Update README.md with env setup instructions
- [ ] Add to .gitignore verification

**Files to create/modify**:

- `.env.example` (new)
- `README.md` (update Getting Started section)

---

### 1.3 Static Assets & Public Directory

**Why**: Favicon referenced but doesn't exist. No place for static files.

**Tasks**:

- [ ] Create `public/` directory
- [ ] Add placeholder favicon.png (or favicon.ico)
- [ ] Create `robots.txt` (allow all for now)
- [ ] Add `.gitkeep` or actual assets

**Files to create**:

- `public/favicon.png`
- `public/robots.txt`

---

### 1.4 Next.js Error Handling

**Why**: Poor UX without custom error pages. Default Next.js errors expose too much.

**Tasks**:

- [ ] Create `app/error.tsx` - Client-side error boundary
- [ ] Create `app/global-error.tsx` - Root error boundary
- [ ] Create `app/not-found.tsx` - Custom 404 page
- [ ] Create `app/loading.tsx` - Loading UI during navigation
- [ ] Style error pages to match app design (gradient theme)

**Files to create**:

- `app/error.tsx`
- `app/global-error.tsx`
- `app/not-found.tsx`
- `app/loading.tsx`

---

### 1.5 Git Hooks Initialization

**Why**: husky installed but not initialized. Pre-commit hooks won't run.

**Tasks**:

- [ ] Run `npx husky init`
- [ ] Create pre-commit hook with lint-staged
- [ ] Test that hooks run on commit
- [ ] Update .gitignore to include .husky/\_/

**Commands**:

```bash
npx husky init
echo "npx lint-staged" > .husky/pre-commit
chmod +x .husky/pre-commit
```

---

### 1.6 Security Headers

**Why**: Basic security hardening for production deployment.

**Tasks**:

- [ ] Add security headers to `next.config.ts`:
  - X-Frame-Options: SAMEORIGIN
  - X-Content-Type-Options: nosniff
  - X-DNS-Prefetch-Control: on
  - Referrer-Policy: origin-when-cross-origin
  - Permissions-Policy (disable camera, mic, geolocation)
- [ ] Test headers in dev mode

**Files to modify**:

- `next.config.ts`

---

## Phase 2: HIGH Priority - Before First Deploy

### 2.1 Prettier Configuration

**Why**: Implicit formatting rules. Team consistency issues.

**Tasks**:

- [ ] Create `.prettierrc` with explicit rules
- [ ] Create `.prettierignore` (node_modules, .next, etc.)
- [ ] Run format on entire codebase
- [ ] Commit formatted code

**Files to create**:

- `.prettierrc`
- `.prettierignore`

---

### 2.2 API Health Check Endpoint

**Why**: Needed for Docker health checks and monitoring.

**Tasks**:

- [ ] Create `app/api/health/route.ts`
- [ ] Return JSON with status, timestamp, version
- [ ] Add to Dockerfile HEALTHCHECK instruction

**Files to create**:

- `app/api/health/route.ts`

---

### 2.3 Folder Restructuring (Minimal for MVP)

**Why**: Current structure too flat. Prepare for feature growth.

**Tasks**:

- [ ] Create folder structure:
  - `lib/types/` - Shared TypeScript types
  - `lib/constants.ts` - App constants
  - `components/features/` - Feature-specific components
- [ ] Move Welcome.tsx to appropriate location (or keep as landing)
- [ ] Update imports

**Deferred**: Full route groups, auth folders (wait until features implemented)

---

### 2.4 TypeScript Types Setup

**Why**: Prepare for Supabase and API integration.

**Tasks**:

- [ ] Create `lib/types/index.ts` with base types:
  - Flashcard
  - User
  - GenerateRequest/Response
- [ ] Create `lib/types/database.ts` placeholder for Supabase types
- [ ] Create `lib/types/api.ts` for API response types

**Files to create**:

- `lib/types/index.ts`
- `lib/types/database.ts`
- `lib/types/api.ts`

---

## Phase 3: MEDIUM Priority - Production Prep (Post-MVP)

### 3.1 Testing Framework

- [ ] Install Vitest + React Testing Library
- [ ] Create `vitest.config.ts`
- [ ] Add test script to package.json
- [ ] Create example test for utils.ts

**Deferred to post-MVP**: Full test coverage

---

### 3.2 Middleware Setup

- [ ] Create `middleware.ts` file
- [ ] Add auth check placeholder (for future Supabase auth)
- [ ] Add rate limiting logic (simple in-memory for MVP)

**Deferred to post-MVP**: Advanced rate limiting, Redis

---

### 3.3 Monitoring & Logging

- [ ] Add console.log wrapper in `lib/logger.ts`
- [ ] Plan for Sentry integration (don't implement yet)

**Deferred to post-MVP**: Actual Sentry setup, analytics

---

## Out of Scope for Now

These are good practices but **NOT needed for MVP**:

- ❌ Advanced rate limiting with Redis
- ❌ Error tracking (Sentry/Bugsnag)
- ❌ Analytics integration
- ❌ Performance monitoring (Vercel Analytics)
- ❌ Database migrations (wait for Supabase setup)
- ❌ Seed data scripts
- ❌ LICENSE file (can add later)
- ❌ CONTRIBUTING.md (no contributors yet)
- ❌ E2E testing with Playwright
- ❌ Input validation with Zod (add when building forms)
- ❌ Full route groups restructure
- ❌ CORS configuration (add when needed)

---

## Execution Order

**Day 1 (MVP Blockers)**:

1. Docker setup (1.1)
2. Environment variables (1.2)
3. Public directory & favicon (1.3)
4. Error pages (1.4)
5. Security headers (1.6)
6. Git hooks (1.5)

**Day 2 (Pre-Deploy)**: 7. Prettier config (2.1) 8. Health check API (2.2) 9. Basic types setup (2.4) 10. Minimal folder restructure (2.3)

**Post-MVP**:

- Testing framework (3.1)
- Middleware (3.2)
- Monitoring prep (3.3)

---

## Success Criteria

**After Phase 1**:

- ✅ `npm run build` succeeds
- ✅ `docker build` succeeds
- ✅ Docker container runs and serves app
- ✅ Health check endpoint responds
- ✅ Custom error pages render
- ✅ Git hooks run on commit
- ✅ Security headers present in response

**After Phase 2**:

- ✅ Code formatting consistent
- ✅ Types defined for core entities
- ✅ Folder structure supports feature growth
- ✅ Ready for Supabase integration
- ✅ Ready for OpenRouter integration

---

## Time Estimate

- Phase 1: ~2-3 hours
- Phase 2: ~1-2 hours
- Phase 3: ~2-3 hours (can be done later)

**Total for MVP-ready**: ~4-5 hours

---

## Notes

- Keep changes incremental and testable
- Commit after each major task
- Test build after each phase
- Don't over-engineer - this is an MVP
- Focus on "good enough" not "perfect"
