import { Router } from 'express';
import { FeedController } from '../controllers/feedController.js';

const router = Router();

router.post('/events', FeedController.addEvent);
router.get('/:user_id', FeedController.getFeed);

export default router;
