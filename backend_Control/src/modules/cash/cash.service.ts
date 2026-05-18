import { listExpensesInRange } from '../expenses/expenses.repository';
import { listSalesInRange } from '../sales/sales.repository';
import { parseAmount } from '../../utils/http';
import { createCashClosureRecord, listCashClosuresByBusinessDate } from './cash.repository';

function getBusinessDateKey(date?: string) {
  const parsed = date ? new Date(`${date}T12:00:00`) : new Date();
  const value = Number.isNaN(parsed.getTime()) ? new Date() : parsed;

  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

function getBusinessDateRange(date?: string) {
  const businessDate = getBusinessDateKey(date);
  const from = new Date(`${businessDate}T00:00:00`);
  const to = new Date(`${businessDate}T23:59:59.999`);

  return { businessDate, from, to };
}

export async function getTodaySummary(shopId: string, date?: string) {
  const { businessDate, from, to } = getBusinessDateRange(date);
  const [todaySales, todayExpenses, todayClosures] = await Promise.all([
    listSalesInRange(shopId, from, to),
    listExpensesInRange(shopId, from, to),
    listCashClosuresByBusinessDate(shopId, businessDate),
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
  const physicalCashActual = Math.round(parseAmount(body.physicalCashAmount));
  const note = String(body.note ?? '').trim();
  const requestedBusinessDate = typeof body.businessDate === 'string' ? body.businessDate : undefined;

  if (!Number.isFinite(physicalCashActual) || physicalCashActual < 0) {
    throw new Error('Le montant compte doit etre valide.');
  }

  const businessDate = getBusinessDateKey(requestedBusinessDate);

  const summary = await getTodaySummary(shopId, businessDate);
  const physicalCashExpected = summary.physicalCashExpected;
  const cashGap = physicalCashActual - physicalCashExpected;

  return createCashClosureRecord({
    shopId,
    businessDate,
    cashSalesAmount: summary.cashSalesAmount,
    mobileMoneySalesAmount: summary.mobileMoneySalesAmount,
    expensesAmount: summary.expensesAmount,
    physicalCashExpected,
    physicalCashActual,
    cashGap,
    note,
  });
}
