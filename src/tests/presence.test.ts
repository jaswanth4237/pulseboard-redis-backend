import request from 'supertest';
import app from '../app.js';
import { redis } from '../redis/client.js';
import { PresenceService } from '../services/presenceService.js';

describe('4. Presence Tracking', () => {
    beforeEach(async () => {
        await redis.flushdb();
    });

    afterAll(async () => {
        await redis.quit();
    });

    it('should track online/offline status using Redis Set', async () => {
        await PresenceService.setUserOnline('user_alice');
        await PresenceService.setUserOnline('user_bob');

        const onlineList = await PresenceService.getOnlineUsers();
        expect(onlineList.sort()).toEqual(['user_alice', 'user_bob'].sort());

        const isAliceOnline = await PresenceService.isUserOnline('user_alice');
        expect(isAliceOnline).toBe(true);

        const isCharlieOnline = await PresenceService.isUserOnline('user_charlie');
        expect(isCharlieOnline).toBe(false);

        // Set offline
        await PresenceService.setUserOffline('user_alice');
        const isAliceOnlineAfter = await PresenceService.isUserOnline('user_alice');
        expect(isAliceOnlineAfter).toBe(false);

        // API Test
        const res = await request(app).get('/presence/online');
        expect(res.status).toBe(200);
        expect(res.body.online_users).toEqual(['user_bob']);
    });
});
