import Redis from 'ioredis';
import { config } from './config';

let redis: Redis | null = null;

export function isRedisEnabled(): boolean {
  return config.redis.enabled;
}

export function getRedis(): Redis | null {
  if (!config.redis.enabled) return null;

  if (!redis) {
    redis = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
    });

    redis.on('error', (err) => {
      console.error('Redis connection error:', err.message);
    });
  }
  return redis;
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
