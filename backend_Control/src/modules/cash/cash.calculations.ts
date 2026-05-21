import type { CashClosureRow, ExpenseRow, SaleRow, TodaySummary } from '../../types/control';

export function getBusinessDateKey(date?: string, fallback = new Date()) {
  const parsed = date ? new Date(`${date}T12:00:00`) : fallback;
  const value = Number.isNaN(parsed.getTime()) ? fallback : parsed;

  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

export function getBusinessDateRange(date?: string) {
  const businessDate = getBusinessDateKey(date);
  const from = new Date(`${businessDate}T00:00:00`);
  const to = new Date(`${businessDate}T23:59:59.999`);

  return { businessDate, from, to };
}

export function buildTodaySummary(
  todaySales: SaleRow[],
  todayExpenses: ExpenseRow[],
  todayClosures: CashClosureRow[]
): TodaySummary {
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
    closureCount: todayClosures.length,
    isClosed: todayClosures.length > 0,
  };
}
