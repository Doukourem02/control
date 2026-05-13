import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type Product = {
  id: string;
  name: string;
  category: string;
  quantityKg: number;
  purchaseAmount: number;
  salePricePerKg: number;
};

export type Sale = {
  id: string;
  productId: string;
  productName: string;
  quantityKg: number;
  totalAmount: number;
  createdAt: string;
};

export type Expense = {
  id: string;
  type: string;
  amount: number;
  note: string;
  createdAt: string;
};

export type MissingStock = {
  id: string;
  productId: string;
  productName: string;
  quantityKg: number;
  reason: string;
  note: string;
  createdAt: string;
};

export type CashClosing = {
  id: string;
  expectedAmount: number;
  realAmount: number;
  difference: number;
  note: string;
  createdAt: string;
};

type AddStockInput = {
  name: string;
  category: string;
  quantityKg: number;
  purchaseAmount: number;
  salePricePerKg: number;
};

type AddSaleInput = {
  productId: string;
  quantityKg: number;
};

type AddExpenseInput = {
  type: string;
  amount: number;
  note: string;
};

type AddMissingStockInput = {
  productId: string;
  quantityKg: number;
  reason: string;
  note: string;
};

type AddCashClosingInput = {
  expectedAmount: number;
  realAmount: number;
  note: string;
};

type StockStoreValue = {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  missingStocks: MissingStock[];
  cashClosings: CashClosing[];
  totalStockKg: number;
  stockPurchaseValue: number;
  todaySalesAmount: number;
  todayExpensesAmount: number;
  expectedCashAmount: number;
  addStock: (input: AddStockInput) => void;
  addSale: (input: AddSaleInput) => boolean;
  addExpense: (input: AddExpenseInput) => void;
  addMissingStock: (input: AddMissingStockInput) => boolean;
  addCashClosing: (input: AddCashClosingInput) => void;
};

const StockStoreContext = createContext<StockStoreValue | null>(null);

export function StockStoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [missingStocks, setMissingStocks] = useState<MissingStock[]>([]);
  const [cashClosings, setCashClosings] = useState<CashClosing[]>([]);

  const value = useMemo<StockStoreValue>(() => {
    const totalStockKg = products.reduce((sum, product) => sum + product.quantityKg, 0);
    const stockPurchaseValue = products.reduce(
      (sum, product) => sum + product.purchaseAmount,
      0,
    );
    const todaySalesAmount = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const todayExpensesAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const expectedCashAmount = todaySalesAmount - todayExpensesAmount;

    return {
      products,
      sales,
      expenses,
      missingStocks,
      cashClosings,
      totalStockKg,
      stockPurchaseValue,
      todaySalesAmount,
      todayExpensesAmount,
      expectedCashAmount,
      addStock: (input) => {
        setProducts((currentProducts) => [
          {
            id: `${Date.now()}-${input.name}`,
            ...input,
          },
          ...currentProducts,
        ]);
      },
      addSale: ({ productId, quantityKg }) => {
        const product = products.find((item) => item.id === productId);

        if (!product || quantityKg <= 0 || quantityKg > product.quantityKg) {
          return false;
        }

        const sale: Sale = {
          id: `${Date.now()}-${productId}`,
          productId,
          productName: product.name,
          quantityKg,
          totalAmount: quantityKg * product.salePricePerKg,
          createdAt: new Date().toISOString(),
        };

        setProducts((currentProducts) =>
          currentProducts.map((item) =>
            item.id === productId
              ? { ...item, quantityKg: item.quantityKg - quantityKg }
              : item,
          ),
        );
        setSales((currentSales) => [sale, ...currentSales]);

        return true;
      },
      addExpense: (input) => {
        setExpenses((currentExpenses) => [
          {
            id: `${Date.now()}-${input.type}`,
            ...input,
            createdAt: new Date().toISOString(),
          },
          ...currentExpenses,
        ]);
      },
      addMissingStock: ({ productId, quantityKg, reason, note }) => {
        const product = products.find((item) => item.id === productId);

        if (!product || quantityKg <= 0 || quantityKg > product.quantityKg) {
          return false;
        }

        const missingStock: MissingStock = {
          id: `${Date.now()}-${productId}`,
          productId,
          productName: product.name,
          quantityKg,
          reason,
          note,
          createdAt: new Date().toISOString(),
        };

        setProducts((currentProducts) =>
          currentProducts.map((item) =>
            item.id === productId
              ? { ...item, quantityKg: item.quantityKg - quantityKg }
              : item,
          ),
        );
        setMissingStocks((currentMissingStocks) => [missingStock, ...currentMissingStocks]);

        return true;
      },
      addCashClosing: (input) => {
        setCashClosings((currentCashClosings) => [
          {
            id: `${Date.now()}-cash`,
            ...input,
            difference: input.realAmount - input.expectedAmount,
            createdAt: new Date().toISOString(),
          },
          ...currentCashClosings,
        ]);
      },
    };
  }, [products, sales, expenses, missingStocks, cashClosings]);

  return <StockStoreContext.Provider value={value}>{children}</StockStoreContext.Provider>;
}

export function useStockStore() {
  const value = useContext(StockStoreContext);

  if (!value) {
    throw new Error('useStockStore must be used inside StockStoreProvider');
  }

  return value;
}
