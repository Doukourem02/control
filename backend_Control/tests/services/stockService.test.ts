import assert from 'node:assert/strict';
import { describe, it, before, mock } from 'node:test';
import { createRequire } from 'node:module';

const req = createRequire(__filename);

type StockService = typeof import('../../src/services/stockService');
let getStockMovements: StockService['getStockMovements'];

const STOCK_MOVEMENTS = 'stock_movements';

function parseQueries(queries: unknown[]): { method: string; attribute?: string; values: unknown[] }[] {
  return (queries as string[]).map((q) => JSON.parse(q));
}

function findQuery(queries: unknown[], method: string, attribute?: string) {
  return parseQueries(queries).find((q) => q.method === method && (attribute === undefined || q.attribute === attribute));
}

// stock.repository a ete fusionne dans stock.service : listStockMovementsByShop
// n'est plus un module a part a espionner, on espionne le client Appwrite.
const listDocuments = mock.fn(async (..._args: unknown[]) => ({ documents: [] as unknown[] }));

before(() => {
  const appwritePath = req.resolve('../../src/config/appwrite');
  req.cache[appwritePath] = {
    exports: {
      DATABASE_ID: 'db-test',
      COLLECTIONS: { stockMovements: STOCK_MOVEMENTS },
      databases: { listDocuments },
    },
  } as unknown as NodeJS.Module;

  delete req.cache[req.resolve('../../src/services/stockService')];
  ({ getStockMovements } = req('../../src/services/stockService') as StockService);
});

describe('stock.service – getStockMovements', () => {
  it('defaults to limit 8 when rawLimit is undefined', async () => {
    listDocuments.mock.resetCalls();
    await getStockMovements('shop-1', undefined);
    const queries = listDocuments.mock.calls[0].arguments[2] as unknown[];
    assert.equal(findQuery(queries, 'limit')?.values[0], 8);
  });

  it('clamps limit to 50 at maximum', async () => {
    listDocuments.mock.resetCalls();
    await getStockMovements('shop-1', 9999);
    const queries = listDocuments.mock.calls[0].arguments[2] as unknown[];
    assert.equal(findQuery(queries, 'limit')?.values[0], 50);
  });

  it('clamps limit to 1 at minimum', async () => {
    listDocuments.mock.resetCalls();
    await getStockMovements('shop-1', 0);
    const queries = listDocuments.mock.calls[0].arguments[2] as unknown[];
    assert.equal(findQuery(queries, 'limit')?.values[0], 1);
  });

  it('passes productId filter to the database query', async () => {
    listDocuments.mock.resetCalls();
    await getStockMovements('shop-1', 10, undefined, undefined, 'product-abc');
    const queries = listDocuments.mock.calls[0].arguments[2] as unknown[];
    assert.equal(findQuery(queries, 'equal', 'productId')?.values[0], 'product-abc');
  });

  it('trims whitespace from productId filter', async () => {
    listDocuments.mock.resetCalls();
    await getStockMovements('shop-1', 10, undefined, undefined, '  p-1  ');
    const queries = listDocuments.mock.calls[0].arguments[2] as unknown[];
    assert.equal(findQuery(queries, 'equal', 'productId')?.values[0], 'p-1');
  });

  it('ignores blank productId filter', async () => {
    listDocuments.mock.resetCalls();
    await getStockMovements('shop-1', 10, undefined, undefined, '   ');
    const queries = listDocuments.mock.calls[0].arguments[2] as unknown[];
    assert.equal(findQuery(queries, 'equal', 'productId'), undefined);
  });

  it('passes from/to Date range when date is provided', async () => {
    listDocuments.mock.resetCalls();
    await getStockMovements('shop-1', 10, undefined, '2026-05-21');
    const queries = listDocuments.mock.calls[0].arguments[2] as unknown[];
    assert.ok(findQuery(queries, 'greaterThanEqual', '$createdAt'), 'devrait filtrer a partir du debut de journee');
    assert.ok(findQuery(queries, 'lessThanEqual', '$createdAt'), 'devrait filtrer jusqu\'a la fin de journee');
  });

  it('passes undefined for date range when no date is provided', async () => {
    listDocuments.mock.resetCalls();
    await getStockMovements('shop-1', 10);
    const queries = listDocuments.mock.calls[0].arguments[2] as unknown[];
    assert.equal(findQuery(queries, 'greaterThanEqual', '$createdAt'), undefined);
    assert.equal(findQuery(queries, 'lessThanEqual', '$createdAt'), undefined);
  });

  it('passes movement type filter when type is provided', async () => {
    listDocuments.mock.resetCalls();
    await getStockMovements('shop-1', 10, 'supply');
    const queries = listDocuments.mock.calls[0].arguments[2] as unknown[];
    assert.equal(findQuery(queries, 'equal', 'type')?.values[0], 'supply');
  });
});
