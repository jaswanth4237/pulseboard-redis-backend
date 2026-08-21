import request from 'supertest';
import app from '../app.js';
import { redis, createRedisClient } from '../redis/client.js';

describe('7. Real-Time Messaging (Pub/Sub)', () => {
    beforeEach(async () => {
        await redis.flushdb();
    });

    afterAll(async () => {
        await redis.quit();
    });

    it('should publish message to channel topic and receive via subscriber', (done) => {
        const channelId = 'incidents_101';
        const expectedChannel = `channel:${channelId}:messages`;
        const subClient = createRedisClient();

        subClient.subscribe(expectedChannel).then(() => {
            subClient.on('message', (channel, message) => {
                try {
                    expect(channel).toBe(expectedChannel);
                    const parsed = JSON.parse(message);
                    expect(parsed.payload.content).toBe('Database outage detected');
                    subClient.quit().then(() => done());
                } catch (err) {
                    subClient.quit().then(() => done(err));
                }
            });

            // Publish message after subscription is confirmed
            request(app)
                .post(`/channels/${channelId}/messages`)
                .send({ senderId: 'bot', text: 'Database outage detected' })
                .end((err, res) => {
                    if (err) done(err);
                    expect(res.status).toBe(200);
                });
        });
    });
});
