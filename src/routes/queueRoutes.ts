import { Router } from 'express';
import { QueueController } from '../controllers/queueController.js';

const router = Router();

router.post('/jobs/enqueue', QueueController.enqueueJob);
router.get('/jobs/status', QueueController.getQueueStatus);

export default router;
