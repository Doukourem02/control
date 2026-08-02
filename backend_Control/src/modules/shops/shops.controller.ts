import type { Request, Response } from 'express';

import { getOrCreateCurrentShop, getShopLogo, updateCurrentShop } from './shops.service';
import { getShopId, sendError } from '../../utils/http';

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

export async function getShopLogoController(request: Request, response: Response) {
  const shopId = getShopId(request);
  const file = await getShopLogo(shopId);

  response.setHeader('Content-Type', file.mimeType);
  response.end(Buffer.from(file.bytes));
}
