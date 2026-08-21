import request from 'supertest';
import app from '../app.js';
import { redis } from '../redis/client.js';
import { WorkspaceService } from '../services/workspaceService.js';

describe('5 & 17. Workspace Membership', () => {
    beforeEach(async () => {
        await redis.flushdb();
    });

    afterAll(async () => {
        await redis.quit();
    });

    it('should add/remove members and find common members (SINTER)', async () => {
        const ws1 = 'workspace_devs';
        const ws2 = 'workspace_ops';

        // Add members
        await WorkspaceService.addMember(ws1, 'user_dev1');
        await WorkspaceService.addMember(ws1, 'user_shared');
        await WorkspaceService.addMember(ws2, 'user_ops1');
        await WorkspaceService.addMember(ws2, 'user_shared');

        // Test API GET /workspaces/:id/members (Requirement 17)
        const res1 = await request(app).get(`/workspaces/${ws1}/members`);
        expect(res1.status).toBe(200);
        expect(Array.isArray(res1.body)).toBe(true);
        expect(res1.body.sort()).toEqual(['user_dev1', 'user_shared'].sort());

        // Test SINTER (Common members)
        const common = await WorkspaceService.getCommonMembers([ws1, ws2]);
        expect(common).toEqual(['user_shared']);

        // Remove member
        await WorkspaceService.removeMember(ws1, 'user_dev1');
        const updatedMembers = await WorkspaceService.getMembers(ws1);
        expect(updatedMembers).toEqual(['user_shared']);
    });
});
