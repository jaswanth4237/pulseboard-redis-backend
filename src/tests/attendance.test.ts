import request from 'supertest';
import app from '../app.js';
import { redis } from '../redis/client.js';
import { AttendanceService } from '../services/attendanceService.js';

describe('12. Attendance & Binary Tracking', () => {
    beforeEach(async () => {
        await redis.flushdb();
    });

    afterAll(async () => {
        await redis.quit();
    });

    it('should track daily activity bits and count total active days using Bitmaps', async () => {
        const userId = 'user_at_1';
        const yearMonth = '2026-08';

        // Mark user active on days 1, 5, 15, 20
        await AttendanceService.markActive(userId, 1, yearMonth);
        await AttendanceService.markActive(userId, 5, yearMonth);
        await AttendanceService.markActive(userId, 15, yearMonth);
        await AttendanceService.markActive(userId, 20, yearMonth);

        // Check specific days using GETBIT
        expect(await AttendanceService.wasActive(userId, 1, yearMonth)).toBe(true);
        expect(await AttendanceService.wasActive(userId, 5, yearMonth)).toBe(true);
        expect(await AttendanceService.wasActive(userId, 2, yearMonth)).toBe(false);

        // Count active days using BITCOUNT
        const totalActiveDays = await AttendanceService.getActiveDaysCount(userId, yearMonth);
        expect(totalActiveDays).toBe(4);

        // API Test
        const res = await request(app).get(`/attendance/${userId}/${yearMonth}/count`);
        expect(res.status).toBe(200);
        expect(res.body.active_days_count).toBe(4);
    });
});
