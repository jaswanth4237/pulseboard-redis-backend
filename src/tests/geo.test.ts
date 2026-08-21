import request from 'supertest';
import app from '../app.js';
import { redis } from '../redis/client.js';
import { GeoService } from '../services/geoService.js';

describe('13. Geospatial Awareness', () => {
    beforeEach(async () => {
        await redis.flushdb();
    });

    afterAll(async () => {
        await redis.quit();
    });

    it('should store user locations and search nearby users within radius', async () => {
        // Add locations (Longitude, Latitude)
        // San Francisco Downtown: -122.4194, 37.7749
        await GeoService.updateLocation('user_sf1', -122.4194, 37.7749);
        // Oakland (approx 15km away): -122.2712, 37.8044
        await GeoService.updateLocation('user_oakland', -122.2712, 37.8044);
        // Los Angeles (approx 550km away): -118.2437, 34.0522
        await GeoService.updateLocation('user_la', -118.2437, 34.0522);

        // Search within 25km of SF Downtown
        const nearby = await GeoService.findNearbyUsers(-122.4194, 37.7749, 25);
        const userIds = nearby.map((u) => u.userId);

        expect(userIds).toContain('user_sf1');
        expect(userIds).toContain('user_oakland');
        expect(userIds).not.toContain('user_la');

        // API Test GET /geo/nearby
        const res = await request(app)
            .get('/geo/nearby')
            .query({ longitude: -122.4194, latitude: 37.7749, radius: 25 });

        expect(res.status).toBe(200);
        expect(res.body.count).toBe(2);
    });
});
