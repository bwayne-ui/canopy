import { NextRequest, NextResponse } from 'next/server';
import { prisma as db } from '@/lib/db';

export const runtime = 'nodejs';

function generateDiuCsv(batchRef: string, lines: Array<{
  lineNumber: number;
  entityName: string;
  fundName: string;
  effectiveDate: string;
  transactionDate: string;
  transactionType: string;
  amount: number;
  debitCredit: string;
  investorId: string;
  accountRef: string;
  memo: string;
  externalRef: string;
}>): string {
  const headers = [
    'Line', 'Entity', 'Fund', 'EffDate', 'TxnDate', 'TxnType',
    'Amount', 'DC', 'InvestorID', 'AccountRef', 'Memo', 'ExternalRef',
  ];
  const rows = lines.map((l) =>
    [
      l.lineNumber, l.entityName, l.fundName, l.effectiveDate, l.transactionDate,
      l.transactionType, l.amount.toFixed(2), l.debitCredit, l.investorId,
      l.accountRef, `"${l.memo}"`, l.externalRef,
    ].join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

export async function POST(req: NextRequest) {
  const { exceptionId } = await req.json();

  const exception = await db.wfException.findUniqueOrThrow({
    where: { id: exceptionId },
    include: { fund: { include: { investors: { take: 8 } } } },
  });

  const batchRef = `DIU-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  const effectiveDate = new Date().toISOString().slice(0, 10);
  const txnType =
    exception.exceptionType === 'side_letter_not_applied' ? 'FEE_ADJUSTMENT' :
    exception.exceptionType === 'wrong_sleeve' ? 'SLEEVE_REALLOC' :
    'CORRECTING_ENTRY';

  const lines = exception.fund.investors.map((inv: { id: string }, i: number) => ({
    lineNumber: i + 1,
    entityName: exception.fund.shortName,
    fundName: exception.fund.name,
    effectiveDate,
    transactionDate: effectiveDate,
    transactionType: txnType,
    amount: Math.abs(exception.impactAmount / exception.fund.investors.length),
    debitCredit: 'C' as const,
    investorId: `INV-${inv.id.slice(-6).toUpperCase()}`,
    accountRef: `ACCT-${inv.id.slice(-6).toUpperCase()}`,
    memo: `${exception.title.slice(0, 60)} — ${batchRef}`,
    externalRef: `CWE-${exceptionId.slice(-8).toUpperCase()}`,
  }));

  const fileContent = generateDiuCsv(batchRef, lines);

  let action = await db.wfRecommendedAction.findFirst({
    where: { exceptionId, status: { in: ['pending', 'approved'] } },
  });
  if (!action) {
    action = await db.wfRecommendedAction.create({
      data: {
        exceptionId,
        actionType: 'diu_generation',
        description: `DIU for: ${exception.title}`,
        status: 'pending',
      },
    });
  }

  const batch = await db.wfDiuBatch.create({
    data: {
      actionId: action.id,
      batchRef,
      fundName: exception.fund.name,
      status: 'generated',
      totalLines: lines.length,
      totalAmount: exception.impactAmount,
      fileContent,
      lines: { create: lines },
    },
    include: { lines: true },
  });

  await db.wfException.update({ where: { id: exceptionId }, data: { status: 'in_progress' } });
  await db.wfAuditLog.create({
    data: {
      entityType: 'diu_batch',
      entityId: batch.id,
      action: 'generated',
      note: `DIU ${batchRef} generated for: ${exception.title}`,
    },
  });

  return NextResponse.json(batch);
}
