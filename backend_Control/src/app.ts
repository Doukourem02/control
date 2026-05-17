import cors from 'cors';
import express from 'express';

import { activityRouter } from './modules/activity/activity.routes';
import { categoriesRouter } from './modules/categories/categories.routes';
import { cashRouter } from './modules/cash/cash.routes';
import { expensesRouter } from './modules/expenses/expenses.routes';
import { healthRouter } from './modules/health/health.routes';
import { missingRouter } from './modules/missing/missing.routes';
import { productsRouter } from './modules/products/products.routes';
import { salesRouter } from './modules/sales/sales.routes';
import { stockRouter } from './modules/stock/stock.routes';
import { errorHandler } from './middleware/error-handler';

export const app = express();

app.use(cors());
app.use(express.json());

app.use(healthRouter);
app.use(productsRouter);
app.use(stockRouter);
app.use(salesRouter);
app.use(expensesRouter);
app.use(cashRouter);
app.use(missingRouter);
app.use(activityRouter);
app.use(categoriesRouter);

app.use(errorHandler);
