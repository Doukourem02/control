import { createId, nowIso, readStore, updateStore } from '../../database/control-store';
import type { ProductRow, ProductUnit } from '../../types/control';

export type SaveProductInput = {
  shopId: string;
  productId?: string;
  name: string;
  category: string;
  quantity: number;
  unit: ProductUnit;
  purchaseTotal: number;
  sellingUnitPrice: number;
};

function byName(a: ProductRow, b: ProductRow) {
  return a.name.localeCompare(b.name, 'fr');
}

export async function listProductsByShop(shopId: string) {
  const store = await readStore();

  return store.products.filter((product) => product.shopId === shopId).sort(byName);
}

export async function saveProductSupply(input: SaveProductInput) {
  return updateStore((store) => {
    const timestamp = nowIso();
    const incomingUnitCost = Math.round(input.purchaseTotal / input.quantity);
    let savedProduct: ProductRow;
    let movementType: 'initial' | 'supply' = 'initial';

    if (input.productId) {
      const existingProduct = store.products.find(
        (currentProduct) =>
          currentProduct.$id === input.productId && currentProduct.shopId === input.shopId
      );

      if (!existingProduct) {
        throw new Error('Produit introuvable.');
      }

      const nextQuantity = existingProduct.quantity + input.quantity;
      const weightedPurchaseTotal =
        existingProduct.quantity * existingProduct.purchaseUnitPrice + input.purchaseTotal;

      existingProduct.quantity = nextQuantity;
      existingProduct.purchaseUnitPrice = Math.round(weightedPurchaseTotal / nextQuantity);
      existingProduct.sellingUnitPrice = input.sellingUnitPrice;
      existingProduct.$updatedAt = timestamp;
      savedProduct = existingProduct;
      movementType = 'supply';
    } else {
      savedProduct = {
        $id: createId(),
        $createdAt: timestamp,
        $updatedAt: timestamp,
        shopId: input.shopId,
        name: input.name,
        category: input.category,
        quantity: input.quantity,
        unit: input.unit,
        purchaseUnitPrice: incomingUnitCost,
        sellingUnitPrice: input.sellingUnitPrice,
      };
      store.products.push(savedProduct);
    }

    store.stockMovements.push({
      $id: createId(),
      $createdAt: timestamp,
      $updatedAt: timestamp,
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

    store.activityLogs.push({
      $id: createId(),
      $createdAt: timestamp,
      $updatedAt: timestamp,
      shopId: input.shopId,
      type: 'stock',
      actorName: 'Vendeuse',
      message:
        movementType === 'initial'
          ? `Stock ajoute : ${savedProduct.name}`
          : `Approvisionnement : ${savedProduct.name}`,
    });

    return savedProduct;
  });
}
