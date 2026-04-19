import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { toNum } from '@/lib/utils';

export async function GET() {
  const [entities, investors, tasks] = await Promise.all([
    prisma.entity.findMany({ include: { client: true }, orderBy: { name: 'asc' } }),
    prisma.investor.groupBy({ by: ['entityName'], _count: { id: true } }),
    prisma.taskAssignment.groupBy({ by: ['entityName'], _count: { id: true } }),
  ]);

  const investorCounts = Object.fromEntries(investors.map((g) => [g.entityName, g._count.id]));
  const taskCounts = Object.fromEntries(tasks.filter((g) => g.entityName).map((g) => [g.entityName!, g._count.id]));

  return NextResponse.json({
    items: entities.map((e) => ({
      id: e.id, entityId: e.entityId, name: e.name, entityType: e.entityType,
      structureType: e.structureType, strategy: e.strategy, clientName: e.client.name,
      domicile: e.domicile, vintage: e.vintage,
      assetClass: e.assetClass, entityRole: e.entityRole, fundStructure: e.fundStructure,
      navMm: toNum(e.navMm),
      commitmentMm: e.commitmentMm ? toNum(e.commitmentMm) : null,
      grossIrrPct: e.grossIrrPct ? toNum(e.grossIrrPct) : null,
      netIrrPct: e.netIrrPct ? toNum(e.netIrrPct) : null,
      lifecycleStatus: e.lifecycleStatus,
      scopeStatus: e.scopeStatus,
      dataQualityScore: e.dataQualityScore ? toNum(e.dataQualityScore) : null,
      investorCount: investorCounts[e.name] ?? 0,
      taskCount: taskCounts[e.name] ?? 0,
    })),
  });
}
