import type { Request, Response } from 'express';

import { getShopId } from '../../utils/http';
import { getTodaySummary } from './cash.service';

export async function getTodaySummaryController(request: Request, response: Response) {
  const summary = await getTodaySummary(getShopId(request));

  response.json({ summary });
}
