import type { Request, Response } from 'express';

import { getShopId } from '../../utils/http';
import { createMissing, getMissings } from './missing.service';

export async function getMissingsController(request: Request, response: Response) {
  const missings = await getMissings(getShopId(request), request.query.limit, request.query.date);

  response.json({ missings });
}

export async function createMissingController(request: Request, response: Response) {
  const missing = await createMissing(request.body, getShopId(request));

  response.status(201).json({ missing });
}
