import type { Request, Response } from 'express';

import { getShopId } from '../utils/http';
import { getStockMovements } from '../services/stockService';

export async function listStockMovements(request: Request, response: Response) {
  const movements = await getStockMovements(
    getShopId(request),
    request.query.limit,
    request.query.type,
    request.query.date,
    request.query.productId
  );

  response.json({ movements });
}
