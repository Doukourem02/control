import { Router } from 'express';

import { requireOperationalRole } from '../middleware/roles';
import {
  createCashClosureController,
  getCashClosuresController,
  getTodaySummaryController,
  patchCashClosureController,
} from '../controllers/cashController';

export const cashRouter = Router();

cashRouter.get('/api/summary/today', getTodaySummaryController);
cashRouter.get('/api/cash-closures', getCashClosuresController);
cashRouter.post('/api/cash-closures', requireOperationalRole, createCashClosureController);
cashRouter.patch('/api/cash-closures/:id', requireOperationalRole, patchCashClosureController);
