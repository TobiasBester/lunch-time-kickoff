import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lunch_time_kickoff',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  footballData: {
    apiKey: process.env.FOOTBALL_DATA_API_KEY || '',
    apiUrl: process.env.FOOTBALL_DATA_API_URL || 'https://api.football-data.org/v4',
  },

  cache: {
    ttlCompetitions: parseInt(process.env.CACHE_TTL_COMPETITIONS || '604800', 10),
    ttlSeasons: parseInt(process.env.CACHE_TTL_SEASONS || '86400', 10),
    ttlTeams: parseInt(process.env.CACHE_TTL_TEAMS || '86400', 10),
    ttlMatches: parseInt(process.env.CACHE_TTL_MATCHES || '3600', 10),
  },
};
