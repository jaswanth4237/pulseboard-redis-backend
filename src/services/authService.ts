import { v4 as uuidv4 } from 'uuid';
import { redis } from '../redis/client.js';
import { config } from '../config/index.js';

export class AuthService {
    static async createSession(userId: string, ttlSeconds: number = config.sessionTTLSeconds): Promise<string> {
        const token = uuidv4();
        const key = `session:${token}`;
        await redis.setex(key, ttlSeconds, userId);
        return token;
    }

    static async getUserIdFromSession(token: string): Promise<string | null> {
        const key = `session:${token}`;
        return await redis.get(key);
    }

    static async getSessionTTL(token: string): Promise<number> {
        const key = `session:${token}`;
        return await redis.ttl(key);
    }

    static async revokeSession(token: string): Promise<boolean> {
        const key = `session:${token}`;
        const result = await redis.del(key);
        return result > 0;
    }
}
