import axios from 'axios';

export interface Competition {
  id: string;
  name: string;
  code: string;
  emblemUrl?: string;
}

export interface Season {
  id: string;
  competitionId: string;
  startDate: string;
  endDate: string;
  currentMatchday?: number;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  tla: string;
  crestUrl?: string;
}

export interface Match {
  id: string;
  competitionId: string;
  seasonId: string;
  matchday: number;
  utcDate: string;
  status: string;
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
  score: {
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
  };
}

export interface HealthStatus {
  status: string;
  database: string;
  redis: string;
}

export interface DayStats {
  day: string;
  wins: number;
  draws: number;
  losses: number;
  total: number;
}

export interface TimeSlotStats {
  slot: string;
  wins: number;
  draws: number;
  losses: number;
  total: number;
}

export interface TeamStats {
  teamId: string;
  teamName: string;
  wins: number;
  draws: number;
  losses: number;
  total: number;
}

// In production, VITE_API_BASE_URL is set to the backend Cloud Run URL at build time.
// In development, it is empty and Vite's dev-server proxy forwards /api and /health.
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const api = axios.create({ baseURL: `${BACKEND_URL}/api` });

export const footballApi = {
  async getHealth(): Promise<HealthStatus> {
    const { data } = await axios.get(`${BACKEND_URL}/health`);
    return data;
  },

  async getCompetitions(): Promise<Competition[]> {
    const { data } = await api.get('/competitions');
    return data.competitions;
  },

  async getSeasons(competitionId: string): Promise<Season[]> {
    const { data } = await api.get(`/competitions/${competitionId}/seasons`);
    return data.seasons;
  },

  async getTeams(seasonId: string, competitionId: string): Promise<Team[]> {
    const { data } = await api.get(`/seasons/${seasonId}/teams`, {
      params: { competitionId },
    });
    return data.teams;
  },

  async getMatches(seasonId: string, competitionId: string): Promise<Match[]> {
    const { data } = await api.get(`/seasons/${seasonId}/matches`, {
      params: { competitionId },
    });
    return data.matches;
  },

  async invalidateCache(type?: string): Promise<string> {
    const { data } = await api.post('/cache/invalidate', type ? { type } : {});
    return data.message;
  },

  async getDayOfWeekAnalytics(competitionId: string, seasonId: string, teamId?: string): Promise<DayStats[]> {
    const params: Record<string, string> = { competitionId, seasonId };
    if (teamId) params.teamId = teamId;
    const { data } = await api.get('/analytics/by-day-of-week', { params });
    return data.data;
  },

  async getTimeOfDayAnalytics(competitionId: string, seasonId: string, teamId?: string): Promise<TimeSlotStats[]> {
    const params: Record<string, string> = { competitionId, seasonId };
    if (teamId) params.teamId = teamId;
    const { data } = await api.get('/analytics/by-time-of-day', { params });
    return data.data;
  },

  async getTeamAnalytics(competitionId: string, seasonId: string): Promise<TeamStats[]> {
    const { data } = await api.get('/analytics/by-team', { params: { competitionId, seasonId } });
    return data.data;
  },
};
