/**
 * Represents a football team
 */
export interface Team {
  id: string;
  name: string;
  shortName: string;
  tla: string; // Three-letter abbreviation (e.g., "MUN", "LIV")
  crestUrl?: string;
}
