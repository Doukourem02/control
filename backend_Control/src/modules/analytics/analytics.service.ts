import { listExpensesInRange } from '../expenses/expenses.repository';
import { listSalesInRange } from '../sales/sales.repository';

export type ChartPoint = { date: string; amount: number };

export type AnalyticsTransaction = {
  id: string;
  date: string;
  label: string;
  amount: number;
  sub: string;
};

export type AnalyticsData = {
  total: number;
  previousTotal: number;
  chartData: ChartPoint[];
  transactions: AnalyticsTransaction[];
};

function getAnchorDate(date?: string): Date {
  const parsed = date ? new Date(`${date}T12:00:00`) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function getRange(days: number, date?: string): { from: Date; to: Date } {
  const to = getAnchorDate(date);
  to.setHours(23, 59, 59, 999);
  const from = new Date(to);
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - (days - 1));
  return { from, to };
}

function getDayRange(date?: string): { from: Date; to: Date } {
  const from = getAnchorDate(date);
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

function getPreviousDayRange(date?: string): { from: Date; to: Date } {
  const from = getAnchorDate(date);
  from.setDate(from.getDate() - 1);
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

function dateKey(isoString: string): string {
  return isoString.substring(0, 10);
}

function buildChartData(days: number, amountsByDate: Map<string, number>, date?: string): ChartPoint[] {
  const points: ChartPoint[] = [];
  const anchor = getAnchorDate(date);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(anchor);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().substring(0, 10);
    points.push({ date: key, amount: amountsByDate.get(key) ?? 0 });
  }
  return points;
}

export async function getAnalytics(
  shopId: string,
  type: 'sales' | 'expenses',
  days: number,
  date?: string
): Promise<AnalyticsData> {
  const { from, to } = getRange(days, date);
  const { from: dayFrom, to: dayTo } = getDayRange(date);
  const { from: prevFrom, to: prevTo } = getPreviousDayRange(date);

  if (type === 'sales') {
    const [rangeSales, selectedDaySales, previousDaySales] = await Promise.all([
      listSalesInRange(shopId, from, to),
      listSalesInRange(shopId, dayFrom, dayTo),
      listSalesInRange(shopId, prevFrom, prevTo),
    ]);

    const total = selectedDaySales.reduce((sum, s) => sum + s.totalAmount, 0);
    const previousTotal = previousDaySales.reduce((sum, s) => sum + s.totalAmount, 0);

    const amountsByDate = new Map<string, number>();
    for (const sale of rangeSales) {
      const key = dateKey(sale.$createdAt);
      amountsByDate.set(key, (amountsByDate.get(key) ?? 0) + sale.totalAmount);
    }

    const transactions: AnalyticsTransaction[] = [...selectedDaySales]
      .reverse()
      .slice(0, 15)
      .map((s) => ({
        id: s.$id,
        date: s.$createdAt,
        label: s.productName,
        amount: s.totalAmount,
        sub: s.paymentMethod,
      }));

    return { total, previousTotal, chartData: buildChartData(days, amountsByDate, date), transactions };
  } else {
    const [rangeExpenses, selectedDayExpenses, previousDayExpenses] = await Promise.all([
      listExpensesInRange(shopId, from, to),
      listExpensesInRange(shopId, dayFrom, dayTo),
      listExpensesInRange(shopId, prevFrom, prevTo),
    ]);

    const total = selectedDayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const previousTotal = previousDayExpenses.reduce((sum, e) => sum + e.amount, 0);

    const amountsByDate = new Map<string, number>();
    for (const expense of rangeExpenses) {
      const key = dateKey(expense.$createdAt);
      amountsByDate.set(key, (amountsByDate.get(key) ?? 0) + expense.amount);
    }

    const transactions: AnalyticsTransaction[] = [...selectedDayExpenses]
      .reverse()
      .slice(0, 15)
      .map((e) => ({
        id: e.$id,
        date: e.$createdAt,
        label: e.category,
        amount: e.amount,
        sub: e.note ?? '',
      }));

    return { total, previousTotal, chartData: buildChartData(days, amountsByDate, date), transactions };
  }
}
