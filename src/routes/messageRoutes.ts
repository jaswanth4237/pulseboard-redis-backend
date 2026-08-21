import { Router } from 'express';
import { MessageController } from '../controllers/messageController.js';

const router = Router();

router.post('/channels/:id/messages', MessageController.sendMessage);
router.post('/channels/:id/typing', MessageController.sendTyping);

export default router;
