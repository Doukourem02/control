import { AppwriteException, ID, Query, type Models } from 'node-appwrite';
import { COLLECTIONS, DATABASE_ID, databases } from '../../config/appwrite';
import type { MissingReason, MissingRow } from '../../types/control';
import { userError } from '../../utils/http';
import { triggerStockLowAlert } from '../notifications/notifications.triggers';

export type CreateMissingInput = {
  shopId: string;
  productId: string;
  quantity: number;
  reason: MissingReason;
  note: string;
};

function toMissingRow(doc: any): MissingRow {
  return {
    $id: doc.$id,
    $createdAt: doc.$createdAt,
    $updatedAt: doc.$updatedAt,
    shopId: doc['shopId'] as string,
    productId: doc['productId'] as string,
    productName: doc['productName'] as string,
    quantity: doc['quantity'] as number,
    unit: doc['unit'] as MissingRow['unit'],
    reason: doc['reason'] as MissingReason,
    note: doc['note'] as string,
  };
}

export async function createMissingRecord(input: CreateMissingInput): Promise<MissingRow> {
  let productDoc;

  try {
    productDoc = await databases.getDocument(DATABASE_ID, COLLECTIONS.products, input.productId);
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 404) {
      throw userError('Produit introuvable.', 404, 'PRODUCT_NOT_FOUND');
    }

    throw error;
  }

  if (productDoc['shopId'] !== input.shopId) {
    throw userError('Produit introuvable.', 404, 'PRODUCT_NOT_FOUND');
  }

  const currentQuantity = productDoc['quantity'] as number;

  if (input.quantity > currentQuantity) {
    throw userError('Stock insuffisant pour declarer ce manquant.', 409, 'STOCK_INSUFFICIENT');
  }

  const missingDoc = await databases.createDocument(DATABASE_ID, COLLECTIONS.missings, ID.unique(), {
    shopId: input.shopId,
    productId: productDoc.$id,
    productName: productDoc['name'] as string,
    quantity: input.quantity,
    unit: productDoc['unit'] as string,
    reason: input.reason,
    note: input.note,
  });

  const newQuantity = currentQuantity - input.quantity;

  await databases.updateDocument(DATABASE_ID, COLLECTIONS.products, input.productId, {
    quantity: newQuantity,
  });

  triggerStockLowAlert(input.shopId, productDoc['name'] as string, currentQuantity, newQuantity).catch(() => {});

  await databases.createDocument(DATABASE_ID, COLLECTIONS.stockMovements, ID.unique(), {
    shopId: input.shopId,
    productId: productDoc.$id,
    productName: productDoc['name'] as string,
    type: 'missing',
    quantity: input.quantity,
    unit: productDoc['unit'] as string,
    unitCost: productDoc['purchaseUnitPrice'] as number,
    totalCost: Math.round(input.quantity * (productDoc['purchaseUnitPrice'] as number)),
    note: input.reason,
  });

  await databases.createDocument(DATABASE_ID, COLLECTIONS.activityLogs, ID.unique(), {
    shopId: input.shopId,
    type: 'missing',
    actorName: 'Vendeuse',
    message: `Manquant : ${productDoc['name'] as string} (${input.reason})`,
  });

  return toMissingRow(missingDoc);
}

export async function listRecentMissingsByShop(shopId: string, limit: number): Promise<MissingRow[]> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.missings, [
    Query.equal('shopId', shopId),
    Query.orderDesc('$createdAt'),
    Query.limit(limit),
  ]);

  return response.documents.map(toMissingRow);
}

export async function listMissingsInRange(shopId: string, from: Date, to: Date): Promise<MissingRow[]> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.missings, [
    Query.equal('shopId', shopId),
    Query.greaterThanEqual('$createdAt', from.toISOString()),
    Query.lessThanEqual('$createdAt', to.toISOString()),
    Query.orderDesc('$createdAt'),
    Query.limit(200),
  ]);

  return response.documents.map(toMissingRow);
}

export async function listTodayMissingsByShop(shopId: string): Promise<MissingRow[]> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.missings, [
    Query.equal('shopId', shopId),
    Query.greaterThanEqual('$createdAt', startOfToday.toISOString()),
    Query.limit(200),
  ]);

  return response.documents.map(toMissingRow);
}
