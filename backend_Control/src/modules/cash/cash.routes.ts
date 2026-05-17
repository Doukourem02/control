import { Router } from 'express';

import { createCashClosureController, getTodaySummaryController } from './cash.controller';

export const cashRouter = Router();

cashRouter.get('/api/summary/today', getTodaySummaryController);
cashRouter.post('/api/cash-closures', createCashClosureController);
