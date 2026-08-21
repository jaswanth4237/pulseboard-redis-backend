import { Router } from 'express';
import { ProfileController } from '../controllers/profileController.js';

const router = Router();

router.post('/', ProfileController.setProfile);
router.get('/:id', ProfileController.getProfile);
router.get('/:id/field/:field', ProfileController.getField);
router.post('/:id/fields', ProfileController.getFields);

export default router;
