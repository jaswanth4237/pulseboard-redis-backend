import { LockService } from './services/lockService.js';
import { QueueService } from './services/queueService.js';

export class SchedulerRunner {
    private timer: NodeJS.Timeout | null = null;

    start(intervalMs: number = 10000) {
        console.log('[Scheduler Service] Running background task scheduler...');
        this.timer = setInterval(async () => {
            await this.runScheduledTasks();
        }, intervalMs);
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        console.log('[Scheduler Service] Task scheduler stopped.');
    }

    async runScheduledTasks() {
        console.log('[Scheduler Service] Checking scheduled tasks...');
        const lockName = 'nightly_cleanup_task';
        const token = await LockService.acquireLock(lockName, 15);

        if (token) {
            try {
                console.log('[Scheduler Service] Acquired distributed lock. Enqueuing nightly cleanup job...');
                await QueueService.enqueueJob('NIGHTLY_CLEANUP', { scheduledAt: new Date().toISOString() });
            } finally {
                await LockService.releaseLock(lockName, token);
            }
        } else {
            console.log('[Scheduler Service] Nightly cleanup lock held by another scheduler instance. Skipping.');
        }
    }
}

if (process.argv[1].endsWith('scheduler.ts') || process.argv[1].endsWith('scheduler.js')) {
    const scheduler = new SchedulerRunner();
    scheduler.start();

    process.on('SIGINT', () => {
        scheduler.stop();
        process.exit(0);
    });
}
