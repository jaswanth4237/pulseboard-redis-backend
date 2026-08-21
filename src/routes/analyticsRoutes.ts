import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController.js';

const router = Router();

router.get('/trending', AnalyticsController.getTrendingChannels);
router.post('/channels/:id/activity', AnalyticsController.recordChannelActivity);
router.post('/users/:id/reputation', AnalyticsController.recordUserReputation);
router.get('/reputation', AnalyticsController.getTopReputationUsers);
router.post('/dau/record', AnalyticsController.recordDAU);
router.get('/dau/:date', AnalyticsController.getDAU);

export default router;
