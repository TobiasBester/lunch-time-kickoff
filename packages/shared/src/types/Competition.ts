/**
 * Represents a football competition (e.g., Premier League, Champions League)
 */
export interface Competition {
  id: string;
  name: string;
  code: string; // e.g., "PL" for Premier League
  emblemUrl?: string;
}
