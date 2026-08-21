import { redis } from '../redis/client.js';

export class DAUService {
    private static getKey(dateStr: string): string {
        return `analytics:dau:${dateStr}`;
    }

    private static getTodayString(): string {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    static async recordUserActivity(userId: string, dateStr?: string): Promise<boolean> {
        const targetDate = dateStr || this.getTodayString();
        const key = this.getKey(targetDate);
        const result = await redis.pfadd(key, userId);
        return result === 1;
    }

    static async getDAUCount(dateStr?: string): Promise<number> {
        const targetDate = dateStr || this.getTodayString();
        const key = this.getKey(targetDate);
        return await redis.pfcount(key);
    }
}
