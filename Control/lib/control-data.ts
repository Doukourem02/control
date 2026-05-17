import { ID, Permission, Query, Role, type Models } from 'react-native-appwrite';

import { APPWRITE_DATABASE_ID, APPWRITE_TABLES, tablesDb } from '@/lib/appwrite';

export const DEFAULT_SHOP_ID = 'default-shop';

type SaleRow = Models.Row & {
  shopId: string;
  totalAmount: number;
  paymentMethod: 'Cash' | 'Mobile Money';
};

type ExpenseRow = Models.Row & {
  shopId: string;
  amount: number;
};

type CashClosureRow = Models.Row & {
  shopId: string;
  cashGap: number;
};

export type ProductUnit = 'kg' | 'piece' | 'carton' | 'tas' | 'unite';

export type ProductRow = Models.Row & {
  shopId: string;
  name: string;
  category: string;
  quantity: number;
  unit: ProductUnit;
  purchaseUnitPrice: number;
  sellingUnitPrice: number;
};

export type CreateProductInput = {
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

export function getAppwriteErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return 'Erreur Appwrite inconnue.';
}

const emptyTodaySummary: TodaySummary = {
  cashSalesAmount: 0,
  mobileMoneySalesAmount: 0,
  expensesAmount: 0,
  physicalCashExpected: 0,
  salesCount: 0,
  expensesCount: 0,
  latestCashGap: 0,
};

function isToday(value: string) {
  const date = new Date(value);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function rowCreatedAt(row: Models.Row) {
  return row.$createdAt;
}

async function listRows<Row extends Models.Row>(tableId: string) {
  const response = await tablesDb.listRows<Row>({
    databaseId: APPWRITE_DATABASE_ID,
    tableId,
    queries: [Query.limit(100)],
  });

  return response.rows;
}

const testPermissions = [
  Permission.read(Role.any()),
  Permission.update(Role.any()),
  Permission.delete(Role.any()),
];

export async function getProducts(shopId = DEFAULT_SHOP_ID): Promise<ProductRow[]> {
  try {
    const products = await listRows<ProductRow>(APPWRITE_TABLES.products);

    return products
      .filter((product) => product.shopId === shopId)
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.warn('Unable to load products from Appwrite.', getAppwriteErrorMessage(error));
    return [];
  }
}

export async function createProduct(input: CreateProductInput, shopId = DEFAULT_SHOP_ID) {
  const purchaseUnitPrice = Math.round(input.purchaseTotal / input.quantity);
  const product = await tablesDb.createRow<ProductRow>({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: APPWRITE_TABLES.products,
    rowId: ID.unique(),
    data: {
      shopId,
      name: input.name.trim(),
      category: input.category.trim(),
      quantity: input.quantity,
      unit: input.unit,
      purchaseUnitPrice,
      sellingUnitPrice: input.sellingUnitPrice,
    },
    permissions: testPermissions,
  });

  await Promise.all([
    tablesDb.createRow({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: APPWRITE_TABLES.stockMovements,
      rowId: ID.unique(),
      data: {
        shopId,
        productId: product.$id,
        productName: product.name,
        type: 'initial',
        quantity: product.quantity,
        unit: product.unit,
        unitCost: product.purchaseUnitPrice,
        totalCost: input.purchaseTotal,
        note: 'Stock initial',
      },
      permissions: testPermissions,
    }),
    tablesDb.createRow({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: APPWRITE_TABLES.activityLogs,
      rowId: ID.unique(),
      data: {
        shopId,
        type: 'stock',
        actorName: 'Vendeuse',
        message: `Stock ajoute : ${product.name}`,
      },
      permissions: testPermissions,
    }),
  ]);

  return product;
}

export async function createSale(input: CreateSaleInput, shopId = DEFAULT_SHOP_ID) {
  const product = await tablesDb.getRow<ProductRow>({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: APPWRITE_TABLES.products,
    rowId: input.productId,
  });

  if (input.quantity <= 0) {
    throw new Error('La quantite doit etre superieure a 0.');
  }

  if (input.quantity > product.quantity) {
    throw new Error('Stock insuffisant pour cette vente.');
  }

  const totalAmount = Math.round(input.quantity * product.sellingUnitPrice);
  const remainingQuantity = product.quantity - input.quantity;

  const sale = await tablesDb.createRow({
    databaseId: APPWRITE_DATABASE_ID,
    tableId: APPWRITE_TABLES.sales,
    rowId: ID.unique(),
    data: {
      shopId,
      productId: product.$id,
      productName: product.name,
      quantity: input.quantity,
      unit: product.unit,
      unitPrice: product.sellingUnitPrice,
      totalAmount,
      paymentMethod: input.paymentMethod,
    },
    permissions: testPermissions,
  });

  await Promise.all([
    tablesDb.updateRow<ProductRow>({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: APPWRITE_TABLES.products,
      rowId: product.$id,
      data: {
        quantity: remainingQuantity,
      },
    }),
    tablesDb.createRow({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: APPWRITE_TABLES.stockMovements,
      rowId: ID.unique(),
      data: {
        shopId,
        productId: product.$id,
        productName: product.name,
        type: 'sale',
        quantity: input.quantity,
        unit: product.unit,
        unitCost: product.purchaseUnitPrice,
        totalCost: Math.round(input.quantity * product.purchaseUnitPrice),
        note: `Vente ${input.paymentMethod}`,
      },
      permissions: testPermissions,
    }),
    tablesDb.createRow({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: APPWRITE_TABLES.activityLogs,
      rowId: ID.unique(),
      data: {
        shopId,
        type: 'sale',
        actorName: 'Vendeuse',
        message: `Vente : ${product.name}`,
      },
      permissions: testPermissions,
    }),
  ]);

  return sale;
}

export async function getTodaySummary(shopId = DEFAULT_SHOP_ID): Promise<TodaySummary> {
  try {
    const [salesRows, expenseRows, closureRows] = await Promise.all([
      listRows<SaleRow>(APPWRITE_TABLES.sales),
      listRows<ExpenseRow>(APPWRITE_TABLES.expenses),
      listRows<CashClosureRow>(APPWRITE_TABLES.cashClosures),
    ]);

    const todaySales = salesRows.filter((sale) => sale.shopId === shopId && isToday(rowCreatedAt(sale)));
    const todayExpenses = expenseRows.filter(
      (expense) => expense.shopId === shopId && isToday(rowCreatedAt(expense))
    );
    const todayClosures = closureRows
      .filter((closure) => closure.shopId === shopId && isToday(rowCreatedAt(closure)))
      .sort((a, b) => new Date(rowCreatedAt(b)).getTime() - new Date(rowCreatedAt(a)).getTime());

    const cashSalesAmount = todaySales
      .filter((sale) => sale.paymentMethod === 'Cash')
      .reduce((total, sale) => total + sale.totalAmount, 0);
    const mobileMoneySalesAmount = todaySales
      .filter((sale) => sale.paymentMethod === 'Mobile Money')
      .reduce((total, sale) => total + sale.totalAmount, 0);
    const expensesAmount = todayExpenses.reduce((total, expense) => total + expense.amount, 0);

    return {
      cashSalesAmount,
      mobileMoneySalesAmount,
      expensesAmount,
      physicalCashExpected: cashSalesAmount - expensesAmount,
      salesCount: todaySales.length,
      expensesCount: todayExpenses.length,
      latestCashGap: todayClosures[0]?.cashGap ?? 0,
    };
  } catch (error) {
    console.warn('Unable to load today summary from Appwrite.', error);
    return emptyTodaySummary;
  }
}
