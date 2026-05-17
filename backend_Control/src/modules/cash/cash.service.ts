import { listTodayExpensesByShop } from '../expenses/expenses.repository';
import { listTodaySalesByShop } from '../sales/sales.repository';
import { listTodayCashClosuresByShop } from './cash.repository';

export async function getTodaySummary(shopId: string) {
  const [todaySales, todayExpenses, todayClosures] = await Promise.all([
    listTodaySalesByShop(shopId),
    listTodayExpensesByShop(shopId),
    listTodayCashClosuresByShop(shopId),
  ]);

  const cashSalesAmount = todaySales
    .filter((sale) => sale.paymentMethod === 'Cash')
    .reduce((total, sale) => total + sale.totalAmount, 0);
  const mobileMoneySalesAmount = todaySales
    .filter((sale) => sale.paymentMethod === 'Mobile Money')
    .reduce((total, sale) => total + sale.totalAmount, 0);
  const expensesAmount = todayExpenses.reduce((total, expense) => total + expense.amount, 0);

  return {
    cashSalesAmount,
    mobileMoneySalesAmount,
    expensesAmount,
    physicalCashExpected: cashSalesAmount - expensesAmount,
    salesCount: todaySales.length,
    expensesCount: todayExpenses.length,
    latestCashGap: todayClosures[0]?.cashGap ?? 0,
  };
}
