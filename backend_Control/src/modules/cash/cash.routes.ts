import { Router } from 'express';

import {
  createCashClosureController,
  getCashClosuresController,
  getTodaySummaryController,
  patchCashClosureController,
} from './cash.controller';

export const cashRouter = Router();

cashRouter.get('/api/summary/today', getTodaySummaryController);
cashRouter.get('/api/cash-closures', getCashClosuresController);
cashRouter.post('/api/cash-closures', createCashClosureController);
cashRouter.patch('/api/cash-closures/:id', patchCashClosureController);
