import { expenseCategories, type ExpenseCategory } from '../../types/control';
import { parseAmount } from '../../utils/http';
import { createExpenseRecord } from './expenses.repository';

function isExpenseCategory(value: unknown): value is ExpenseCategory {
  return typeof value === 'string' && expenseCategories.includes(value as ExpenseCategory);
}

export async function createExpense(body: Record<string, unknown>, shopId: string) {
  const amount = Math.round(parseAmount(body.amount));
  const category = body.category;
  const note = String(body.note ?? '').trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Le montant de la sortie doit etre superieur a 0.');
  }

  if (!isExpenseCategory(category)) {
    throw new Error('Selectionne une categorie valide.');
  }

  return createExpenseRecord({ shopId, category, amount, note });
}
