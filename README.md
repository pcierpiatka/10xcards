# 10x Cards

AI-powered flashcard generator for efficient learning.

## Tech Stack

- [Next.js](https://nextjs.org/) v15 - React framework
- [React](https://react.dev/) v19 - UI library
- [TypeScript](https://www.typescriptlang.org/) v5 - Type safety
- [Tailwind CSS](https://tailwindcss.com/) v4 - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Accessible React components
- [Supabase](https://supabase.com/) - Backend & Auth
- [OpenRouter](https://openrouter.ai/) - AI models

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

This will start:

- **Next.js app** on [http://localhost:3000](http://localhost:3000)
- **Supabase Studio** (database UI) on [http://localhost:3001](http://localhost:3001)
- **Supabase API Gateway** on [http://localhost:8000](http://localhost:8000)
- **PostgreSQL database** on `localhost:5432`
- **Email testing UI** (Inbucket) on [http://localhost:9000](http://localhost:9000)

4. Access the services:

- **Application**: [http://localhost:3000](http://localhost:3000)
- **Supabase Studio**: [http://localhost:3001](http://localhost:3001) (manage database, auth, storage)
- **Email inbox**: [http://localhost:9000](http://localhost:9000) (view registration/auth emails)
- **Health check**: [http://localhost:3000/api/health](http://localhost:3000/api/health)

5. Stop services:

```bash
docker-compose down
```

6. Stop and remove all data (including database):

```bash
docker-compose down -v
```

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

## Project Structure

```
.
├── app/                  # Next.js App Router
│   ├── api/              # API routes
│   │   └── health/       # Health check endpoint
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   ├── globals.css       # Global styles
│   ├── error.tsx         # Error boundary
│   ├── global-error.tsx  # Root error boundary
│   ├── not-found.tsx     # 404 page
│   └── loading.tsx       # Loading UI
├── components/           # React components
│   ├── Welcome.tsx       # Landing page component
│   └── ui/               # shadcn/ui components
├── lib/                  # Utilities and types
│   ├── utils.ts          # Helper functions
│   ├── constants.ts      # App constants
│   └── types/            # TypeScript type definitions
│       ├── index.ts      # Core types
│       ├── api.ts        # API types
│       └── database.ts   # Database types
└── public/               # Static assets
    ├── favicon.svg       # App icon
    └── robots.txt        # SEO crawler rules
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
- **realtime** - Realtime subscriptions and broadcasting
- **storage** - File storage with image transformations
- **meta** - Database metadata and management API
- **studio** - Supabase Studio web UI
- **imgproxy** - Image transformation service
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
