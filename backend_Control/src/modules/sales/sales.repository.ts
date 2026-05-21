import { AppwriteException, ID, Query, type Models } from 'node-appwrite';
import { COLLECTIONS, DATABASE_ID, databases } from '../../config/appwrite';
import type { PaymentMethod, SaleRow } from '../../types/control';
import { userError } from '../../utils/http';
import { triggerStockLowAlert } from '../notifications/notifications.triggers';

export type CreateSaleInput = {
  shopId: string;
  productId: string;
  quantity: number;
  totalAmount?: number;
  paymentMethod: PaymentMethod;
};

function toSaleRow(doc: any): SaleRow {
  return {
    $id: doc.$id,
    $createdAt: doc.$createdAt,
    $updatedAt: doc.$updatedAt,
    shopId: doc['shopId'] as string,
    productId: doc['productId'] as string,
    productName: (doc['productName'] ?? doc['productname']) as string,
    quantity: doc['quantity'] as number,
    unit: doc['unit'] as SaleRow['unit'],
    unitPrice: doc['unitPrice'] as number,
    totalAmount: doc['totalAmount'] as number,
    paymentMethod: doc['paymentMethod'] as PaymentMethod,
  };
}

export async function createSaleRecord(input: CreateSaleInput): Promise<SaleRow> {
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
    throw userError('Stock insuffisant pour cette vente.', 409, 'STOCK_INSUFFICIENT');
  }

  const totalAmount = input.totalAmount != null
    ? Math.round(input.totalAmount)
    : Math.round(input.quantity * (productDoc['sellingUnitPrice'] as number));

  const saleDoc = await databases.createDocument(DATABASE_ID, COLLECTIONS.sales, ID.unique(), {
    shopId: input.shopId,
    productId: productDoc.$id,
    productname: productDoc['name'] as string,
    quantity: input.quantity,
    unit: productDoc['unit'] as string,
    unitPrice: productDoc['sellingUnitPrice'] as number,
    totalAmount,
    paymentMethod: input.paymentMethod,
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
    type: 'sale',
    quantity: input.quantity,
    unit: productDoc['unit'] as string,
    unitCost: productDoc['purchaseUnitPrice'] as number,
    totalCost: Math.round(input.quantity * (productDoc['purchaseUnitPrice'] as number)),
    note: `Vente ${input.paymentMethod}`,
  });

  await databases.createDocument(DATABASE_ID, COLLECTIONS.activityLogs, ID.unique(), {
    shopId: input.shopId,
    type: 'sale',
    actorName: 'Vendeuse',
    message: `Vente : ${productDoc['name'] as string}`,
  });

  return toSaleRow(saleDoc);
}

export async function listTodaySalesByShop(shopId: string): Promise<SaleRow[]> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.sales, [
    Query.equal('shopId', shopId),
    Query.greaterThanEqual('$createdAt', startOfToday.toISOString()),
    Query.limit(500),
  ]);

  return response.documents.map(toSaleRow);
}

export async function listSalesInRange(shopId: string, from: Date, to: Date): Promise<SaleRow[]> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.sales, [
    Query.equal('shopId', shopId),
    Query.greaterThanEqual('$createdAt', from.toISOString()),
    Query.lessThanEqual('$createdAt', to.toISOString()),
    Query.orderAsc('$createdAt'),
    Query.limit(1000),
  ]);

  return response.documents.map(toSaleRow);
}

export async function productHasSales(shopId: string, productId: string): Promise<boolean> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.sales, [
    Query.equal('shopId', shopId),
    Query.equal('productId', productId),
    Query.limit(1),
  ]);
  return response.total > 0;
}
