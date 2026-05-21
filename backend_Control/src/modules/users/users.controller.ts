import type { Request, Response } from 'express';

import { createOAuthSession, getCurrentUser, getOAuthUrl, loginUser, logoutUser, registerUser } from './users.service';

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

export async function login(request: Request, response: Response) {
  const session = await loginUser(request.body);
  response.json(session);
}

export async function me(request: Request, response: Response) {
  const sessionSecret = getBearerToken(request);

  if (!sessionSecret) {
    response.status(401).json({ message: 'Session requise.' });
    return;
  }

  const session = await getCurrentUser(sessionSecret);
  response.json(session);
}

export async function logout(request: Request, response: Response) {
  const sessionSecret = getBearerToken(request);

  if (sessionSecret) {
    await logoutUser(sessionSecret);
  }

  response.json({ ok: true });
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
