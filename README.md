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

- Node.js v22 (as specified in `.nvmrc`)
- npm (comes with Node.js)

## Getting Started

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

Health check endpoint available at [http://localhost:3000/api/health](http://localhost:3000/api/health).

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
