import { expenseCategories, type ExpenseCategory } from '../../types/control';
import { parseAmount, userError } from '../../utils/http';
import { decodeBase64Photo } from '../../utils/photo-storage';
import {
  createExpenseRecord,
  getExpenseById,
  getReceiptFile,
  uploadReceiptPhoto,
} from './expenses.repository';

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
