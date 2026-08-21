import { Router } from 'express';
import { LockController } from '../controllers/lockController.js';

const router = Router();

router.post('/locks/acquire', LockController.acquireLock);
router.post('/locks/release', LockController.releaseLock);
router.post('/tasks/daily-digest', LockController.executeDailyDigestTask);

export default router;
