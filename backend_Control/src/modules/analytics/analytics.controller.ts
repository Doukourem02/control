import type { Request, Response } from 'express';
import { getAnalytics } from './analytics.service';

export async function handleGetAnalytics(req: Request, res: Response) {
  const shopId = String(req.query.shopId ?? 'default-shop');
  const type = req.query.type === 'expenses' ? 'expenses' : 'sales';
  const days = Math.min(30, Math.max(1, Number(req.query.days ?? 7)));
  const date = typeof req.query.date === 'string' ? req.query.date : undefined;

  const analytics = await getAnalytics(shopId, type, days, date);
  res.json({ analytics });
}
