import { Router } from 'express';

import { createSaleController } from './sales.controller';

export const salesRouter = Router();

salesRouter.post('/api/sales', createSaleController);
