import type { Request, Response } from 'express';

export function healthController(_req: Request, res: Response) {
  return res.status(200).json({
    ok: true,
    service: 'control-backend',
    timestamp: new Date().toISOString(),
  });
}
