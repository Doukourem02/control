import { Router } from 'express';
import { dailyReportHandler, historyCSVHandler } from '../controllers/exportsController';

export const exportsRouter = Router();

exportsRouter.get('/api/exports/daily', dailyReportHandler);
exportsRouter.get('/api/exports/history', historyCSVHandler);
