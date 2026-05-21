import { Router } from 'express';

import {
  listNotificationsHandler,
  markAllNotificationsReadHandler,
  markNotificationReadHandler,
} from './notifications.controller';

export const notificationsRouter = Router();

notificationsRouter.get('/api/notifications', listNotificationsHandler);
notificationsRouter.patch('/api/notifications/read-all', markAllNotificationsReadHandler);
notificationsRouter.patch('/api/notifications/:id/read', markNotificationReadHandler);
