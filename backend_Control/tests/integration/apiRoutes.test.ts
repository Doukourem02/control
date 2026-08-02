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
    accountRole: 'owner',
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

const triggerClosureReminderIfNeeded = mock.fn(async (_shopId: string) => undefined);
const triggerCashGapAlert = mock.fn(
  async (_shopId: string, _businessDate: string, _cashGap: number, _currency: string) => undefined
);
// createSaleRecord/saveProductSupply/getTodaySummary appellent aussi ces
// declencheurs pour de vrai maintenant (repository fusionne) : il en faut un
// mock pour chacun, meme non asserte, sinon l'appel reel plante.
const triggerStockLowAlert = mock.fn(async () => undefined);
const triggerStockAnomalyAlert = mock.fn(async () => undefined);
const triggerSuspiciousSaleAlert = mock.fn(async () => undefined);
const triggerActivityDropAlert = mock.fn(async () => undefined);

// products/sales/cash/expenses.repository ont ete fusionnes dans leur service
// respectif : on ne peut plus intercepter un module repository a part, on
// simule directement le client Appwrite partage par tous ces services.
const PRODUCTS = 'products';
const SALES = 'sales';
const CASH_CLOSURES = 'cash_closures';
const EXPENSES = 'expenses';

function parseQueries(queries: unknown[]): { method: string; attribute?: string; values: unknown[] }[] {
  return (queries as string[]).map((q) => JSON.parse(q));
}

function findQuery(queries: unknown[], method: string, attribute?: string) {
  return parseQueries(queries).find((q) => q.method === method && (attribute === undefined || q.attribute === attribute));
}

function callsForCollection(spy: { mock: { calls: { arguments: unknown[] }[] } }, collectionId: string) {
  return spy.mock.calls.filter((c) => c.arguments[1] === collectionId);
}

const listDocuments = mock.fn(async (_db: string, collectionId: string, queries: unknown[]) => {
  if (collectionId === PRODUCTS) return { documents: mockProducts };
  if (collectionId === SALES) {
    if (findQuery(queries, 'equal', 'productId')) {
      return { documents: [], total: mockProductHasSales ? 1 : 0 };
    }
    return { documents: mockSalesInRange };
  }
  if (collectionId === EXPENSES) return { documents: mockExpensesInRange };
  if (collectionId === CASH_CLOSURES) {
    const isBusinessDateQuery = Boolean(findQuery(queries, 'equal', 'businessDate'));
    return { documents: isBusinessDateQuery ? mockClosuresByDate : mockClosuresByShop };
  }
  return { documents: [] };
});

const getDocument = mock.fn(async (_db: string, collectionId: string, _id: string) => {
  if (collectionId === PRODUCTS) {
    if (!mockProductById) throw new Error('not found');
    return mockProductById;
  }
  if (collectionId === CASH_CLOSURES) {
    if (!mockCashClosureById) throw new Error('not found');
    return mockCashClosureById;
  }
  throw new Error('not found');
});

const createDocument = mock.fn(
  async (_db: string, collectionId: string, id: string, data: Record<string, unknown>) => {
    if (collectionId === SALES) return { $id: 'sale-1', $createdAt: NOW, $updatedAt: NOW, ...data };
    if (collectionId === PRODUCTS) return { $id: 'product-new', $createdAt: NOW, $updatedAt: NOW, ...data };
    if (collectionId === CASH_CLOSURES) return closure({ ...data });
    return { $id: id || 'generated', $createdAt: NOW, $updatedAt: NOW, ...data };
  }
);

const updateDocument = mock.fn(
  async (_db: string, collectionId: string, id: string, fields: Record<string, unknown>) => {
    if (collectionId === PRODUCTS) return { ...product({ $id: id }), ...fields };
    if (collectionId === CASH_CLOSURES) return closure({ $id: id, ...fields });
    return { $id: id, ...fields };
  }
);

const deleteDocument = mock.fn(async (_db: string, _collectionId: string, _id: string) => undefined);

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
  req.cache[req.resolve('../../src/middleware/auth')] = {
    exports: { requireAuth },
  } as unknown as NodeJS.Module;

  req.cache[req.resolve('../../src/services/shopsService')] = {
    exports: { getShopById },
  } as unknown as NodeJS.Module;

  req.cache[req.resolve('../../src/services/notificationsTriggers')] = {
    exports: {
      triggerClosureReminderIfNeeded,
      triggerCashGapAlert,
      triggerStockLowAlert,
      triggerStockAnomalyAlert,
      triggerSuspiciousSaleAlert,
      triggerActivityDropAlert,
    },
  } as unknown as NodeJS.Module;

  req.cache[req.resolve('../../src/config/appwrite')] = {
    exports: {
      DATABASE_ID: 'db-test',
      COLLECTIONS: { products: PRODUCTS, sales: SALES, cashClosures: CASH_CLOSURES, expenses: EXPENSES },
      databases: { listDocuments, getDocument, createDocument, updateDocument, deleteDocument },
    },
  } as unknown as NodeJS.Module;

  delete req.cache[req.resolve('../../src/app')];
  const { app } = req('../../src/app') as typeof import('../../src/app');
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
  triggerClosureReminderIfNeeded.mock.resetCalls();
  triggerCashGapAlert.mock.resetCalls();
  triggerStockLowAlert.mock.resetCalls();
  triggerStockAnomalyAlert.mock.resetCalls();
  triggerSuspiciousSaleAlert.mock.resetCalls();
  triggerActivityDropAlert.mock.resetCalls();
  listDocuments.mock.resetCalls();
  getDocument.mock.resetCalls();
  createDocument.mock.resetCalls();
  updateDocument.mock.resetCalls();
  deleteDocument.mock.resetCalls();
});

describe('critical API routes integration', () => {
  it('POST /api/sales creates a sale through controller and service', async () => {
    const response = await request('POST', '/api/sales', {
      productId: 'product-1',
      quantity: '2',
      paymentMethod: 'Cash',
      totalAmount: 1200,
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.sale.$id, 'sale-1');
    assert.equal(getShopById.mock.calls[0].arguments[0], AUTH_SHOP_ID);

    const saleCreates = callsForCollection(createDocument, SALES);
    assert.equal(saleCreates.length, 1);
    assert.deepEqual(saleCreates[0].arguments[3], {
      shopId: AUTH_SHOP_ID,
      productId: 'product-1',
      productname: 'Riz',
      quantity: 2,
      unit: 'kg',
      unitPrice: 500,
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
    assert.equal(callsForCollection(createDocument, SALES).length, 0);
  });

  it('GET /api/products lists products for the authenticated shop', async () => {
    mockProducts = [product({ $id: 'product-2', name: 'Sucre' })];

    const response = await request('GET', '/api/products');

    assert.equal(response.status, 200);
    assert.equal(response.body.products[0].name, 'Sucre');
    const listCalls = callsForCollection(listDocuments, PRODUCTS);
    assert.equal(findQuery(listCalls[0].arguments[2] as unknown[], 'equal', 'shopId')?.values[0], AUTH_SHOP_ID);
  });

  it('GET /api/v1/products keeps the versioned API path compatible', async () => {
    mockProducts = [product({ $id: 'product-v1', name: 'Huile' })];

    const response = await request('GET', '/api/v1/products');

    assert.equal(response.status, 200);
    assert.equal(response.body.products[0].name, 'Huile');
    const listCalls = callsForCollection(listDocuments, PRODUCTS);
    assert.equal(findQuery(listCalls[0].arguments[2] as unknown[], 'equal', 'shopId')?.values[0], AUTH_SHOP_ID);
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
    const productCreates = callsForCollection(createDocument, PRODUCTS);
    assert.equal((productCreates[0].arguments[3] as Record<string, unknown>).shopId, AUTH_SHOP_ID);
  });

  it('PATCH /api/products/:id updates an owned product', async () => {
    const response = await request('PATCH', '/api/products/product-1', {
      name: 'Riz local',
      sellingUnitPrice: 650,
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.product.name, 'Riz local');
    const productGets = callsForCollection(getDocument, PRODUCTS);
    assert.equal(productGets[0].arguments[2], 'product-1');
    const productUpdates = callsForCollection(updateDocument, PRODUCTS);
    assert.deepEqual(productUpdates[0].arguments[3], {
      name: 'Riz local',
      sellingUnitPrice: 650,
    });
  });

  it('DELETE /api/products/:id archives an owned product with no sales', async () => {
    const response = await request('DELETE', '/api/products/product-1');

    assert.equal(response.status, 204);
    const salesChecks = callsForCollection(listDocuments, SALES).filter((c) =>
      findQuery(c.arguments[2] as unknown[], 'equal', 'productId')
    );
    assert.equal(salesChecks.length, 1);
    assert.equal(findQuery(salesChecks[0].arguments[2] as unknown[], 'equal', 'shopId')?.values[0], AUTH_SHOP_ID);
    assert.equal(findQuery(salesChecks[0].arguments[2] as unknown[], 'equal', 'productId')?.values[0], 'product-1');
    const productDeletes = callsForCollection(deleteDocument, PRODUCTS);
    assert.equal(productDeletes[0].arguments[2], 'product-1');
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

    const salesRangeCalls = callsForCollection(listDocuments, SALES).filter(
      (c) => !findQuery(c.arguments[2] as unknown[], 'equal', 'productId')
    );
    assert.equal(findQuery(salesRangeCalls[0].arguments[2] as unknown[], 'equal', 'shopId')?.values[0], AUTH_SHOP_ID);

    const closureDateCalls = callsForCollection(listDocuments, CASH_CLOSURES);
    assert.equal(findQuery(closureDateCalls[0].arguments[2] as unknown[], 'equal', 'businessDate')?.values[0], '2026-05-21');
    assert.equal(triggerClosureReminderIfNeeded.mock.calls[0].arguments[0], AUTH_SHOP_ID);
  });

  it('GET /api/cash-closures uses the dated lookup when date is provided', async () => {
    mockClosuresByDate = [closure({ $id: 'closure-date', businessDate: '2026-05-20' })];

    const response = await request('GET', '/api/cash-closures?date=2026-05-20&limit=10');

    assert.equal(response.status, 200);
    assert.equal(response.body.closures[0].$id, 'closure-date');

    const closureCalls = callsForCollection(listDocuments, CASH_CLOSURES);
    assert.equal(closureCalls.length, 1);
    const queries = closureCalls[0].arguments[2] as unknown[];
    assert.equal(findQuery(queries, 'equal', 'shopId')?.values[0], AUTH_SHOP_ID);
    assert.equal(findQuery(queries, 'equal', 'businessDate')?.values[0], '2026-05-20');
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

    const closureCreates = callsForCollection(createDocument, CASH_CLOSURES);
    assert.equal((closureCreates[0].arguments[3] as Record<string, unknown>).shopId, AUTH_SHOP_ID);
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

    const closureGets = callsForCollection(getDocument, CASH_CLOSURES);
    assert.equal(closureGets[0].arguments[2], 'closure-1');

    const closureUpdates = callsForCollection(updateDocument, CASH_CLOSURES);
    assert.equal(closureUpdates[0].arguments[2], 'closure-1');
    assert.equal((closureUpdates[0].arguments[3] as Record<string, unknown>).correctionNote, 'Erreur de saisie corrigee');
  });
});
