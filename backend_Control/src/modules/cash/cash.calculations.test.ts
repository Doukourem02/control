import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { CashClosureRow, ExpenseRow, SaleRow } from '../../types/control';
import { buildTodaySummary, getBusinessDateKey, getBusinessDateRange } from './cash.calculations';

function sale(paymentMethod: SaleRow['paymentMethod'], totalAmount: number): SaleRow {
  return {
    $id: `${paymentMethod}-${totalAmount}`,
    $createdAt: '2026-05-21T09:00:00.000Z',
    $updatedAt: '2026-05-21T09:00:00.000Z',
    shopId: 'shop-1',
    productId: 'product-1',
    productName: 'Produit',
    quantity: 1,
    unit: 'piece',
    unitPrice: totalAmount,
    totalAmount,
    paymentMethod,
  };
}

function expense(amount: number): ExpenseRow {
  return {
    $id: `expense-${amount}`,
    $createdAt: '2026-05-21T10:00:00.000Z',
    $updatedAt: '2026-05-21T10:00:00.000Z',
    shopId: 'shop-1',
    category: 'transport',
    amount,
    note: '',
  };
}

function closure(cashGap: number): CashClosureRow {
  return {
    $id: `closure-${cashGap}`,
    $createdAt: '2026-05-21T20:00:00.000Z',
    $updatedAt: '2026-05-21T20:00:00.000Z',
    shopId: 'shop-1',
    businessDate: '2026-05-21',
    cashSalesAmount: 0,
    mobileMoneySalesAmount: 0,
    expensesAmount: 0,
    physicalCashExpected: 0,
    physicalCashActual: 0,
    cashGap,
    note: '',
  };
}

describe('cash calculations', () => {
  it('builds the daily summary from sales, expenses, and closures', () => {
    const summary = buildTodaySummary(
      [sale('Cash', 1200), sale('Mobile Money', 4500), sale('Cash', 800)],
      [expense(300), expense(200)],
      [closure(-100), closure(50)]
    );

    assert.deepEqual(summary, {
      cashSalesAmount: 2000,
      mobileMoneySalesAmount: 4500,
      expensesAmount: 500,
      physicalCashExpected: 1500,
      salesCount: 3,
      expensesCount: 2,
      latestCashGap: -100,
      closureCount: 2,
      isClosed: true,
    });
  });

  it('returns an open empty summary when no activity exists', () => {
    assert.deepEqual(buildTodaySummary([], [], []), {
      cashSalesAmount: 0,
      mobileMoneySalesAmount: 0,
      expensesAmount: 0,
      physicalCashExpected: 0,
      salesCount: 0,
      expensesCount: 0,
      latestCashGap: 0,
      closureCount: 0,
      isClosed: false,
    });
  });

  it('normalizes valid, missing, and invalid business dates', () => {
    const fallback = new Date('2026-05-21T08:30:00');

    assert.equal(getBusinessDateKey('2026-04-03', fallback), '2026-04-03');
    assert.equal(getBusinessDateKey(undefined, fallback), '2026-05-21');
    assert.equal(getBusinessDateKey('date-invalide', fallback), '2026-05-21');
  });

  it('builds a full-day local range for a business date', () => {
    const range = getBusinessDateRange('2026-05-21');

    assert.equal(range.businessDate, '2026-05-21');
    assert.equal(range.from.getHours(), 0);
    assert.equal(range.from.getMinutes(), 0);
    assert.equal(range.to.getHours(), 23);
    assert.equal(range.to.getMinutes(), 59);
    assert.equal(range.to.getSeconds(), 59);
    assert.equal(range.to.getMilliseconds(), 999);
  });
});
