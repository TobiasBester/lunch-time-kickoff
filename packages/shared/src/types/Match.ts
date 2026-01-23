/**
 * Match status types
 */
export type MatchStatus =
  | 'SCHEDULED'
  | 'LIVE'
  | 'IN_PLAY'
  | 'PAUSED'
  | 'FINISHED'
  | 'POSTPONED'
  | 'SUSPENDED'
  | 'CANCELLED';

/**
 * Represents a football match
 */
export interface Match {
  id: string;
  competitionId: string;
  seasonId: string;
  matchday: number;
  utcDate: Date;
  status: MatchStatus;
  homeTeam: {
    id: string;
    name: string;
  };
  awayTeam: {
    id: string;
    name: string;
  };
  score: {
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
  };
}
