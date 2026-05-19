import type { Request, Response } from 'express';

import { getShopId } from '../../utils/http';
import { createCashClosure, getCashClosures, getTodaySummary } from './cash.service';

export async function getTodaySummaryController(request: Request, response: Response) {
  const date = typeof request.query.date === 'string' ? request.query.date : undefined;
  const summary = await getTodaySummary(getShopId(request), date);

  response.json({ summary });
}

export async function createCashClosureController(request: Request, response: Response) {
  const closure = await createCashClosure(request.body, getShopId(request));

  response.status(201).json({ closure });
}

export async function getCashClosuresController(request: Request, response: Response) {
  const date = typeof request.query.date === 'string' ? request.query.date : undefined;
  const closures = await getCashClosures(getShopId(request), request.query.limit, date);

  response.json({ closures });
}
