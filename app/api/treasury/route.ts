import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { toNum } from '@/lib/utils';

export async function GET() {
  const [accounts, cashFlows] = await Promise.all([
    prisma.treasuryAccount.findMany({ orderBy: { accountName: 'asc' } }),
    prisma.cashFlow.findMany({ orderBy: { transactionDate: 'desc' } }),
  ]);
  return NextResponse.json({
    accounts: accounts.map((a) => ({
      id: a.id, accountId: a.accountId, accountName: a.accountName, accountType: a.accountType,
      institution: a.institution, currentBalance: toNum(a.currentBalance),
      availableBalance: toNum(a.availableBalance), pendingInflows: toNum(a.pendingInflows),
      pendingOutflows: toNum(a.pendingOutflows), entityName: a.entityName, status: a.status,
    })),
    cashFlows: cashFlows.map((cf) => ({
      id: cf.id, cashFlowId: cf.cashFlowId, flowType: cf.flowType, category: cf.category,
      amount: toNum(cf.amount), accountName: cf.accountName, entityName: cf.entityName,
      counterparty: cf.counterparty, description: cf.description,
      transactionDate: cf.transactionDate.toISOString().split('T')[0], status: cf.status,
    })),
  });
}
