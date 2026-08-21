import request from 'supertest';
import app from '../app.js';
import { redis } from '../redis/client.js';
import { DAUService } from '../services/dauService.js';

describe('11. Approximate Analytics (DAU)', () => {
    beforeEach(async () => {
        await redis.flushdb();
    });

    afterAll(async () => {
        await redis.quit();
    });

    it('should estimate unique daily active users using HyperLogLog (PFADD / PFCOUNT)', async () => {
        const testDate = '2026-08-21';

        // Record activity for 100 users, including duplicate activity
        for (let i = 1; i <= 100; i++) {
            await DAUService.recordUserActivity(`user_${i}`, testDate);
            if (i % 2 === 0) {
                // Record duplicate action for even users
                await DAUService.recordUserActivity(`user_${i}`, testDate);
            }
        }

        const count = await DAUService.getDAUCount(testDate);
        // HyperLogLog gives approximate count with ~0.81% standard error
        expect(count).toBeGreaterThanOrEqual(95);
        expect(count).toBeLessThanOrEqual(105);

        // API Test
        const res = await request(app).get(`/analytics/dau/${testDate}`);
        expect(res.status).toBe(200);
        expect(res.body.dau_count).toBe(count);
    });
});
