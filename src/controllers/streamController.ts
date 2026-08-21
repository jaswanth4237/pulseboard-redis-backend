import { Request, Response } from 'express';
import { StreamService } from '../services/streamService.js';
import { config } from '../config/index.js';

export class StreamController {
    static async addEvent(req: Request, res: Response) {
        try {
            const { stream, data } = req.body;
            const streamName = stream || config.streamName;

            if (!data || typeof data !== 'object') {
                return res.status(400).json({ error: 'data object is required' });
            }

            const eventId = await StreamService.addEvent(data, streamName);
            return res.status(201).json({ message: 'Event added to stream', stream: streamName, eventId });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }

    static async readEvents(req: Request, res: Response) {
        try {
            const consumerName = (req.query.consumer as string) || `consumer_${Date.now()}`;
            const streamName = (req.query.stream as string) || config.streamName;
            const groupName = (req.query.group as string) || config.consumerGroup;
            const count = req.query.count ? parseInt(req.query.count as string, 10) : 10;

            // Ensure consumer group exists
            await StreamService.createConsumerGroup(streamName, groupName);

            const events = await StreamService.readGroup(consumerName, streamName, groupName, count);
            return res.status(200).json({ consumer: consumerName, group: groupName, count: events.length, events });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }

    static async acknowledge(req: Request, res: Response) {
        try {
            const { eventId, stream, group } = req.body;
            const streamName = stream || config.streamName;
            const groupName = group || config.consumerGroup;

            if (!eventId) {
                return res.status(400).json({ error: 'eventId is required' });
            }

            const ackCount = await StreamService.acknowledge(eventId, streamName, groupName);
            return res.status(200).json({ message: 'Event acknowledged', eventId, ackCount });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }
}
