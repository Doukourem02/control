import { type PaymentMethod } from '../../types/control';
import { parseAmount } from '../../utils/http';
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
    throw new Error('Selectionne un produit.');
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error('La quantite doit etre superieure a 0.');
  }

  if (!isPaymentMethod(paymentMethod)) {
    throw new Error('Selectionne un mode de paiement valide.');
  }

  return createSaleRecord({
    shopId,
    productId,
    quantity,
    paymentMethod,
  });
}
