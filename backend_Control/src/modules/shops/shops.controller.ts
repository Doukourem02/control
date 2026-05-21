import type { Request, Response } from 'express';

import { getOrCreateCurrentShop, updateCurrentShop } from './shops.service';

export async function getCurrentShop(request: Request, response: Response) {
  if (!request.auth) {
    response.status(401).json({ message: 'Session requise.' });
    return;
  }

  const shop = await getOrCreateCurrentShop(request.auth.userId, request.auth.name);

  response.json({ shop });
}

export async function updateCurrentShopSettings(request: Request, response: Response) {
  if (!request.auth) {
    response.status(401).json({ message: 'Session requise.' });
    return;
  }

  const shop = await updateCurrentShop(request.auth.userId, request.body);

  response.json({ shop });
}
