import { userError } from '../../utils/http';
import {
  getNotificationById,
  listNotifications,
  markAllNotificationsReadForShop,
  markNotificationReadById,
  type NotificationType,
} from './notifications.repository';

export async function getNotificationsForShop(shopId: string, limit = 30) {
  return listNotifications(shopId, limit);
}

export async function markNotificationRead(shopId: string, notificationId: string) {
  const notification = await getNotificationById(notificationId);

  if (!notification) {
    throw userError('Notification introuvable.', 404, 'NOTIFICATION_NOT_FOUND');
  }

  if (notification.shopId !== shopId) {
    throw userError('Acces non autorise.', 403, 'NOTIFICATION_ACCESS_DENIED');
  }

  return markNotificationReadById(notificationId);
}

export async function markAllNotificationsRead(shopId: string) {
  await markAllNotificationsReadForShop(shopId);
}

export { type NotificationType };
