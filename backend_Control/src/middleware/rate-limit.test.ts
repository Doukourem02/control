import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request, Response } from 'express';

import { clearRateLimitBucketsForTests, createRateLimiter } from './rate-limit';

function mockResponse() {
  const headers = new Map<string, string>();
  const response = {
    statusCode: 200,
    payload: undefined as unknown,
    setHeader(name: string, value: string) {
      headers.set(name, value);
      return response;
    },
    status(code: number) {
      response.statusCode = code;
      return response;
    },
    json(payload: unknown) {
      response.payload = payload;
      return response;
    },
    headers,
  };

  return response;
}

function mockRequest(ip: string) {
  return {
    ip,
    socket: { remoteAddress: ip },
  } as Request;
}

describe('createRateLimiter', () => {
  it('lets requests through until the configured limit is exceeded', () => {
    clearRateLimitBucketsForTests();
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 2 });
    let nextCalls = 0;

    const first = mockResponse();
    limiter(mockRequest('127.0.0.1'), first as unknown as Response, () => {
      nextCalls += 1;
    });

    const second = mockResponse();
    limiter(mockRequest('127.0.0.1'), second as unknown as Response, () => {
      nextCalls += 1;
    });

    const third = mockResponse();
    limiter(mockRequest('127.0.0.1'), third as unknown as Response, () => {
      nextCalls += 1;
    });

    assert.equal(nextCalls, 2);
    assert.equal(third.statusCode, 429);
    assert.equal((third.payload as { error: { code: string } }).error.code, 'RATE_LIMITED');
    assert.equal(third.headers.get('X-RateLimit-Limit'), '2');
  });
});
