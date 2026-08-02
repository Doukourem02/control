import type { NextFunction, Request, Response } from 'express';
import { AppwriteException } from 'node-appwrite';

import { createSessionAccount } from '../config/appwrite';
import { getShopById } from '../services/shopsService';
import { getActiveShopForOwner } from '../services/shopsService';
import { getActiveMemberByUserId } from '../services/teamService';
import { getUserProfileByUserId, type AccountRole } from '../services/usersService';
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
    let accountRole: AccountRole | null = null;

    try {
      const [profile, membership] = await Promise.all([
        getUserProfileByUserId(user.$id),
        getActiveMemberByUserId(user.$id),
      ]);

      accountRole = profile?.accountRole ?? null;

      // Le proprietaire cree/possede sa propre boutique ; tous les autres roles
      // (seller/manager/comptable) rejoignent une boutique via une invitation d'equipe.
      if (profile && profile.accountRole !== 'owner') {
        const memberShopId = profile.shopId || membership?.shopId || '';
        const memberShop = memberShopId ? await getShopById(memberShopId) : null;
        shopId = memberShop?.$id ?? memberShopId;
      } else {
        const shop = await getActiveShopForOwner(user.$id, profile?.shopId, user.name || user.email);
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
      accountRole,
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
