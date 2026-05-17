import { Router } from 'express';

import { listStockMovements } from './stock.controller';

export const stockRouter = Router();

stockRouter.get('/api/stock-movements', listStockMovements);
