import { listStockMovementsByShop } from './stock.repository';

export async function getStockMovements(shopId: string, rawLimit: unknown, type?: unknown) {
  const limit = Math.max(1, Math.min(50, Number(rawLimit ?? 8)));
  const movementType = typeof type === 'string' ? type : undefined;

  return listStockMovementsByShop(shopId, limit, movementType);
}
