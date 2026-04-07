import { Match, MatchResult, DayStats, TimeSlotStats, TeamStats } from '@lunch-time-kickoff/shared';
import { DataService } from './DataService';

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = ['Early', 'Afternoon', 'Evening'];

function getDayOfWeek(date: Date): string {
  // getUTCDay(): 0=Sunday, 1=Monday, ..., 6=Saturday
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getUTCDay()];
}

function getTimeSlot(date: Date): string {
  const hour = date.getUTCHours();
  if (hour < 14) return 'Early';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

function getMatchResult(match: Match): MatchResult | null {
  const { home, away } = match.score.fullTime;
  if (home === null || away === null) return null;
  if (home > away) return 'HOME_WIN';
  if (away > home) return 'AWAY_WIN';
  return 'DRAW';
}

/** From a team's perspective: did they win, draw, or lose? */
function getTeamOutcome(result: MatchResult, isHome: boolean): 'win' | 'draw' | 'loss' {
  if (result === 'DRAW') return 'draw';
  if (isHome && result === 'HOME_WIN') return 'win';
  if (!isHome && result === 'AWAY_WIN') return 'win';
  return 'loss';
}

function emptyTally(): { wins: number; draws: number; losses: number } {
  return { wins: 0, draws: 0, losses: 0 };
}

export class AnalyticsService {
  constructor(private dataService: DataService) {}

  async getByDayOfWeek(competitionId: string, seasonId: string, teamId?: string): Promise<DayStats[]> {
    const matches = await this.dataService.getMatches(competitionId, seasonId);
    const tally = new Map<string, { wins: number; draws: number; losses: number }>(
      DAYS_ORDER.map((d) => [d, emptyTally()]),
    );

    for (const match of matches) {
      if (match.status !== 'FINISHED') continue;
      const result = getMatchResult(match);
      if (!result) continue;

      const day = getDayOfWeek(new Date(match.utcDate));
      const bucket = tally.get(day);
      if (!bucket) continue;

      if (teamId) {
        const isHome = match.homeTeam.id === teamId;
        const isAway = match.awayTeam.id === teamId;
        if (!isHome && !isAway) continue;
        const outcome = getTeamOutcome(result, isHome);
        bucket[outcome === 'win' ? 'wins' : outcome === 'draw' ? 'draws' : 'losses']++;
      } else {
        if (result === 'HOME_WIN') bucket.wins++;
        else if (result === 'AWAY_WIN') bucket.losses++;
        else bucket.draws++;
      }
    }

    return DAYS_ORDER.map((day) => {
      const { wins, draws, losses } = tally.get(day)!;
      return { day, wins, draws, losses, total: wins + draws + losses };
    });
  }

  async getByTimeOfDay(competitionId: string, seasonId: string, teamId?: string): Promise<TimeSlotStats[]> {
    const matches = await this.dataService.getMatches(competitionId, seasonId);
    const tally = new Map<string, { wins: number; draws: number; losses: number }>(
      TIME_SLOTS.map((s) => [s, emptyTally()]),
    );

    for (const match of matches) {
      if (match.status !== 'FINISHED') continue;
      const result = getMatchResult(match);
      if (!result) continue;

      const slot = getTimeSlot(new Date(match.utcDate));
      const bucket = tally.get(slot);
      if (!bucket) continue;

      if (teamId) {
        const isHome = match.homeTeam.id === teamId;
        const isAway = match.awayTeam.id === teamId;
        if (!isHome && !isAway) continue;
        const outcome = getTeamOutcome(result, isHome);
        bucket[outcome === 'win' ? 'wins' : outcome === 'draw' ? 'draws' : 'losses']++;
      } else {
        if (result === 'HOME_WIN') bucket.wins++;
        else if (result === 'AWAY_WIN') bucket.losses++;
        else bucket.draws++;
      }
    }

    return TIME_SLOTS.map((slot) => {
      const { wins, draws, losses } = tally.get(slot)!;
      return { slot, wins, draws, losses, total: wins + draws + losses };
    });
  }

  async getByTeam(competitionId: string, seasonId: string): Promise<TeamStats[]> {
    const matches = await this.dataService.getMatches(competitionId, seasonId);
    const tally = new Map<string, { teamName: string; wins: number; draws: number; losses: number }>();

    for (const match of matches) {
      if (match.status !== 'FINISHED') continue;
      const result = getMatchResult(match);
      if (!result) continue;

      for (const isHome of [true, false]) {
        const team = isHome ? match.homeTeam : match.awayTeam;
        if (!tally.has(team.id)) {
          tally.set(team.id, { teamName: team.name, ...emptyTally() });
        }
        const bucket = tally.get(team.id)!;
        const outcome = getTeamOutcome(result, isHome);
        bucket[outcome === 'win' ? 'wins' : outcome === 'draw' ? 'draws' : 'losses']++;
      }
    }

    return Array.from(tally.entries())
      .map(([teamId, { teamName, wins, draws, losses }]) => ({
        teamId,
        teamName,
        wins,
        draws,
        losses,
        total: wins + draws + losses,
      }))
      .sort((a, b) => b.wins - a.wins);
  }
}
