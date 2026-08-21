import { redis } from '../redis/client.js';
import { config } from '../config/index.js';

export class RateLimiterService {
    static async checkRateLimit(
        userId: string,
        maxRequests: number = config.rateLimit.maxRequests,
        windowSeconds: number = config.rateLimit.windowSeconds
    ): Promise<{ allowed: boolean; current: number; ttl: number }> {
        const minuteTimestamp = Math.floor(Date.now() / (windowSeconds * 1000));
        const key = `rate_limit:${userId}:${minuteTimestamp}`;

        // Pipeline increment and ttl fetch
        const multi = redis.multi();
        multi.incr(key);
        multi.ttl(key);
        const results = await multi.exec();

        if (!results || results.length < 2) {
            throw new Error('Rate limiter Redis transaction failed');
        }

        const count = results[0][1] as number;
        let ttl = results[1][1] as number;

        // Set TTL on the first request in the window
        if (count === 1 || ttl < 0) {
            await redis.expire(key, windowSeconds);
            ttl = windowSeconds;
        }

        const allowed = count <= maxRequests;
        return { allowed, current: count, ttl };
    }
}
