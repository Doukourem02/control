import type { Request, Response } from 'express';

import { getShopLogo, updateCurrentShop } from '../services/shopsService';
import { getShopById } from '../services/shopsService';
import { getShopId, sendError } from '../utils/http';

export async function getCurrentShop(request: Request, response: Response) {
  if (!request.auth) {
    sendError(response, 401, 'Session requise.', 'AUTH_REQUIRED');
    return;
  }

  const shop = await getShopById(getShopId(request));

  if (!shop) {
    sendError(response, 404, 'Boutique introuvable.', 'SHOP_NOT_FOUND');
    return;
  }

  response.json({ shop });
}

export async function updateCurrentShopSettings(request: Request, response: Response) {
  if (!request.auth) {
    sendError(response, 401, 'Session requise.', 'AUTH_REQUIRED');
    return;
  }

  const shop = await updateCurrentShop(getShopId(request), request.body);

  response.json({ shop });
}

export async function getShopLogoController(request: Request, response: Response) {
  const shopId = getShopId(request);
  const file = await getShopLogo(shopId);

  response.setHeader('Content-Type', file.mimeType);
  response.end(Buffer.from(file.bytes));
}
