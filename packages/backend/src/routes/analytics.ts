import { Router, Request, Response } from 'express';
import { AnalyticsService } from '../services/AnalyticsService';
import { DataService } from '../services/DataService';

export function createAnalyticsRouter(dataService: DataService): Router {
  const router = Router();
  const analyticsService = new AnalyticsService(dataService);

  // GET /api/analytics/by-day-of-week?competitionId=&seasonId=&teamId=
  router.get('/by-day-of-week', async (req: Request, res: Response) => {
    const { competitionId, seasonId, teamId } = req.query as Record<string, string | undefined>;

    if (!competitionId || !seasonId) {
      res.status(400).json({ error: 'competitionId and seasonId query parameters are required' });
      return;
    }

    try {
      const data = await analyticsService.getByDayOfWeek(competitionId, seasonId, teamId);
      res.json({ data });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch day-of-week analytics';
      res.status(500).json({ error: message });
    }
  });

  // GET /api/analytics/by-time-of-day?competitionId=&seasonId=&teamId=
  router.get('/by-time-of-day', async (req: Request, res: Response) => {
    const { competitionId, seasonId, teamId } = req.query as Record<string, string | undefined>;

    if (!competitionId || !seasonId) {
      res.status(400).json({ error: 'competitionId and seasonId query parameters are required' });
      return;
    }

    try {
      const data = await analyticsService.getByTimeOfDay(competitionId, seasonId, teamId);
      res.json({ data });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch time-of-day analytics';
      res.status(500).json({ error: message });
    }
  });

  // GET /api/analytics/by-team?competitionId=&seasonId=
  router.get('/by-team', async (req: Request, res: Response) => {
    const { competitionId, seasonId } = req.query as Record<string, string | undefined>;

    if (!competitionId || !seasonId) {
      res.status(400).json({ error: 'competitionId and seasonId query parameters are required' });
      return;
    }

    try {
      const data = await analyticsService.getByTeam(competitionId, seasonId);
      res.json({ data });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch team analytics';
      res.status(500).json({ error: message });
    }
  });

  return router;
}
