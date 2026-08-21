import { Request, Response } from 'express';
import { WorkspaceService } from '../services/workspaceService.js';

function str(val: string | string[] | undefined): string {
    if (Array.isArray(val)) return val[0];
    return val || '';
}

export class WorkspaceController {
    static async addMember(req: Request, res: Response) {
        try {
            const workspaceId = str(req.params.id);
            const { userId } = req.body;
            const targetUserId = userId || req.userId;

            if (!targetUserId) {
                return res.status(400).json({ error: 'userId is required' });
            }

            await WorkspaceService.addMember(workspaceId, targetUserId);
            return res.status(200).json({ message: 'Member added to workspace', workspaceId, userId: targetUserId });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }

    static async removeMember(req: Request, res: Response) {
        try {
            const workspaceId = str(req.params.id);
            const userId = str(req.params.user_id) || req.body.userId;

            if (!userId) {
                return res.status(400).json({ error: 'userId is required' });
            }

            await WorkspaceService.removeMember(workspaceId, userId);
            return res.status(200).json({ message: 'Member removed from workspace', workspaceId, userId });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }

    static async getMembers(req: Request, res: Response) {
        try {
            const workspaceId = str(req.params.id);
            const members = await WorkspaceService.getMembers(workspaceId);
            // Return JSON array directly or object containing array (Requirement 17 says "JSON array of user objects or user IDs")
            return res.status(200).json(members);
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }

    static async getCommonMembers(req: Request, res: Response) {
        try {
            const workspaceIdsStr = str(req.query.ids as any);
            if (!workspaceIdsStr) {
                return res.status(400).json({ error: 'Query parameter ids (comma separated) is required' });
            }
            const workspaceIds = workspaceIdsStr.split(',').map((id) => id.trim());
            const common = await WorkspaceService.getCommonMembers(workspaceIds);
            return res.status(200).json({ workspace_ids: workspaceIds, common_members: common });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }
}
