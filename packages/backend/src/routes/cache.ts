import { Router, Request, Response } from 'express';
import { cacheService } from '../services/CacheService';

export function createCacheRouter(): Router {
  const router = Router();

  // POST /api/cache/invalidate
  router.post('/invalidate', async (req: Request, res: Response) => {
    try {
      const { type } = req.body as { type?: string };

      if (type && ['competitions', 'seasons', 'teams', 'matches'].includes(type)) {
        await cacheService.invalidateByType(
          type as 'competitions' | 'seasons' | 'teams' | 'matches'
        );
        res.json({ message: `Cache invalidated for type: ${type}` });
      } else if (!type) {
        await cacheService.invalidateAll();
        res.json({ message: 'All caches invalidated' });
      } else {
        res.status(400).json({
          error: 'Invalid cache type. Must be one of: competitions, seasons, teams, matches',
        });
      }
    } catch (err) {
      console.error('Error invalidating cache:', err);
      res.status(500).json({ error: 'Failed to invalidate cache' });
    }
  });

  return router;
}
