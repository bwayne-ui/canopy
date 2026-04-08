import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { toNum } from '@/lib/utils';

export async function GET() {
  const entities = await prisma.entity.findMany({ include: { client: true }, orderBy: { name: 'asc' } });
  return NextResponse.json({
    items: entities.map((e) => ({
      id: e.id, entityId: e.entityId, name: e.name, entityType: e.entityType,
      strategy: e.strategy, clientName: e.client.name, domicile: e.domicile,
      navMm: toNum(e.navMm), grossIrrPct: e.grossIrrPct ? toNum(e.grossIrrPct) : null,
      netIrrPct: e.netIrrPct ? toNum(e.netIrrPct) : null,
      lifecycleStatus: e.lifecycleStatus,
      dataQualityScore: e.dataQualityScore ? toNum(e.dataQualityScore) : null,
    })),
  });
}
