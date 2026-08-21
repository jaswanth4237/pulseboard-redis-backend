import { redis } from '../redis/client.js';

export class WorkspaceService {
    private static getKey(workspaceId: string): string {
        return `workspace:${workspaceId}:members`;
    }

    static async addMember(workspaceId: string, userId: string): Promise<boolean> {
        const added = await redis.sadd(this.getKey(workspaceId), userId);
        return added > 0;
    }

    static async removeMember(workspaceId: string, userId: string): Promise<boolean> {
        const removed = await redis.srem(this.getKey(workspaceId), userId);
        return removed > 0;
    }

    static async getMembers(workspaceId: string): Promise<string[]> {
        return await redis.smembers(this.getKey(workspaceId));
    }

    static async getCommonMembers(workspaceIds: string[]): Promise<string[]> {
        if (workspaceIds.length === 0) return [];
        const keys = workspaceIds.map((id) => this.getKey(id));
        return await redis.sinter(...keys);
    }
}
