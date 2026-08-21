import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: parseInt(process.env.PORT || '3000', 10),
    redis: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
    },
    sessionTTLSeconds: parseInt(process.env.SESSION_TTL || '3600', 10),
    rateLimit: {
        windowSeconds: 60,
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    },
    feedMaxItems: 100,
    streamName: 'stream:events',
    consumerGroup: 'pulseboard-workers',
    jobQueueName: 'queue:jobs',
};
