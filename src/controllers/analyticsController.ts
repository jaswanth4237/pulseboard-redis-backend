import { Request, Response } from 'express';
import { RankingService } from '../services/rankingService.js';
import { DAUService } from '../services/dauService.js';

function str(val: string | string[] | undefined): string {
    if (Array.isArray(val)) return val[0];
    return val || '';
}

export class AnalyticsController {
    static async recordChannelActivity(req: Request, res: Response) {
        try {
            const channelId = str(req.params.id);
            const increment = req.body.increment ? parseFloat(req.body.increment) : 1;

            const newScore = await RankingService.recordChannelActivity(channelId, increment);
            return res.status(200).json({ channelId, newScore });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }

    static async getTrendingChannels(req: Request, res: Response) {
        try {
            const limit = req.query.limit ? parseInt(str(req.query.limit as any), 10) : 10;
            const trending = await RankingService.getTrendingChannels(limit);

            // Requirement 18 specifies "response body must be a JSON array of channel objects or channel IDs"
            return res.status(200).json(trending);
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }

    static async recordUserReputation(req: Request, res: Response) {
        try {
            const userId = str(req.params.id);
            const increment = req.body.increment ? parseFloat(req.body.increment) : 1;

            const newScore = await RankingService.incrementUserReputation(userId, increment);
            return res.status(200).json({ userId, newScore });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }

    static async getTopReputationUsers(req: Request, res: Response) {
        try {
            const limit = req.query.limit ? parseInt(str(req.query.limit as any), 10) : 10;
            const topUsers = await RankingService.getTopReputationUsers(limit);
            return res.status(200).json(topUsers);
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }

    static async recordDAU(req: Request, res: Response) {
        try {
            const { userId, date } = req.body;
            const targetUserId = userId || req.userId;

            if (!targetUserId) {
                return res.status(400).json({ error: 'userId is required' });
            }

            await DAUService.recordUserActivity(targetUserId, date);
            return res.status(200).json({ message: 'DAU recorded', userId: targetUserId, date });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }

    static async getDAU(req: Request, res: Response) {
        try {
            const dateStr = str(req.params.date);
            const count = await DAUService.getDAUCount(dateStr);
            return res.status(200).json({ date: dateStr, dau_count: count });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }
}
