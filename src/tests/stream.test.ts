import request from 'supertest';
import app from '../app.js';
import { redis } from '../redis/client.js';
import { StreamService } from '../services/streamService.js';

describe('8. Event Streaming (Redis Streams)', () => {
    beforeEach(async () => {
        await redis.flushdb();
    });

    afterAll(async () => {
        await redis.quit();
    });

    it('should add event, read via consumer group, and acknowledge', async () => {
        const streamName = 'stream:test_events';
        const groupName = 'test_group';
        const consumerName = 'consumer_1';

        // 1. Add event
        const eventId = await StreamService.addEvent(
            { action: 'DEPLOYMENT_STARTED', environment: 'production' },
            streamName
        );
        expect(eventId).toBeTruthy();

        // 2. Create group and read
        await StreamService.createConsumerGroup(streamName, groupName, '0');
        const messages = await StreamService.readGroup(consumerName, streamName, groupName, 5);

        expect(messages.length).toBe(1);
        expect(messages[0].id).toBe(eventId);
        expect(messages[0].data.action).toBe('DEPLOYMENT_STARTED');

        // 3. Acknowledge message
        const ackCount = await StreamService.acknowledge(eventId, streamName, groupName);
        expect(ackCount).toBe(1);
    });
});
