import { Router } from 'express';

import {
  login,
  logout,
  me,
  oauthSession,
  oauthUrl,
  recoverPassword,
  register,
  role,
  resetPassword,
  verifyInvite,
} from './users.controller';

export const usersRouter = Router();

usersRouter.post('/api/auth/register', register);
usersRouter.post('/api/auth/invite/verify', verifyInvite);
usersRouter.post('/api/auth/login', login);
usersRouter.get('/api/auth/me', me);
usersRouter.post('/api/auth/role', role);
usersRouter.post('/api/auth/logout', logout);
usersRouter.post('/api/auth/recovery/request', recoverPassword);
usersRouter.post('/api/auth/recovery/confirm', resetPassword);
usersRouter.get('/api/auth/oauth/:provider/url', oauthUrl);
usersRouter.post('/api/auth/oauth/session', oauthSession);
