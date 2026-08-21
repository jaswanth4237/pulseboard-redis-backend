import { Request, Response } from 'express';
import { QueueService } from '../services/queueService.js';

export class QueueController {
    static async enqueueJob(req: Request, res: Response) {
        try {
            const { jobType, payload } = req.body;
            if (!jobType) {
                return res.status(400).json({ error: 'jobType is required' });
            }

            const job = await QueueService.enqueueJob(jobType, payload || {});
            return res.status(202).json({
                message: 'Job enqueued successfully',
                job,
            });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }

    static async getQueueStatus(req: Request, res: Response) {
        try {
            const length = await QueueService.getQueueLength();
            return res.status(200).json({ queue_length: length });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }
}
