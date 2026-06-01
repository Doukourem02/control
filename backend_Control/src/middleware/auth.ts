import type { NextFunction, Request, Response } from 'express';
import { AppwriteException } from 'node-appwrite';

import { createSessionAccount } from '../config/appwrite';
import { getShopById } from '../modules/shops/shops.repository';
import { getOrCreateCurrentShop } from '../modules/shops/shops.service';
import { getActiveMemberByUserId } from '../modules/team/team.repository';
import { getUserProfileByUserId } from '../modules/users/users.repository';
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
    let shopId = '';

    try {
      const [profile, membership] = await Promise.all([
        getUserProfileByUserId(user.$id),
        getActiveMemberByUserId(user.$id),
      ]);

      if (profile?.accountRole === 'seller') {
        const sellerShopId = profile.shopId || membership?.shopId || '';
        const sellerShop = sellerShopId ? await getShopById(sellerShopId) : null;
        shopId = sellerShop?.$id ?? sellerShopId;
      } else {
        const shop = await getOrCreateCurrentShop(user.$id, user.name || user.email);
        shopId = shop.$id;
      }
    } catch (error) {
      next(error);
      return;
    }

    request.auth = {
      userId: user.$id,
      email: user.email,
      name: user.name,
      shopId,
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
