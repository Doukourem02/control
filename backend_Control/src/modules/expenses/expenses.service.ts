import { expenseCategories, type ExpenseCategory } from '../../types/control';
import { parseAmount, userError } from '../../utils/http';
import { createExpenseRecord } from './expenses.repository';

function isExpenseCategory(value: unknown): value is ExpenseCategory {
  return typeof value === 'string' && expenseCategories.includes(value as ExpenseCategory);
}

export async function createExpense(body: Record<string, unknown>, shopId: string) {
  const amount = Math.round(parseAmount(body.amount));
  const category = body.category;
  const note = String(body.note ?? '').trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    throw userError('Le montant de la sortie doit etre superieur a 0.', 400, 'EXPENSE_AMOUNT_INVALID');
  }

  if (!isExpenseCategory(category)) {
    throw userError('Selectionne une categorie valide.', 400, 'EXPENSE_CATEGORY_INVALID');
  }

  return createExpenseRecord({ shopId, category, amount, note });
}
