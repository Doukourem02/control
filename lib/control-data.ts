import { ID, Permission, Query, Role, type Models } from 'react-native-appwrite';

import { APPWRITE_DATABASE_ID, APPWRITE_TABLES, tablesDb } from '@/lib/appwrite';

export const DEFAULT_SHOP_ID = 'default-shop';

type SaleRow = Models.Row & {
  shopId: string;
  totalAmount: number;
  paymentMethod: 'Cash' | 'Mobile Money';
  createdAt: string;
};

type ExpenseRow = Models.Row & {
  shopId: string;
  amount: number;
  createdAt: string;
};

type CashClosureRow = Models.Row & {
  shopId: string;
  cashGap: number;
  createdAt: string;
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
  createdAt: string;
  updatedAt: string;
};

export type CreateProductInput = {
  name: string;
  category: string;
  quantity: number;
  unit: ProductUnit;
  purchaseUnitPrice: number;
  sellingUnitPrice: number;
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
    console.warn('Unable to load products from Appwrite.', error);
    return [];
  }
}

export async function createProduct(input: CreateProductInput, shopId = DEFAULT_SHOP_ID) {
  const now = new Date().toISOString();
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
      purchaseUnitPrice: input.purchaseUnitPrice,
      sellingUnitPrice: input.sellingUnitPrice,
      createdAt: now,
      updatedAt: now,
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
        totalCost: Math.round(product.quantity * product.purchaseUnitPrice),
        note: 'Stock initial',
        createdAt: now,
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
        createdAt: now,
      },
      permissions: testPermissions,
    }),
  ]);

  return product;
}

export async function getTodaySummary(shopId = DEFAULT_SHOP_ID): Promise<TodaySummary> {
  try {
    const [salesRows, expenseRows, closureRows] = await Promise.all([
      listRows<SaleRow>(APPWRITE_TABLES.sales),
      listRows<ExpenseRow>(APPWRITE_TABLES.expenses),
      listRows<CashClosureRow>(APPWRITE_TABLES.cashClosures),
    ]);

    const todaySales = salesRows.filter((sale) => sale.shopId === shopId && isToday(sale.createdAt));
    const todayExpenses = expenseRows.filter(
      (expense) => expense.shopId === shopId && isToday(expense.createdAt)
    );
    const todayClosures = closureRows
      .filter((closure) => closure.shopId === shopId && isToday(closure.createdAt))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
