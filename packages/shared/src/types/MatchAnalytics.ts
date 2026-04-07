/**
 * Result types for match analysis
 */
export type MatchResult = 'HOME_WIN' | 'AWAY_WIN' | 'DRAW';

/**
 * Derived data for match visualizations and analytics
 */
export interface MatchAnalytics {
  dayOfWeek: string; // Monday, Tuesday, etc.
  timeOfDay: string; // "15:00", "20:00", etc.
  hour: number; // 15, 20, etc.
  result: MatchResult;
  teamId: string;
  teamName: string;
  isHomeGame: boolean;
}

/**
 * Aggregated win/draw/loss stats for a given day of week
 */
export interface DayStats {
  day: string; // "Monday", "Tuesday", etc.
  wins: number;
  draws: number;
  losses: number;
  total: number;
}

/**
 * Aggregated win/draw/loss stats for a given time slot
 */
export interface TimeSlotStats {
  slot: string; // "Early", "Afternoon", "Evening"
  wins: number;
  draws: number;
  losses: number;
  total: number;
}

/**
 * Aggregated win/draw/loss stats for a team across a season
 */
export interface TeamStats {
  teamId: string;
  teamName: string;
  wins: number;
  draws: number;
  losses: number;
  total: number;
}
