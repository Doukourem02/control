import { AppwriteException, ID, Query } from 'node-appwrite';
import { COLLECTIONS, DATABASE_ID, databases } from '../config/appwrite';
import { userError } from '../utils/http';

export type NotificationType =
  | 'stock_low'
  | 'closure_reminder'
  | 'cash_gap'
  | 'stock_anomaly'
  | 'suspicious_sale'
  | 'activity_drop';

export type NotificationRow = {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  shopId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: string;
};

function toNotificationRow(doc: any): NotificationRow {
  return {
    $id: doc.$id,
    $createdAt: doc.$createdAt,
    $updatedAt: doc.$updatedAt,
    shopId: doc.shopId,
    type: doc.type,
    title: doc.title,
    message: doc.message,
    read: doc.read ?? 'false',
  };
}

function isNotFound(error: unknown) {
  return error instanceof AppwriteException && error.code === 404;
}

export async function listNotifications(shopId: string, limit = 30): Promise<NotificationRow[]> {
  const result = await databases.listDocuments(DATABASE_ID, COLLECTIONS.notifications, [
    Query.equal('shopId', shopId),
    Query.orderDesc('$createdAt'),
    Query.limit(limit),
  ]);
  return result.documents.map(toNotificationRow);
}

export async function createNotification(
  shopId: string,
  type: NotificationType,
  title: string,
  message: string
): Promise<NotificationRow> {
  const doc = await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.notifications,
    ID.unique(),
    { shopId, type, title, message, read: 'false' }
  );
  return toNotificationRow(doc);
}

export async function getNotificationById(id: string): Promise<NotificationRow | null> {
  try {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.notifications, id);
    return toNotificationRow(doc);
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

export async function markNotificationReadById(id: string): Promise<NotificationRow> {
  const doc = await databases.updateDocument(DATABASE_ID, COLLECTIONS.notifications, id, {
    read: 'true',
  });
  return toNotificationRow(doc);
}

export async function markAllNotificationsReadForShop(shopId: string): Promise<void> {
  const unread = await databases.listDocuments(DATABASE_ID, COLLECTIONS.notifications, [
    Query.equal('shopId', shopId),
    Query.equal('read', 'false'),
    Query.limit(100),
  ]);

  await Promise.all(
    unread.documents.map((doc) =>
      databases.updateDocument(DATABASE_ID, COLLECTIONS.notifications, doc.$id, { read: 'true' })
    )
  );
}

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
