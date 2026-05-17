import type { Request, Response } from 'express';

import { getShopId } from '../../utils/http';
import { listRecentActivityByShop } from './activity.repository';

export async function getActivityLogsController(request: Request, response: Response) {
  const limit = Math.max(1, Math.min(50, Number(request.query.limit ?? 20)));
  const logs = await listRecentActivityByShop(getShopId(request), limit);

  response.json({ logs });
}
