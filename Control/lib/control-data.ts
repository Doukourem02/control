export const DEFAULT_SHOP_ID = 'default-shop';

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

type CashClosureRow = BaseRow & {
  shopId: string;
  businessDate: string;
  expectedCashAmount: number;
  physicalCashAmount: number;
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
  physicalCashAmount: number;
  note?: string;
};

export type TodaySummary = {
  cashSalesAmount: number;
  mobileMoneySalesAmount: number;
  expensesAmount: number;
  physicalCashExpected: number;
  salesCount: number;
  expensesCount: number;
  latestCashGap: number;
};

class ApiResponseError extends Error {}

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
};

export function getControlErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return 'Erreur inconnue.';
}

async function requestApi<ResponseBody>(
  path: string,
  options: RequestInit = {}
): Promise<ResponseBody> {
  const response = await fetch(`${backendBaseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiResponseError(body?.message ?? 'Erreur backend inconnue.');
  }

  return response.json() as Promise<ResponseBody>;
}

export async function getCategories(shopId = DEFAULT_SHOP_ID): Promise<CategoryRow[]> {
  try {
    const response = await requestApi<{ categories: CategoryRow[] }>(
      `/api/categories?shopId=${encodeURIComponent(shopId)}`
    );
    return response.categories;
  } catch (error) {
    console.warn('Unable to load categories.', getControlErrorMessage(error));
    return [];
  }
}

export async function createCategory(input: CreateCategoryInput, shopId = DEFAULT_SHOP_ID): Promise<CategoryRow> {
  const response = await requestApi<{ category: CategoryRow }>('/api/categories', {
    method: 'POST',
    body: JSON.stringify({ ...input, shopId }),
  });
  return response.category;
}

export async function deleteCategory(categoryId: string): Promise<void> {
  await requestApi(`/api/categories/${categoryId}`, { method: 'DELETE' });
}

export async function getProducts(shopId = DEFAULT_SHOP_ID): Promise<ProductRow[]> {
  try {
    const response = await requestApi<{ products: ProductRow[] }>(
      `/api/products?shopId=${encodeURIComponent(shopId)}`
    );

    return response.products;
  } catch (error) {
    console.warn('Unable to load products from CONTROL API.', getControlErrorMessage(error));
    return [];
  }
}

export async function createProduct(input: CreateProductInput, shopId = DEFAULT_SHOP_ID) {
  const response = await requestApi<{ product: ProductRow }>('/api/products', {
    method: 'POST',
    body: JSON.stringify({ ...input, shopId }),
  });

  return response.product;
}

export async function createSale(input: CreateSaleInput, shopId = DEFAULT_SHOP_ID) {
  const response = await requestApi<{ sale: SaleRow }>('/api/sales', {
    method: 'POST',
    body: JSON.stringify({ ...input, shopId }),
  });

  return response.sale;
}

export async function createExpense(input: CreateExpenseInput, shopId = DEFAULT_SHOP_ID) {
  const response = await requestApi<{ expense: ExpenseRow }>('/api/expenses', {
    method: 'POST',
    body: JSON.stringify({ ...input, shopId }),
  });

  return response.expense;
}

export async function createMissing(input: CreateMissingInput, shopId = DEFAULT_SHOP_ID) {
  const response = await requestApi<{ missing: MissingRow }>('/api/missings', {
    method: 'POST',
    body: JSON.stringify({ ...input, shopId }),
  });

  return response.missing;
}

export async function getRecentMissings(
  shopId = DEFAULT_SHOP_ID,
  limit = 10
): Promise<MissingRow[]> {
  try {
    const response = await requestApi<{ missings: MissingRow[] }>(
      `/api/missings?shopId=${encodeURIComponent(shopId)}&limit=${limit}`
    );

    return response.missings;
  } catch (error) {
    console.warn('Unable to load missings from CONTROL API.', getControlErrorMessage(error));
    return [];
  }
}

export async function getActivityLogs(
  shopId = DEFAULT_SHOP_ID,
  limit = 20
): Promise<ActivityLogRow[]> {
  try {
    const response = await requestApi<{ logs: ActivityLogRow[] }>(
      `/api/activity-logs?shopId=${encodeURIComponent(shopId)}&limit=${limit}`
    );

    return response.logs;
  } catch (error) {
    console.warn('Unable to load activity logs from CONTROL API.', getControlErrorMessage(error));
    return [];
  }
}

export async function createCashClosure(
  input: CreateCashClosureInput,
  shopId = DEFAULT_SHOP_ID
) {
  const response = await requestApi<{ closure: CashClosureRow }>('/api/cash-closures', {
    method: 'POST',
    body: JSON.stringify({ ...input, shopId }),
  });

  return response.closure;
}

export async function getRecentStockMovements(
  shopId = DEFAULT_SHOP_ID,
  limit = 6
): Promise<StockMovementRow[]> {
  try {
    const response = await requestApi<{ movements: StockMovementRow[] }>(
      `/api/stock-movements?shopId=${encodeURIComponent(shopId)}&limit=${limit}`
    );

    return response.movements;
  } catch (error) {
    console.warn('Unable to load stock movements from CONTROL API.', getControlErrorMessage(error));
    return [];
  }
}

export async function getTodaySummary(shopId = DEFAULT_SHOP_ID): Promise<TodaySummary> {
  try {
    const response = await requestApi<{ summary: TodaySummary }>(
      `/api/summary/today?shopId=${encodeURIComponent(shopId)}`
    );

    return response.summary;
  } catch (error) {
    console.warn('Unable to load today summary from CONTROL API.', getControlErrorMessage(error));
    return emptyTodaySummary;
  }
}
