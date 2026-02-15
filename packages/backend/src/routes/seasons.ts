import { Router, Request, Response } from 'express';
import { DataService } from '../services/DataService';

export function createSeasonsRouter(dataService: DataService): Router {
  const router = Router();

  // GET /api/seasons/:id/teams
  // Note: We need the competitionId to fetch from the provider.
  // The client should pass it as a query parameter.
  router.get('/:id/teams', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const competitionId = req.query.competitionId as string;

      if (!competitionId) {
        res.status(400).json({ error: 'competitionId query parameter is required' });
        return;
      }

      const teams = await dataService.getTeamsByCompetition(competitionId, id);
      res.json({ teams });
    } catch (err) {
      console.error('Error fetching teams:', err);
      res.status(500).json({ error: 'Failed to fetch teams' });
    }
  });

  // GET /api/seasons/:id/matches
  router.get('/:id/matches', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const competitionId = req.query.competitionId as string;

      if (!competitionId) {
        res.status(400).json({ error: 'competitionId query parameter is required' });
        return;
      }

      const matches = await dataService.getMatches(competitionId, id);
      res.json({ matches });
    } catch (err) {
      console.error('Error fetching matches:', err);
      res.status(500).json({ error: 'Failed to fetch matches' });
    }
  });

  return router;
}
