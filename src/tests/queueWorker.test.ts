import request from 'supertest';
import app from '../app.js';
import { redis } from '../redis/client.js';
import { QueueService } from '../services/queueService.js';

describe('15. Background Job Queue & Worker Service', () => {
    beforeEach(async () => {
        await redis.flushdb();
    });

    afterAll(async () => {
        await redis.quit();
    });

    it('should enqueue job payload to Redis List and dequeue for worker execution', async () => {
        // API call to enqueue job
        const res = await request(app)
            .post('/jobs/enqueue')
            .send({
                jobType: 'WELCOME_EMAIL',
                payload: { userId: 'user_new', email: 'newbie@pulseboard.io' },
            });

        expect(res.status).toBe(202);
        expect(res.body.job).toHaveProperty('id');
        expect(res.body.job.type).toBe('WELCOME_EMAIL');

        // Check queue length
        const queueLength = await QueueService.getQueueLength();
        expect(queueLength).toBe(1);

        // Dequeue job (simulating worker process)
        const dequeuedJob = await QueueService.popJobImmediate();
        expect(dequeuedJob).not.toBeNull();
        expect(dequeuedJob?.type).toBe('WELCOME_EMAIL');
        expect(dequeuedJob?.payload.email).toBe('newbie@pulseboard.io');

        const emptyLength = await QueueService.getQueueLength();
        expect(emptyLength).toBe(0);
    });
});
