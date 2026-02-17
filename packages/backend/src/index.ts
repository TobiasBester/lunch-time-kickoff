import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from './config';
import prisma from './db';
import { getRedis, isRedisEnabled, closeRedis } from './redis';
import { FootballDataOrgProvider } from './services/FootballDataOrgProvider';
import { DataService } from './services/DataService';
import { createCompetitionsRouter } from './routes/competitions';
import { createSeasonsRouter } from './routes/seasons';
import { createCacheRouter } from './routes/cache';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const provider = new FootballDataOrgProvider();
const dataService = new DataService(provider);

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const checks: Record<string, string> = {
    server: 'ok',
  };

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  // Check Redis (optional)
  if (isRedisEnabled()) {
    try {
      const redis = getRedis();
      if (redis) await redis.ping();
      checks.redis = 'ok';
    } catch {
      checks.redis = 'error';
    }
  } else {
    checks.redis = 'disabled';
  }

  const allOk = Object.values(checks).every((v) => v === 'ok' || v === 'disabled');

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    service: 'lunch-time-kickoff-backend',
    checks,
  });
});

// API info
app.get('/api', (req: Request, res: Response) => {
  res.json({
    message: 'Premier League Dashboard API',
    version: '0.2.0',
    provider: provider.getProviderName(),
    rateLimits: provider.getRateLimits(),
    endpoints: {
      health: 'GET /health',
      api: 'GET /api',
      competitions: 'GET /api/competitions',
      competitionSeasons: 'GET /api/competitions/:id/seasons',
      seasonTeams: 'GET /api/seasons/:id/teams?competitionId=:cid',
      seasonMatches: 'GET /api/seasons/:id/matches?competitionId=:cid',
      cacheInvalidate: 'POST /api/cache/invalidate',
    },
  });
});

// Mount routers
app.use('/api/competitions', createCompetitionsRouter(dataService));
app.use('/api/seasons', createSeasonsRouter(dataService));
app.use('/api/cache', createCacheRouter());

// Graceful shutdown
async function shutdown(): Promise<void> {
  console.log('Shutting down...');
  await prisma.$disconnect();
  await closeRedis();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
app.listen(config.port, () => {
  console.log(`Backend server running on http://localhost:${config.port}`);
  console.log(`API available at http://localhost:${config.port}/api`);
});

export default app;
