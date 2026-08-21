import { QueueService } from './services/queueService.js';
import { StreamService } from './services/streamService.js';
import { config } from './config/index.js';

export class WorkerRunner {
    private isRunning = false;
    private workerId = `worker-${Math.random().toString(36).substring(2, 7)}`;

    async start() {
        this.isRunning = true;
        console.log(`[Worker Service] ${this.workerId} started. Processing Redis Queues & Streams...`);

        // Ensure Redis Stream Consumer Group exists
        try {
            await StreamService.createConsumerGroup(config.streamName, config.consumerGroup);
        } catch (err) {
            console.log('[Worker Service] Stream group setup note:', err);
        }

        // Run parallel loops for job queue & stream consumer
        this.processQueueLoop();
        this.processStreamLoop();
    }

    stop() {
        this.isRunning = false;
        console.log(`[Worker Service] ${this.workerId} stopping...`);
    }

    private async processQueueLoop() {
        while (this.isRunning) {
            try {
                const job = await QueueService.dequeueJob(2);
                if (job) {
                    console.log(`[Worker Service - Job Queue] Processing job ${job.id} of type '${job.type}':`, job.payload);
                    await this.executeJob(job);
                }
            } catch (err) {
                if (this.isRunning) {
                    console.error('[Worker Service - Job Queue] Error:', err);
                    await new Promise((res) => setTimeout(res, 1000));
                }
            }
        }
    }

    private async processStreamLoop() {
        while (this.isRunning) {
            try {
                const messages = await StreamService.readGroup(
                    this.workerId,
                    config.streamName,
                    config.consumerGroup,
                    5
                );

                for (const msg of messages) {
                    console.log(`[Worker Service - Stream] Received Event ID ${msg.id}:`, msg.data);
                    // Process stream event...
                    await StreamService.acknowledge(msg.id, config.streamName, config.consumerGroup);
                    console.log(`[Worker Service - Stream] Acknowledged Event ID ${msg.id}`);
                }

                if (messages.length === 0) {
                    await new Promise((res) => setTimeout(res, 1000));
                }
            } catch (err) {
                if (this.isRunning) {
                    console.error('[Worker Service - Stream] Error:', err);
                    await new Promise((res) => setTimeout(res, 1000));
                }
            }
        }
    }

    private async executeJob(job: any) {
        switch (job.type) {
            case 'WELCOME_EMAIL':
                console.log(`[Worker] Sent welcome email to user ${job.payload.email || job.payload.userId}`);
                break;
            case 'WORKSPACE_SUMMARY':
                console.log(`[Worker] Generated summary for workspace ${job.payload.workspaceId}`);
                break;
            default:
                console.log(`[Worker] Executed generic job ${job.type}`);
        }
    }
}

if (process.argv[1].endsWith('worker.ts') || process.argv[1].endsWith('worker.js')) {
    const runner = new WorkerRunner();
    runner.start();

    process.on('SIGINT', () => {
        runner.stop();
        process.exit(0);
    });
}
