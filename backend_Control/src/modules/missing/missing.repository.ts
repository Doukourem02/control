import { createId, nowIso, readStore, updateStore } from '../../database/control-store';
import type { MissingReason } from '../../types/control';
import { isToday } from '../../utils/dates';

export type CreateMissingInput = {
  shopId: string;
  productId: string;
  quantity: number;
  reason: MissingReason;
  note: string;
};

export async function createMissingRecord(input: CreateMissingInput) {
  return updateStore((store) => {
    const product = store.products.find(
      (p) => p.$id === input.productId && p.shopId === input.shopId
    );

    if (!product) {
      throw new Error('Produit introuvable.');
    }

    if (input.quantity > product.quantity) {
      throw new Error('Stock insuffisant pour declarer ce manquant.');
    }

    const timestamp = nowIso();

    product.quantity -= input.quantity;
    product.$updatedAt = timestamp;

    const missing = {
      $id: createId(),
      $createdAt: timestamp,
      $updatedAt: timestamp,
      shopId: input.shopId,
      productId: product.$id,
      productName: product.name,
      quantity: input.quantity,
      unit: product.unit,
      reason: input.reason,
      note: input.note,
    };

    store.missings.push(missing);
    store.stockMovements.push({
      $id: createId(),
      $createdAt: timestamp,
      $updatedAt: timestamp,
      shopId: input.shopId,
      productId: product.$id,
      productName: product.name,
      type: 'missing',
      quantity: input.quantity,
      unit: product.unit,
      unitCost: product.purchaseUnitPrice,
      totalCost: Math.round(input.quantity * product.purchaseUnitPrice),
      note: input.reason,
    });
    store.activityLogs.push({
      $id: createId(),
      $createdAt: timestamp,
      $updatedAt: timestamp,
      shopId: input.shopId,
      type: 'missing',
      actorName: 'Vendeuse',
      message: `Manquant : ${product.name} (${input.reason})`,
    });

    return missing;
  });
}

export async function listRecentMissingsByShop(shopId: string, limit: number) {
  const store = await readStore();

  return store.missings
    .filter((m) => m.shopId === shopId)
    .sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime())
    .slice(0, limit);
}

export async function listTodayMissingsByShop(shopId: string) {
  const store = await readStore();

  return store.missings.filter((m) => m.shopId === shopId && isToday(m.$createdAt));
}
