import { Request, Response } from 'express';
import { PresenceService } from '../services/presenceService.js';

function str(val: string | string[] | undefined): string {
    if (Array.isArray(val)) return val[0];
    return val || '';
}

export class PresenceController {
    static async setOnline(req: Request, res: Response) {
        try {
            const userId = req.body.userId || req.userId;
            if (!userId) {
                return res.status(400).json({ error: 'userId is required' });
            }
            await PresenceService.setUserOnline(userId);
            return res.status(200).json({ message: 'User set to online', userId, online: true });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }

    static async setOffline(req: Request, res: Response) {
        try {
            const userId = req.body.userId || req.userId;
            if (!userId) {
                return res.status(400).json({ error: 'userId is required' });
            }
            await PresenceService.setUserOffline(userId);
            return res.status(200).json({ message: 'User set to offline', userId, online: false });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }

    static async getOnlineUsers(req: Request, res: Response) {
        try {
            const onlineUsers = await PresenceService.getOnlineUsers();
            return res.status(200).json({ online_users: onlineUsers, count: onlineUsers.length });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }

    static async checkOnline(req: Request, res: Response) {
        try {
            const userId = str(req.params.user_id);
            if (!userId) {
                return res.status(400).json({ error: 'user_id is required' });
            }
            const isOnline = await PresenceService.isUserOnline(userId);
            return res.status(200).json({ user_id: userId, online: isOnline });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }
}
