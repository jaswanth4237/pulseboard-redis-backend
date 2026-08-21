import { v4 as uuidv4 } from 'uuid';
import { redis } from '../redis/client.js';

export class LockService {
    private static getKey(lockName: string): string {
        return `lock:${lockName}`;
    }

    static async acquireLock(lockName: string, ttlSeconds: number = 30): Promise<string | null> {
        const key = this.getKey(lockName);
        const token = uuidv4();
        const result = await redis.set(key, token, 'EX', ttlSeconds, 'NX');
        if (result === 'OK') {
            return token;
        }
        return null;
    }

    static async releaseLock(lockName: string, token: string): Promise<boolean> {
        const key = this.getKey(lockName);
        // Lua script guarantees atomic comparison and removal
        const luaScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
        const result = await redis.eval(luaScript, 1, key, token);
        return result === 1;
    }
}
