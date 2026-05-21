import type { NextFunction, Request, Response } from 'express';

import { HttpError } from '../utils/http';

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
) {
  const message = error instanceof Error ? error.message : 'Erreur backend inconnue.';
  const statusCode = error instanceof HttpError ? error.statusCode : 400;

  response.status(statusCode).json({ message });
}
