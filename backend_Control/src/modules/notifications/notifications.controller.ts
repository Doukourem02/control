import type { Request, Response } from 'express';

import { getShopId, sendError } from '../../utils/http';
import {
  getNotificationsForShop,
  markAllNotificationsRead,
  markNotificationRead,
} from './notifications.service';

export async function listNotificationsHandler(request: Request, response: Response) {
  if (!request.auth) {
    sendError(response, 401, 'Session requise.', 'AUTH_REQUIRED');
    return;
  }

  const shopId = getShopId(request);
  const rawLimit = Number(request.query['limit'] ?? 30);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 30;

  const notifications = await getNotificationsForShop(shopId, limit);

  response.json({ notifications });
}

export async function markNotificationReadHandler(request: Request, response: Response) {
  if (!request.auth) {
    sendError(response, 401, 'Session requise.', 'AUTH_REQUIRED');
    return;
  }

  const shopId = getShopId(request);
  const notificationId = String(request.params['id'] ?? '');

  if (!notificationId) {
    sendError(response, 400, 'Identifiant de notification manquant.', 'NOTIFICATION_ID_REQUIRED');
    return;
  }

  const notification = await markNotificationRead(shopId, notificationId);

  response.json({ notification });
}

export async function markAllNotificationsReadHandler(request: Request, response: Response) {
  if (!request.auth) {
    sendError(response, 401, 'Session requise.', 'AUTH_REQUIRED');
    return;
  }

  const shopId = getShopId(request);

  await markAllNotificationsRead(shopId);

  response.json({ success: true });
}
