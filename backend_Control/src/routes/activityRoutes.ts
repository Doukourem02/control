import { Router } from 'express';

import { getActivityLogsController } from '../controllers/activityController';

export const activityRouter = Router();

activityRouter.get('/api/activity-logs', getActivityLogsController);
