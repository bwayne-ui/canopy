import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import type { ReconResult } from '@/lib/tools/reconciliation';

export const runtime = 'nodejs';

function fmtPct(v: number) {
  return `${v.toFixed(1)}%`;
}

export async function POST(req: NextRequest) {
  const body: ReconResult = await req.json();

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Canopy';
  wb.created = new Date();

  const headerStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B3A4B' } },
    alignment: { horizontal: 'center' },
  };

  // ---- Sheet 1: Matched Credits ----
  const ws1 = wb.addWorksheet('Matched Credits');
  ws1.columns = [
    { header: 'Investor', key: 'investor', width: 32 },
    { header: 'Expected Amount', key: 'expectedAmount', width: 18 },
    { header: 'Matched Amount', key: 'matchedAmount', width: 18 },
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'Confidence', key: 'confidence', width: 14 },
    { header: 'Method', key: 'matchMethod', width: 12 },
    { header: 'Reason', key: 'matchReason', width: 40 },
  ];
  ws1.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));
  for (const r of body.matched) {
    ws1.addRow({ ...r, confidence: fmtPct(r.confidence) });
  }

  // ---- Sheet 2: Unplaced Credits ----
  const ws2 = wb.addWorksheet('Unplaced Credits');
  ws2.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Description', key: 'description', width: 50 },
    { header: 'Amount', key: 'amount', width: 16 },
  ];
  ws2.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));
  for (const r of body.unplacedCredits) {
    ws2.addRow(r);
  }

  // ---- Sheet 3: Previously Funded ----
  const ws3 = wb.addWorksheet('Previously Funded');
  ws3.columns = [
    { header: 'Investor', key: 'investor', width: 32 },
    { header: 'Position ID', key: 'positionId', width: 18 },
    { header: 'Amount', key: 'amount', width: 16 },
    { header: 'Notes', key: 'notes', width: 30 },
  ];
  ws3.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));
  for (const r of body.previouslyFunded) {
    ws3.addRow(r);
  }

  // ---- Sheet 4: Still Outstanding ----
  const ws4 = wb.addWorksheet('Still Outstanding');
  ws4.columns = [
    { header: 'Investor', key: 'investor', width: 32 },
    { header: 'Position ID', key: 'positionId', width: 18 },
    { header: 'Expected Amount', key: 'expectedAmount', width: 18 },
  ];
  ws4.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));
  for (const r of body.stillOutstanding) {
    ws4.addRow(r);
  }

  const buf = await wb.xlsx.writeBuffer();
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="recon_results_${ts}.xlsx"`,
    },
  });
}
