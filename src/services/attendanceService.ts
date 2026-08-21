import { redis } from '../redis/client.js';

export class AttendanceService {
    private static getKey(userId: string, yearMonthStr?: string): string {
        const ym = yearMonthStr || this.getCurrentYearMonth();
        return `attendance:${userId}:${ym}`;
    }

    private static getCurrentYearMonth(): string {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }

    static async markActive(userId: string, dayOfMonth: number, yearMonthStr?: string): Promise<boolean> {
        const key = this.getKey(userId, yearMonthStr);
        await redis.setbit(key, dayOfMonth, 1);
        return true;
    }

    static async wasActive(userId: string, dayOfMonth: number, yearMonthStr?: string): Promise<boolean> {
        const key = this.getKey(userId, yearMonthStr);
        const bit = await redis.getbit(key, dayOfMonth);
        return bit === 1;
    }

    static async getActiveDaysCount(userId: string, yearMonthStr?: string): Promise<number> {
        const key = this.getKey(userId, yearMonthStr);
        return await redis.bitcount(key);
    }
}
