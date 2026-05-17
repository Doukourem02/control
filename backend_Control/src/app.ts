import cors from 'cors';
import express from 'express';

import { cashRouter } from './modules/cash/cash.routes';
import { expensesRouter } from './modules/expenses/expenses.routes';
import { healthRouter } from './modules/health/health.routes';
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

app.use(errorHandler);
