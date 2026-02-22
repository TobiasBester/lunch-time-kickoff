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

const api = axios.create({ baseURL: '/api' });

export const footballApi = {
  async getHealth(): Promise<HealthStatus> {
    const { data } = await axios.get('/health');
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
};
