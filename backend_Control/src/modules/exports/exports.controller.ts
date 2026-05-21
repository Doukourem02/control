import type { Request, Response } from 'express';
import { generateDailyPDF, generateHistoryCSV } from './exports.service';
import { getShopId } from '../../utils/http';

function isValidDateKey(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

export async function dailyReportHandler(request: Request, response: Response): Promise<void> {
  const shopId = getShopId(request);
  const date = typeof request.query.date === 'string' ? request.query.date : new Date().toISOString().slice(0, 10);

  if (!isValidDateKey(date)) {
    response.status(400).json({ error: 'Date invalide. Format attendu : YYYY-MM-DD.' });
    return;
  }

  const pdf = await generateDailyPDF(shopId, date);

  response.setHeader('Content-Type', 'application/pdf');
  response.setHeader('Content-Disposition', `attachment; filename="bilan-${date}.pdf"`);
  response.setHeader('Content-Length', pdf.length);
  response.end(pdf);
}

export async function historyCSVHandler(request: Request, response: Response): Promise<void> {
  const shopId = getShopId(request);
  const today = new Date().toISOString().slice(0, 10);
  const from = typeof request.query.from === 'string' ? request.query.from : today;
  const to = typeof request.query.to === 'string' ? request.query.to : today;

  if (!isValidDateKey(from) || !isValidDateKey(to)) {
    response.status(400).json({ error: 'Dates invalides. Format attendu : YYYY-MM-DD.' });
    return;
  }

  if (from > to) {
    response.status(400).json({ error: 'La date de début doit être avant la date de fin.' });
    return;
  }

  const csv = await generateHistoryCSV(shopId, from, to);

  response.setHeader('Content-Type', 'text/csv; charset=utf-8');
  response.setHeader('Content-Disposition', `attachment; filename="historique-${from}-${to}.csv"`);
  response.end('﻿' + csv);
}
