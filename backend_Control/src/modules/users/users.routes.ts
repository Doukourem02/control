import { Router } from 'express';

import { login, logout, me, oauthSession, oauthUrl, register } from './users.controller';

export const usersRouter = Router();

usersRouter.post('/api/auth/register', register);
usersRouter.post('/api/auth/login', login);
usersRouter.get('/api/auth/me', me);
usersRouter.post('/api/auth/logout', logout);
usersRouter.get('/api/auth/oauth/:provider/url', oauthUrl);
usersRouter.post('/api/auth/oauth/session', oauthSession);
