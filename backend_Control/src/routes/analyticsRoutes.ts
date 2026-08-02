import { Router } from 'express';
import { handleGetAnalytics } from '../controllers/analyticsController';

export const analyticsRouter = Router();

analyticsRouter.get('/api/analytics', handleGetAnalytics);
