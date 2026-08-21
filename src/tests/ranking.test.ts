import request from 'supertest';
import app from '../app.js';
import { redis } from '../redis/client.js';
import { RankingService } from '../services/rankingService.js';

describe('9 & 18. Trending Channels & Reputation', () => {
    beforeEach(async () => {
        await redis.flushdb();
    });

    afterAll(async () => {
        await redis.quit();
    });

    it('should rank trending channels using Sorted Sets and GET /analytics/trending (Requirement 18)', async () => {
        // Record activity
        await RankingService.recordChannelActivity('chan_general', 5);
        await RankingService.recordChannelActivity('chan_incidents', 20);
        await RankingService.recordChannelActivity('chan_deployments', 12);

        // API GET /analytics/trending
        const res = await request(app).get('/analytics/trending');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(3);

        // Highest score should be first (chan_incidents with score 20)
        expect(res.body[0].id).toBe('chan_incidents');
        expect(res.body[0].score).toBe(20);
        expect(res.body[1].id).toBe('chan_deployments');
        expect(res.body[1].score).toBe(12);
        expect(res.body[2].id).toBe('chan_general');
        expect(res.body[2].score).toBe(5);
    });
});
