import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { toNum } from '@/lib/utils';

export async function GET() {
  const clients = await prisma.client.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json({
    items: clients.map((c) => ({
      id: c.id, name: c.name, shortName: c.shortName,
      primaryStrategy: c.primaryStrategy, strategy: c.primaryStrategy,
      hqCity: c.hqCity, region: c.region, status: c.status,
      totalEntities: c.totalEntities, entities: c.totalEntities,
      totalNavMm: toNum(c.totalNavMm),
      totalCommitmentMm: toNum(c.totalCommitmentMm),
      revenueL12m: toNum(c.revenueL12m), marginPct: toNum(c.marginPct), teamLead: c.teamLead,
      aumMm: c.aumMm, relationshipStage: c.relationshipStage, churnReason: c.churnReason,
      accountExecutive: c.accountExecutive,
    })),
  });
}
