import { Competition, Season, Team, Match } from '@lunch-time-kickoff/shared';
import prisma from '../db';
import { getRedis } from '../redis';
import { config } from '../config';

type CacheDataType = 'competitions' | 'seasons' | 'teams' | 'matches';

function getTtl(type: CacheDataType): number {
  switch (type) {
    case 'competitions':
      return config.cache.ttlCompetitions;
    case 'seasons':
      return config.cache.ttlSeasons;
    case 'teams':
      return config.cache.ttlTeams;
    case 'matches':
      return config.cache.ttlMatches;
  }
}

export class CacheService {
  // --- Redis-based fast cache ---

  private redisKey(type: string, ...parts: string[]): string {
    return `ltk:${type}:${parts.join(':')}`;
  }

  async getFromRedis<T>(key: string): Promise<T | null> {
    try {
      const redis = getRedis();
      const data = await redis.get(key);
      if (data) return JSON.parse(data) as T;
    } catch {
      // Redis unavailable, fall through to DB cache
    }
    return null;
  }

  async setInRedis<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
    try {
      const redis = getRedis();
      await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
    } catch {
      // Redis unavailable, skip
    }
  }

  // --- Competitions ---

  async getCachedCompetitions(): Promise<Competition[] | null> {
    const key = this.redisKey('competitions', 'all');
    const fromRedis = await this.getFromRedis<Competition[]>(key);
    if (fromRedis) return fromRedis;

    const rows = await prisma.cachedCompetition.findMany({
      where: { expiresAt: { gt: new Date() } },
    });

    if (rows.length === 0) return null;

    const result: Competition[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      emblemUrl: r.emblemUrl ?? undefined,
    }));

    await this.setInRedis(key, result, getTtl('competitions'));
    return result;
  }

  async cacheCompetitions(competitions: Competition[]): Promise<void> {
    const expiresAt = new Date(Date.now() + getTtl('competitions') * 1000);

    await prisma.$transaction([
      prisma.cachedCompetition.deleteMany(),
      ...competitions.map((c) =>
        prisma.cachedCompetition.create({
          data: {
            id: c.id,
            name: c.name,
            code: c.code,
            emblemUrl: c.emblemUrl ?? null,
            expiresAt,
          },
        })
      ),
    ]);

    const key = this.redisKey('competitions', 'all');
    await this.setInRedis(key, competitions, getTtl('competitions'));
  }

  // --- Seasons ---

  async getCachedSeasons(competitionId: string): Promise<Season[] | null> {
    const key = this.redisKey('seasons', competitionId);
    const fromRedis = await this.getFromRedis<Season[]>(key);
    if (fromRedis) return fromRedis;

    const rows = await prisma.cachedSeason.findMany({
      where: { competitionId, expiresAt: { gt: new Date() } },
    });

    if (rows.length === 0) return null;

    const result: Season[] = rows.map((r) => ({
      id: r.id,
      competitionId: r.competitionId,
      startDate: r.startDate,
      endDate: r.endDate,
      currentMatchday: r.currentMatchday ?? undefined,
    }));

    await this.setInRedis(key, result, getTtl('seasons'));
    return result;
  }

  async cacheSeasons(competitionId: string, seasons: Season[]): Promise<void> {
    const expiresAt = new Date(Date.now() + getTtl('seasons') * 1000);

    await prisma.$transaction([
      prisma.cachedSeason.deleteMany({ where: { competitionId } }),
      ...seasons.map((s) =>
        prisma.cachedSeason.create({
          data: {
            id: s.id,
            competitionId: s.competitionId,
            startDate: s.startDate,
            endDate: s.endDate,
            currentMatchday: s.currentMatchday ?? null,
            expiresAt,
          },
        })
      ),
    ]);

    const key = this.redisKey('seasons', competitionId);
    await this.setInRedis(key, seasons, getTtl('seasons'));
  }

  // --- Teams ---

  async getCachedTeams(seasonId: string): Promise<Team[] | null> {
    const key = this.redisKey('teams', seasonId);
    const fromRedis = await this.getFromRedis<Team[]>(key);
    if (fromRedis) return fromRedis;

    const rows = await prisma.cachedTeam.findMany({
      where: { seasonId, expiresAt: { gt: new Date() } },
    });

    if (rows.length === 0) return null;

    const result: Team[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      shortName: r.shortName,
      tla: r.tla,
      crestUrl: r.crestUrl ?? undefined,
    }));

    await this.setInRedis(key, result, getTtl('teams'));
    return result;
  }

  async cacheTeams(seasonId: string, teams: Team[]): Promise<void> {
    const expiresAt = new Date(Date.now() + getTtl('teams') * 1000);

    await prisma.$transaction([
      prisma.cachedTeam.deleteMany({ where: { seasonId } }),
      ...teams.map((t) =>
        prisma.cachedTeam.create({
          data: {
            id: t.id,
            seasonId,
            name: t.name,
            shortName: t.shortName,
            tla: t.tla,
            crestUrl: t.crestUrl ?? null,
            expiresAt,
          },
        })
      ),
    ]);

    const key = this.redisKey('teams', seasonId);
    await this.setInRedis(key, teams, getTtl('teams'));
  }

  // --- Matches ---

  async getCachedMatches(seasonId: string): Promise<Match[] | null> {
    const key = this.redisKey('matches', seasonId);
    const fromRedis = await this.getFromRedis<Match[]>(key);
    if (fromRedis) return fromRedis;

    const rows = await prisma.cachedMatch.findMany({
      where: { seasonId, expiresAt: { gt: new Date() } },
    });

    if (rows.length === 0) return null;

    const result: Match[] = rows.map((r) => ({
      id: r.id,
      competitionId: r.competitionId,
      seasonId: r.seasonId,
      matchday: r.matchday,
      utcDate: r.utcDate,
      status: r.status as Match['status'],
      homeTeam: { id: r.homeTeamId, name: r.homeTeamName },
      awayTeam: { id: r.awayTeamId, name: r.awayTeamName },
      score: {
        fullTime: { home: r.ftHomeScore, away: r.ftAwayScore },
        halfTime: { home: r.htHomeScore, away: r.htAwayScore },
      },
    }));

    await this.setInRedis(key, result, getTtl('matches'));
    return result;
  }

  async cacheMatches(seasonId: string, matches: Match[]): Promise<void> {
    const expiresAt = new Date(Date.now() + getTtl('matches') * 1000);

    await prisma.$transaction([
      prisma.cachedMatch.deleteMany({ where: { seasonId } }),
      ...matches.map((m) =>
        prisma.cachedMatch.create({
          data: {
            id: m.id,
            competitionId: m.competitionId,
            seasonId: m.seasonId,
            matchday: m.matchday,
            utcDate: m.utcDate,
            status: m.status,
            homeTeamId: m.homeTeam.id,
            homeTeamName: m.homeTeam.name,
            awayTeamId: m.awayTeam.id,
            awayTeamName: m.awayTeam.name,
            ftHomeScore: m.score.fullTime.home,
            ftAwayScore: m.score.fullTime.away,
            htHomeScore: m.score.halfTime.home,
            htAwayScore: m.score.halfTime.away,
            expiresAt,
          },
        })
      ),
    ]);

    const key = this.redisKey('matches', seasonId);
    await this.setInRedis(key, matches, getTtl('matches'));
  }

  // --- Cache invalidation ---

  async invalidateAll(): Promise<void> {
    await prisma.$transaction([
      prisma.cachedMatch.deleteMany(),
      prisma.cachedTeam.deleteMany(),
      prisma.cachedSeason.deleteMany(),
      prisma.cachedCompetition.deleteMany(),
    ]);

    try {
      const redis = getRedis();
      const keys = await redis.keys('ltk:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch {
      // Redis unavailable
    }
  }

  async invalidateByType(type: CacheDataType): Promise<void> {
    switch (type) {
      case 'competitions':
        await prisma.cachedCompetition.deleteMany();
        break;
      case 'seasons':
        await prisma.cachedSeason.deleteMany();
        break;
      case 'teams':
        await prisma.cachedTeam.deleteMany();
        break;
      case 'matches':
        await prisma.cachedMatch.deleteMany();
        break;
    }

    try {
      const redis = getRedis();
      const keys = await redis.keys(`ltk:${type}:*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch {
      // Redis unavailable
    }
  }
}

export const cacheService = new CacheService();
