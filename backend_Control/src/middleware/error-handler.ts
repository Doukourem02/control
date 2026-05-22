import type { NextFunction, Request, Response } from 'express';

import { HttpError } from '../utils/http';
import { logger } from '../utils/logger';

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
) {
  const isHttpError = error instanceof HttpError;
  const statusCode = isHttpError ? error.statusCode : 500;
  const type = isHttpError ? error.kind : 'dev';
  const code = isHttpError ? error.code : 'INTERNAL_ERROR';
  const message =
    isHttpError && error.kind === 'user'
      ? error.message
      : 'Un probleme technique est survenu. Reessaie dans un instant.';

  if (!isHttpError || error.kind === 'dev') {
    logger.error('CONTROL_API_ERROR', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      path: _request.path,
      method: _request.method,
    });
  }

  response.status(statusCode).json({
    message,
    error: {
      type,
      code,
      message,
    },
  });
}
