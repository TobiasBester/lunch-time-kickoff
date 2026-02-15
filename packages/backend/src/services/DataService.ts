import { Competition, Season, Team, Match, FootballDataProvider } from '@lunch-time-kickoff/shared';
import { cacheService } from './CacheService';

/**
 * DataService implements a cache-first strategy:
 * 1. Check Redis cache
 * 2. Check PostgreSQL cache
 * 3. Fetch from external API provider
 * 4. Cache the result in both layers
 */
export class DataService {
  constructor(private provider: FootballDataProvider) {}

  async getCompetitions(): Promise<Competition[]> {
    const cached = await cacheService.getCachedCompetitions();
    if (cached) return cached;

    const competitions = await this.provider.getCompetitions();
    await cacheService.cacheCompetitions(competitions);
    return competitions;
  }

  async getSeasonsByCompetition(competitionId: string): Promise<Season[]> {
    const cached = await cacheService.getCachedSeasons(competitionId);
    if (cached) return cached;

    const seasons = await this.provider.getSeasonsByCompetition(competitionId);
    await cacheService.cacheSeasons(competitionId, seasons);
    return seasons;
  }

  async getTeamsByCompetition(competitionId: string, seasonId: string): Promise<Team[]> {
    const cached = await cacheService.getCachedTeams(seasonId);
    if (cached) return cached;

    const teams = await this.provider.getTeamsByCompetition(competitionId, seasonId);
    await cacheService.cacheTeams(seasonId, teams);
    return teams;
  }

  async getMatches(competitionId: string, seasonId: string): Promise<Match[]> {
    const cached = await cacheService.getCachedMatches(seasonId);
    if (cached) return cached;

    const matches = await this.provider.getMatches(competitionId, seasonId);
    await cacheService.cacheMatches(seasonId, matches);
    return matches;
  }
}
