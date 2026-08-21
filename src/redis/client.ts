import { Redis } from 'ioredis';
import { config } from '../config/index.js';

export const redis = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    lazyConnect: false,
    maxRetriesPerRequest: null,
});

redis.on('connect', () => {
    console.log('[Redis] Connected successfully');
});

redis.on('error', (err: any) => {
    console.error('[Redis] Error:', err);
});

export function createRedisClient(): Redis {
    return new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        maxRetriesPerRequest: null,
    });
}
