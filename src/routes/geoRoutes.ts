import { Router } from 'express';
import { GeoController } from '../controllers/geoController.js';

const router = Router();

router.post('/location', GeoController.updateLocation);
router.get('/nearby', GeoController.findNearby);

export default router;
