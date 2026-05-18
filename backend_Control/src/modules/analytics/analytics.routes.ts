import { Router } from 'express';
import { handleGetAnalytics } from './analytics.controller';

export const analyticsRouter = Router();

analyticsRouter.get('/api/analytics', handleGetAnalytics);
