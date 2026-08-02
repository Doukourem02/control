import type { Request, Response } from 'express';

export function healthController(_request: Request, response: Response) {
  return response.status(200).json({
    ok: true,
    service: 'control-backend',
    timestamp: new Date().toISOString(),
  });
}
