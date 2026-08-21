import { redis } from '../redis/client.js';

export class PresenceService {
    private static readonly ONLINE_KEY = 'online_users';

    static async setUserOnline(userId: string): Promise<boolean> {
        const added = await redis.sadd(this.ONLINE_KEY, userId);
        return added > 0;
    }

    static async setUserOffline(userId: string): Promise<boolean> {
        const removed = await redis.srem(this.ONLINE_KEY, userId);
        return removed > 0;
    }

    static async getOnlineUsers(): Promise<string[]> {
        return await redis.smembers(this.ONLINE_KEY);
    }

    static async isUserOnline(userId: string): Promise<boolean> {
        const isMember = await redis.sismember(this.ONLINE_KEY, userId);
        return isMember === 1;
    }
}
