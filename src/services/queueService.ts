import { v4 as uuidv4 } from 'uuid';
import { redis, createRedisClient } from '../redis/client.js';
import { config } from '../config/index.js';

export interface Job {
    id: string;
    type: string;
    payload: Record<string, any>;
    createdAt: string;
}

export class QueueService {
    static async enqueueJob(jobType: string, payload: Record<string, any>): Promise<Job> {
        const job: Job = {
            id: uuidv4(),
            type: jobType,
            payload,
            createdAt: new Date().toISOString(),
        };

        await redis.lpush(config.jobQueueName, JSON.stringify(job));
        return job;
    }

    static async dequeueJob(timeoutSeconds: number = 0): Promise<Job | null> {
        const client = createRedisClient();
        try {
            const result = await client.brpop(config.jobQueueName, timeoutSeconds);
            if (!result) return null;

            const [_, jobStr] = result;
            return JSON.parse(jobStr) as Job;
        } finally {
            client.disconnect();
        }
    }

    static async popJobImmediate(): Promise<Job | null> {
        const jobStr = await redis.rpop(config.jobQueueName);
        if (!jobStr) return null;
        return JSON.parse(jobStr) as Job;
    }

    static async getQueueLength(): Promise<number> {
        return await redis.llen(config.jobQueueName);
    }
}
