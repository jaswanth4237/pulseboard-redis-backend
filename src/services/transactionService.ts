import { redis } from '../redis/client.js';

export class TransactionService {
    static async acceptWorkspaceInvitation(
        workspaceId: string,
        userId: string,
        inviterId: string
    ): Promise<boolean> {
        const workspaceKey = `workspace:${workspaceId}:members`;
        const feedKey = `feed:${userId}`;

        const feedEvent = JSON.stringify({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            type: 'WORKSPACE_INVITE_ACCEPTED',
            payload: { workspaceId, inviterId },
            timestamp: new Date().toISOString(),
        });

        const multi = redis.multi();
        // 1. Add user to workspace membership set
        multi.sadd(workspaceKey, userId);
        // 2. Push event to user activity feed list
        multi.lpush(feedKey, feedEvent);
        // 3. Trim feed list
        multi.ltrim(feedKey, 0, 99);

        const results = await multi.exec();

        if (!results) {
            throw new Error('Transaction aborted or failed');
        }

        // Ensure all commands in multi block succeeded without errors
        for (const [err] of results) {
            if (err) throw err;
        }

        return true;
    }
}
