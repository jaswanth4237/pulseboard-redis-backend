import { Request, Response } from 'express';
import { TransactionService } from '../services/transactionService.js';

function str(val: string | string[] | undefined): string {
    if (Array.isArray(val)) return val[0];
    return val || '';
}

export class TransactionController {
    static async acceptInvitation(req: Request, res: Response) {
        try {
            const workspaceId = str(req.params.id);
            const { userId, inviterId } = req.body;
            const targetUserId = userId || req.userId;
            const inviter = inviterId || 'system';

            if (!workspaceId || !targetUserId) {
                return res.status(400).json({ error: 'workspaceId and userId are required' });
            }

            await TransactionService.acceptWorkspaceInvitation(workspaceId, targetUserId, inviter);

            return res.status(200).json({
                message: 'Workspace invitation accepted atomically via MULTI/EXEC',
                workspaceId,
                userId: targetUserId,
            });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }
}
