import { missingReasons, type MissingReason } from '../../types/control';
import { parseAmount } from '../../utils/http';
import { createMissingRecord, listRecentMissingsByShop } from './missing.repository';

function isMissingReason(value: unknown): value is MissingReason {
  return typeof value === 'string' && missingReasons.includes(value as MissingReason);
}

export async function createMissing(body: Record<string, unknown>, shopId: string) {
  const productId = String(body.productId ?? '');
  const quantity = parseAmount(body.quantity);
  const reason = body.reason;
  const note = String(body.note ?? '').trim();

  if (!productId) {
    throw new Error('Selectionne un produit.');
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error('La quantite doit etre superieure a 0.');
  }

  if (!isMissingReason(reason)) {
    throw new Error('Selectionne une raison valide.');
  }

  return createMissingRecord({ shopId, productId, quantity, reason, note });
}

export async function getMissings(shopId: string, rawLimit: unknown) {
  const limit = Math.max(1, Math.min(50, Number(rawLimit ?? 10)));

  return listRecentMissingsByShop(shopId, limit);
}
