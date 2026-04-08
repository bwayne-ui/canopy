import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { toNum } from '@/lib/utils';

export async function GET() {
  const securities = await prisma.security.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json({
    items: securities.map((s) => ({
      id: s.id, securityId: s.securityId, name: s.name, securityType: s.securityType,
      ticker: s.ticker, marketValue: s.marketValue ? toNum(s.marketValue) : null,
      costBasis: s.costBasis ? toNum(s.costBasis) : null,
      unrealizedGain: s.unrealizedGain ? toNum(s.unrealizedGain) : null,
      sector: s.sector, currency: s.currency,
    })),
  });
}
