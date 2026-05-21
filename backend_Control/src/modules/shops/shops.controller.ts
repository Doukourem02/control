import type { Request, Response } from 'express';

import { getOrCreateCurrentShop, updateCurrentShop } from './shops.service';
import { sendError } from '../../utils/http';

export async function getCurrentShop(request: Request, response: Response) {
  if (!request.auth) {
    sendError(response, 401, 'Session requise.', 'AUTH_REQUIRED');
    return;
  }

  const shop = await getOrCreateCurrentShop(request.auth.userId, request.auth.name);

  response.json({ shop });
}

export async function updateCurrentShopSettings(request: Request, response: Response) {
  if (!request.auth) {
    sendError(response, 401, 'Session requise.', 'AUTH_REQUIRED');
    return;
  }

  const shop = await updateCurrentShop(request.auth.userId, request.body);

  response.json({ shop });
}
