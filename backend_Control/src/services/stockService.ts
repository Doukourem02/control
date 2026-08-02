import { Query } from 'node-appwrite';
import { COLLECTIONS, DATABASE_ID, databases } from '../config/appwrite';
import type { StockMovementRow } from '../types/control';

function toStockMovementRow(doc: any): StockMovementRow {
  return {
    $id: doc.$id,
    $createdAt: doc.$createdAt,
    $updatedAt: doc.$updatedAt,
    shopId: doc['shopId'] as string,
    productId: doc['productId'] as string,
    productName: doc['productName'] as string,
    type: doc['type'] as StockMovementRow['type'],
    quantity: doc['quantity'] as number,
    unit: doc['unit'] as StockMovementRow['unit'],
    unitCost: doc['unitCost'] as number,
    totalCost: doc['totalCost'] as number,
    note: doc['note'] as string,
    supplier: (doc['supplier'] ?? '') as string,
  };
}

export async function listStockMovementsByShop(
  shopId: string,
  limit: number,
  type?: string,
  from?: Date,
  to?: Date,
  productId?: string
): Promise<StockMovementRow[]> {
  const filters = [
    Query.equal('shopId', shopId),
  ];

  if (type) {
    filters.push(Query.equal('type', type));
  }

  if (productId) {
    filters.push(Query.equal('productId', productId));
  }

  if (from) {
    filters.push(Query.greaterThanEqual('$createdAt', from.toISOString()));
  }

  if (to) {
    filters.push(Query.lessThanEqual('$createdAt', to.toISOString()));
  }

  filters.push(Query.orderDesc('$createdAt'), Query.limit(limit));

  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.stockMovements, filters);

  return response.documents.map(toStockMovementRow);
}

function getBusinessDateRange(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  const value = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const key = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  const from = new Date(`${key}T00:00:00`);
  const to = new Date(`${key}T23:59:59.999`);

  return { from, to };
}

export async function getStockMovements(
  shopId: string,
  rawLimit: unknown,
  type?: unknown,
  date?: unknown,
  productId?: unknown
) {
  const limit = Math.max(1, Math.min(50, Number(rawLimit ?? 8)));
  const movementType = typeof type === 'string' ? type : undefined;
  const productFilter = typeof productId === 'string' && productId.trim() ? productId.trim() : undefined;

  if (typeof date === 'string' && date.trim()) {
    const { from, to } = getBusinessDateRange(date);
    return listStockMovementsByShop(shopId, limit, movementType, from, to, productFilter);
  }

  return listStockMovementsByShop(shopId, limit, movementType, undefined, undefined, productFilter);
}
