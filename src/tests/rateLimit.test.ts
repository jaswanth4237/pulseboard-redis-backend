import request from 'supertest';
import express from 'express';
import { redis } from '../redis/client.js';
import { rateLimiterMiddleware } from '../middleware/rateLimiter.js';

describe('2. API Rate Limiting', () => {
    let testApp: express.Application;

    beforeEach(async () => {
        await redis.flushdb();

        testApp = express();
        testApp.use(express.json());
        // Attach dummy userId for test
        testApp.use((req, res, next) => {
            req.userId = 'user_rate_test';
            next();
        });
        // Set low limit (3 requests) for fast test
        testApp.use(rateLimiterMiddleware(3, 60));
        testApp.get('/test-limit', (req, res) => {
            res.status(200).json({ ok: true });
        });
    });

    afterAll(async () => {
        await redis.quit();
    });

    it('should allow requests within threshold and reject with 429 when exceeded', async () => {
        // Requests 1, 2, 3 should succeed
        const r1 = await request(testApp).get('/test-limit');
        expect(r1.status).toBe(200);

        const r2 = await request(testApp).get('/test-limit');
        expect(r2.status).toBe(200);

        const r3 = await request(testApp).get('/test-limit');
        expect(r3.status).toBe(200);

        // Request 4 should be rejected with 429 Too Many Requests
        const r4 = await request(testApp).get('/test-limit');
        expect(r4.status).toBe(429);
        expect(r4.body.error).toBe('Too Many Requests');

        // Verify rate limit key exists and has TTL
        const minuteTimestamp = Math.floor(Date.now() / 60000);
        const key = `rate_limit:user_rate_test:${minuteTimestamp}`;
        const count = await redis.get(key);
        expect(parseInt(count || '0', 10)).toBeGreaterThanOrEqual(4);

        const ttl = await redis.ttl(key);
        expect(ttl).toBeGreaterThan(0);
    });
});
