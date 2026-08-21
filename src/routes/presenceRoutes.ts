import { Router } from 'express';
import { PresenceController } from '../controllers/presenceController.js';

const router = Router();

router.post('/online', PresenceController.setOnline);
router.post('/offline', PresenceController.setOffline);
router.get('/online', PresenceController.getOnlineUsers);
router.get('/check/:user_id', PresenceController.checkOnline);

export default router;
