import { ID, Query } from 'node-appwrite';
import { COLLECTIONS, DATABASE_ID, databases } from '../config/appwrite';
import type { ProductRow } from '../types/control';
import { productUnits, type ProductUnit } from '../types/control';
import { parseAmount, userError } from '../utils/http';
import { productHasSales } from './salesService';

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
  supplier?: string;
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

export async function getProductById(productId: string): Promise<ProductRow | null> {
  try {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.products, productId);
    return toProductRow(doc);
  } catch {
    return null;
  }
}

export async function updateProductFields(
  productId: string,
  fields: Partial<{ name: string; emoji: string; sellingUnitPrice: number }>
): Promise<ProductRow> {
  const doc = await databases.updateDocument(DATABASE_ID, COLLECTIONS.products, productId, fields);
  return toProductRow(doc);
}

export async function deleteProductById(productId: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTIONS.products, productId);
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
    supplier: input.supplier || '',
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

function isProductUnit(value: unknown): value is ProductUnit {
  return typeof value === 'string' && productUnits.includes(value as ProductUnit);
}

export async function getProducts(shopId: string) {
  return listProductsByShop(shopId);
}

export async function createOrSupplyProduct(body: Record<string, unknown>, shopId: string) {
  const productId = typeof body.productId === 'string' ? body.productId : '';
  const name = String(body.name ?? '').trim();
  const category = String(body.category ?? '').trim();
  const emoji = String(body.emoji ?? '📦').trim();
  const quantity = parseAmount(body.quantity);
  const purchaseTotal = Math.round(parseAmount(body.purchaseTotal));
  const sellingUnitPrice = Math.round(parseAmount(body.sellingUnitPrice));
  const supplier = String(body.supplier ?? '').trim();
  const unit = body.unit;

  if (!productId && (!name || !category)) {
    throw userError('Renseigne le nom et la categorie.', 400, 'PRODUCT_NAME_CATEGORY_REQUIRED');
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw userError('La quantite doit etre superieure a 0.', 400, 'QUANTITY_INVALID');
  }

  if (!Number.isFinite(purchaseTotal) || purchaseTotal < 0) {
    throw userError('Le cout achat total doit etre valide.', 400, 'PURCHASE_TOTAL_INVALID');
  }

  if (!Number.isFinite(sellingUnitPrice) || sellingUnitPrice <= 0) {
    throw userError('Le prix de vente par unite doit etre superieur a 0.', 400, 'SELLING_PRICE_INVALID');
  }

  if (!productId && !isProductUnit(unit)) {
    throw userError('Selectionne une unite valide.', 400, 'UNIT_INVALID');
  }

  const product = await saveProductSupply({
    shopId,
    productId,
    name,
    category,
    emoji,
    quantity,
    unit: unit as ProductUnit,
    purchaseTotal,
    sellingUnitPrice,
    supplier,
  });

  return {
    product,
    statusCode: productId ? 200 : 201,
  };
}

export async function updateProduct(
  productId: string,
  shopId: string,
  body: Record<string, unknown>
) {
  const existing = await getProductById(productId);

  if (!existing || existing.shopId !== shopId) {
    throw userError('Produit introuvable.', 404, 'PRODUCT_NOT_FOUND');
  }

  const fields: Partial<{ name: string; emoji: string; sellingUnitPrice: number }> = {};

  if (typeof body.name === 'string') {
    const name = body.name.trim();
    if (name.length < 1) throw userError('Le nom ne peut pas etre vide.', 400, 'PRODUCT_NAME_REQUIRED');
    fields.name = name;
  }

  if (typeof body.emoji === 'string' && body.emoji.trim()) {
    fields.emoji = body.emoji.trim();
  }

  if (body.sellingUnitPrice !== undefined) {
    const price = Math.round(parseAmount(body.sellingUnitPrice));
    if (!Number.isFinite(price) || price <= 0) {
      throw userError('Le prix de vente doit etre superieur a 0.', 400, 'SELLING_PRICE_INVALID');
    }
    fields.sellingUnitPrice = price;
  }

  if (Object.keys(fields).length === 0) {
    throw userError('Aucun champ a modifier.', 400, 'PRODUCT_NO_CHANGES');
  }

  return updateProductFields(productId, fields);
}

export async function archiveProduct(productId: string, shopId: string) {
  const existing = await getProductById(productId);

  if (!existing || existing.shopId !== shopId) {
    throw userError('Produit introuvable.', 404, 'PRODUCT_NOT_FOUND');
  }

  const hasSales = await productHasSales(shopId, productId);

  if (hasSales) {
    throw userError(
      'Ce produit a des ventes enregistrees. Vous ne pouvez pas le supprimer.',
      409,
      'PRODUCT_HAS_SALES'
    );
  }

  await deleteProductById(productId);
}
