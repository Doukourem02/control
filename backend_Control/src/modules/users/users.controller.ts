import type { Request, Response } from 'express';

import {
  confirmPasswordRecovery,
  createOAuthSession,
  defineAccountRole,
  getCurrentUser,
  getOAuthUrl,
  loginUser,
  logoutUser,
  registerUser,
  requestPasswordRecovery,
  verifySellerInvite,
} from './users.service';
import { sendError } from '../../utils/http';

function getBearerToken(request: Request) {
  const header = request.headers.authorization ?? '';

  if (!header.startsWith('Bearer ')) {
    return '';
  }

  return header.slice('Bearer '.length).trim();
}

export async function register(request: Request, response: Response) {
  const session = await registerUser(request.body);
  response.status(201).json(session);
}

export async function verifyInvite(request: Request, response: Response) {
  const result = await verifySellerInvite(request.body);
  response.json(result);
}

export async function login(request: Request, response: Response) {
  const session = await loginUser(request.body);
  response.json(session);
}

export async function me(request: Request, response: Response) {
  const sessionSecret = getBearerToken(request);

  if (!sessionSecret) {
    sendError(response, 401, 'Session requise.', 'AUTH_REQUIRED');
    return;
  }

  const session = await getCurrentUser(sessionSecret);
  response.json(session);
}

export async function role(request: Request, response: Response) {
  const sessionSecret = getBearerToken(request);

  if (!sessionSecret) {
    sendError(response, 401, 'Session requise.', 'AUTH_REQUIRED');
    return;
  }

  const session = await defineAccountRole(sessionSecret, request.body);
  response.json(session);
}

export async function logout(request: Request, response: Response) {
  const sessionSecret = getBearerToken(request);

  if (sessionSecret) {
    await logoutUser(sessionSecret);
  }

  response.json({ ok: true });
}

export async function recoverPassword(request: Request, response: Response) {
  const result = await requestPasswordRecovery(request.body);
  response.json(result);
}

export async function resetPassword(request: Request, response: Response) {
  const result = await confirmPasswordRecovery(request.body);
  response.json(result);
}

export async function oauthUrl(request: Request, response: Response) {
  const provider = String(request.params.provider ?? '').toLowerCase();
  const successUrl = String(request.query.success ?? '');
  const failureUrl = String(request.query.failure ?? '');
  const result = await getOAuthUrl(provider, successUrl, failureUrl);
  response.json(result);
}

export async function oauthSession(request: Request, response: Response) {
  const session = await createOAuthSession(request.body);
  response.json(session);
}
