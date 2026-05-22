import { Query } from 'node-appwrite';
import { COLLECTIONS, DATABASE_ID, databases } from '../../config/appwrite';
import type { StockMovementRow } from '../../types/control';

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
