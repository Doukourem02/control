import { Router } from 'express';

import { requireOperationalRole } from '../../middleware/roles';
import { createExpenseController, getExpenseReceiptController } from './expenses.controller';

export const expensesRouter = Router();

expensesRouter.get('/api/expenses/:id/receipt', getExpenseReceiptController);
expensesRouter.post('/api/expenses', requireOperationalRole, createExpenseController);
