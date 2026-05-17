export const productUnits = ['kg', 'piece', 'carton', 'tas', 'unite'] as const;

export type ProductUnit = (typeof productUnits)[number];

export type PaymentMethod = 'Cash' | 'Mobile Money';

export type ProductRow = {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  shopId: string;
  name: string;
  category: string;
  quantity: number;
  unit: ProductUnit;
  purchaseUnitPrice: number;
  sellingUnitPrice: number;
};

export type StockMovementRow = {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
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

export type SaleRow = {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  shopId: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: ProductUnit;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
};

export type ExpenseRow = {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  shopId: string;
  amount: number;
};

export type CashClosureRow = {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  shopId: string;
  cashGap: number;
};

export type ActivityLogRow = {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  shopId: string;
  type: 'stock' | 'sale' | 'expense' | 'missing' | 'cash';
  actorName: string;
  message: string;
};

export type ControlStore = {
  products: ProductRow[];
  stockMovements: StockMovementRow[];
  sales: SaleRow[];
  expenses: ExpenseRow[];
  cashClosures: CashClosureRow[];
  activityLogs: ActivityLogRow[];
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
