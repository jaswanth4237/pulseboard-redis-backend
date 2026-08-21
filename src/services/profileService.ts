import { redis } from '../redis/client.js';

export interface UserProfile {
    id: string;
    name?: string;
    email?: string;
    role?: string;
    avatarUrl?: string;
    [key: string]: any;
}

export class ProfileService {
    private static getKey(userId: string): string {
        return `user:${userId}`;
    }

    static async setProfile(userId: string, data: Record<string, string>): Promise<boolean> {
        const key = this.getKey(userId);
        const profileWithId = { id: userId, ...data };
        await redis.hset(key, profileWithId);
        return true;
    }

    static async getField(userId: string, field: string): Promise<string | null> {
        const key = this.getKey(userId);
        return await redis.hget(key, field);
    }

    static async getFields(userId: string, fields: string[]): Promise<Record<string, string | null>> {
        const key = this.getKey(userId);
        const values = await redis.hmget(key, ...fields);
        const result: Record<string, string | null> = {};
        fields.forEach((field, index) => {
            result[field] = values[index];
        });
        return result;
    }

    static async getProfile(userId: string): Promise<Record<string, string>> {
        const key = this.getKey(userId);
        return await redis.hgetall(key);
    }

    static async profileExists(userId: string): Promise<boolean> {
        const key = this.getKey(userId);
        const len = await redis.hlen(key);
        return len > 0;
    }
}
