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
