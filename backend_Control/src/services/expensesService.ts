import { AppwriteException, ID, Query, type Models } from 'node-appwrite';
import { BUCKETS, COLLECTIONS, DATABASE_ID, databases } from '../config/appwrite';
import { getPhotoFile, uploadPhoto, decodeBase64Photo } from '../utils/photoStorage';
import { expenseCategories, type ExpenseCategory, type ExpenseRow } from '../types/control';
import { parseAmount, userError } from '../utils/http';

export type CreateExpenseInput = {
  shopId: string;
  category: ExpenseCategory;
  amount: number;
  note: string;
  receiptFileId?: string;
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
    receiptFileId: (doc['receiptFileId'] ?? '') as string,
  };
}

export async function uploadReceiptPhoto(buffer: Buffer, filename: string): Promise<string> {
  return uploadPhoto(BUCKETS.photos, buffer, filename);
}

export async function getReceiptFile(fileId: string): Promise<{ bytes: ArrayBuffer; mimeType: string } | null> {
  return getPhotoFile(BUCKETS.photos, fileId);
}

export async function getExpenseById(expenseId: string): Promise<ExpenseRow | null> {
  try {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.expenses, expenseId);
    return toExpenseRow(doc);
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 404) return null;
    throw error;
  }
}

export async function createExpenseRecord(input: CreateExpenseInput): Promise<ExpenseRow> {
  const expenseDoc = await databases.createDocument(DATABASE_ID, COLLECTIONS.expenses, ID.unique(), {
    shopId: input.shopId,
    category: input.category,
    amount: input.amount,
    note: input.note,
    receiptFileId: input.receiptFileId ?? '',
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

export async function listExpensesInRange(shopId: string, from: Date, to: Date): Promise<ExpenseRow[]> {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.expenses, [
    Query.equal('shopId', shopId),
    Query.greaterThanEqual('$createdAt', from.toISOString()),
    Query.lessThanEqual('$createdAt', to.toISOString()),
    Query.orderAsc('$createdAt'),
    Query.limit(1000),
  ]);

  return response.documents.map(toExpenseRow);
}

const MAX_RECEIPT_BYTES = 4 * 1024 * 1024; // 4 Mo — la photo est deja compressee cote app

function isExpenseCategory(value: unknown): value is ExpenseCategory {
  return typeof value === 'string' && expenseCategories.includes(value as ExpenseCategory);
}

export async function createExpense(body: Record<string, unknown>, shopId: string) {
  const amount = Math.round(parseAmount(body.amount));
  const category = body.category;
  const note = String(body.note ?? '').trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    throw userError('Le montant de la sortie doit etre superieur a 0.', 400, 'EXPENSE_AMOUNT_INVALID');
  }

  if (!isExpenseCategory(category)) {
    throw userError('Selectionne une categorie valide.', 400, 'EXPENSE_CATEGORY_INVALID');
  }

  const receipt = decodeBase64Photo(body.receiptPhoto, body.receiptPhotoType, MAX_RECEIPT_BYTES);
  const receiptFileId = receipt
    ? await uploadReceiptPhoto(receipt.buffer, `${shopId}-${Date.now()}.${receipt.mimeType.split('/')[1] ?? 'jpg'}`)
    : undefined;

  return createExpenseRecord({ shopId, category, amount, note, receiptFileId });
}

export async function getExpenseReceipt(expenseId: string, shopId: string) {
  const expense = await getExpenseById(expenseId);

  if (!expense || expense.shopId !== shopId || !expense.receiptFileId) {
    throw userError('Photo justificative introuvable.', 404, 'EXPENSE_RECEIPT_NOT_FOUND');
  }

  const file = await getReceiptFile(expense.receiptFileId);

  if (!file) {
    throw userError('Photo justificative introuvable.', 404, 'EXPENSE_RECEIPT_NOT_FOUND');
  }

  return file;
}
