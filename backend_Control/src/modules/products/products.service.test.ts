import assert from 'node:assert/strict';
import { describe, it, before } from 'node:test';
import { createRequire } from 'node:module';

const req = createRequire(__filename);

type ProductsService = typeof import('./products.service');
let createOrSupplyProduct: ProductsService['createOrSupplyProduct'];
let updateProduct: ProductsService['updateProduct'];
let archiveProduct: ProductsService['archiveProduct'];

let mockProductById: unknown = null;
let mockHasSales = false;

const BASE_PRODUCT = {
  $id: 'p-1',
  shopId: 'shop-1',
  name: 'Riz',
  category: 'Alimentaire',
  emoji: '🍚',
  stock: 10,
  sellingUnitPrice: 500,
  unit: 'kg',
};

before(() => {
  const salesRepoPath = req.resolve('../sales/sales.repository');
  req.cache[salesRepoPath] = {
    exports: { productHasSales: async () => mockHasSales },
  } as unknown as NodeJS.Module;

  const productsRepoPath = req.resolve('./products.repository');
  req.cache[productsRepoPath] = {
    exports: {
      listProductsByShop: async () => [],
      saveProductSupply: async (data: unknown) => ({ $id: 'p-new', ...(data as object) }),
      getProductById: async () => mockProductById,
      updateProductFields: async (id: string, fields: object) => ({ ...BASE_PRODUCT, $id: id, ...fields }),
      deleteProductById: async () => undefined,
    },
  } as unknown as NodeJS.Module;

  delete req.cache[req.resolve('./products.service')];
  ({ createOrSupplyProduct, updateProduct, archiveProduct } = req('./products.service') as ProductsService);
});

describe('products.service – createOrSupplyProduct', () => {
  it('throws PRODUCT_NAME_CATEGORY_REQUIRED when name is missing for new product', async () => {
    await assert.rejects(
      () => createOrSupplyProduct({ category: 'Alimentaire', quantity: 5, sellingUnitPrice: 500, purchaseTotal: 2000, unit: 'kg' }, 'shop-1'),
      (err: unknown) => {
        assert.equal((err as { code?: string }).code, 'PRODUCT_NAME_CATEGORY_REQUIRED');
        return true;
      }
    );
  });

  it('throws PRODUCT_NAME_CATEGORY_REQUIRED when category is missing for new product', async () => {
    await assert.rejects(
      () => createOrSupplyProduct({ name: 'Riz', quantity: 5, sellingUnitPrice: 500, purchaseTotal: 2000, unit: 'kg' }, 'shop-1'),
      (err: unknown) => {
        assert.equal((err as { code?: string }).code, 'PRODUCT_NAME_CATEGORY_REQUIRED');
        return true;
      }
    );
  });

  it('throws QUANTITY_INVALID when quantity is 0', async () => {
    await assert.rejects(
      () => createOrSupplyProduct({ name: 'Riz', category: 'Alimentaire', quantity: 0, sellingUnitPrice: 500, purchaseTotal: 2000, unit: 'kg' }, 'shop-1'),
      (err: unknown) => {
        assert.equal((err as { code?: string }).code, 'QUANTITY_INVALID');
        return true;
      }
    );
  });

  it('throws QUANTITY_INVALID when quantity is negative', async () => {
    await assert.rejects(
      () => createOrSupplyProduct({ name: 'Riz', category: 'Alimentaire', quantity: -1, sellingUnitPrice: 500, purchaseTotal: 2000, unit: 'kg' }, 'shop-1'),
      (err: unknown) => {
        assert.equal((err as { code?: string }).code, 'QUANTITY_INVALID');
        return true;
      }
    );
  });

  it('throws PURCHASE_TOTAL_INVALID when purchaseTotal is negative', async () => {
    await assert.rejects(
      () => createOrSupplyProduct({ name: 'Riz', category: 'Alimentaire', quantity: 5, sellingUnitPrice: 500, purchaseTotal: -100, unit: 'kg' }, 'shop-1'),
      (err: unknown) => {
        assert.equal((err as { code?: string }).code, 'PURCHASE_TOTAL_INVALID');
        return true;
      }
    );
  });

  it('throws SELLING_PRICE_INVALID when sellingUnitPrice is 0', async () => {
    await assert.rejects(
      () => createOrSupplyProduct({ name: 'Riz', category: 'Alimentaire', quantity: 5, sellingUnitPrice: 0, purchaseTotal: 2000, unit: 'kg' }, 'shop-1'),
      (err: unknown) => {
        assert.equal((err as { code?: string }).code, 'SELLING_PRICE_INVALID');
        return true;
      }
    );
  });

  it('throws UNIT_INVALID when unit is unrecognised for a new product', async () => {
    await assert.rejects(
      () => createOrSupplyProduct({ name: 'Riz', category: 'Alimentaire', quantity: 5, sellingUnitPrice: 500, purchaseTotal: 2000, unit: 'tonne' }, 'shop-1'),
      (err: unknown) => {
        assert.equal((err as { code?: string }).code, 'UNIT_INVALID');
        return true;
      }
    );
  });

  it('creates a new product and returns statusCode 201', async () => {
    const result = await createOrSupplyProduct(
      { name: 'Riz', category: 'Alimentaire', quantity: 10, sellingUnitPrice: 500, purchaseTotal: 3000, unit: 'kg' },
      'shop-1'
    );
    assert.equal(result.statusCode, 201);
  });

  it('supplies an existing product and returns statusCode 200', async () => {
    const result = await createOrSupplyProduct(
      { productId: 'p-1', quantity: 5, sellingUnitPrice: 500, purchaseTotal: 1500 },
      'shop-1'
    );
    assert.equal(result.statusCode, 200);
  });
});

describe('products.service – updateProduct', () => {
  it('throws PRODUCT_NOT_FOUND when product does not exist', async () => {
    mockProductById = null;
    await assert.rejects(
      () => updateProduct('p-999', 'shop-1', { name: 'Nouveau nom' }),
      (err: unknown) => {
        assert.equal((err as { code?: string }).code, 'PRODUCT_NOT_FOUND');
        return true;
      }
    );
  });

  it('throws PRODUCT_NOT_FOUND when product belongs to another shop', async () => {
    mockProductById = { ...BASE_PRODUCT, shopId: 'autre-boutique' };
    await assert.rejects(
      () => updateProduct('p-1', 'shop-1', { name: 'Nouveau nom' }),
      (err: unknown) => {
        assert.equal((err as { code?: string }).code, 'PRODUCT_NOT_FOUND');
        return true;
      }
    );
  });

  it('throws PRODUCT_NAME_REQUIRED when name is an empty string', async () => {
    mockProductById = { ...BASE_PRODUCT };
    await assert.rejects(
      () => updateProduct('p-1', 'shop-1', { name: '   ' }),
      (err: unknown) => {
        assert.equal((err as { code?: string }).code, 'PRODUCT_NAME_REQUIRED');
        return true;
      }
    );
  });

  it('throws SELLING_PRICE_INVALID when price is 0', async () => {
    mockProductById = { ...BASE_PRODUCT };
    await assert.rejects(
      () => updateProduct('p-1', 'shop-1', { sellingUnitPrice: 0 }),
      (err: unknown) => {
        assert.equal((err as { code?: string }).code, 'SELLING_PRICE_INVALID');
        return true;
      }
    );
  });

  it('throws PRODUCT_NO_CHANGES when body has no recognised fields', async () => {
    mockProductById = { ...BASE_PRODUCT };
    await assert.rejects(
      () => updateProduct('p-1', 'shop-1', {}),
      (err: unknown) => {
        assert.equal((err as { code?: string }).code, 'PRODUCT_NO_CHANGES');
        return true;
      }
    );
  });

  it('updates name and returns updated product', async () => {
    mockProductById = { ...BASE_PRODUCT };
    const result = await updateProduct('p-1', 'shop-1', { name: 'Maïs' }) as { name: string };
    assert.equal(result.name, 'Maïs');
  });

  it('updates emoji and price together', async () => {
    mockProductById = { ...BASE_PRODUCT };
    const result = await updateProduct('p-1', 'shop-1', { emoji: '🌽', sellingUnitPrice: 750 }) as {
      emoji: string;
      sellingUnitPrice: number;
    };
    assert.equal(result.emoji, '🌽');
    assert.equal(result.sellingUnitPrice, 750);
  });
});

describe('products.service – archiveProduct', () => {
  it('throws PRODUCT_NOT_FOUND when product does not exist', async () => {
    mockProductById = null;
    await assert.rejects(
      () => archiveProduct('p-999', 'shop-1'),
      (err: unknown) => {
        assert.equal((err as { code?: string }).code, 'PRODUCT_NOT_FOUND');
        return true;
      }
    );
  });

  it('throws PRODUCT_NOT_FOUND when product belongs to another shop', async () => {
    mockProductById = { ...BASE_PRODUCT, shopId: 'autre-boutique' };
    await assert.rejects(
      () => archiveProduct('p-1', 'shop-1'),
      (err: unknown) => {
        assert.equal((err as { code?: string }).code, 'PRODUCT_NOT_FOUND');
        return true;
      }
    );
  });

  it('throws PRODUCT_HAS_SALES when product has recorded sales', async () => {
    mockProductById = { ...BASE_PRODUCT };
    mockHasSales = true;
    try {
      await assert.rejects(
        () => archiveProduct('p-1', 'shop-1'),
        (err: unknown) => {
          assert.equal((err as { code?: string }).code, 'PRODUCT_HAS_SALES');
          return true;
        }
      );
    } finally {
      mockHasSales = false;
    }
  });

  it('deletes the product when it exists and has no sales', async () => {
    mockProductById = { ...BASE_PRODUCT };
    mockHasSales = false;
    await assert.doesNotReject(() => archiveProduct('p-1', 'shop-1'));
  });
});
