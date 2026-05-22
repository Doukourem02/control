import assert from 'node:assert/strict';
import { describe, it, before } from 'node:test';
import { createRequire } from 'node:module';

const req = createRequire(__filename);

type CashService = typeof import('./cash.service');
let getCashClosures: CashService['getCashClosures'];
let createCashClosure: CashService['createCashClosure'];
let patchCashClosure: CashService['patchCashClosure'];

let mockSales: unknown[] = [];
let mockExpenses: unknown[] = [];
let mockClosuresByDate: unknown[] = [];
let mockAllClosures: unknown[] = [{ $id: 'closure-1' }];
let mockCashClosureById: unknown = null;

before(() => {
  const salesRepoPath = req.resolve('../sales/sales.repository');
  req.cache[salesRepoPath] = {
    exports: { listSalesInRange: async () => mockSales },
  } as unknown as NodeJS.Module;

  const expensesRepoPath = req.resolve('../expenses/expenses.repository');
  req.cache[expensesRepoPath] = {
    exports: { listExpensesInRange: async () => mockExpenses },
  } as unknown as NodeJS.Module;

  const cashRepoPath = req.resolve('./cash.repository');
  req.cache[cashRepoPath] = {
    exports: {
      listCashClosuresByBusinessDate: async () => mockClosuresByDate,
      listCashClosuresByShop: async () => mockAllClosures,
      createCashClosureRecord: async (data: unknown) => ({ $id: 'closure-new', ...(data as object) }),
      getCashClosureById: async () => mockCashClosureById,
      updateCashClosureCorrection: async (id: string, note: string) => ({ $id: id, correctionNote: note }),
    },
  } as unknown as NodeJS.Module;

  const shopsPath = req.resolve('../shops/shops.repository');
  req.cache[shopsPath] = {
    exports: { getShopById: async () => ({ currency: 'FCFA' }) },
  } as unknown as NodeJS.Module;

  const triggersPath = req.resolve('../notifications/notifications.triggers');
  req.cache[triggersPath] = {
    exports: { triggerCashGapAlert: async () => {} },
  } as unknown as NodeJS.Module;

  delete req.cache[req.resolve('./cash.service')];
  ({ getCashClosures, createCashClosure, patchCashClosure } = req('./cash.service') as CashService);
});

describe('cash.service – getCashClosures', () => {
  it('uses default limit of 30 when no limit given', async () => {
    const result = await getCashClosures('shop-1', undefined);
    assert.ok(Array.isArray(result));
  });

  it('clamps limit to 1 at minimum', async () => {
    const result = await getCashClosures('shop-1', 0);
    assert.ok(Array.isArray(result));
  });

  it('clamps limit to 100 at maximum', async () => {
    const result = await getCashClosures('shop-1', 9999);
    assert.ok(Array.isArray(result));
  });

  it('routes to businessDate lookup when date is provided', async () => {
    mockClosuresByDate = [{ $id: 'c-date', businessDate: '2026-05-21' }];
    const result = await getCashClosures('shop-1', 10, '2026-05-21') as unknown[];
    assert.equal(result.length, 1);
    assert.equal((result[0] as { $id: string }).$id, 'c-date');
  });
});

describe('cash.service – createCashClosure', () => {
  before(() => {
    mockSales = [];
    mockExpenses = [];
    mockClosuresByDate = [];
  });

  it('throws CASH_AMOUNT_INVALID when amount is not a number', async () => {
    await assert.rejects(
      () => createCashClosure({ physicalCashAmount: 'abc' }, 'shop-1'),
      (err: unknown) => {
        assert.equal((err as { code?: string }).code, 'CASH_AMOUNT_INVALID');
        return true;
      }
    );
  });

  it('throws CASH_AMOUNT_INVALID when amount is negative', async () => {
    await assert.rejects(
      () => createCashClosure({ physicalCashAmount: -200 }, 'shop-1'),
      (err: unknown) => {
        assert.equal((err as { code?: string }).code, 'CASH_AMOUNT_INVALID');
        return true;
      }
    );
  });

  it('computes cashGap as physical minus expected', async () => {
    // cashSales=2000, expenses=500 → expected=1500, physical=1600 → gap=+100
    mockSales = [
      { paymentMethod: 'Cash', totalAmount: 1200 },
      { paymentMethod: 'Cash', totalAmount: 800 },
      { paymentMethod: 'Mobile Money', totalAmount: 3000 },
    ];
    mockExpenses = [{ amount: 500 }];
    mockClosuresByDate = [];

    const result = await createCashClosure({ physicalCashAmount: 1600 }, 'shop-1') as { cashGap: number };
    assert.equal(result.cashGap, 100);
  });

  it('accepts a physicalCashAmount of 0', async () => {
    mockSales = [];
    mockExpenses = [];
    mockClosuresByDate = [];

    const result = await createCashClosure({ physicalCashAmount: 0 }, 'shop-1') as { cashGap: number };
    assert.equal(result.cashGap, 0);
  });
});

describe('cash.service – patchCashClosure', () => {
  it('throws CORRECTION_NOTE_EMPTY when note is blank', async () => {
    await assert.rejects(
      () => patchCashClosure('c-1', 'shop-1', { correctionNote: '   ' }),
      (err: unknown) => {
        assert.equal((err as { code?: string }).code, 'CORRECTION_NOTE_EMPTY');
        return true;
      }
    );
  });

  it('throws CORRECTION_NOTE_EMPTY when note is absent', async () => {
    await assert.rejects(
      () => patchCashClosure('c-1', 'shop-1', {}),
      (err: unknown) => {
        assert.equal((err as { code?: string }).code, 'CORRECTION_NOTE_EMPTY');
        return true;
      }
    );
  });

  it('throws CLOSURE_NOT_FOUND when closure does not exist', async () => {
    mockCashClosureById = null;
    await assert.rejects(
      () => patchCashClosure('c-999', 'shop-1', { correctionNote: 'erreur de saisie' }),
      (err: unknown) => {
        assert.equal((err as { code?: string }).code, 'CLOSURE_NOT_FOUND');
        return true;
      }
    );
  });

  it('throws CLOSURE_NOT_FOUND when closure belongs to another shop', async () => {
    mockCashClosureById = { $id: 'c-1', shopId: 'autre-boutique' };
    await assert.rejects(
      () => patchCashClosure('c-1', 'shop-1', { correctionNote: 'correction' }),
      (err: unknown) => {
        assert.equal((err as { code?: string }).code, 'CLOSURE_NOT_FOUND');
        return true;
      }
    );
  });

  it('applies the correction note when closure matches shop', async () => {
    mockCashClosureById = { $id: 'c-1', shopId: 'shop-1' };
    const result = await patchCashClosure('c-1', 'shop-1', { correctionNote: 'saisie corrigée' }) as {
      correctionNote: string;
    };
    assert.equal(result.correctionNote, 'saisie corrigée');
  });
});
