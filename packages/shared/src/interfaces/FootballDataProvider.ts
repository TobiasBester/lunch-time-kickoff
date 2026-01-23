import { Competition } from '../types/Competition';
import { Season } from '../types/Season';
import { Team } from '../types/Team';
import { Match } from '../types/Match';

/**
 * Rate limit configuration for a data provider
 */
export interface RateLimits {
  requestsPerMinute: number;
  requestsPerDay?: number;
}

/**
 * Interface that any football data provider must implement.
 * This abstraction allows us to swap between different APIs
 * (football-data.org, API-Football, TheSportsDB, etc.) without
 * affecting the rest of the application.
 */
export interface FootballDataProvider {
  /**
   * Get all available competitions
   */
  getCompetitions(): Promise<Competition[]>;

  /**
   * Get all seasons for a specific competition
   * @param competitionId - The competition identifier
   */
  getSeasonsByCompetition(competitionId: string): Promise<Season[]>;

  /**
   * Get all teams participating in a competition season
   * @param competitionId - The competition identifier
   * @param seasonId - The season identifier
   */
  getTeamsByCompetition(competitionId: string, seasonId: string): Promise<Team[]>;

  /**
   * Get all matches for a competition season
   * @param competitionId - The competition identifier
   * @param seasonId - The season identifier
   */
  getMatches(competitionId: string, seasonId: string): Promise<Match[]>;

  /**
   * Get the name of this provider
   */
  getProviderName(): string;

  /**
   * Get rate limit information for this provider
   */
  getRateLimits(): RateLimits;
}
