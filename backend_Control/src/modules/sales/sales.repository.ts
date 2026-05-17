import { createId, nowIso, readStore, updateStore } from '../../database/control-store';
import type { PaymentMethod } from '../../types/control';
import { isToday } from '../../utils/dates';

export type CreateSaleInput = {
  shopId: string;
  productId: string;
  quantity: number;
  paymentMethod: PaymentMethod;
};

export async function createSaleRecord(input: CreateSaleInput) {
  return updateStore((store) => {
    const product = store.products.find(
      (currentProduct) =>
        currentProduct.$id === input.productId && currentProduct.shopId === input.shopId
    );

    if (!product) {
      throw new Error('Produit introuvable.');
    }

    if (input.quantity > product.quantity) {
      throw new Error('Stock insuffisant pour cette vente.');
    }

    const timestamp = nowIso();
    const totalAmount = Math.round(input.quantity * product.sellingUnitPrice);
    const saleRow = {
      $id: createId(),
      $createdAt: timestamp,
      $updatedAt: timestamp,
      shopId: input.shopId,
      productId: product.$id,
      productName: product.name,
      quantity: input.quantity,
      unit: product.unit,
      unitPrice: product.sellingUnitPrice,
      totalAmount,
      paymentMethod: input.paymentMethod,
    };

    product.quantity -= input.quantity;
    product.$updatedAt = timestamp;
    store.sales.push(saleRow);
    store.stockMovements.push({
      $id: createId(),
      $createdAt: timestamp,
      $updatedAt: timestamp,
      shopId: input.shopId,
      productId: product.$id,
      productName: product.name,
      type: 'sale',
      quantity: input.quantity,
      unit: product.unit,
      unitCost: product.purchaseUnitPrice,
      totalCost: Math.round(input.quantity * product.purchaseUnitPrice),
      note: `Vente ${input.paymentMethod}`,
    });
    store.activityLogs.push({
      $id: createId(),
      $createdAt: timestamp,
      $updatedAt: timestamp,
      shopId: input.shopId,
      type: 'sale',
      actorName: 'Vendeuse',
      message: `Vente : ${product.name}`,
    });

    return saleRow;
  });
}

export async function listTodaySalesByShop(shopId: string) {
  const store = await readStore();

  return store.sales.filter((sale) => sale.shopId === shopId && isToday(sale.$createdAt));
}
