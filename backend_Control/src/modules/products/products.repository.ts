import { ID, Query } from 'node-appwrite';
import { COLLECTIONS, DATABASE_ID, databases } from '../../config/appwrite';
import type { ProductRow, ProductUnit } from '../../types/control';

export type SaveProductInput = {
  shopId: string;
  productId?: string;
  name: string;
  category: string;
  emoji: string;
  quantity: number;
  unit: ProductUnit;
  purchaseTotal: number;
  sellingUnitPrice: number;
};

function toProductRow(doc: any): ProductRow {
  return {
    $id: doc.$id,
    $createdAt: doc.$createdAt,
    $updatedAt: doc.$updatedAt,
    shopId: doc['shopId'] as string,
    name: doc['name'] as string,
    category: doc['category'] as string,
    emoji: (doc['emoji'] as string) || '📦',
    quantity: doc['quantity'] as number,
    unit: doc['unit'] as ProductUnit,
    purchaseUnitPrice: doc['purchaseUnitPrice'] as number,
    sellingUnitPrice: doc['sellingUnitPrice'] as number,
  };
}

export async function listProductsByShop(shopId: string): Promise<ProductRow[]> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.products, [
    Query.equal('shopId', shopId),
    Query.orderAsc('name'),
    Query.limit(200),
  ]);

  return response.documents.map(toProductRow);
}

export async function saveProductSupply(input: SaveProductInput): Promise<ProductRow> {
  const incomingUnitCost = Math.round(input.purchaseTotal / input.quantity);
  let savedProduct: ProductRow;
  let movementType: 'initial' | 'supply' = 'initial';

  if (input.productId) {
    const existingDoc = await databases.getDocument(DATABASE_ID, COLLECTIONS.products, input.productId);
    const existing = toProductRow(existingDoc);

    const nextQuantity = existing.quantity + input.quantity;
    const weightedPurchaseTotal = existing.quantity * existing.purchaseUnitPrice + input.purchaseTotal;

    const updatedDoc = await databases.updateDocument(DATABASE_ID, COLLECTIONS.products, input.productId, {
      quantity: nextQuantity,
      purchaseUnitPrice: Math.round(weightedPurchaseTotal / nextQuantity),
      sellingUnitPrice: input.sellingUnitPrice,
    });

    savedProduct = toProductRow(updatedDoc);
    movementType = 'supply';
  } else {
    const newDoc = await databases.createDocument(DATABASE_ID, COLLECTIONS.products, ID.unique(), {
      shopId: input.shopId,
      name: input.name,
      category: input.category,
      emoji: input.emoji || '📦',
      quantity: input.quantity,
      unit: input.unit,
      purchaseUnitPrice: incomingUnitCost,
      sellingUnitPrice: input.sellingUnitPrice,
    });

    savedProduct = toProductRow(newDoc);
  }

  await databases.createDocument(DATABASE_ID, COLLECTIONS.stockMovements, ID.unique(), {
    shopId: input.shopId,
    productId: savedProduct.$id,
    productName: savedProduct.name,
    type: movementType,
    quantity: input.quantity,
    unit: savedProduct.unit,
    unitCost: incomingUnitCost,
    totalCost: input.purchaseTotal,
    note: movementType === 'initial' ? 'Stock initial' : 'Approvisionnement',
  });

  await databases.createDocument(DATABASE_ID, COLLECTIONS.activityLogs, ID.unique(), {
    shopId: input.shopId,
    type: 'stock',
    actorName: 'Vendeuse',
    message: movementType === 'initial'
      ? `Stock ajoute : ${savedProduct.name}`
      : `Approvisionnement : ${savedProduct.name}`,
  });

  return savedProduct;
}
