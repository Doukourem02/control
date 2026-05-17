import { listTodayExpensesByShop } from '../expenses/expenses.repository';
import { listTodaySalesByShop } from '../sales/sales.repository';
import { parseAmount } from '../../utils/http';
import { createCashClosureRecord, listTodayCashClosuresByShop } from './cash.repository';

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

export async function createCashClosure(body: Record<string, unknown>, shopId: string) {
  const physicalCashAmount = Math.round(parseAmount(body.physicalCashAmount));
  const note = String(body.note ?? '').trim();

  if (!Number.isFinite(physicalCashAmount) || physicalCashAmount < 0) {
    throw new Error('Le montant compte doit etre valide.');
  }

  const now = new Date();
  const businessDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const summary = await getTodaySummary(shopId);
  const expectedCashAmount = summary.physicalCashExpected;
  const cashGap = physicalCashAmount - expectedCashAmount;

  return createCashClosureRecord({
    shopId,
    businessDate,
    expectedCashAmount,
    physicalCashAmount,
    cashGap,
    note,
  });
}
