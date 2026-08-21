import { redis } from '../redis/client.js';
import { config } from '../config/index.js';

export interface FeedEvent {
    id?: string;
    type: string;
    payload: Record<string, any>;
    timestamp: string;
}

export class FeedService {
    static async addEventToFeed(
        userId: string,
        event: FeedEvent,
        maxItems: number = config.feedMaxItems
    ): Promise<number> {
        const key = `feed:${userId}`;
        const payload = JSON.stringify({
            id: event.id || `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            ...event,
            timestamp: event.timestamp || new Date().toISOString(),
        });

        const multi = redis.multi();
        multi.lpush(key, payload);
        multi.ltrim(key, 0, maxItems - 1);
        await multi.exec();

        return await redis.llen(key);
    }

    static async getFeed(userId: string, start: number = 0, stop: number = 99): Promise<FeedEvent[]> {
        const key = `feed:${userId}`;
        const items = await redis.lrange(key, start, stop);
        return items.map((item: string) => JSON.parse(item));
    }
}
