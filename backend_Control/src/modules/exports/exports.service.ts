import PDFDocument from 'pdfkit';
import { listExpensesInRange } from '../expenses/expenses.repository';
import { listCashClosuresByBusinessDate } from '../cash/cash.repository';
import { listSalesInRange } from '../sales/sales.repository';
import { getShopById } from '../shops/shops.repository';

function parseDateKey(date: string): { from: Date; to: Date } {
  const from = new Date(`${date}T00:00:00`);
  const to = new Date(`${date}T23:59:59.999`);
  return { from, to };
}

function parseRangeKey(from: string, to: string): { from: Date; to: Date } {
  return {
    from: new Date(`${from}T00:00:00`),
    to: new Date(`${to}T23:59:59.999`),
  };
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function fmt(amount: number, currency: string): string {
  return `${amount.toLocaleString('fr-FR')} ${currency}`;
}

export async function generateDailyPDF(shopId: string, date: string): Promise<Buffer> {
  const { from, to } = parseDateKey(date);

  const [shop, sales, expenses, closures] = await Promise.all([
    getShopById(shopId),
    listSalesInRange(shopId, from, to),
    listExpensesInRange(shopId, from, to),
    listCashClosuresByBusinessDate(shopId, date),
  ]);

  const currency = shop?.currency ?? 'FCFA';
  const shopName = shop?.name ?? 'Boutique';

  const totalCash = sales.filter((s) => s.paymentMethod === 'Cash').reduce((sum, s) => sum + s.totalAmount, 0);
  const totalMobileMoney = sales.filter((s) => s.paymentMethod === 'Mobile Money').reduce((sum, s) => sum + s.totalAmount, 0);
  const totalSales = totalCash + totalMobileMoney;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const physicalExpected = totalCash - totalExpenses;
  const closure = closures[0] ?? null;

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: 'A4' });
    const buffers: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const gray = '#666666';
    const dark = '#111111';
    const light = '#EEEEEE';

    // ── Header ──────────────────────────────────────────────────────────────
    doc.fontSize(20).fillColor(dark).font('Helvetica-Bold').text('BILAN JOURNALIER', { align: 'center' });
    doc.fontSize(12).fillColor(gray).font('Helvetica').text(shopName, { align: 'center' });
    doc.fontSize(11).fillColor(gray).text(`Date : ${date}`, { align: 'center' });
    doc.moveDown(1.2);

    // ── Section helper ───────────────────────────────────────────────────────
    function section(title: string) {
      doc.moveTo(48, doc.y).lineTo(547, doc.y).strokeColor(light).lineWidth(1).stroke();
      doc.moveDown(0.4);
      doc.fontSize(13).fillColor(dark).font('Helvetica-Bold').text(title.toUpperCase());
      doc.moveDown(0.3);
    }

    function row(label: string, value: string, bold = false) {
      const y = doc.y;
      doc.fontSize(10).fillColor(gray).font('Helvetica').text(label, 48, y, { width: 300 });
      doc.fontSize(10).fillColor(dark).font(bold ? 'Helvetica-Bold' : 'Helvetica').text(value, 350, y, { width: 197, align: 'right' });
      doc.moveDown(0.35);
    }

    // ── Ventes ───────────────────────────────────────────────────────────────
    section('Ventes');
    row('Ventes Cash', fmt(totalCash, currency));
    row('Ventes Mobile Money', fmt(totalMobileMoney, currency));
    row('Total ventes', fmt(totalSales, currency), true);
    row('Nombre de ventes', `${sales.length}`);
    doc.moveDown(0.6);

    if (sales.length > 0) {
      doc.fontSize(9).fillColor(gray).font('Helvetica-Bold')
        .text('HEURE', 48, doc.y, { width: 50 })
        .text('PRODUIT', 100, doc.y - doc.currentLineHeight(), { width: 200 })
        .text('QTÉ', 300, doc.y - doc.currentLineHeight(), { width: 60, align: 'right' })
        .text('PRIX', 362, doc.y - doc.currentLineHeight(), { width: 80, align: 'right' })
        .text('MODE', 444, doc.y - doc.currentLineHeight(), { width: 103, align: 'right' });
      doc.moveDown(0.2);
      doc.moveTo(48, doc.y).lineTo(547, doc.y).strokeColor(light).lineWidth(0.5).stroke();
      doc.moveDown(0.2);

      for (const s of sales) {
        doc.fontSize(9).fillColor(dark).font('Helvetica')
          .text(formatTime(s.$createdAt), 48, doc.y, { width: 50 })
          .text(s.productName, 100, doc.y - doc.currentLineHeight(), { width: 200 })
          .text(`${s.quantity}`, 300, doc.y - doc.currentLineHeight(), { width: 60, align: 'right' })
          .text(fmt(s.unitPrice, ''), 362, doc.y - doc.currentLineHeight(), { width: 80, align: 'right' })
          .text(s.paymentMethod, 444, doc.y - doc.currentLineHeight(), { width: 103, align: 'right' });
        doc.moveDown(0.2);
      }
    }

    doc.moveDown(0.8);

    // ── Dépenses ─────────────────────────────────────────────────────────────
    section('Dépenses');
    row('Total dépenses', fmt(totalExpenses, currency), true);
    row('Nombre de dépenses', `${expenses.length}`);
    doc.moveDown(0.6);

    if (expenses.length > 0) {
      doc.fontSize(9).fillColor(gray).font('Helvetica-Bold')
        .text('HEURE', 48, doc.y, { width: 50 })
        .text('CATÉGORIE', 100, doc.y - doc.currentLineHeight(), { width: 250 })
        .text('MONTANT', 350, doc.y - doc.currentLineHeight(), { width: 197, align: 'right' });
      doc.moveDown(0.2);
      doc.moveTo(48, doc.y).lineTo(547, doc.y).strokeColor(light).lineWidth(0.5).stroke();
      doc.moveDown(0.2);

      for (const e of expenses) {
        const label = e.note ? `${e.category} — ${e.note}` : e.category;
        doc.fontSize(9).fillColor(dark).font('Helvetica')
          .text(formatTime(e.$createdAt), 48, doc.y, { width: 50 })
          .text(label, 100, doc.y - doc.currentLineHeight(), { width: 250 })
          .text(fmt(e.amount, currency), 350, doc.y - doc.currentLineHeight(), { width: 197, align: 'right' });
        doc.moveDown(0.2);
      }
    }

    doc.moveDown(0.8);

    // ── Clôture caisse ───────────────────────────────────────────────────────
    section('Clôture caisse');
    if (closure) {
      row('Espèces attendues', fmt(closure.physicalCashExpected, currency));
      row('Espèces comptées', fmt(closure.physicalCashActual, currency));
      const gap = closure.cashGap;
      row('Écart', (gap >= 0 ? '+' : '') + fmt(gap, currency), true);
      if (closure.note) row('Note', closure.note);
    } else {
      row('Espèces attendues', fmt(physicalExpected, currency));
      doc.fontSize(10).fillColor(gray).font('Helvetica-BoldOblique').text('Journée non clôturée');
    }

    doc.moveDown(1.5);

    // ── Footer ───────────────────────────────────────────────────────────────
    doc.fontSize(8).fillColor('#AAAAAA').font('Helvetica')
      .text(`Généré par CONTROL · ${new Date().toLocaleString('fr-FR')}`, { align: 'center' });

    doc.end();
  });
}

export async function generateHistoryCSV(shopId: string, from: string, to: string): Promise<string> {
  const { from: fromDate, to: toDate } = parseRangeKey(from, to);

  const [sales, expenses] = await Promise.all([
    listSalesInRange(shopId, fromDate, toDate),
    listExpensesInRange(shopId, fromDate, toDate),
  ]);

  function escape(val: string | number): string {
    const s = String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  const rows: string[] = [
    'Type,Date,Heure,Description,Quantité,Prix unitaire,Montant,Mode de paiement',
  ];

  const allItems: { iso: string; row: string }[] = [];

  for (const s of sales) {
    allItems.push({
      iso: s.$createdAt,
      row: [
        escape('Vente'),
        escape(formatDate(s.$createdAt)),
        escape(formatTime(s.$createdAt)),
        escape(s.productName),
        escape(s.quantity),
        escape(s.unitPrice),
        escape(s.totalAmount),
        escape(s.paymentMethod),
      ].join(','),
    });
  }

  for (const e of expenses) {
    const desc = e.note ? `${e.category} — ${e.note}` : e.category;
    allItems.push({
      iso: e.$createdAt,
      row: [
        escape('Dépense'),
        escape(formatDate(e.$createdAt)),
        escape(formatTime(e.$createdAt)),
        escape(desc),
        escape(''),
        escape(''),
        escape(e.amount),
        escape(''),
      ].join(','),
    });
  }

  allItems.sort((a, b) => a.iso.localeCompare(b.iso));
  for (const item of allItems) rows.push(item.row);

  return rows.join('\n');
}
