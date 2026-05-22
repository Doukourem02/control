import {
  ControlApiError,
  createApiError,
  createNetworkError,
  logControlError,
  shouldSurfaceControlError,
} from '@/lib/control-errors';
import { getStoredSessionSecret } from '@/lib/control-auth-storage';
import { cacheRead, cacheWrite } from '@/lib/offline-cache';
import { getIsOffline, notifyNetworkOffline, notifyNetworkOnline } from '@/lib/network-state';
import { queueAdd, queueGet, queueRemove } from '@/lib/offline-queue';

export { getControlErrorMessage, isOfflineQueued } from '@/lib/control-errors';

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
  correctionNote: string;
  isPartial: boolean;
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
  paymentMethods: string;
  defaultClosingTime: string;
  amountsVisibleByDefault: string;
  displayLanguage: string;
  defaultUnit: ProductUnit;
  stockLowAlertsEnabled: string;
  closureReminderEnabled: string;
  cashGapAlertsEnabled: string;
  defaultLowStockThreshold: string;
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
  isPartial?: boolean;
};

export type UpdateShopInput = {
  name?: string;
  currency?: string;
  contact?: string;
  address?: string;
  openingHours?: string;
  paymentMethods?: string[];
  defaultClosingTime?: string;
  amountsVisibleByDefault?: boolean;
  displayLanguage?: string;
  defaultUnit?: ProductUnit;
  stockLowAlertsEnabled?: boolean;
  closureReminderEnabled?: boolean;
  cashGapAlertsEnabled?: boolean;
  defaultLowStockThreshold?: string;
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
    notifyNetworkOffline();
    throw createNetworkError(error);
  }

  if (!response.ok) {
    throw await createApiError(response);
  }

  notifyNetworkOnline();
  return response.json() as Promise<ResponseBody>;
}

export async function getCategories(): Promise<CategoryRow[]> {
  try {
    const response = await requestApi<{ categories: CategoryRow[] }>('/api/categories');
    void cacheWrite('categories', response.categories);
    return response.categories;
  } catch (error) {
    if (shouldSurfaceControlError(error)) throw error;
    logControlError('load-categories', error);
    return (await cacheRead<CategoryRow[]>('categories')) ?? [];
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
    void cacheWrite('products', response.products);
    return response.products;
  } catch (error) {
    if (shouldSurfaceControlError(error)) throw error;
    logControlError('load-products', error);
    return (await cacheRead<ProductRow[]>('products')) ?? [];
  }
}

export async function createProduct(input: CreateProductInput) {
  const response = await requestApi<{ product: ProductRow }>('/api/products', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  return response.product;
}

export type UpdateProductInput = {
  name?: string;
  emoji?: string;
  sellingUnitPrice?: number;
};

export async function updateProduct(productId: string, input: UpdateProductInput): Promise<ProductRow> {
  const response = await requestApi<{ product: ProductRow }>(`/api/products/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return response.product;
}

export async function deleteProduct(productId: string): Promise<void> {
  await requestApi(`/api/products/${productId}`, { method: 'DELETE' });
}

export async function createSale(input: CreateSaleInput) {
  if (getIsOffline()) {
    await queueAdd({ type: 'sale', payload: input });
    throw new ControlApiError(
      'Vente mise en attente — sera envoyée à la reconnexion.',
      0,
      'OFFLINE_QUEUED',
      'user'
    );
  }
  const response = await requestApi<{ sale: SaleRow }>('/api/sales', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return response.sale;
}

export async function createExpense(input: CreateExpenseInput) {
  if (getIsOffline()) {
    await queueAdd({ type: 'expense', payload: input });
    throw new ControlApiError(
      'Sortie mise en attente — sera envoyée à la reconnexion.',
      0,
      'OFFLINE_QUEUED',
      'user'
    );
  }
  const response = await requestApi<{ expense: ExpenseRow }>('/api/expenses', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return response.expense;
}

let flushing = false;

export async function flushOfflineQueue(): Promise<number> {
  if (flushing) return 0;
  flushing = true;
  let flushed = 0;
  try {
    const queue = await queueGet();
    for (const item of queue) {
      try {
        if (item.type === 'sale') {
          await requestApi('/api/sales', { method: 'POST', body: JSON.stringify(item.payload) });
        } else if (item.type === 'expense') {
          await requestApi('/api/expenses', { method: 'POST', body: JSON.stringify(item.payload) });
        }
        await queueRemove(item.id);
        flushed++;
      } catch {
        break;
      }
    }
  } finally {
    flushing = false;
  }
  return flushed;
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

export async function correctCashClosure(
  id: string,
  correctionNote: string
): Promise<CashClosureRow> {
  const response = await requestApi<{ closure: CashClosureRow }>(`/api/cash-closures/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ correctionNote }),
  });

  return response.closure;
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

export async function getProductSupplyHistory(productId: string, limit = 20): Promise<StockMovementRow[]> {
  try {
    const query = new URLSearchParams({
      productId,
      type: 'supply',
      limit: String(limit),
    });

    const response = await requestApi<{ movements: StockMovementRow[] }>(
      `/api/stock-movements?${query.toString()}`
    );

    return response.movements;
  } catch (error) {
    if (shouldSurfaceControlError(error)) throw error;
    logControlError('load-supply-history', error);
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
    if (!date) void cacheWrite('today-summary', response.summary);
    return response.summary;
  } catch (error) {
    if (shouldSurfaceControlError(error)) throw error;
    logControlError('load-today-summary', error);
    if (!date) return (await cacheRead<TodaySummary>('today-summary')) ?? emptyTodaySummary;
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

export type NotificationType = 'stock_low' | 'closure_reminder' | 'cash_gap';

export type NotificationRow = BaseRow & {
  shopId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: string;
};

export async function getNotifications(limit = 30): Promise<NotificationRow[]> {
  try {
    const response = await requestApi<{ notifications: NotificationRow[] }>(
      `/api/notifications?limit=${limit}`
    );
    return response.notifications;
  } catch (error) {
    if (shouldSurfaceControlError(error)) throw error;
    logControlError('load-notifications', error);
    return [];
  }
}

export async function markNotificationRead(id: string): Promise<NotificationRow> {
  const response = await requestApi<{ notification: NotificationRow }>(
    `/api/notifications/${id}/read`,
    { method: 'PATCH' }
  );
  return response.notification;
}

export async function markAllNotificationsRead(): Promise<void> {
  await requestApi('/api/notifications/read-all', { method: 'PATCH' });
}

async function downloadApiFile(path: string): Promise<{ data: string; filename: string }> {
  const sessionSecret = await getStoredSessionSecret();

  let response: Response;
  try {
    response = await fetch(`${backendBaseUrl}${path}`, {
      headers: sessionSecret ? { Authorization: `Bearer ${sessionSecret}` } : {},
    });
  } catch (error) {
    throw createNetworkError(error);
  }

  if (!response.ok) {
    throw await createApiError(response);
  }

  const contentDisposition = response.headers.get('Content-Disposition') ?? '';
  const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
  const filename = filenameMatch ? filenameMatch[1] : 'export';

  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < uint8Array.byteLength; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  const base64 = btoa(binary);

  return { data: base64, filename };
}

export async function exportDailyReport(date: string): Promise<{ data: string; filename: string }> {
  return downloadApiFile(`/api/exports/daily?date=${encodeURIComponent(date)}`);
}

export async function exportHistoryCSV(from: string, to: string): Promise<{ data: string; filename: string }> {
  return downloadApiFile(`/api/exports/history?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
}

// ── Team ─────────────────────────────────────────────────────────────────────

export type MemberStatus = 'pending' | 'active' | 'removed';

export type MemberRow = BaseRow & {
  shopId: string;
  email: string;
  name: string;
  userId: string | null;
  role: 'seller';
  inviteCode: string;
  status: MemberStatus;
};

export async function getTeamMembers(): Promise<MemberRow[]> {
  try {
    const response = await requestApi<{ members: MemberRow[] }>('/api/team/members');
    return response.members;
  } catch (error) {
    if (shouldSurfaceControlError(error)) throw error;
    logControlError('load-team-members', error);
    return [];
  }
}

export async function getMyRole(): Promise<'owner' | 'seller'> {
  try {
    const response = await requestApi<{ role: 'owner' | 'seller' }>('/api/team/role');
    return response.role;
  } catch {
    return 'owner';
  }
}

export type InviteMemberInput = { email: string; name: string };

export async function inviteTeamMember(input: InviteMemberInput): Promise<MemberRow> {
  const response = await requestApi<{ member: MemberRow }>('/api/team/invite', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return response.member;
}

export async function removeTeamMember(memberId: string): Promise<void> {
  await requestApi(`/api/team/members/${memberId}`, { method: 'DELETE' });
}

export async function joinShop(inviteCode: string): Promise<MemberRow> {
  const response = await requestApi<{ member: MemberRow }>('/api/team/join', {
    method: 'POST',
    body: JSON.stringify({ inviteCode }),
  });
  return response.member;
}
