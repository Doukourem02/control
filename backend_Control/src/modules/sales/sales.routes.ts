import { Router } from 'express';

import { requireOperationalRole } from '../../middleware/roles';
import { createSaleController } from './sales.controller';

export const salesRouter = Router();

salesRouter.post('/api/sales', requireOperationalRole, createSaleController);
