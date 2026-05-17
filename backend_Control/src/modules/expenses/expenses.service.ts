import { parseAmount } from '../../utils/http';
import { createExpenseRecord } from './expenses.repository';

export async function createExpense(body: Record<string, unknown>, shopId: string) {
  const amount = Math.round(parseAmount(body.amount));
  const note = String(body.note ?? '').trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Le montant de la sortie doit etre superieur a 0.');
  }

  return createExpenseRecord({
    shopId,
    amount,
    note,
  });
}
