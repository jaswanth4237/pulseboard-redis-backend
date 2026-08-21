import { Request, Response } from 'express';
import { LockService } from '../services/lockService.js';

export class LockController {
    static async acquireLock(req: Request, res: Response) {
        try {
            const { lockName, ttlSeconds } = req.body;
            if (!lockName) {
                return res.status(400).json({ error: 'lockName is required' });
            }

            const token = await LockService.acquireLock(lockName, ttlSeconds || 30);
            if (!token) {
                return res.status(409).json({ error: 'Lock acquisition failed. Lock currently held by another process.' });
            }

            return res.status(200).json({ message: 'Lock acquired successfully', lockName, token });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }

    static async releaseLock(req: Request, res: Response) {
        try {
            const { lockName, token } = req.body;
            if (!lockName || !token) {
                return res.status(400).json({ error: 'lockName and token are required' });
            }

            const released = await LockService.releaseLock(lockName, token);
            if (!released) {
                return res.status(400).json({ error: 'Failed to release lock. Invalid token or lock expired.' });
            }

            return res.status(200).json({ message: 'Lock released successfully', lockName });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }

    static async executeDailyDigestTask(req: Request, res: Response) {
        const lockName = 'daily_digest';
        const token = await LockService.acquireLock(lockName, 60);

        if (!token) {
            return res.status(409).json({ error: 'Daily digest task is already running in another process.' });
        }

        try {
            // Simulate critical daily digest processing
            console.log('[LockController] Executing daily digest task...');
            await new Promise((resolve) => setTimeout(resolve, 50));
            return res.status(200).json({ message: 'Daily digest task completed successfully' });
        } finally {
            await LockService.releaseLock(lockName, token);
        }
    }
}
