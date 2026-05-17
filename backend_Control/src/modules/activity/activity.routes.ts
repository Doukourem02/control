import { Router } from 'express';

import { getActivityLogsController } from './activity.controller';

export const activityRouter = Router();

activityRouter.get('/api/activity-logs', getActivityLogsController);
