import request from 'supertest';
import app from '../app.js';
import { redis } from '../redis/client.js';
import { ProfileService } from '../services/profileService.js';

describe('6. User Profiles', () => {
    beforeEach(async () => {
        await redis.flushdb();
    });

    afterAll(async () => {
        await redis.quit();
    });

    it('should store and fetch profile fields using Redis Hashes', async () => {
        const userId = 'user_prof_1';
        await ProfileService.setProfile(userId, {
            name: 'Sarah Connor',
            email: 'sarah@skynet.org',
            role: 'Incident Lead',
        });

        // Check full profile
        const profile = await ProfileService.getProfile(userId);
        expect(profile.name).toBe('Sarah Connor');
        expect(profile.role).toBe('Incident Lead');

        // Check individual field
        const name = await ProfileService.getField(userId, 'name');
        expect(name).toBe('Sarah Connor');

        // Check existence
        const exists = await ProfileService.profileExists(userId);
        expect(exists).toBe(true);

        // API Test GET /users/:id
        const res = await request(app).get(`/users/${userId}`);
        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Sarah Connor');
    });
});
