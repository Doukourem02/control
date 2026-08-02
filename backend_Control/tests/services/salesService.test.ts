import assert from 'node:assert/strict';
import { describe, it, before } from 'node:test';
import { createRequire } from 'node:module';

const req = createRequire(__filename);

type SalesService = typeof import('../../src/services/salesService');
let createSale: SalesService['createSale'];

let mockPaymentMethods = 'Cash,Mobile Money';

const PRODUCTS = 'products';
const SALES = 'sales';
const STOCK_MOVEMENTS = 'stock_movements';
const ACTIVITY_LOGS = 'activity_logs';

const mockProduct = {
  $id: 'p-1',
  shopId: 'shop-1',
  name: 'Riz',
  unit: 'kg',
  sellingUnitPrice: 3000,
  purchaseUnitPrice: 2000,
  quantity: 100,
};

before(() => {
  const shopsPath = req.resolve('../../src/services/shopsService');
  req.cache[shopsPath] = {
    exports: { getShopById: async () => ({ paymentMethods: mockPaymentMethods }) },
  } as unknown as NodeJS.Module;

  // sales.repository a ete fusionne dans sales.service : on simule
  // directement le client Appwrite plutot qu'un module repository.
  const appwritePath = req.resolve('../../src/config/appwrite');
  req.cache[appwritePath] = {
    exports: {
      DATABASE_ID: 'db-test',
      COLLECTIONS: { products: PRODUCTS, sales: SALES, stockMovements: STOCK_MOVEMENTS, activityLogs: ACTIVITY_LOGS },
      databases: {
        getDocument: async (_db: string, collectionId: string) => {
          if (collectionId === PRODUCTS) return mockProduct;
          throw new Error('unexpected collection');
        },
        createDocument: async (_db: string, collectionId: string, id: string, data: Record<string, unknown>) => {
          if (collectionId === SALES) return { $id: 'sale-1', ...data };
          return { $id: id, ...data };
        },
        updateDocument: async (_db: string, _collectionId: string, id: string, data: Record<string, unknown>) => ({
          $id: id,
          ...data,
        }),
        listDocuments: async () => ({ documents: [], total: 0 }),
      },
    },
  } as unknown as NodeJS.Module;

  delete req.cache[req.resolve('../../src/services/salesService')];
  ({ createSale } = req('../../src/services/salesService') as SalesService);
});

describe('sales.service – createSale', () => {
  it('throws PRODUCT_REQUIRED when productId is empty', async () => {
    await assert.rejects(
      () => createSale({ quantity: 1, paymentMethod: 'Cash' }, 'shop-1'),
      (err: unknown) => {
        assert.equal((err as { code?: string }).code, 'PRODUCT_REQUIRED');
        return true;
      }
    );
  });

  it('throws QUANTITY_INVALID when quantity is 0', async () => {
    await assert.rejects(
      () => createSale({ productId: 'p-1', quantity: 0, paymentMethod: 'Cash' }, 'shop-1'),
      (err: unknown) => {
        assert.equal((err as { code?: string }).code, 'QUANTITY_INVALID');
        return true;
      }
    );
  });

  it('throws QUANTITY_INVALID when quantity is negative', async () => {
    await assert.rejects(
      () => createSale({ productId: 'p-1', quantity: -3, paymentMethod: 'Cash' }, 'shop-1'),
      (err: unknown) => {
        assert.equal((err as { code?: string }).code, 'QUANTITY_INVALID');
        return true;
      }
    );
  });

  it('throws QUANTITY_INVALID when quantity is NaN', async () => {
    await assert.rejects(
      () => createSale({ productId: 'p-1', quantity: 'beaucoup', paymentMethod: 'Cash' }, 'shop-1'),
      (err: unknown) => {
        assert.equal((err as { code?: string }).code, 'QUANTITY_INVALID');
        return true;
      }
    );
  });

  it('throws PAYMENT_METHOD_INVALID for unrecognised payment method', async () => {
    await assert.rejects(
      () => createSale({ productId: 'p-1', quantity: 2, paymentMethod: 'Bitcoin' }, 'shop-1'),
      (err: unknown) => {
        assert.equal((err as { code?: string }).code, 'PAYMENT_METHOD_INVALID');
        return true;
      }
    );
  });

  it('throws PAYMENT_METHOD_DISABLED when method is not enabled in shop', async () => {
    mockPaymentMethods = 'Cash';
    try {
      await assert.rejects(
        () => createSale({ productId: 'p-1', quantity: 1, paymentMethod: 'Mobile Money' }, 'shop-1'),
        (err: unknown) => {
          assert.equal((err as { code?: string }).code, 'PAYMENT_METHOD_DISABLED');
          return true;
        }
      );
    } finally {
      mockPaymentMethods = 'Cash,Mobile Money';
    }
  });

  it('creates a sale with valid input', async () => {
    const result = await createSale(
      { productId: 'p-1', quantity: 3, paymentMethod: 'Cash', totalAmount: 9000 },
      'shop-1'
    ) as { $id: string; productId: string };
    assert.equal(result.$id, 'sale-1');
    assert.equal(result.productId, 'p-1');
  });
});
