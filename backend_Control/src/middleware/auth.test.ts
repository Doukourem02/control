import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { beforeEach, describe, it, mock } from 'node:test';
import type { NextFunction, Request, Response } from 'express';
import { AppwriteException } from 'node-appwrite';

const req = createRequire(__filename);

const accountGet = mock.fn(async () => ({
  $id: 'user-1',
  email: 'owner@example.com',
  name: 'Owner',
}));
const createSessionAccount = mock.fn((_sessionSecret: string) => ({ get: accountGet }));
const getOrCreateCurrentShop = mock.fn(async () => ({
  $id: 'shop-1',
}));

req.cache[req.resolve('../config/appwrite')] = {
  exports: { createSessionAccount },
} as unknown as NodeJS.Module;

req.cache[req.resolve('../modules/shops/shops.service')] = {
  exports: { getOrCreateCurrentShop },
} as unknown as NodeJS.Module;

delete req.cache[req.resolve('./auth')];
const { requireAuth } = req('./auth') as typeof import('./auth');

function mockRequest(token = 'session-secret') {
  return {
    headers: {
      authorization: token ? `Bearer ${token}` : '',
    },
  } as Request;
}

function mockResponse() {
  const response = {
    statusCode: 200,
    payload: undefined as unknown,
    status(code: number) {
      response.statusCode = code;
      return response;
    },
    json(payload: unknown) {
      response.payload = payload;
      return response;
    },
  };

  return response;
}

beforeEach(() => {
  accountGet.mock.mockImplementation(async () => ({
    $id: 'user-1',
    email: 'owner@example.com',
    name: 'Owner',
  }));
  getOrCreateCurrentShop.mock.mockImplementation(async () => ({ $id: 'shop-1' }));
  createSessionAccount.mock.resetCalls();
  accountGet.mock.resetCalls();
  getOrCreateCurrentShop.mock.resetCalls();
});

describe('requireAuth', () => {
  it('returns AUTH_SESSION_EXPIRED when Appwrite rejects the session', async () => {
    accountGet.mock.mockImplementation(async () => {
      throw new AppwriteException('Invalid session', 401);
    });
    const response = mockResponse();
    let nextCalls = 0;

    await requireAuth(mockRequest(), response as unknown as Response, (() => {
      nextCalls += 1;
    }) as NextFunction);

    assert.equal(nextCalls, 0);
    assert.equal(response.statusCode, 401);
    assert.equal((response.payload as { error: { code: string } }).error.code, 'AUTH_SESSION_EXPIRED');
  });

  it('forwards shop provisioning failures to the error handler', async () => {
    const shopError = new Error('shops collection is missing');
    getOrCreateCurrentShop.mock.mockImplementation(async () => {
      throw shopError;
    });
    const response = mockResponse();
    let forwardedError: unknown;

    await requireAuth(mockRequest(), response as unknown as Response, ((error?: unknown) => {
      forwardedError = error;
    }) as NextFunction);

    assert.equal(response.statusCode, 200);
    assert.equal(forwardedError, shopError);
  });
});
