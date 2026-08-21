import request from 'supertest';
import app from '../app.js';
import { redis } from '../redis/client.js';
import { AuthService } from '../services/authService.js';

describe('1 & 16. Sessions & Authentication', () => {
    beforeEach(async () => {
        await redis.flushdb();
    });

    afterAll(async () => {
        await redis.quit();
    });

    it('should create session key with TTL on POST /auth/login (Requirement 16)', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'eng-lead@pulseboard.io', userId: 'user_101' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('session_token');
        expect(res.body.user_id).toBe('user_101');

        const token = res.body.session_token;
        const sessionKey = `session:${token}`;

        // Verify key exists in Redis
        const storedUserId = await redis.get(sessionKey);
        expect(storedUserId).toBe('user_101');

        // Verify TTL is set
        const ttl = await redis.ttl(sessionKey);
        expect(ttl).toBeGreaterThan(0);
        expect(ttl).toBeLessThanOrEqual(3600);
    });

    it('should retrieve user_id using AuthService and revoke session', async () => {
        const token = await AuthService.createSession('user_202', 10);
        const userId = await AuthService.getUserIdFromSession(token);
        expect(userId).toBe('user_202');

        const revoked = await AuthService.revokeSession(token);
        expect(revoked).toBe(true);

        const checkUserId = await AuthService.getUserIdFromSession(token);
        expect(checkUserId).toBeNull();
    });
});
