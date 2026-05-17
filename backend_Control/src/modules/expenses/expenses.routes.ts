import { Router } from 'express';

import { createExpenseController } from './expenses.controller';

export const expensesRouter = Router();

expensesRouter.post('/api/expenses', createExpenseController);
