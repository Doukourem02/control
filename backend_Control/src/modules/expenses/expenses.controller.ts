import type { Request, Response } from 'express';

import { getShopId } from '../../utils/http';
import { createExpense } from './expenses.service';

export async function createExpenseController(request: Request, response: Response) {
  const expense = await createExpense(request.body, getShopId(request));

  response.status(201).json({ expense });
}
