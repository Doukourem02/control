import { listExpensesInRange } from '../expenses/expenses.repository';
import { triggerActivityDropAlert, triggerCashGapAlert } from '../notifications/notifications.triggers';
import { listSalesInRange } from '../sales/sales.repository';
import { parseAmount, userError } from '../../utils/http';
import {
  createCashClosureRecord,
  getCashClosureById,
  listCashClosuresByBusinessDate,
  listCashClosuresByShop,
  updateCashClosureCorrection,
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

const WEEKDAY_LABELS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const HISTORY_WEEKS = 4;
const MIN_COMPARABLE_DAYS = 2;

export async function checkActivityDropIfNeeded(shopId: string): Promise<void> {
  const now = new Date();

  // Pas assez de la journee ecoulee pour juger une baisse avant le milieu d'apres-midi
  if (now.getHours() < 14) return;

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todaySales = await listSalesInRange(shopId, todayStart, now);
  const todayTotal = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);

  const weeklyTotals: number[] = [];
  for (let weeksAgo = 1; weeksAgo <= HISTORY_WEEKS; weeksAgo++) {
    const pastDay = new Date(now);
    pastDay.setDate(pastDay.getDate() - 7 * weeksAgo);

    const pastDayStart = new Date(pastDay);
    pastDayStart.setHours(0, 0, 0, 0);
    const pastDaySameTime = new Date(pastDay);
    pastDaySameTime.setHours(now.getHours(), now.getMinutes(), 0, 0);

    const pastSales = await listSalesInRange(shopId, pastDayStart, pastDaySameTime);
    const pastTotal = pastSales.reduce((sum, sale) => sum + sale.totalAmount, 0);

    if (pastTotal > 0) weeklyTotals.push(pastTotal);
  }

  if (weeklyTotals.length < MIN_COMPARABLE_DAYS) return;

  const average = weeklyTotals.reduce((sum, total) => sum + total, 0) / weeklyTotals.length;

  await triggerActivityDropAlert(shopId, todayTotal, average, WEEKDAY_LABELS[now.getDay()]);
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
  const isPartial = body.isPartial === true;

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
      isPartial,
    }),
    getShopById(shopId),
  ]);

  triggerCashGapAlert(shopId, businessDate, cashGap, shop?.currency ?? 'FCFA').catch(() => {});

  return closure;
}

export async function patchCashClosure(id: string, shopId: string, body: Record<string, unknown>) {
  const correctionNote = String(body.correctionNote ?? '').trim();

  if (!correctionNote) {
    throw userError('La note de correction ne peut pas etre vide.', 400, 'CORRECTION_NOTE_EMPTY');
  }

  const existing = await getCashClosureById(id);

  if (!existing || existing.shopId !== shopId) {
    throw userError('Cloture introuvable.', 404, 'CLOSURE_NOT_FOUND');
  }

  return updateCashClosureCorrection(id, correctionNote);
}
