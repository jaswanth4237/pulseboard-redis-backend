import { Router } from 'express';
import authRoutes from './authRoutes.js';
import feedRoutes from './feedRoutes.js';
import presenceRoutes from './presenceRoutes.js';
import workspaceRoutes from './workspaceRoutes.js';
import profileRoutes from './profileRoutes.js';
import messageRoutes from './messageRoutes.js';
import streamRoutes from './streamRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import lockRoutes from './lockRoutes.js';
import attendanceRoutes from './attendanceRoutes.js';
import geoRoutes from './geoRoutes.js';
import queueRoutes from './queueRoutes.js';

import { rateLimiterMiddleware } from '../middleware/rateLimiter.js';

const router = Router();

// Apply global API rate limiter middleware
router.use(rateLimiterMiddleware());

// Health Check Endpoint
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Modular Routes
router.use('/auth', authRoutes);
router.use('/feed', feedRoutes);
router.use('/presence', presenceRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/users', profileRoutes);
router.use('/', messageRoutes);
router.use('/', streamRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/', lockRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/geo', geoRoutes);
router.use('/', queueRoutes);

export default router;
