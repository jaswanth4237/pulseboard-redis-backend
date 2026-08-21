import request from 'supertest';
import app from '../app.js';
import { redis } from '../redis/client.js';
import { WorkspaceService } from '../services/workspaceService.js';
import { FeedService } from '../services/feedService.js';

describe('14. Transactions & Atomicity (MULTI/EXEC)', () => {
    beforeEach(async () => {
        await redis.flushdb();
    });

    afterAll(async () => {
        await redis.quit();
    });

    it('should execute multi-step invitation acceptance atomically via MULTI/EXEC', async () => {
        const workspaceId = 'ws_sec_ops';
        const userId = 'user_new_hire';
        const inviterId = 'user_manager';

        const res = await request(app)
            .post(`/workspaces/${workspaceId}/invite`)
            .send({ userId, inviterId });

        expect(res.status).toBe(200);

        // Verify step 1: User added to workspace set
        const members = await WorkspaceService.getMembers(workspaceId);
        expect(members).toContain(userId);

        // Verify step 2: Event pushed to user activity feed list
        const feed = await FeedService.getFeed(userId);
        expect(feed.length).toBe(1);
        expect(feed[0].type).toBe('WORKSPACE_INVITE_ACCEPTED');
        expect(feed[0].payload.workspaceId).toBe(workspaceId);
    });
});
