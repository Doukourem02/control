import type { Request, Response } from 'express';

import { createStoreForOwner, listStoresForOwner, switchActiveStore } from './organizations.service';

export async function listStoresHandler(request: Request, response: Response): Promise<void> {
  if (!request.auth) { response.status(401).json({ error: 'Non autorise.', code: 'AUTH_REQUIRED' }); return; }

  const stores = await listStoresForOwner(request.auth.userId, request.auth.name);
  response.json({ stores, activeShopId: request.auth.shopId });
}

export async function createStoreHandler(request: Request, response: Response): Promise<void> {
  if (!request.auth) { response.status(401).json({ error: 'Non autorise.', code: 'AUTH_REQUIRED' }); return; }

  if (request.auth.accountRole !== 'owner') {
    response.status(403).json({ error: 'Seul le proprietaire peut creer une boutique.', code: 'ORG_OWNER_ONLY' });
    return;
  }

  const store = await createStoreForOwner(request.auth.userId, request.auth.name, request.body as Record<string, unknown>);
  response.status(201).json({ store });
}

export async function activateStoreHandler(request: Request, response: Response): Promise<void> {
  if (!request.auth) { response.status(401).json({ error: 'Non autorise.', code: 'AUTH_REQUIRED' }); return; }

  if (request.auth.accountRole !== 'owner') {
    response.status(403).json({ error: 'Seul le proprietaire peut changer de boutique active.', code: 'ORG_OWNER_ONLY' });
    return;
  }

  const shopId = String(request.params['shopId'] ?? '');
  const shop = await switchActiveStore(request.auth.userId, shopId);
  response.json({ shop });
}
