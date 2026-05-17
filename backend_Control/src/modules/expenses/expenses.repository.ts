import { ID, Query, type Models } from 'node-appwrite';
import { COLLECTIONS, DATABASE_ID, databases } from '../../config/appwrite';
import type { ExpenseCategory, ExpenseRow } from '../../types/control';

export type CreateExpenseInput = {
  shopId: string;
  category: ExpenseCategory;
  amount: number;
  note: string;
};

function toExpenseRow(doc: any): ExpenseRow {
  return {
    $id: doc.$id,
    $createdAt: doc.$createdAt,
    $updatedAt: doc.$updatedAt,
    shopId: doc['shopId'] as string,
    category: doc['category'] as ExpenseCategory,
    amount: doc['amount'] as number,
    note: doc['note'] as string,
  };
}

export async function createExpenseRecord(input: CreateExpenseInput): Promise<ExpenseRow> {
  const expenseDoc = await databases.createDocument(DATABASE_ID, COLLECTIONS.expenses, ID.unique(), {
    shopId: input.shopId,
    category: input.category,
    amount: input.amount,
    note: input.note,
  });

  await databases.createDocument(DATABASE_ID, COLLECTIONS.activityLogs, ID.unique(), {
    shopId: input.shopId,
    type: 'expense',
    actorName: 'Vendeuse',
    message: input.note
      ? `Sortie caisse (${input.category}) : ${input.note}`
      : `Sortie caisse : ${input.category}`,
  });

  return toExpenseRow(expenseDoc);
}

export async function listTodayExpensesByShop(shopId: string): Promise<ExpenseRow[]> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.expenses, [
    Query.equal('shopId', shopId),
    Query.greaterThanEqual('$createdAt', startOfToday.toISOString()),
    Query.limit(200),
  ]);

  return response.documents.map(toExpenseRow);
}
