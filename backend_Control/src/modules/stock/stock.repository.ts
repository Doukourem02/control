import { readStore } from '../../database/control-store';

export async function listStockMovementsByShop(shopId: string, limit: number, type?: string) {
  const store = await readStore();

  return store.stockMovements
    .filter((movement) => movement.shopId === shopId && (!type || movement.type === type))
    .sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime())
    .slice(0, limit);
}
