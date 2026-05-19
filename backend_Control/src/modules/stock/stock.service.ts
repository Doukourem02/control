import { listStockMovementsByShop } from './stock.repository';

function getBusinessDateRange(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  const value = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const key = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  const from = new Date(`${key}T00:00:00`);
  const to = new Date(`${key}T23:59:59.999`);

  return { from, to };
}

export async function getStockMovements(shopId: string, rawLimit: unknown, type?: unknown, date?: unknown) {
  const limit = Math.max(1, Math.min(50, Number(rawLimit ?? 8)));
  const movementType = typeof type === 'string' ? type : undefined;

  if (typeof date === 'string' && date.trim()) {
    const { from, to } = getBusinessDateRange(date);
    return listStockMovementsByShop(shopId, limit, movementType, from, to);
  }

  return listStockMovementsByShop(shopId, limit, movementType);
}
