import { Router } from 'express';

import { listStockMovements } from '../controllers/stockController';

export const stockRouter = Router();

stockRouter.get('/api/stock-movements', listStockMovements);
