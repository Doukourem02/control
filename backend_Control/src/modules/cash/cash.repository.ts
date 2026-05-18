import { ID, Query, type Models } from 'node-appwrite';
import { COLLECTIONS, DATABASE_ID, databases } from '../../config/appwrite';
import type { CashClosureRow } from '../../types/control';

export type CreateCashClosureInput = {
  shopId: string;
  businessDate: string;
  cashSalesAmount: number;
  mobileMoneySalesAmount: number;
  expensesAmount: number;
  physicalCashExpected: number;
  physicalCashAmount: number;
  cashGap: number;
  note: string;
};

function toCashClosureRow(doc: any): CashClosureRow {
  return {
    $id: doc.$id,
    $createdAt: doc.$createdAt,
    $updatedAt: doc.$updatedAt,
    shopId: doc['shopId'] as string,
    businessDate: doc['businessDate'] as string,
    cashSalesAmount: doc['cashSalesAmount'] as number,
    mobileMoneySalesAmount: doc['mobileMoneySalesAmount'] as number,
    expensesAmount: doc['expensesAmount'] as number,
    physicalCashExpected: doc['physicalCashExpected'] as number,
    physicalCashAmount: doc['physicalCashAmount'] as number,
    cashGap: doc['cashGap'] as number,
    note: doc['note'] as string,
  };
}

export async function createCashClosureRecord(input: CreateCashClosureInput): Promise<CashClosureRow> {
  const closureDoc = await databases.createDocument(DATABASE_ID, COLLECTIONS.cashClosures, ID.unique(), {
    shopId: input.shopId,
    businessDate: input.businessDate,
    cashSalesAmount: input.cashSalesAmount,
    mobileMoneySalesAmount: input.mobileMoneySalesAmount,
    expensesAmount: input.expensesAmount,
    physicalCashExpected: input.physicalCashExpected,
    physicalCashAmount: input.physicalCashAmount,
    cashGap: input.cashGap,
    note: input.note,
  });

  await databases.createDocument(DATABASE_ID, COLLECTIONS.activityLogs, ID.unique(), {
    shopId: input.shopId,
    type: 'cash',
    actorName: 'Vendeuse',
    message: `Cloture caisse : ecart ${input.cashGap} F`,
  });

  return toCashClosureRow(closureDoc);
}

export async function listTodayCashClosuresByShop(shopId: string): Promise<CashClosureRow[]> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.cashClosures, [
    Query.equal('shopId', shopId),
    Query.greaterThanEqual('$createdAt', startOfToday.toISOString()),
    Query.orderDesc('$createdAt'),
    Query.limit(50),
  ]);

  return response.documents.map(toCashClosureRow);
}
