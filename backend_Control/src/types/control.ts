export const productUnits = ['kg', 'piece', 'carton', 'tas', 'unite'] as const;

export type ProductUnit = (typeof productUnits)[number];

export type PaymentMethod = 'Cash' | 'Mobile Money';

export type CategoryRow = {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  shopId: string;
  name: string;
  emoji: string;
};

export type ProductRow = {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  shopId: string;
  name: string;
  category: string;
  emoji: string;
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
  supplier: string;
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

export const expenseKinds = ['fixed', 'variable'] as const;

export type ExpenseKind = (typeof expenseKinds)[number];

/**
 * Cahier des charges §8 : depenses fixes (loyer, electricite, eau, internet,
 * salaires) vs variables (achats fournisseurs, transport, glace, carburant,
 * reparations). Mappe sur les categories existantes plutot que de demander
 * une saisie supplementaire a l'utilisateur.
 */
const EXPENSE_CATEGORY_KIND: Record<ExpenseCategory, ExpenseKind> = {
  salaire: 'fixed',
  courant: 'fixed',
  eau: 'fixed',
  transport: 'variable',
  sachets: 'variable',
  nettoyage: 'variable',
  imprevu: 'variable',
};

export function getExpenseKind(category: ExpenseCategory): ExpenseKind {
  return EXPENSE_CATEGORY_KIND[category];
}

export type ExpenseRow = {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  shopId: string;
  category: ExpenseCategory;
  amount: number;
  note: string;
  receiptFileId: string;
};

export type CashClosureRow = {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
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
  closureCount: number;
  isClosed: boolean;
};
