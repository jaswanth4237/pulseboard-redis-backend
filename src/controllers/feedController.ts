import { Request, Response } from 'express';
import { FeedService } from '../services/feedService.js';

function str(val: string | string[] | undefined): string {
    if (Array.isArray(val)) return val[0];
    return val || '';
}

export class FeedController {
    static async addEvent(req: Request, res: Response) {
        try {
            const { userId, type, payload } = req.body;
            const targetUserId = userId || req.userId;

            if (!targetUserId || !type) {
                return res.status(400).json({ error: 'userId and event type are required' });
            }

            const feedLength = await FeedService.addEventToFeed(targetUserId, {
                type,
                payload: payload || {},
                timestamp: new Date().toISOString(),
            });

            return res.status(201).json({ message: 'Event added to feed', feedLength });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }

    static async getFeed(req: Request, res: Response) {
        try {
            const userId = str(req.params.user_id) || req.userId;
            if (!userId) {
                return res.status(400).json({ error: 'user_id is required' });
            }

            const start = req.query.start ? parseInt(str(req.query.start as any), 10) : 0;
            const stop = req.query.stop ? parseInt(str(req.query.stop as any), 10) : 99;

            const feed = await FeedService.getFeed(userId, start, stop);
            return res.status(200).json({ user_id: userId, count: feed.length, feed });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }
}
