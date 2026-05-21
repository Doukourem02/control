import cors from 'cors';
import express from 'express';

import { activityRouter } from './modules/activity/activity.routes';
import { analyticsRouter } from './modules/analytics/analytics.routes';
import { categoriesRouter } from './modules/categories/categories.routes';
import { cashRouter } from './modules/cash/cash.routes';
import { expensesRouter } from './modules/expenses/expenses.routes';
import { healthRouter } from './modules/health/health.routes';
import { missingRouter } from './modules/missing/missing.routes';
import { exportsRouter } from './modules/exports/exports.routes';
import { teamRouter } from './modules/team/team.routes';
import { notificationsRouter } from './modules/notifications/notifications.routes';
import { productsRouter } from './modules/products/products.routes';
import { salesRouter } from './modules/sales/sales.routes';
import { shopsRouter } from './modules/shops/shops.routes';
import { stockRouter } from './modules/stock/stock.routes';
import { usersRouter } from './modules/users/users.routes';
import { errorHandler } from './middleware/error-handler';
import { requireAuth } from './middleware/auth';

export const app = express();

app.use(cors());
app.use(express.json());

app.use(healthRouter);
app.use(usersRouter);

app.use(requireAuth);

app.use(shopsRouter);
app.use(productsRouter);
app.use(stockRouter);
app.use(salesRouter);
app.use(expensesRouter);
app.use(cashRouter);
app.use(missingRouter);
app.use(activityRouter);
app.use(analyticsRouter);
app.use(categoriesRouter);
app.use(notificationsRouter);
app.use(exportsRouter);
app.use(teamRouter);

app.use(errorHandler);
