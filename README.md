# Lunch Time Kickoff - Premier League Dashboard

A flexible dashboard for visualizing English Premier League statistics with the ability to analyze data across multiple dimensions (teams, time of day, days of week, etc.).

## Project Overview

This application allows you to explore Premier League match data through various lenses:
- View team performance across different times and days
- Analyze when teams perform best
- Track match results by time of day and day of week
- Interactive visualizations with flexible axis switching

## Tech Stack

### Frontend
- **Vue 3** with Composition API
- **TypeScript** for type safety
- **Vuetify 3** for Material Design components
- **Pinia** for state management
- **Vite** as build tool

### Backend
- **Node.js 18+** with Express.js
- **TypeScript** for type safety
- **PostgreSQL** for data persistence
- **Redis** for caching
- **Prisma** ORM (to be configured in Phase 2)

### Data Source
- **football-data.org API** (free tier)
- Abstracted provider interface for easy API swapping

## Project Structure

```
lunch-time-kickoff/
├── packages/
│   ├── frontend/          # Vue 3 + Vuetify app
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── views/
│   │   │   ├── router/
│   │   │   ├── plugins/
│   │   │   └── main.ts
│   │   ├── package.json
│   │   └── vite.config.ts
│   ├── backend/           # Express API server
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── shared/            # Shared types and interfaces
│       ├── src/
│       │   ├── types/
│       │   └── interfaces/
│       └── package.json
├── docker-compose.yml     # PostgreSQL + Redis
├── package.json           # Monorepo root
└── .claude/
    └── plan.md           # Detailed implementation plan
```

## Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Docker** (for PostgreSQL and Redis)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd lunch-time-kickoff
```

2. Install dependencies:
```bash
npm install
```

3. Start Docker services (PostgreSQL and Redis):
```bash
docker-compose up -d
```

4. Configure environment variables:
```bash
# Copy the example env file
cp packages/backend/.env.example packages/backend/.env

# Edit the .env file and add your football-data.org API key
# Register at: https://www.football-data.org/client/register
```

### Development

Start both frontend and backend development servers:
```bash
npm run dev
```

Or run them separately:
```bash
# Backend only (runs on http://localhost:3001)
npm run dev:backend

# Frontend only (runs on http://localhost:3000)
npm run dev:frontend
```

### Available Scripts

#### Root Level
- `npm run dev` - Run both frontend and backend in development mode
- `npm run build` - Build all packages
- `npm run typecheck` - Type check all packages
- `npm run lint` - Lint all packages
- `npm run format` - Format code with Prettier

#### Package Specific
- `npm run dev --workspace=@lunch-time-kickoff/frontend` - Run frontend dev server
- `npm run dev --workspace=@lunch-time-kickoff/backend` - Run backend dev server
- `npm run build --workspace=@lunch-time-kickoff/shared` - Build shared package

## Phase 1: Project Foundation ✅

**Status: Complete**

Phase 1 has been successfully completed with the following deliverables:

- ✅ Monorepo structure with npm workspaces
- ✅ TypeScript configuration for all packages
- ✅ Express backend with basic health check endpoint
- ✅ Vue 3 + Vuetify frontend with routing and Pinia
- ✅ Shared package with TypeScript interfaces
- ✅ Docker Compose for PostgreSQL and Redis
- ✅ ESLint and Prettier configuration
- ✅ Environment variable management

### Key Interfaces (Shared Package)

The shared package defines the core data structures:

- **Competition** - Football competitions (e.g., Premier League)
- **Season** - Seasons for each competition
- **Team** - Team information
- **Match** - Match data with scores and status
- **MatchAnalytics** - Derived analytics for visualizations
- **FootballDataProvider** - Interface for data providers

## Phase 2: Data Abstraction Layer (Next)

The next phase will implement:
- Backend data provider for football-data.org API
- Database schema with Prisma
- Caching layer with Redis
- API endpoints for competitions, seasons, teams, and matches

See `.claude/plan.md` for the complete implementation roadmap.

## API Endpoints

### Current (Phase 1)
- `GET /health` - Health check endpoint
- `GET /api` - API information

### Planned (Phase 2+)
- `GET /api/competitions` - List available competitions
- `GET /api/competitions/:id/seasons` - Get seasons for competition
- `GET /api/seasons/:id/teams` - Get teams in season
- `GET /api/seasons/:id/matches` - Get matches for season
- `GET /api/analytics/*` - Analytics endpoints

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting: `npm run typecheck && npm run lint`
4. Format code: `npm run format`
5. Submit a pull request

## License

[Add your license here]
