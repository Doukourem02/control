import { Router } from 'express';

import {
  createCashClosureController,
  getCashClosuresController,
  getTodaySummaryController,
} from './cash.controller';

export const cashRouter = Router();

cashRouter.get('/api/summary/today', getTodaySummaryController);
cashRouter.get('/api/cash-closures', getCashClosuresController);
cashRouter.post('/api/cash-closures', createCashClosureController);
