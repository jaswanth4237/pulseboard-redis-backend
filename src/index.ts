import app from './app.js';
import { config } from './config/index.js';
import { MessageService } from './services/messageService.js';

const PORT = config.port;

// Initialize conceptual Pub/Sub Subscriber for logging real-time messages & typing
MessageService.createSubscriber(['channel:*:messages', 'channel:*:typing'], (channel, message) => {
    console.log(`[PubSub Subscriber] Channel: ${channel} | Received Message: ${message}`);
});

app.listen(PORT, () => {
    console.log(`[PulseBoard API Server] Running on http://localhost:${PORT}`);
});
