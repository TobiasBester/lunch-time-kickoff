import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  FootballDataProvider,
  RateLimits,
  Competition,
  Season,
  Team,
  Match,
  MatchStatus,
} from '@lunch-time-kickoff/shared';
import { config } from '../config';
import { RateLimiter } from './RateLimiter';
import prisma from '../db';

// football-data.org API response types
interface FdoCompetition {
  id: number;
  name: string;
  code: string;
  emblem?: string;
}

interface FdoSeason {
  id: number;
  startDate: string;
  endDate: string;
  currentMatchday?: number;
}

interface FdoTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest?: string;
}

interface FdoMatch {
  id: number;
  competition: { id: number };
  season: { id: number };
  matchday: number;
  utcDate: string;
  status: string;
  homeTeam: { id: number; name: string };
  awayTeam: { id: number; name: string };
  score: {
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
  };
}

export class FootballDataOrgProvider implements FootballDataProvider {
  private client: AxiosInstance;
  private rateLimiter: RateLimiter;

  constructor() {
    this.client = axios.create({
      baseURL: config.footballData.apiUrl,
      headers: {
        'X-Auth-Token': config.footballData.apiKey,
      },
      timeout: 15_000,
    });

    // football-data.org free tier: 10 requests/minute
    this.rateLimiter = new RateLimiter(10);
  }

  getProviderName(): string {
    return 'football-data.org';
  }

  getRateLimits(): RateLimits {
    return { requestsPerMinute: 10 };
  }

  private async request<T>(endpoint: string): Promise<T> {
    await this.rateLimiter.acquire();

    let statusCode = 0;
    try {
      const response = await this.client.get<T>(endpoint);
      statusCode = response.status;
      return response.data;
    } catch (err) {
      if (err instanceof AxiosError) {
        statusCode = err.response?.status ?? 0;

        if (statusCode === 429) {
          // Rate limited - wait and retry once
          const retryAfter = parseInt(err.response?.headers?.['x-requestcounter-reset'] || '60', 10);
          console.warn(`Rate limited by football-data.org. Waiting ${retryAfter}s...`);
          await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
          await this.rateLimiter.acquire();
          const retryResponse = await this.client.get<T>(endpoint);
          statusCode = retryResponse.status;
          return retryResponse.data;
        }
      }
      throw err;
    } finally {
      // Log API usage
      try {
        await prisma.apiUsageLog.create({
          data: {
            provider: this.getProviderName(),
            endpoint,
            statusCode,
          },
        });
      } catch {
        // Don't fail the request if logging fails
      }
    }
  }

  async getCompetitions(): Promise<Competition[]> {
    const data = await this.request<{ competitions: FdoCompetition[] }>('/competitions');

    return data.competitions.map((c) => ({
      id: String(c.id),
      name: c.name,
      code: c.code,
      emblemUrl: c.emblem,
    }));
  }

  async getSeasonsByCompetition(competitionId: string): Promise<Season[]> {
    const data = await this.request<{
      seasons: FdoSeason[];
    }>(`/competitions/${competitionId}`);

    return data.seasons.map((s) => ({
      id: String(s.id),
      competitionId,
      year: new Date(s.startDate).getFullYear(),
      startDate: new Date(s.startDate),
      endDate: new Date(s.endDate),
      currentMatchday: s.currentMatchday ?? undefined,
    }));
  }

  async getTeamsByCompetition(competitionId: string, seasonId: string): Promise<Team[]> {
    const data = await this.request<{
      teams: FdoTeam[];
    }>(`/competitions/${competitionId}/teams?season=${seasonId}`);

    return data.teams.map((t) => ({
      id: String(t.id),
      name: t.name,
      shortName: t.shortName,
      tla: t.tla,
      crestUrl: t.crest,
    }));
  }

  async getMatches(competitionId: string, seasonId: string): Promise<Match[]> {
    const data = await this.request<{
      matches: FdoMatch[];
    }>(`/competitions/${competitionId}/matches?season=${seasonId}`);

    return data.matches.map((m) => ({
      id: String(m.id),
      competitionId: String(m.competition.id),
      seasonId: String(m.season.id),
      matchday: m.matchday,
      utcDate: new Date(m.utcDate),
      status: m.status as MatchStatus,
      homeTeam: { id: String(m.homeTeam.id), name: m.homeTeam.name },
      awayTeam: { id: String(m.awayTeam.id), name: m.awayTeam.name },
      score: {
        fullTime: { home: m.score.fullTime.home, away: m.score.fullTime.away },
        halfTime: { home: m.score.halfTime.home, away: m.score.halfTime.away },
      },
    }));
  }
}
