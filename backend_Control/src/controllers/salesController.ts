import type { Request, Response } from 'express';

import { getShopId } from '../utils/http';
import { createSale } from '../services/salesService';

export async function createSaleController(request: Request, response: Response) {
  const sale = await createSale(request.body, getShopId(request));

  response.status(201).json({ sale });
}
