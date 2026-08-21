import { redis, createRedisClient } from '../redis/client.js';

export class MessageService {
    static async publishMessage(channelId: string, payload: Record<string, any>): Promise<number> {
        const channelName = `channel:${channelId}:messages`;
        const message = JSON.stringify({
            channelId,
            payload,
            timestamp: new Date().toISOString(),
        });
        return await redis.publish(channelName, message);
    }

    static async publishTyping(channelId: string, userId: string, isTyping: boolean): Promise<number> {
        const channelName = `channel:${channelId}:typing`;
        const message = JSON.stringify({
            channelId,
            userId,
            isTyping,
            timestamp: new Date().toISOString(),
        });
        return await redis.publish(channelName, message);
    }

    static createSubscriber(
        channels: string[],
        onMessage: (channel: string, message: string) => void
    ) {
        const subClient = createRedisClient();
        subClient.subscribe(...channels).then((count) => {
            console.log(`[PubSub] Subscribed to ${count} channels`);
        }).catch((err) => {
            console.error('[PubSub] Subscription error:', err);
        });

        subClient.on('message', (channel: string, message: string) => {
            onMessage(channel, message);
        });

        return subClient;
    }
}
