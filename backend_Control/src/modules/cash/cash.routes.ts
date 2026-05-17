import { Router } from 'express';

import { getTodaySummaryController } from './cash.controller';

export const cashRouter = Router();

cashRouter.get('/api/summary/today', getTodaySummaryController);
