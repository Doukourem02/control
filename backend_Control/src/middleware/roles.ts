import type { NextFunction, Request, Response } from 'express';
import { sendError } from '../utils/http';

const READ_ONLY_ROLES = new Set(['comptable']);

/**
 * Le role comptable est en lecture seule sur les actions operationnelles
 * (ventes, depenses, stock, clotures, produits) : il consulte les chiffres,
 * il ne les produit pas.
 */
export function requireOperationalRole(request: Request, response: Response, next: NextFunction) {
  const role = request.auth?.accountRole;

  if (role && READ_ONLY_ROLES.has(role)) {
    sendError(response, 403, 'Le role comptable est en lecture seule sur cette action.', 'ROLE_READ_ONLY');
    return;
  }

  next();
}
