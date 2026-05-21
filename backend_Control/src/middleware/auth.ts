import type { NextFunction, Request, Response } from 'express';

import { createSessionAccount } from '../config/appwrite';
import { getOrCreateCurrentShop } from '../modules/shops/shops.service';
import { sendError } from '../utils/http';

function getBearerToken(request: Request) {
  const header = request.headers.authorization ?? '';

  if (!header.startsWith('Bearer ')) {
    return '';
  }

  return header.slice('Bearer '.length).trim();
}

export async function requireAuth(request: Request, response: Response, next: NextFunction) {
  const sessionSecret = getBearerToken(request);

  if (!sessionSecret) {
    sendError(response, 401, 'Connecte-toi pour continuer.', 'AUTH_REQUIRED');
    return;
  }

  try {
    const account = createSessionAccount(sessionSecret);
    const user = await account.get();
    const shop = await getOrCreateCurrentShop(user.$id, user.name || user.email);

    request.auth = {
      userId: user.$id,
      email: user.email,
      name: user.name,
      shopId: shop.$id,
      sessionSecret,
    };

    next();
  } catch {
    sendError(response, 401, 'Session expiree ou invalide.', 'AUTH_SESSION_EXPIRED');
  }
}
