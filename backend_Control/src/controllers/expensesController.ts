import type { Request, Response } from 'express';

import { getShopId } from '../utils/http';
import { createExpense, getExpenseReceipt } from '../services/expensesService';

export async function createExpenseController(request: Request, response: Response) {
  const expense = await createExpense(request.body, getShopId(request));

  response.status(201).json({ expense });
}

export async function getExpenseReceiptController(request: Request, response: Response) {
  const shopId = getShopId(request);
  const expenseId = String(request.params['id'] ?? '');
  const file = await getExpenseReceipt(expenseId, shopId);

  response.setHeader('Content-Type', file.mimeType);
  response.end(Buffer.from(file.bytes));
}
