import type { NextFunction, Request, Response } from 'express';
import { AppwriteException } from 'node-appwrite';

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

function isSessionAuthError(error: unknown) {
  return error instanceof AppwriteException && (error.code === 401 || error.code === 403);
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
    let shop;

    try {
      shop = await getOrCreateCurrentShop(user.$id, user.name || user.email);
    } catch (error) {
      next(error);
      return;
    }

    request.auth = {
      userId: user.$id,
      email: user.email,
      name: user.name,
      shopId: shop.$id,
      sessionSecret,
    };

    next();
  } catch (error) {
    if (!isSessionAuthError(error)) {
      next(error);
      return;
    }

    sendError(response, 401, 'Session expiree ou invalide.', 'AUTH_SESSION_EXPIRED');
  }
}
