import assert from 'node:assert/strict';
import { describe, it, before, mock } from 'node:test';
import { createRequire } from 'node:module';

const req = createRequire(__filename);

type StockService = typeof import('./stock.service');
let getStockMovements: StockService['getStockMovements'];

const listStockMovementsByShop = mock.fn(async (..._args: unknown[]) => [] as unknown[]);

before(() => {
  const repoPath = req.resolve('./stock.repository');
  req.cache[repoPath] = {
    exports: { listStockMovementsByShop },
  } as unknown as NodeJS.Module;

  delete req.cache[req.resolve('./stock.service')];
  ({ getStockMovements } = req('./stock.service') as StockService);
});

describe('stock.service – getStockMovements', () => {
  it('defaults to limit 8 when rawLimit is undefined', async () => {
    listStockMovementsByShop.mock.resetCalls();
    await getStockMovements('shop-1', undefined);
    assert.equal(listStockMovementsByShop.mock.calls[0].arguments[1], 8);
  });

  it('clamps limit to 50 at maximum', async () => {
    listStockMovementsByShop.mock.resetCalls();
    await getStockMovements('shop-1', 9999);
    assert.equal(listStockMovementsByShop.mock.calls[0].arguments[1], 50);
  });

  it('clamps limit to 1 at minimum', async () => {
    listStockMovementsByShop.mock.resetCalls();
    await getStockMovements('shop-1', 0);
    assert.equal(listStockMovementsByShop.mock.calls[0].arguments[1], 1);
  });

  it('passes productId filter to the repository', async () => {
    listStockMovementsByShop.mock.resetCalls();
    await getStockMovements('shop-1', 10, undefined, undefined, 'product-abc');
    assert.equal(listStockMovementsByShop.mock.calls[0].arguments[5], 'product-abc');
  });

  it('trims whitespace from productId filter', async () => {
    listStockMovementsByShop.mock.resetCalls();
    await getStockMovements('shop-1', 10, undefined, undefined, '  p-1  ');
    assert.equal(listStockMovementsByShop.mock.calls[0].arguments[5], 'p-1');
  });

  it('ignores blank productId filter', async () => {
    listStockMovementsByShop.mock.resetCalls();
    await getStockMovements('shop-1', 10, undefined, undefined, '   ');
    assert.equal(listStockMovementsByShop.mock.calls[0].arguments[5], undefined);
  });

  it('passes from/to Date range when date is provided', async () => {
    listStockMovementsByShop.mock.resetCalls();
    await getStockMovements('shop-1', 10, undefined, '2026-05-21');
    const args = listStockMovementsByShop.mock.calls[0].arguments;
    assert.ok(args[3] instanceof Date, 'from devrait être une Date');
    assert.ok(args[4] instanceof Date, 'to devrait être une Date');
    assert.equal((args[3] as Date).getHours(), 0);
    assert.equal((args[4] as Date).getHours(), 23);
  });

  it('passes undefined for date range when no date is provided', async () => {
    listStockMovementsByShop.mock.resetCalls();
    await getStockMovements('shop-1', 10);
    const args = listStockMovementsByShop.mock.calls[0].arguments;
    assert.equal(args[3], undefined);
    assert.equal(args[4], undefined);
  });

  it('passes movement type filter when type is provided', async () => {
    listStockMovementsByShop.mock.resetCalls();
    await getStockMovements('shop-1', 10, 'supply');
    assert.equal(listStockMovementsByShop.mock.calls[0].arguments[2], 'supply');
  });
});
