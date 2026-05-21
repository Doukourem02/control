import { listExpensesInRange } from '../expenses/expenses.repository';
import { triggerCashGapAlert } from '../notifications/notifications.triggers';
import { listSalesInRange } from '../sales/sales.repository';
import { parseAmount, userError } from '../../utils/http';
import {
  createCashClosureRecord,
  listCashClosuresByBusinessDate,
  listCashClosuresByShop,
} from './cash.repository';
import { getShopById } from '../shops/shops.repository';
import { buildTodaySummary, getBusinessDateKey, getBusinessDateRange } from './cash.calculations';

export async function getTodaySummary(shopId: string, date?: string) {
  const { businessDate, from, to } = getBusinessDateRange(date);
  const [todaySales, todayExpenses, todayClosures] = await Promise.all([
    listSalesInRange(shopId, from, to),
    listExpensesInRange(shopId, from, to),
    listCashClosuresByBusinessDate(shopId, businessDate),
  ]);

  return buildTodaySummary(todaySales, todayExpenses, todayClosures);
}

export async function getCashClosures(shopId: string, rawLimit: unknown, date?: string) {
  const limit = Math.max(1, Math.min(100, Number(rawLimit ?? 30)));

  if (date) {
    return listCashClosuresByBusinessDate(shopId, getBusinessDateKey(date));
  }

  return listCashClosuresByShop(shopId, limit);
}

export async function createCashClosure(body: Record<string, unknown>, shopId: string) {
  const physicalCashActual = Math.round(parseAmount(body.physicalCashAmount));
  const note = String(body.note ?? '').trim();
  const requestedBusinessDate = typeof body.businessDate === 'string' ? body.businessDate : undefined;

  if (!Number.isFinite(physicalCashActual) || physicalCashActual < 0) {
    throw userError('Le montant compte doit etre valide.', 400, 'CASH_AMOUNT_INVALID');
  }

  const businessDate = getBusinessDateKey(requestedBusinessDate);

  const summary = await getTodaySummary(shopId, businessDate);
  const physicalCashExpected = summary.physicalCashExpected;
  const cashGap = physicalCashActual - physicalCashExpected;

  const [closure, shop] = await Promise.all([
    createCashClosureRecord({
      shopId,
      businessDate,
      cashSalesAmount: summary.cashSalesAmount,
      mobileMoneySalesAmount: summary.mobileMoneySalesAmount,
      expensesAmount: summary.expensesAmount,
      physicalCashExpected,
      physicalCashActual,
      cashGap,
      note,
    }),
    getShopById(shopId),
  ]);

  triggerCashGapAlert(shopId, businessDate, cashGap, shop?.currency ?? 'FCFA').catch(() => {});

  return closure;
}
