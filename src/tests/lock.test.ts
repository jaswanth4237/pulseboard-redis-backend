import request from 'supertest';
import app from '../app.js';
import { redis } from '../redis/client.js';
import { LockService } from '../services/lockService.js';

describe('10. Distributed Locking', () => {
    beforeEach(async () => {
        await redis.flushdb();
    });

    afterAll(async () => {
        await redis.quit();
    });

    it('should acquire lock atomically, reject concurrent acquisition, and release cleanly', async () => {
        const lockName = 'report_generation';

        // First process acquires lock
        const token1 = await LockService.acquireLock(lockName, 10);
        expect(token1).toBeTruthy();

        // Second process tries to acquire same lock (should fail)
        const token2 = await LockService.acquireLock(lockName, 10);
        expect(token2).toBeNull();

        // Process 1 releases lock
        const released = await LockService.releaseLock(lockName, token1!);
        expect(released).toBe(true);

        // Now process 2 can acquire lock
        const token3 = await LockService.acquireLock(lockName, 10);
        expect(token3).toBeTruthy();
    });
});
