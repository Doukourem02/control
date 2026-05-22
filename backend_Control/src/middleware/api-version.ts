import type { NextFunction, Request, Response } from 'express';

export function apiVersionAlias(request: Request, _response: Response, next: NextFunction) {
  if (request.url === '/api/v1') {
    request.url = '/api';
  } else if (request.url.startsWith('/api/v1/')) {
    request.url = `/api/${request.url.slice('/api/v1/'.length)}`;
  }

  next();
}
