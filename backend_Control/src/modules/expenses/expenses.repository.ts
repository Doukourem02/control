import { createId, nowIso, readStore, updateStore } from '../../database/control-store';
import { isToday } from '../../utils/dates';

export type CreateExpenseInput = {
  shopId: string;
  amount: number;
  note: string;
};

export async function createExpenseRecord(input: CreateExpenseInput) {
  return updateStore((store) => {
    const timestamp = nowIso();
    const expense = {
      $id: createId(),
      $createdAt: timestamp,
      $updatedAt: timestamp,
      shopId: input.shopId,
      amount: input.amount,
      note: input.note,
    };

    store.expenses.push(expense);
    store.activityLogs.push({
      $id: createId(),
      $createdAt: timestamp,
      $updatedAt: timestamp,
      shopId: input.shopId,
      type: 'expense',
      actorName: 'Vendeuse',
      message: input.note ? `Sortie caisse : ${input.note}` : 'Sortie caisse',
    });

    return expense;
  });
}

export async function listTodayExpensesByShop(shopId: string) {
  const store = await readStore();

  return store.expenses.filter((expense) => expense.shopId === shopId && isToday(expense.$createdAt));
}
