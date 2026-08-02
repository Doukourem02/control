import type { NextFunction, Request, Response } from 'express';

import { sendError } from '../utils/http';

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 120;

function readPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function createRateLimiter({
  windowMs = readPositiveInteger(process.env.RATE_LIMIT_WINDOW_MS, DEFAULT_WINDOW_MS),
  maxRequests = readPositiveInteger(process.env.RATE_LIMIT_MAX_REQUESTS, DEFAULT_MAX_REQUESTS),
} = {}) {
  return function rateLimit(request: Request, response: Response, next: NextFunction) {
    const now = Date.now();
    const key = request.ip || request.socket.remoteAddress || 'unknown';
    const existing = buckets.get(key);
    const bucket = existing && existing.resetAt > now
      ? existing
      : { count: 0, resetAt: now + windowMs };

    bucket.count += 1;
    buckets.set(key, bucket);

    response.setHeader('X-RateLimit-Limit', String(maxRequests));
    response.setHeader('X-RateLimit-Remaining', String(Math.max(0, maxRequests - bucket.count)));
    response.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > maxRequests) {
      sendError(
        response,
        429,
        'Trop de requetes. Reessaie dans un instant.',
        'RATE_LIMITED'
      );
      return;
    }

    next();
  };
}

export function clearRateLimitBucketsForTests() {
  buckets.clear();
}
