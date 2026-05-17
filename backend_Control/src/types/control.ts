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

export const expenseCategories = [
  'transport',
  'courant',
  'sachets',
  'eau',
  'salaire',
  'imprevu',
  'nettoyage',
] as const;

export type ExpenseCategory = (typeof expenseCategories)[number];

export type ExpenseRow = {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  shopId: string;
  category: ExpenseCategory;
  amount: number;
  note: string;
};

export type CashClosureRow = {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  shopId: string;
  businessDate: string;
  expectedCashAmount: number;
  physicalCashAmount: number;
  cashGap: number;
  note: string;
};

export const missingReasons = ['perdu', 'abime', 'erreur', 'consommation interne'] as const;

export type MissingReason = (typeof missingReasons)[number];

export type MissingRow = {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  shopId: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: ProductUnit;
  reason: MissingReason;
  note: string;
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
  missings: MissingRow[];
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
