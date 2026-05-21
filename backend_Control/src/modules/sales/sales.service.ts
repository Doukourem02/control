import { type PaymentMethod } from '../../types/control';
import { parseAmount, userError } from '../../utils/http';
import { createSaleRecord } from './sales.repository';

const paymentMethods: PaymentMethod[] = ['Cash', 'Mobile Money'];

function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === 'string' && paymentMethods.includes(value as PaymentMethod);
}

export async function createSale(body: Record<string, unknown>, shopId: string) {
  const productId = String(body.productId ?? '');
  const quantity = parseAmount(body.quantity);
  const paymentMethod = body.paymentMethod;

  if (!productId) {
    throw userError('Selectionne un produit.', 400, 'PRODUCT_REQUIRED');
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw userError('La quantite doit etre superieure a 0.', 400, 'QUANTITY_INVALID');
  }

  if (!isPaymentMethod(paymentMethod)) {
    throw userError('Selectionne un mode de paiement valide.', 400, 'PAYMENT_METHOD_INVALID');
  }

  const totalAmount = parseAmount(body.totalAmount);

  return createSaleRecord({
    shopId,
    productId,
    quantity,
    totalAmount: Number.isFinite(totalAmount) && totalAmount > 0 ? totalAmount : undefined,
    paymentMethod,
  });
}
