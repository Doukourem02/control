import type { NextFunction, Request, Response } from 'express';

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
) {
  const message = error instanceof Error ? error.message : 'Erreur backend inconnue.';

  response.status(400).json({ message });
}
