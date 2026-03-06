/**
 * Represents a season for a specific competition
 */
export interface Season {
  id: string;
  competitionId: string;
  year: number;
  startDate: Date;
  endDate: Date;
  currentMatchday?: number;
}
