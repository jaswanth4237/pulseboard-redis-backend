import request from 'supertest';
import app from '../app.js';
import { redis } from '../redis/client.js';
import { FeedService } from '../services/feedService.js';

describe('3. Activity Feed', () => {
    beforeEach(async () => {
        await redis.flushdb();
    });

    afterAll(async () => {
        await redis.quit();
    });

    it('should push events, retrieve in reverse chronological order, and trim feed', async () => {
        const userId = 'user_feed_1';

        // Add 5 events
        for (let i = 1; i <= 5; i++) {
            await FeedService.addEventToFeed(
                userId,
                {
                    type: 'INCIDENT_CREATED',
                    payload: { incidentId: `INC-${i}` },
                    timestamp: new Date().toISOString(),
                },
                3 // Max capacity set to 3 for trimming test
            );
        }

        const feed = await FeedService.getFeed(userId);
        expect(feed.length).toBe(3); // Trimmed to max 3
        // Most recent event (INC-5) should be first
        expect(feed[0].payload.incidentId).toBe('INC-5');
        expect(feed[1].payload.incidentId).toBe('INC-4');
        expect(feed[2].payload.incidentId).toBe('INC-3');

        // Test API Endpoint
        const res = await request(app).get(`/feed/${userId}`);
        expect(res.status).toBe(200);
        expect(res.body.count).toBe(3);
        expect(res.body.feed[0].payload.incidentId).toBe('INC-5');
    });
});
