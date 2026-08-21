import { Router } from 'express';
import { StreamController } from '../controllers/streamController.js';

const router = Router();

router.post('/events/stream', StreamController.addEvent);
router.get('/events/stream/read', StreamController.readEvents);
router.post('/events/stream/ack', StreamController.acknowledge);

export default router;
