import { missingReasons, type MissingReason } from '../../types/control';
import { parseAmount, userError } from '../../utils/http';
import { createMissingRecord, listMissingsInRange, listRecentMissingsByShop } from './missing.repository';

function isMissingReason(value: unknown): value is MissingReason {
  return typeof value === 'string' && missingReasons.includes(value as MissingReason);
}

function getBusinessDateRange(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  const value = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const key = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  const from = new Date(`${key}T00:00:00`);
  const to = new Date(`${key}T23:59:59.999`);

  return { from, to };
}

export async function createMissing(body: Record<string, unknown>, shopId: string) {
  const productId = String(body.productId ?? '');
  const quantity = parseAmount(body.quantity);
  const reason = body.reason;
  const note = String(body.note ?? '').trim();

  if (!productId) {
    throw userError('Selectionne un produit.', 400, 'PRODUCT_REQUIRED');
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw userError('La quantite doit etre superieure a 0.', 400, 'QUANTITY_INVALID');
  }

  if (!isMissingReason(reason)) {
    throw userError('Selectionne une raison valide.', 400, 'MISSING_REASON_INVALID');
  }

  return createMissingRecord({ shopId, productId, quantity, reason, note });
}

export async function getMissings(shopId: string, rawLimit: unknown, date?: unknown) {
  const limit = Math.max(1, Math.min(50, Number(rawLimit ?? 10)));

  if (typeof date === 'string' && date.trim()) {
    const { from, to } = getBusinessDateRange(date);
    return listMissingsInRange(shopId, from, to);
  }

  return listRecentMissingsByShop(shopId, limit);
}
