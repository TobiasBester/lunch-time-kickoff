# Premier League Dashboard - Project Plan

## Project Overview
Create a flexible dashboard for visualizing English Premier League statistics with the ability to analyze data across multiple dimensions (teams, time of day, days of week, etc.).

## MVP Requirements (2025/2026 Season)

### Core Features
1. **Data Visualization**: Display when teams played and their results
   - Days of the week matches were played
   - Times of day matches were played
   - Match results (Win/Loss/Draw)

2. **Flexible Axis Switching**
   - View by team: See each team's performance across different times/days
   - View by time-of-day: See which times produced what results across all teams
   - View by day-of-week: See performance patterns by day

3. **Season Scope**: 2025/2026 season for MVP

### Future Extensibility Considerations
- Multiple seasons support
- Multiple competitions (Premier League, FA Cup, Champions League, etc.)
- Additional statistics (goals, possession, shots, etc.)
- Player-level statistics
- Head-to-head comparisons
- Filtering and drill-down capabilities

## Technical Decisions (FINALIZED)

### 1. Data Source - API Comparison & Selection

After researching available football APIs, here are the viable options:

| API | Free Tier | Rate Limits | Premier League | Pros | Cons |
|-----|-----------|-------------|----------------|------|------|
| **football-data.org** | ✅ Yes | 10 req/min | ✅ Included | Free forever for top leagues, well-documented | Limited historical data on free tier |
| **API-Football** | ✅ Yes | 100 req/day | ✅ Included | All endpoints, all competitions | Daily limit (100/day) might be restrictive |
| **TheSportsDB** | ✅ Yes | 30 req/min | ✅ Included | Good rate limits | Less comprehensive match data |
| **Sportmonks** | ⚠️ Trial only | N/A | ✅ Trial access | Very comprehensive | Expensive after trial |

**RECOMMENDATION: football-data.org**
- Best balance of free access and rate limits for our use case
- 10 requests/minute = 14,400 requests/day (more than enough)
- Includes Premier League, Champions League, and other top leagues
- Well-documented RESTful API
- Free tier is permanent for registered users

**Architecture Decision**: Build a data abstraction layer that can swap between APIs without affecting the frontend. We'll implement football-data.org first, but design the interface to support others.

### 2. Technology Stack (FINALIZED)

**Frontend:**
- **Framework**: Vue 3 with Composition API
- **Language**: TypeScript
- **UI Library**: Vuetify 3 (Material Design components)
- **Visualization**: TBD (evaluate Chart.js, Apache ECharts, or Plotly during implementation)
- **State Management**: Pinia (official Vue state management)
- **Build Tool**: Vite

**Backend:**
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (for persistent storage and historical data)
- **ORM**: Prisma (type-safe database access)
- **Caching**: Redis (for fast repeated queries and rate limit tracking)

**Development Tools:**
- **Package Manager**: npm
- **Linting**: ESLint + Prettier
- **Testing**: Vitest (unit), Playwright (e2e)
- **API Documentation**: OpenAPI/Swagger

### 3. Architecture Design

**Chosen: Backend + Frontend (Monorepo)**

```
lunch-time-kickoff/
├── packages/
│   ├── frontend/          # Vue 3 + Vuetify app
│   ├── backend/           # Express API server
│   └── shared/            # Shared types, interfaces
├── docker-compose.yml     # PostgreSQL + Redis
└── package.json           # Monorepo root
```

**Key Architectural Principles:**
1. **Data Abstraction Layer**: Backend implements a `FootballDataProvider` interface that any API can implement
2. **Caching Strategy**: Cache API responses in PostgreSQL to minimize external API calls
3. **Type Safety**: Shared TypeScript interfaces between frontend and backend
4. **Separation of Concerns**: Frontend never calls external APIs directly

### 4. Data Model Design

**Core Entities:**

```typescript
// Shared types across frontend and backend
interface Competition {
  id: string;
  name: string;
  code: string; // e.g., "PL" for Premier League
  emblemUrl?: string;
}

interface Season {
  id: string;
  competitionId: string;
  startDate: Date;
  endDate: Date;
  currentMatchday?: number;
}

interface Team {
  id: string;
  name: string;
  shortName: string;
  tla: string; // Three-letter abbreviation
  crestUrl?: string;
}

interface Match {
  id: string;
  competitionId: string;
  seasonId: string;
  matchday: number;
  utcDate: Date;
  status: 'SCHEDULED' | 'LIVE' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'POSTPONED' | 'SUSPENDED' | 'CANCELLED';
  homeTeam: {
    id: string;
    name: string;
  };
  awayTeam: {
    id: string;
    name: string;
  };
  score: {
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
  };
}

// Derived data for visualizations
interface MatchAnalytics {
  dayOfWeek: string; // Monday, Tuesday, etc.
  timeOfDay: string; // "15:00", "20:00", etc.
  hour: number; // 15, 20, etc.
  result: 'HOME_WIN' | 'AWAY_WIN' | 'DRAW';
  teamId: string;
  teamName: string;
  isHomeGame: boolean;
}
```

**Data Abstraction Layer Interface:**

```typescript
interface FootballDataProvider {
  // Core methods that any API must implement
  getCompetitions(): Promise<Competition[]>;
  getSeasonsByCompetition(competitionId: string): Promise<Season[]>;
  getTeamsByCompetition(competitionId: string, seasonId: string): Promise<Team[]>;
  getMatches(competitionId: string, seasonId: string): Promise<Match[]>;

  // Provider metadata
  getProviderName(): string;
  getRateLimits(): { requestsPerMinute: number; requestsPerDay?: number };
}
```

**Database Schema (PostgreSQL + Prisma):**

- Cache external API responses with timestamps
- Store transformed analytics data for fast queries
- Track API usage for rate limit management

## Implementation Phases

### Phase 1: Project Foundation (Estimated: High Priority)
**Goal:** Set up monorepo structure, tooling, and core infrastructure

**Tasks:**
1. **Repository Setup**
   - [ ] Initialize monorepo structure (packages/frontend, packages/backend, packages/shared)
   - [ ] Configure TypeScript for all packages
   - [ ] Set up Vite for frontend
   - [ ] Set up Express for backend
   - [ ] Configure path aliases and module resolution

2. **Development Environment**
   - [ ] Create docker-compose.yml for PostgreSQL and Redis
   - [ ] Set up environment variable management (.env files)
   - [ ] Configure ESLint and Prettier
   - [ ] Set up git hooks (husky) for linting

3. **Shared Package**
   - [ ] Define TypeScript interfaces (Competition, Season, Team, Match, etc.)
   - [ ] Create FootballDataProvider interface
   - [ ] Define API response/request types
   - [ ] Set up package exports

**Deliverables:**
- Working monorepo with all packages scaffolded
- Docker Compose running PostgreSQL and Redis locally
- TypeScript compilation working across all packages

---

### Phase 2: Data Abstraction Layer (Estimated: High Priority)
**Goal:** Implement the backend data provider system with football-data.org

**Tasks:**
1. **Backend Core Setup**
   - [ ] Set up Prisma with PostgreSQL
   - [ ] Create database schema (migrations)
   - [ ] Implement database connection and health checks

2. **Football-Data.org Provider**
   - [ ] Register for football-data.org API key
   - [ ] Implement `FootballDataOrgProvider` class
   - [ ] Add HTTP client with rate limiting (10 req/min)
   - [ ] Implement error handling and retry logic
   - [ ] Map API responses to our internal types

3. **Caching Layer**
   - [ ] Implement cache-first strategy
   - [ ] Set appropriate TTLs (Time To Live) for different data types
     - Competitions: 1 week (rarely change)
     - Seasons: 1 day
     - Teams: 1 day
     - Matches: 1 hour (for ongoing seasons)
   - [ ] Create cache invalidation endpoints

4. **API Endpoints**
   - [ ] `GET /api/competitions` - List available competitions
   - [ ] `GET /api/competitions/:id/seasons` - Get seasons for competition
   - [ ] `GET /api/seasons/:id/teams` - Get teams in season
   - [ ] `GET /api/seasons/:id/matches` - Get matches for season
   - [ ] `POST /api/cache/invalidate` - Manual cache clearing

**Deliverables:**
- Working backend API with football-data.org integration
- Data caching to minimize external API calls
- Postman/Thunder Client collection for testing

---

### Phase 3: Data Analytics & Aggregation (Estimated: Medium Priority)
**Goal:** Transform raw match data into analytics for visualizations

**Tasks:**
1. **Analytics Service**
   - [ ] Create `AnalyticsService` class in backend
   - [ ] Implement match data transformation
     - Extract day of week from match dates
     - Extract time of day from match dates
     - Calculate match results (home win/away win/draw)
     - Determine team outcomes (win/loss/draw from team perspective)

2. **Analytics Endpoints**
   - [ ] `GET /api/analytics/by-day-of-week` - Aggregate results by day
   - [ ] `GET /api/analytics/by-time-of-day` - Aggregate results by hour
   - [ ] `GET /api/analytics/by-team` - Team-specific stats
   - [ ] Support query parameters for filtering (competitionId, seasonId, teamId)

3. **Data Aggregation Logic**
   - [ ] Group matches by day of week
   - [ ] Group matches by time slots (early, afternoon, evening, night)
   - [ ] Calculate win/loss/draw percentages
   - [ ] Support multiple aggregation dimensions

**Deliverables:**
- Analytics endpoints returning aggregated data
- Flexible querying system for different views

---

### Phase 4: Frontend Foundation (Estimated: High Priority)
**Goal:** Set up Vue 3 + Vuetify app with routing and state management

**Tasks:**
1. **Vue App Setup**
   - [ ] Initialize Vue 3 app with Vite
   - [ ] Install and configure Vuetify 3
   - [ ] Set up Vue Router
   - [ ] Configure Pinia store

2. **Project Structure**
   - [ ] Create folder structure (views, components, stores, services)
   - [ ] Set up API client service (axios/fetch)
   - [ ] Create composables for data fetching
   - [ ] Set up global error handling

3. **Layout & Navigation**
   - [ ] Create app layout with Vuetify components
   - [ ] Add navigation drawer/header
   - [ ] Create season selector component
   - [ ] Add loading indicators

4. **State Management**
   - [ ] Create Pinia stores
     - `useCompetitionStore` - Manage competitions/seasons
     - `useMatchStore` - Manage match data
     - `useAnalyticsStore` - Manage analytics data
   - [ ] Implement data fetching actions
   - [ ] Add computed getters for filtered data

**Deliverables:**
- Working Vue app connected to backend
- Basic navigation and layout
- State management for API data

---

### Phase 5: MVP Visualizations (Estimated: High Priority)
**Goal:** Implement the core dashboard visualizations with axis switching

**Tasks:**
1. **Visualization Library Selection**
   - [ ] Evaluate Chart.js, Apache ECharts, and Plotly
   - [ ] Create proof-of-concept for each
   - [ ] Select library based on ease of use and features
   - [ ] Install and configure chosen library

2. **Core Visualization Components**
   - [ ] `DayOfWeekChart.vue` - Bar/column chart showing results by day
   - [ ] `TimeOfDayChart.vue` - Bar/column chart showing results by time
   - [ ] `ResultsLegend.vue` - Color-coded legend (wins/losses/draws)
   - [ ] `AxisSwitcher.vue` - Toggle between team-view and time-view

3. **Dashboard View**
   - [ ] Create main dashboard layout
   - [ ] Implement view switching logic
   - [ ] Add filters (season, competition)
   - [ ] Display selected data in charts

4. **Interactivity**
   - [ ] Hover tooltips showing detailed match info
   - [ ] Click to filter/drill down
   - [ ] Axis switching animations

**Deliverables:**
- Working MVP dashboard with day/time visualizations
- Ability to switch between team-centric and time-centric views
- Interactive charts with tooltips

---

### Phase 6: Polish & Production Readiness (Estimated: Medium Priority)
**Goal:** Ensure the app is reliable, tested, and ready for deployment

**Tasks:**
1. **Error Handling & UX**
   - [ ] Add comprehensive error messages
   - [ ] Implement empty state views
   - [ ] Add loading skeletons
   - [ ] Handle API rate limit errors gracefully

2. **Testing**
   - [ ] Write unit tests for analytics service
   - [ ] Write unit tests for data provider
   - [ ] Write component tests for Vue components
   - [ ] E2E tests for critical user flows

3. **Documentation**
   - [ ] API documentation (OpenAPI/Swagger)
   - [ ] README with setup instructions
   - [ ] Architecture documentation
   - [ ] Environment variable documentation

4. **Deployment Preparation**
   - [ ] Create production build scripts
   - [ ] Set up environment configs (dev/staging/prod)
   - [ ] Database migration strategy
   - [ ] Create Docker images (optional)

**Deliverables:**
- Well-tested application
- Comprehensive documentation
- Deployment-ready codebase

---

### Phase 7: Future Enhancements (Post-MVP)
**Goal:** Expand functionality beyond initial MVP

**Planned Features:**
- [ ] Multi-season comparison view
- [ ] Additional competitions (FA Cup, Champions League)
- [ ] More statistics (goals, shots, possession)
- [ ] Player-level statistics
- [ ] Head-to-head team comparisons
- [ ] Advanced filtering and search
- [ ] Export data to CSV/JSON
- [ ] User preferences and saved views
- [ ] Additional data providers (API-Football, TheSportsDB)
- [ ] Real-time match updates (WebSocket)

## Decisions Made

✅ **Data Source**: football-data.org (free tier, swappable architecture)
✅ **Tech Stack**: Vue 3 + TypeScript + Vuetify / Node.js + Express + PostgreSQL + Redis
✅ **Architecture**: Monorepo with backend + frontend + shared packages
✅ **Mobile Support**: Not required for MVP
✅ **Updates**: Manual refresh (no real-time WebSocket for MVP)
✅ **Interactivity**: Charts support drill-down clicks (e.g., click "Monday" to see all Monday matches)
✅ **Package Manager**: npm
✅ **Caching**: Redis + PostgreSQL (Redis for fast queries, PostgreSQL for persistent storage)

## Outstanding Questions

1. **Hosting**: Where should we deploy this? (Can decide later)
2. **Authentication**: Single-user or multi-user? (Assuming single-user for MVP)

## Next Steps - Immediate Actions

1. **Phase 1 Start**: Initialize the monorepo structure
2. **API Registration**: Get football-data.org API key
3. **Docker Setup**: Configure PostgreSQL container
4. **TypeScript Configuration**: Set up shared types package
5. **Begin Phase 2**: Start implementing data provider once Phase 1 complete

---

**Last Updated**: 2026-01-21
**API Research Sources:**
- [API-Football Pricing](https://www.api-football.com/pricing)
- [API-Football on RapidAPI](https://rapidapi.com/api-sports/api/api-football/pricing)
- [football-data.org Documentation](https://docs.football-data.org/general/v4/policies.html)
- [TheSportsDB Documentation](https://www.thesportsdb.com/documentation)
- [Free Sports APIs Guide 2026](https://www.isportsapi.com/en/blog/others-2155-top-6-free-sports-data-api-providers:-a-curated-developer-guide-for-2026.html)
