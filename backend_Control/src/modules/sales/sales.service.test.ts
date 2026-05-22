import assert from 'node:assert/strict';
import { describe, it, before } from 'node:test';
import { createRequire } from 'node:module';

const req = createRequire(__filename);

type SalesService = typeof import('./sales.service');
let createSale: SalesService['createSale'];

let mockPaymentMethods = 'Cash,Mobile Money';

before(() => {
  const shopsPath = req.resolve('../shops/shops.repository');
  req.cache[shopsPath] = {
    exports: { getShopById: async () => ({ paymentMethods: mockPaymentMethods }) },
  } as unknown as NodeJS.Module;

  const salesRepoPath = req.resolve('./sales.repository');
  req.cache[salesRepoPath] = {
    exports: {
      createSaleRecord: async (data: unknown) => ({ $id: 'sale-1', ...(data as object) }),
      productHasSales: async () => false,
    },
  } as unknown as NodeJS.Module;

  delete req.cache[req.resolve('./sales.service')];
  ({ createSale } = req('./sales.service') as SalesService);
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
