import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import { createRequire } from 'node:module';
import type { AddressInfo } from 'node:net';
import { after, before, beforeEach, describe, it, mock } from 'node:test';
import type { NextFunction, Request, Response } from 'express';

const req = createRequire(__filename);
const AUTH_SHOP_ID = 'shop-integration';
const NOW = '2026-05-22T10:00:00.000Z';

type JsonResponse = {
  status: number;
  body: any;
};

let server: Server;
let baseUrl = '';

let mockPaymentMethods = 'Cash,Mobile Money';
let mockProducts: unknown[] = [];
let mockProductById: unknown = null;
let mockProductHasSales = false;
let mockSalesInRange: unknown[] = [];
let mockExpensesInRange: unknown[] = [];
let mockClosuresByDate: unknown[] = [];
let mockClosuresByShop: unknown[] = [];
let mockCashClosureById: unknown = null;

function product(overrides: Record<string, unknown> = {}) {
  return {
    $id: 'product-1',
    $createdAt: NOW,
    $updatedAt: NOW,
    shopId: AUTH_SHOP_ID,
    name: 'Riz',
    category: 'Alimentaire',
    emoji: 'box',
    quantity: 10,
    unit: 'kg',
    purchaseUnitPrice: 300,
    sellingUnitPrice: 500,
    ...overrides,
  };
}

function closure(overrides: Record<string, unknown> = {}) {
  return {
    $id: 'closure-1',
    $createdAt: NOW,
    $updatedAt: NOW,
    shopId: AUTH_SHOP_ID,
    businessDate: '2026-05-21',
    cashSalesAmount: 0,
    mobileMoneySalesAmount: 0,
    expensesAmount: 0,
    physicalCashExpected: 0,
    physicalCashActual: 0,
    cashGap: 0,
    note: '',
    correctionNote: '',
    isPartial: false,
    ...overrides,
  };
}

const requireAuth = mock.fn((request: Request, _response: Response, next: NextFunction) => {
  request.auth = {
    userId: 'user-integration',
    email: 'owner@example.com',
    name: 'Owner',
    shopId: AUTH_SHOP_ID,
    sessionSecret: 'test-session',
  };
  next();
});

const getShopById = mock.fn(async (shopId: string) => ({
  $id: shopId,
  $createdAt: NOW,
  $updatedAt: NOW,
  ownerUserId: 'user-integration',
  ownerName: 'Owner',
  name: 'Boutique test',
  currency: 'FCFA',
  contact: '',
  address: '',
  openingHours: '',
  paymentMethods: mockPaymentMethods,
  defaultClosingTime: '20:00',
  amountsVisibleByDefault: 'true',
  displayLanguage: 'fr',
  defaultUnit: 'piece',
  stockLowAlertsEnabled: 'true',
  closureReminderEnabled: 'true',
  cashGapAlertsEnabled: 'true',
  defaultLowStockThreshold: '5',
}));

const listProductsByShop = mock.fn(async (_shopId: string) => mockProducts);
const saveProductSupply = mock.fn(async (input: Record<string, unknown>) => ({
  $id: input.productId || 'product-new',
  $createdAt: NOW,
  $updatedAt: NOW,
  shopId: input.shopId,
  name: input.name || 'Produit existant',
  category: input.category || 'Alimentaire',
  emoji: input.emoji || 'box',
  quantity: input.quantity,
  unit: input.unit || 'kg',
  purchaseUnitPrice: Math.round(Number(input.purchaseTotal) / Number(input.quantity)),
  sellingUnitPrice: input.sellingUnitPrice,
}));
const getProductById = mock.fn(async (_id: string) => mockProductById);
const updateProductFields = mock.fn(async (id: string, fields: Record<string, unknown>) => ({
  ...product({ $id: id }),
  ...fields,
}));
const deleteProductById = mock.fn(async (_id: string) => undefined);

const createSaleRecord = mock.fn(async (input: Record<string, unknown>) => ({
  $id: 'sale-1',
  $createdAt: NOW,
  $updatedAt: NOW,
  productName: 'Riz',
  unit: 'kg',
  unitPrice: 500,
  totalAmount: input.totalAmount ?? 1000,
  ...input,
}));
const listSalesInRange = mock.fn(async (_shopId: string, _from: Date, _to: Date) => mockSalesInRange);
const productHasSales = mock.fn(async (_shopId: string, _productId: string) => mockProductHasSales);

const listExpensesInRange = mock.fn(async (_shopId: string, _from: Date, _to: Date) => mockExpensesInRange);

const listCashClosuresByBusinessDate = mock.fn(
  async (_shopId: string, _businessDate: string) => mockClosuresByDate
);
const listCashClosuresByShop = mock.fn(async (_shopId: string, _limit: number) => mockClosuresByShop);
const createCashClosureRecord = mock.fn(async (input: Record<string, unknown>) => closure(input));
const getCashClosureById = mock.fn(async (_id: string) => mockCashClosureById);
const updateCashClosureCorrection = mock.fn(async (id: string, correctionNote: string) =>
  closure({ $id: id, correctionNote })
);

const triggerClosureReminderIfNeeded = mock.fn(async (_shopId: string) => undefined);
const triggerCashGapAlert = mock.fn(
  async (_shopId: string, _businessDate: string, _cashGap: number, _currency: string) => undefined
);

async function request(method: string, path: string, body?: Record<string, unknown>): Promise<JsonResponse> {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();

  return {
    status: response.status,
    body: text ? JSON.parse(text) : undefined,
  };
}

before(async () => {
  req.cache[req.resolve('../middleware/auth')] = {
    exports: { requireAuth },
  } as unknown as NodeJS.Module;

  req.cache[req.resolve('../modules/shops/shops.repository')] = {
    exports: { getShopById },
  } as unknown as NodeJS.Module;

  req.cache[req.resolve('../modules/products/products.repository')] = {
    exports: {
      listProductsByShop,
      saveProductSupply,
      getProductById,
      updateProductFields,
      deleteProductById,
    },
  } as unknown as NodeJS.Module;

  req.cache[req.resolve('../modules/sales/sales.repository')] = {
    exports: { createSaleRecord, listSalesInRange, productHasSales },
  } as unknown as NodeJS.Module;

  req.cache[req.resolve('../modules/expenses/expenses.repository')] = {
    exports: { listExpensesInRange },
  } as unknown as NodeJS.Module;

  req.cache[req.resolve('../modules/cash/cash.repository')] = {
    exports: {
      listCashClosuresByBusinessDate,
      listCashClosuresByShop,
      createCashClosureRecord,
      getCashClosureById,
      updateCashClosureCorrection,
    },
  } as unknown as NodeJS.Module;

  req.cache[req.resolve('../modules/notifications/notifications.triggers')] = {
    exports: { triggerClosureReminderIfNeeded, triggerCashGapAlert },
  } as unknown as NodeJS.Module;

  delete req.cache[req.resolve('../app')];
  const { app } = req('../app') as typeof import('../app');
  server = createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, resolve);
  });

  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

beforeEach(() => {
  mockPaymentMethods = 'Cash,Mobile Money';
  mockProducts = [product()];
  mockProductById = product();
  mockProductHasSales = false;
  mockSalesInRange = [];
  mockExpensesInRange = [];
  mockClosuresByDate = [];
  mockClosuresByShop = [closure()];
  mockCashClosureById = closure();

  requireAuth.mock.resetCalls();
  getShopById.mock.resetCalls();
  listProductsByShop.mock.resetCalls();
  saveProductSupply.mock.resetCalls();
  getProductById.mock.resetCalls();
  updateProductFields.mock.resetCalls();
  deleteProductById.mock.resetCalls();
  createSaleRecord.mock.resetCalls();
  listSalesInRange.mock.resetCalls();
  productHasSales.mock.resetCalls();
  listExpensesInRange.mock.resetCalls();
  listCashClosuresByBusinessDate.mock.resetCalls();
  listCashClosuresByShop.mock.resetCalls();
  createCashClosureRecord.mock.resetCalls();
  getCashClosureById.mock.resetCalls();
  updateCashClosureCorrection.mock.resetCalls();
  triggerClosureReminderIfNeeded.mock.resetCalls();
  triggerCashGapAlert.mock.resetCalls();
});

describe('critical API routes integration', () => {
  it('POST /api/sales creates a sale through controller, service and repository', async () => {
    const response = await request('POST', '/api/sales', {
      productId: 'product-1',
      quantity: '2',
      paymentMethod: 'Cash',
      totalAmount: 1200,
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.sale.$id, 'sale-1');
    assert.equal(getShopById.mock.calls[0].arguments[0], AUTH_SHOP_ID);
    assert.deepEqual(createSaleRecord.mock.calls[0].arguments[0], {
      shopId: AUTH_SHOP_ID,
      productId: 'product-1',
      quantity: 2,
      totalAmount: 1200,
      paymentMethod: 'Cash',
    });
  });

  it('POST /api/sales returns validation errors through the HTTP error handler', async () => {
    const response = await request('POST', '/api/sales', {
      productId: 'product-1',
      quantity: 1,
      paymentMethod: 'Bitcoin',
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, 'PAYMENT_METHOD_INVALID');
    assert.equal(createSaleRecord.mock.callCount(), 0);
  });

  it('GET /api/products lists products for the authenticated shop', async () => {
    mockProducts = [product({ $id: 'product-2', name: 'Sucre' })];

    const response = await request('GET', '/api/products');

    assert.equal(response.status, 200);
    assert.equal(response.body.products[0].name, 'Sucre');
    assert.equal(listProductsByShop.mock.calls[0].arguments[0], AUTH_SHOP_ID);
  });

  it('GET /api/v1/products keeps the versioned API path compatible', async () => {
    mockProducts = [product({ $id: 'product-v1', name: 'Huile' })];

    const response = await request('GET', '/api/v1/products');

    assert.equal(response.status, 200);
    assert.equal(response.body.products[0].name, 'Huile');
    assert.equal(listProductsByShop.mock.calls[0].arguments[0], AUTH_SHOP_ID);
  });

  it('POST /api/products creates a product and preserves the 201 service status', async () => {
    const response = await request('POST', '/api/products', {
      name: 'Mais',
      category: 'Cereales',
      quantity: 4,
      purchaseTotal: 1200,
      sellingUnitPrice: 500,
      unit: 'kg',
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.product.$id, 'product-new');
    assert.equal(saveProductSupply.mock.calls[0].arguments[0].shopId, AUTH_SHOP_ID);
  });

  it('PATCH /api/products/:id updates an owned product', async () => {
    const response = await request('PATCH', '/api/products/product-1', {
      name: 'Riz local',
      sellingUnitPrice: 650,
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.product.name, 'Riz local');
    assert.equal(getProductById.mock.calls[0].arguments[0], 'product-1');
    assert.deepEqual(updateProductFields.mock.calls[0].arguments[1], {
      name: 'Riz local',
      sellingUnitPrice: 650,
    });
  });

  it('DELETE /api/products/:id archives an owned product with no sales', async () => {
    const response = await request('DELETE', '/api/products/product-1');

    assert.equal(response.status, 204);
    assert.deepEqual(productHasSales.mock.calls[0].arguments, [AUTH_SHOP_ID, 'product-1']);
    assert.equal(deleteProductById.mock.calls[0].arguments[0], 'product-1');
  });

  it('GET /api/summary/today returns a computed cash summary', async () => {
    mockSalesInRange = [
      { paymentMethod: 'Cash', totalAmount: 1200 },
      { paymentMethod: 'Mobile Money', totalAmount: 800 },
    ];
    mockExpensesInRange = [{ amount: 300 }];
    mockClosuresByDate = [];

    const response = await request('GET', '/api/summary/today?date=2026-05-21');

    assert.equal(response.status, 200);
    assert.equal(response.body.summary.cashSalesAmount, 1200);
    assert.equal(response.body.summary.mobileMoneySalesAmount, 800);
    assert.equal(response.body.summary.physicalCashExpected, 900);
    assert.equal(response.body.summary.isClosed, false);
    assert.equal(listSalesInRange.mock.calls[0].arguments[0], AUTH_SHOP_ID);
    assert.equal(listCashClosuresByBusinessDate.mock.calls[0].arguments[1], '2026-05-21');
    assert.equal(triggerClosureReminderIfNeeded.mock.calls[0].arguments[0], AUTH_SHOP_ID);
  });

  it('GET /api/cash-closures uses the dated lookup when date is provided', async () => {
    mockClosuresByDate = [closure({ $id: 'closure-date', businessDate: '2026-05-20' })];

    const response = await request('GET', '/api/cash-closures?date=2026-05-20&limit=10');

    assert.equal(response.status, 200);
    assert.equal(response.body.closures[0].$id, 'closure-date');
    assert.deepEqual(listCashClosuresByBusinessDate.mock.calls[0].arguments, [
      AUTH_SHOP_ID,
      '2026-05-20',
    ]);
    assert.equal(listCashClosuresByShop.mock.callCount(), 0);
  });

  it('POST /api/cash-closures creates a closure with computed cash gap', async () => {
    mockSalesInRange = [
      { paymentMethod: 'Cash', totalAmount: 1500 },
      { paymentMethod: 'Mobile Money', totalAmount: 900 },
    ];
    mockExpensesInRange = [{ amount: 300 }];
    mockClosuresByDate = [];

    const response = await request('POST', '/api/cash-closures', {
      businessDate: '2026-05-21',
      physicalCashAmount: 1300,
      note: 'Comptage soir',
      isPartial: true,
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.closure.physicalCashExpected, 1200);
    assert.equal(response.body.closure.cashGap, 100);
    assert.equal(createCashClosureRecord.mock.calls[0].arguments[0].shopId, AUTH_SHOP_ID);
    assert.deepEqual(triggerCashGapAlert.mock.calls[0].arguments, [
      AUTH_SHOP_ID,
      '2026-05-21',
      100,
      'FCFA',
    ]);
  });

  it('PATCH /api/cash-closures/:id applies a correction note', async () => {
    const response = await request('PATCH', '/api/cash-closures/closure-1', {
      correctionNote: 'Erreur de saisie corrigee',
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.closure.correctionNote, 'Erreur de saisie corrigee');
    assert.equal(getCashClosureById.mock.calls[0].arguments[0], 'closure-1');
    assert.deepEqual(updateCashClosureCorrection.mock.calls[0].arguments, [
      'closure-1',
      'Erreur de saisie corrigee',
    ]);
  });
});
