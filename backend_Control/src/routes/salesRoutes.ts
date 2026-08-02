import { Router } from 'express';

import { requireOperationalRole } from '../middleware/roles';
import { createSaleController } from '../controllers/salesController';

export const salesRouter = Router();

salesRouter.post('/api/sales', requireOperationalRole, createSaleController);
