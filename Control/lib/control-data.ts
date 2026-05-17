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

export type ProductUnit = 'kg' | 'piece' | 'carton' | 'tas' | 'unite';

export type ProductRow = BaseRow & {
  shopId: string;
  name: string;
  category: string;
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
  quantity: number;
  unit: ProductUnit;
  purchaseTotal: number;
  sellingUnitPrice: number;
};

export type PaymentMethod = 'Cash' | 'Mobile Money';

export type CreateSaleInput = {
  productId: string;
  quantity: number;
  paymentMethod: PaymentMethod;
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
