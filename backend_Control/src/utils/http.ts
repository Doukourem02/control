import type { Request, Response } from 'express';

const defaultShopId = 'default-shop';

export function getShopId(request: Request) {
  const body = request.body as { shopId?: unknown } | undefined;

  return String(request.query.shopId || body?.shopId || defaultShopId);
}

export function parseAmount(value: unknown) {
  const parsed = typeof value === 'string' ? Number(value.replace(',', '.').trim()) : Number(value);

  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function sendError(response: Response, status: number, message: string) {
  return response.status(status).json({ message });
}
