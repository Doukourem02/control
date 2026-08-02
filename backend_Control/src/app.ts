import cors from 'cors';
import express from 'express';

import { activityRouter } from './routes/activityRoutes';
import { analyticsRouter } from './routes/analyticsRoutes';
import { categoriesRouter } from './routes/categoriesRoutes';
import { cashRouter } from './routes/cashRoutes';
import { expensesRouter } from './routes/expensesRoutes';
import { healthRouter } from './routes/healthRoutes';
import { missingRouter } from './routes/missingRoutes';
import { exportsRouter } from './routes/exportsRoutes';
import { teamRouter } from './routes/teamRoutes';
import { notificationsRouter } from './routes/notificationsRoutes';
import { organizationsRouter } from './routes/organizationsRoutes';
import { productsRouter } from './routes/productsRoutes';
import { salesRouter } from './routes/salesRoutes';
import { shopsRouter } from './routes/shopsRoutes';
import { stockRouter } from './routes/stockRoutes';
import { usersRouter } from './routes/usersRoutes';
import { errorHandler } from './middleware/errorHandler';
import { requireAuth } from './middleware/auth';
import { apiVersionAlias } from './middleware/apiVersion';
import { createRateLimiter } from './middleware/rateLimit';

export const app = express();

app.use(cors());
// Limite relevee (defaut 100kb) pour accueillir la photo justificative des
// depenses, envoyee en base64 dans le corps JSON de POST /api/expenses.
app.use(express.json({ limit: '5mb' }));
app.use(apiVersionAlias);
app.use('/api', createRateLimiter());

app.use(healthRouter);
app.use(usersRouter);

app.use(requireAuth);

app.use(shopsRouter);
app.use(organizationsRouter);
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
