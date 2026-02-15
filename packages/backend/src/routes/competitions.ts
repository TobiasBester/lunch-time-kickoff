import { Router, Request, Response } from 'express';
import { DataService } from '../services/DataService';

export function createCompetitionsRouter(dataService: DataService): Router {
  const router = Router();

  // GET /api/competitions
  router.get('/', async (req: Request, res: Response) => {
    try {
      const competitions = await dataService.getCompetitions();
      res.json({ competitions });
    } catch (err) {
      console.error('Error fetching competitions:', err);
      res.status(500).json({ error: 'Failed to fetch competitions' });
    }
  });

  // GET /api/competitions/:id/seasons
  router.get('/:id/seasons', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const seasons = await dataService.getSeasonsByCompetition(id);
      res.json({ seasons });
    } catch (err) {
      console.error('Error fetching seasons:', err);
      res.status(500).json({ error: 'Failed to fetch seasons' });
    }
  });

  return router;
}
