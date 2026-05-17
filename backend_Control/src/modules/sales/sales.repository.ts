import { ID, Query, type Models } from 'node-appwrite';
import { COLLECTIONS, DATABASE_ID, databases } from '../../config/appwrite';
import type { PaymentMethod, SaleRow } from '../../types/control';

export type CreateSaleInput = {
  shopId: string;
  productId: string;
  quantity: number;
  paymentMethod: PaymentMethod;
};

function toSaleRow(doc: any): SaleRow {
  return {
    $id: doc.$id,
    $createdAt: doc.$createdAt,
    $updatedAt: doc.$updatedAt,
    shopId: doc['shopId'] as string,
    productId: doc['productId'] as string,
    productName: doc['productName'] as string,
    quantity: doc['quantity'] as number,
    unit: doc['unit'] as SaleRow['unit'],
    unitPrice: doc['unitPrice'] as number,
    totalAmount: doc['totalAmount'] as number,
    paymentMethod: doc['paymentMethod'] as PaymentMethod,
  };
}

export async function createSaleRecord(input: CreateSaleInput): Promise<SaleRow> {
  const productDoc = await databases.getDocument(DATABASE_ID, COLLECTIONS.products, input.productId);

  if (productDoc['shopId'] !== input.shopId) {
    throw new Error('Produit introuvable.');
  }

  const currentQuantity = productDoc['quantity'] as number;

  if (input.quantity > currentQuantity) {
    throw new Error('Stock insuffisant pour cette vente.');
  }

  const totalAmount = Math.round(input.quantity * (productDoc['sellingUnitPrice'] as number));

  const saleDoc = await databases.createDocument(DATABASE_ID, COLLECTIONS.sales, ID.unique(), {
    shopId: input.shopId,
    productId: productDoc.$id,
    productName: productDoc['name'] as string,
    quantity: input.quantity,
    unit: productDoc['unit'] as string,
    unitPrice: productDoc['sellingUnitPrice'] as number,
    totalAmount,
    paymentMethod: input.paymentMethod,
  });

  await databases.updateDocument(DATABASE_ID, COLLECTIONS.products, input.productId, {
    quantity: currentQuantity - input.quantity,
  });

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
