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
const getActiveShopForOwner = mock.fn(async () => ({
  $id: 'shop-1',
}));
const getUserProfileByUserId = mock.fn(async () => null as { accountRole: string; shopId: string } | null);
const getActiveMemberByUserId = mock.fn(async () => null as { shopId: string } | null);

req.cache[req.resolve('../../src/config/appwrite')] = {
  exports: { createSessionAccount },
} as unknown as NodeJS.Module;

req.cache[req.resolve('../../src/services/shopsService')] = {
  exports: { getActiveShopForOwner },
} as unknown as NodeJS.Module;

req.cache[req.resolve('../../src/services/usersService')] = {
  exports: { getUserProfileByUserId },
} as unknown as NodeJS.Module;

req.cache[req.resolve('../../src/services/teamService')] = {
  exports: { getActiveMemberByUserId },
} as unknown as NodeJS.Module;

delete req.cache[req.resolve('../../src/middleware/auth')];
const { requireAuth } = req('../../src/middleware/auth') as typeof import('../../src/middleware/auth');

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
  getActiveShopForOwner.mock.mockImplementation(async () => ({ $id: 'shop-1' }));
  getUserProfileByUserId.mock.mockImplementation(async () => null);
  getActiveMemberByUserId.mock.mockImplementation(async () => null);
  createSessionAccount.mock.resetCalls();
  accountGet.mock.resetCalls();
  getActiveShopForOwner.mock.resetCalls();
  getUserProfileByUserId.mock.resetCalls();
  getActiveMemberByUserId.mock.resetCalls();
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
    getActiveShopForOwner.mock.mockImplementation(async () => {
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

  it('resolves the owner active store via profile.shopId (multi-boutique)', async () => {
    getUserProfileByUserId.mock.mockImplementation(async () => ({
      accountRole: 'owner',
      shopId: 'shop-2',
    }));
    getActiveShopForOwner.mock.mockImplementation(async () => ({ $id: 'shop-2' }));

    const request = mockRequest();
    const response = mockResponse();
    let nextCalls = 0;

    await requireAuth(request, response as unknown as Response, (() => {
      nextCalls += 1;
    }) as NextFunction);

    assert.equal(nextCalls, 1);
    assert.equal(request.auth?.shopId, 'shop-2');
    assert.equal(request.auth?.accountRole, 'owner');
    assert.equal(getActiveShopForOwner.mock.calls.length, 1);
    assert.deepEqual(getActiveShopForOwner.mock.calls[0].arguments, ['user-1', 'shop-2', 'Owner']);
  });
});
