import { Request, Response } from 'express';
import { MessageService } from '../services/messageService.js';
import { RankingService } from '../services/rankingService.js';

function str(val: string | string[] | undefined): string {
    if (Array.isArray(val)) return val[0];
    return val || '';
}

export class MessageController {
    static async sendMessage(req: Request, res: Response) {
        try {
            const channelId = str(req.params.id);
            const { text, content, senderId } = req.body;
            const userId = senderId || req.userId || 'anonymous';

            const payload = {
                senderId: userId,
                content: content || text,
                timestamp: new Date().toISOString(),
            };

            const receiversCount = await MessageService.publishMessage(channelId, payload);

            // Increment trending channel activity score in Sorted Set
            await RankingService.recordChannelActivity(channelId, 1);

            return res.status(200).json({
                message: 'Message published successfully',
                channelId,
                receiversCount,
                payload,
            });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }

    static async sendTyping(req: Request, res: Response) {
        try {
            const channelId = str(req.params.id);
            const { userId, isTyping } = req.body;
            const targetUserId = userId || req.userId;

            const receiversCount = await MessageService.publishTyping(
                channelId,
                targetUserId,
                isTyping !== undefined ? isTyping : true
            );

            return res.status(200).json({
                message: 'Typing indicator published',
                channelId,
                userId: targetUserId,
                receiversCount,
            });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }
}
