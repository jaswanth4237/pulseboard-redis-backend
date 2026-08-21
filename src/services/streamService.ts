import { redis } from '../redis/client.js';
import { config } from '../config/index.js';

export interface StreamMessage {
    id: string;
    data: Record<string, string>;
}

export class StreamService {
    static async addEvent(
        data: Record<string, string>,
        streamName: string = config.streamName
    ): Promise<string> {
        const fields: string[] = [];
        for (const [key, value] of Object.entries(data)) {
            fields.push(key, typeof value === 'string' ? value : JSON.stringify(value));
        }
        const messageId = await redis.xadd(streamName, '*', ...fields);
        if (!messageId) {
            throw new Error('Failed to append event to stream');
        }
        return messageId;
    }

    static async createConsumerGroup(
        streamName: string = config.streamName,
        groupName: string = config.consumerGroup,
        startId: string = '$'
    ): Promise<boolean> {
        try {
            await redis.xgroup('CREATE', streamName, groupName, startId, 'MKSTREAM');
            return true;
        } catch (err: any) {
            if (err.message && err.message.includes('BUSYGROUP')) {
                return true; // Group already exists
            }
            throw err;
        }
    }

    static async readGroup(
        consumerName: string,
        streamName: string = config.streamName,
        groupName: string = config.consumerGroup,
        count: number = 10
    ): Promise<StreamMessage[]> {
        try {
            const results = (await redis.xreadgroup(
                'GROUP',
                groupName,
                consumerName,
                'COUNT',
                count,
                'STREAMS',
                streamName,
                '>'
            )) as any;

            if (!results || results.length === 0) return [];

            const streamData = results[0][1];
            const messages: StreamMessage[] = [];

            for (const entry of streamData) {
                const id = entry[0];
                const rawFields = entry[1];
                const data: Record<string, string> = {};
                for (let i = 0; i < rawFields.length; i += 2) {
                    data[rawFields[i]] = rawFields[i + 1];
                }
                messages.push({ id, data });
            }

            return messages;
        } catch (err) {
            console.error('[StreamService] Error reading group:', err);
            return [];
        }
    }

    static async acknowledge(
        eventId: string,
        streamName: string = config.streamName,
        groupName: string = config.consumerGroup
    ): Promise<number> {
        return await redis.xack(streamName, groupName, eventId);
    }
}
