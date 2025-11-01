# 10x Cards

AI-powered flashcard generator for efficient learning.

## Tech Stack

### Frontend

- [Next.js](https://nextjs.org/) v15 - React framework with App Router & SSR
- [React](https://react.dev/) v19 - UI library
- [TypeScript](https://www.typescriptlang.org/) v5 - Type safety (strict mode)
- [Tailwind CSS](https://tailwindcss.com/) v4 - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Accessible React components (Radix UI)

### Backend

- [Supabase](https://supabase.com/) - PostgreSQL database, Auth & BaaS (@supabase/ssr)
- [OpenRouter](https://openrouter.ai/) - AI models (gpt-4o-mini)

### Testing

- [Vitest](https://vitest.dev/) v2.0 - Unit & integration tests
- [Playwright](https://playwright.dev/) v1.48 - E2E tests (cross-browser)
- [React Testing Library](https://testing-library.com/react) v16.1 - Component tests
- [MSW](https://mswjs.io/) v2.6 - API mocking
- [k6](https://k6.io/) - Performance testing

### DevOps

- [Docker](https://www.docker.com/) - Containerization
- [GitHub Actions](https://github.com/features/actions) - CI/CD
- [DigitalOcean](https://www.digitalocean.com/) - Hosting

## Prerequisites

### For Docker Compose (Recommended)

- Docker and Docker Compose
- (Optional) Node.js v22 for running tests/linting locally

### For Local Development

- Node.js v22 (as specified in `.nvmrc`)
- npm (comes with Node.js)
- A Supabase project (cloud or self-hosted)

## Getting Started

### Option 1: Local Development with Docker Compose (Recommended)

This option runs Next.js and a full Supabase stack locally in Docker containers.

1. Copy the environment file:

```bash
cp .env.local.example .env.local
```

2. (Optional) Edit `.env.local` and add your OpenRouter API key if you want to test AI generation:

```bash
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

3. Start all services with Docker Compose:

```bash
docker-compose up -d
```

4. **Create database structure (first time only or after `docker-compose down -v`):**

```bash
./local-dev-scripts/create-supabase-db-structure.sh
```

This script waits for services to be healthy and applies application migrations after GoTrue creates the auth tables.

This will start:

- **Next.js app** on [http://localhost:3000](http://localhost:3000)
- **Supabase Studio** (database UI) on [http://localhost:3001](http://localhost:3001)
- **Supabase API Gateway** on [http://localhost:8000](http://localhost:8000)
- **PostgreSQL database** on `localhost:5432`
- **Email testing UI** (Inbucket) on [http://localhost:9001](http://localhost:9001)

5. Stop services:

```bash
docker-compose down
```

6. Stop and remove all data (including database):

```bash
docker-compose down -v
```

**Note:** After removing volumes (`-v` flag), you must run `./local-dev-scripts/create-supabase-db-structure.sh` again to recreate the database structure.

### Option 2: Local Development without Docker

This requires a running Supabase instance (cloud or self-hosted).

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` and add your:

- Supabase URL and anon key
- OpenRouter API key

3. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

4. Build for production:

```bash
npm run build
npm run start
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production (includes linting and type checking)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npx tsc --noEmit` - Type check without emitting files

## Testing

The project uses a comprehensive testing strategy with multiple test types:

### Test Frameworks

- **Vitest** - Unit and integration tests (fast, TypeScript-native)
- **Playwright** - End-to-end tests (cross-browser support)
- **React Testing Library** - Component tests
- **MSW** (Mock Service Worker) - API mocking
- **k6** - Performance and load testing
- **playwright-lighthouse** - Performance audits

### Running Tests

```bash
# Unit and Integration Tests
npm run test                    # Run all tests
npm run test:unit              # Run unit tests only
npm run test:integration       # Run integration tests only
npm run test:coverage          # Run tests with coverage report

# End-to-End Tests
npm run test:e2e               # Run E2E tests (all browsers)
npm run test:e2e -- --ui       # Run E2E tests in debug mode
npx playwright test --project=chromium  # Run E2E in specific browser

# Performance Tests
npm run test:performance       # Run performance benchmarks

# Security Tests
npm run test:security          # Run security tests
```

### Test Coverage

The project aims for:

- **Unit tests**: ≥ 80% coverage for `lib/` directory
- **Integration tests**: 100% coverage for API routes
- **E2E tests**: 100% coverage for critical user journeys (US-001 to US-015)

View coverage report:

```bash
npm run test:coverage
open coverage/index.html
```

### Test Database Setup

For integration and E2E tests, use the test database:

```bash
# Start test database
docker-compose -f docker-compose.test.yml up -d

# Run tests
npm run test:all

# Stop test database
docker-compose -f docker-compose.test.yml down
```

See `.ai/test-plan.md` for detailed testing strategy and implementation guide.

## Local Development Helper Scripts

The `local-dev-scripts/` directory contains bash scripts for common development tasks:

### Database Setup

**`create-supabase-db-structure.sh`** - Initialize database structure

```bash
./local-dev-scripts/create-supabase-db-structure.sh
```

- Waits for Supabase services to be healthy
- Applies application migrations after GoTrue creates auth tables
- Run this after first `docker-compose up` or after `docker-compose down -v`

### Row Level Security (RLS) Management

**`disable-rls.sh`** - Temporarily disable RLS for testing

```bash
./local-dev-scripts/disable-rls.sh
```

- Disables Row Level Security on all application tables
- **⚠️ WARNING:** Use only in local development environment
- Removes security enforcement - data is accessible without auth checks
- Useful for testing API endpoints or debugging

**`enable-rls.sh`** - Re-enable RLS after testing

```bash
./local-dev-scripts/enable-rls.sh
```

- Restores Row Level Security on all application tables
- Re-enables security policies
- Run this after testing to restore proper access control

**RLS Best Practices:**

- Always re-enable RLS before committing changes
- Never disable RLS in production environments
- Use `disable-rls.sh` only for temporary local testing
- Verify RLS status after running scripts (output shows table security status)

## Project Structure

```
.
├── app/                  # Next.js App Router pages and layouts
│   └── api/              # API routes (health check)
├── components/           # React components
│   └── ui/               # shadcn/ui reusable components
├── lib/                  # Utilities and shared code
│   ├── db/               # Supabase clients and database schema types
│   ├── dto/              # Data Transfer Objects (API contracts)
│   └── types/            # Application domain types (API, business logic)
├── docker/               # Docker configuration and volumes
│   └── volumes/db/migrations/  # Database schema migrations
├── local-dev-scripts/    # Development helper scripts
│   ├── create-supabase-db-structure.sh  # Initialize database
│   ├── disable-rls.sh    # Disable Row Level Security for testing
│   └── enable-rls.sh     # Re-enable Row Level Security
└── public/               # Static assets (favicon, robots.txt)
```

## Code Quality

The project uses:

- **ESLint** - Code linting with strict rules
- **Prettier** - Code formatting (configured in `.prettierrc`)
- **Husky** - Git hooks for pre-commit checks
- **lint-staged** - Run linters on staged files only
- **TypeScript strict mode** - Enhanced type safety

Pre-commit hooks automatically run ESLint and Prettier before each commit.

## Docker Compose Architecture

The `docker-compose.yml` includes the following services:

- **app** - Next.js development server with hot-reload
- **db** - PostgreSQL 15 database with Supabase extensions
- **kong** - API Gateway routing requests to Supabase services
- **auth** - GoTrue authentication server
- **rest** - PostgREST automatic REST API for PostgreSQL
- **meta** - Database metadata and management API for Studio
- **studio** - Supabase Studio web UI
- **inbucket** - SMTP server for testing emails

### Troubleshooting Docker Compose

**View logs for all services:**

```bash
docker-compose logs -f
```

**View logs for specific service:**

```bash
docker-compose logs -f app
docker-compose logs -f db
```

**Restart a specific service:**

```bash
docker-compose restart app
```

**Rebuild containers after code changes:**

```bash
docker-compose up -d --build
```

**Access Supabase Studio:**
Visit [http://localhost:3001](http://localhost:3001) to manage your database, view tables, run SQL queries, and manage authentication.

**Connect to PostgreSQL directly:**

```bash
psql postgresql://postgres:your-super-secret-and-long-postgres-password@localhost:5432/postgres
```

## Deployment

### Docker

Build the Docker image:

```bash
docker build -t 10xcards:latest .
```

Run the container:

```bash
docker run -p 3000:3000 --env-file .env 10xcards:latest
```

### Docker Compose

```bash
docker-compose up -d
```

### DigitalOcean

The project is configured for deployment on DigitalOcean using Docker containers. See the GitHub Actions workflow in `.github/workflows/` for CI/CD setup.

## License

MIT
