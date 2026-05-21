import type { Request, Response } from 'express';

export class HttpError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function getShopId(request: Request) {
  if (!request.auth?.shopId) {
    throw new HttpError('Boutique active introuvable.', 401);
  }

  return request.auth.shopId;
}

export function parseAmount(value: unknown) {
  const parsed = typeof value === 'string' ? Number(value.replace(',', '.').trim()) : Number(value);

  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function sendError(response: Response, status: number, message: string) {
  return response.status(status).json({ message });
}
