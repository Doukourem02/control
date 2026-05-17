import { readStore } from '../../database/control-store';
import { isToday } from '../../utils/dates';

export async function listTodayExpensesByShop(shopId: string) {
  const store = await readStore();

  return store.expenses.filter((expense) => expense.shopId === shopId && isToday(expense.$createdAt));
}
