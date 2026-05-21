import {
  createApiError,
  createNetworkError,
  logControlError,
  shouldSurfaceControlError,
} from '@/lib/control-errors';
import { getStoredSessionSecret } from '@/lib/control-auth-storage';

export { getControlErrorMessage } from '@/lib/control-errors';

type BaseRow = {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
};

type SaleRow = BaseRow & {
  shopId: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: ProductUnit;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
};

export type ExpenseCategory =
  | 'transport'
  | 'courant'
  | 'sachets'
  | 'eau'
  | 'salaire'
  | 'imprevu'
  | 'nettoyage';

export type MissingReason = 'perdu' | 'abime' | 'erreur' | 'consommation interne';

type ExpenseRow = BaseRow & {
  shopId: string;
  category: ExpenseCategory;
  amount: number;
  note: string;
};

export type CashClosureRow = BaseRow & {
  shopId: string;
  businessDate: string;
  cashSalesAmount: number;
  mobileMoneySalesAmount: number;
  expensesAmount: number;
  physicalCashExpected: number;
  physicalCashActual: number;
  cashGap: number;
  note: string;
};

export type MissingRow = BaseRow & {
  shopId: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: ProductUnit;
  reason: MissingReason;
  note: string;
};

export type ActivityLogRow = BaseRow & {
  shopId: string;
  type: 'stock' | 'sale' | 'expense' | 'missing' | 'cash';
  actorName: string;
  message: string;
};

export type ProductUnit = 'kg' | 'piece' | 'carton' | 'tas' | 'unite';

export type CategoryRow = BaseRow & {
  shopId: string;
  name: string;
  emoji: string;
};

export type ProductRow = BaseRow & {
  shopId: string;
  name: string;
  category: string;
  emoji: string;
  quantity: number;
  unit: ProductUnit;
  purchaseUnitPrice: number;
  sellingUnitPrice: number;
};

export type StockMovementRow = BaseRow & {
  shopId: string;
  productId: string;
  productName: string;
  type: 'initial' | 'supply' | 'sale' | 'missing' | 'adjustment';
  quantity: number;
  unit: ProductUnit;
  unitCost: number;
  totalCost: number;
  note: string;
};

export type ShopRow = BaseRow & {
  ownerUserId: string;
  ownerName: string;
  name: string;
  currency: string;
  contact: string;
  address: string;
  openingHours: string;
};

export type CreateProductInput = {
  productId?: string;
  name: string;
  category: string;
  emoji: string;
  quantity: number;
  unit: ProductUnit;
  purchaseTotal: number;
  sellingUnitPrice: number;
};

export type CreateCategoryInput = {
  name: string;
  emoji: string;
};

export type PaymentMethod = 'Cash' | 'Mobile Money';

export type CreateSaleInput = {
  productId: string;
  quantity: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
};

export type CreateExpenseInput = {
  category: ExpenseCategory;
  amount: number;
  note?: string;
};

export type CreateMissingInput = {
  productId: string;
  quantity: number;
  reason: MissingReason;
  note?: string;
};

export type CreateCashClosureInput = {
  businessDate?: string;
  physicalCashAmount: number;
  note?: string;
};

export type UpdateShopInput = {
  name: string;
  contact?: string;
  address?: string;
  openingHours?: string;
};

export type TodaySummary = {
  cashSalesAmount: number;
  mobileMoneySalesAmount: number;
  expensesAmount: number;
  physicalCashExpected: number;
  salesCount: number;
  expensesCount: number;
  latestCashGap: number;
  closureCount: number;
  isClosed: boolean;
};

const backendBaseUrl = (process.env.EXPO_PUBLIC_CONTROL_API_URL ?? 'http://localhost:4000').replace(
  /\/$/,
  ''
);

const emptyTodaySummary: TodaySummary = {
  cashSalesAmount: 0,
  mobileMoneySalesAmount: 0,
  expensesAmount: 0,
  physicalCashExpected: 0,
  salesCount: 0,
  expensesCount: 0,
  latestCashGap: 0,
  closureCount: 0,
  isClosed: false,
};

async function requestApi<ResponseBody>(
  path: string,
  options: RequestInit = {}
): Promise<ResponseBody> {
  const sessionSecret = await getStoredSessionSecret();

  let response: Response;

  try {
    response = await fetch(`${backendBaseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(sessionSecret ? { Authorization: `Bearer ${sessionSecret}` } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    throw createNetworkError(error);
  }

  if (!response.ok) {
    throw await createApiError(response);
  }

  return response.json() as Promise<ResponseBody>;
}

export async function getCategories(): Promise<CategoryRow[]> {
  try {
    const response = await requestApi<{ categories: CategoryRow[] }>('/api/categories');
    return response.categories;
  } catch (error) {
    if (shouldSurfaceControlError(error)) throw error;
    logControlError('load-categories', error);
    return [];
  }
}

export async function createCategory(input: CreateCategoryInput): Promise<CategoryRow> {
  const response = await requestApi<{ category: CategoryRow }>('/api/categories', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return response.category;
}

export async function deleteCategory(categoryId: string): Promise<void> {
  await requestApi(`/api/categories/${categoryId}`, { method: 'DELETE' });
}

export async function getProducts(): Promise<ProductRow[]> {
  try {
    const response = await requestApi<{ products: ProductRow[] }>('/api/products');

    return response.products;
  } catch (error) {
    if (shouldSurfaceControlError(error)) throw error;
    logControlError('load-products', error);
    return [];
  }
}

export async function createProduct(input: CreateProductInput) {
  const response = await requestApi<{ product: ProductRow }>('/api/products', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  return response.product;
}

export async function createSale(input: CreateSaleInput) {
  const response = await requestApi<{ sale: SaleRow }>('/api/sales', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  return response.sale;
}

export async function createExpense(input: CreateExpenseInput) {
  const response = await requestApi<{ expense: ExpenseRow }>('/api/expenses', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  return response.expense;
}

export async function createMissing(input: CreateMissingInput) {
  const response = await requestApi<{ missing: MissingRow }>('/api/missings', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  return response.missing;
}

export async function getRecentMissings(
  limit = 10,
  date?: string
): Promise<MissingRow[]> {
  try {
    const query = new URLSearchParams({
      limit: String(limit),
    });

    if (date) query.set('date', date);

    const response = await requestApi<{ missings: MissingRow[] }>(
      `/api/missings?${query.toString()}`
    );

    return response.missings;
  } catch (error) {
    if (shouldSurfaceControlError(error)) throw error;
    logControlError('load-missings', error);
    return [];
  }
}

export async function getActivityLogs(
  limit = 20
): Promise<ActivityLogRow[]> {
  try {
    const response = await requestApi<{ logs: ActivityLogRow[] }>(
      `/api/activity-logs?limit=${limit}`
    );

    return response.logs;
  } catch (error) {
    if (shouldSurfaceControlError(error)) throw error;
    logControlError('load-activity-logs', error);
    return [];
  }
}

export async function createCashClosure(
  input: CreateCashClosureInput
): Promise<CashClosureRow> {
  const response = await requestApi<{ closure: CashClosureRow }>('/api/cash-closures', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  return response.closure;
}

export async function getCashClosures(
  limit = 30,
  date?: string
): Promise<CashClosureRow[]> {
  try {
    const query = new URLSearchParams({
      limit: String(limit),
    });

    if (date) query.set('date', date);

    const response = await requestApi<{ closures: CashClosureRow[] }>(
      `/api/cash-closures?${query.toString()}`
    );

    return response.closures;
  } catch (error) {
    if (shouldSurfaceControlError(error)) throw error;
    logControlError('load-cash-closures', error);
    return [];
  }
}

export async function getRecentStockMovements(
  limit = 6,
  date?: string
): Promise<StockMovementRow[]> {
  try {
    const query = new URLSearchParams({
      limit: String(limit),
    });

    if (date) query.set('date', date);

    const response = await requestApi<{ movements: StockMovementRow[] }>(
      `/api/stock-movements?${query.toString()}`
    );

    return response.movements;
  } catch (error) {
    if (shouldSurfaceControlError(error)) throw error;
    logControlError('load-stock-movements', error);
    return [];
  }
}

export type AnalyticsType = 'sales' | 'expenses';

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

const emptyAnalytics: AnalyticsData = {
  total: 0,
  previousTotal: 0,
  chartData: [],
  transactions: [],
};

export async function getAnalytics(
  type: AnalyticsType,
  days: number,
  date?: string
): Promise<AnalyticsData> {
  try {
    const query = new URLSearchParams({
      type,
      days: String(days),
    });

    if (date) query.set('date', date);

    const response = await requestApi<{ analytics: AnalyticsData }>(
      `/api/analytics?${query.toString()}`
    );
    return response.analytics;
  } catch (error) {
    if (shouldSurfaceControlError(error)) throw error;
    logControlError('load-analytics', error);
    return emptyAnalytics;
  }
}

export async function getTodaySummary(
  date?: string
): Promise<TodaySummary> {
  try {
    const query = new URLSearchParams();
    if (date) query.set('date', date);

    const suffix = query.toString() ? `?${query.toString()}` : '';
    const response = await requestApi<{ summary: TodaySummary }>(`/api/summary/today${suffix}`);

    return response.summary;
  } catch (error) {
    if (shouldSurfaceControlError(error)) throw error;
    logControlError('load-today-summary', error);
    return emptyTodaySummary;
  }
}

export async function updateCurrentShop(input: UpdateShopInput): Promise<ShopRow> {
  const response = await requestApi<{ shop: ShopRow }>('/api/shops/current', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });

  return response.shop;
}
