import type { Request, Response } from 'express';

export type ErrorKind = 'user' | 'dev';

export class HttpError extends Error {
  public code: string;
  public kind: ErrorKind;
  public details?: unknown;

  constructor(
    message: string,
    public statusCode: number,
    code = 'REQUEST_FAILED',
    kind: ErrorKind = 'user',
    details?: unknown
  ) {
    super(message);
    this.name = 'HttpError';
    this.code = code;
    this.kind = kind;
    this.details = details;
  }
}

export function userError(message: string, statusCode = 400, code = 'VALIDATION_ERROR', details?: unknown) {
  return new HttpError(message, statusCode, code, 'user', details);
}

export function devError(message = 'Erreur technique CONTROL.', statusCode = 500, code = 'INTERNAL_ERROR', details?: unknown) {
  return new HttpError(message, statusCode, code, 'dev', details);
}

export function getShopId(request: Request) {
  if (!request.auth?.shopId) {
    throw userError('Boutique active introuvable.', 401, 'SHOP_REQUIRED');
  }

  return request.auth.shopId;
}

export function parseAmount(value: unknown) {
  const parsed = typeof value === 'string' ? Number(value.replace(',', '.').trim()) : Number(value);

  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function sendError(
  response: Response,
  status: number,
  message: string,
  code = 'REQUEST_FAILED',
  kind: ErrorKind = 'user'
) {
  return response.status(status).json({
    message,
    error: {
      type: kind,
      code,
      message,
    },
  });
}
