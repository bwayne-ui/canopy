import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { toNum } from '@/lib/utils';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: { entities: { orderBy: { name: 'asc' } } },
  });

  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const communications = await prisma.communication.findMany({
    where: { clientName: client.name },
    orderBy: { communicationDate: 'desc' },
    take: 20,
  });

  const relationships = await prisma.relationship.findMany({
    where: { OR: [{ sourceId: client.id }, { targetId: client.id }] },
    orderBy: { createdAt: 'desc' },
  });

  const d = (v: any) => v ? toNum(v) : null;
  const dt = (v: Date | null | undefined) => v?.toISOString().slice(0, 10) ?? null;

  return NextResponse.json({
    client: {
      id: client.id,
      name: client.name,
      shortName: client.shortName,
      primaryStrategy: client.primaryStrategy,
      hqCity: client.hqCity,
      hqCountry: client.hqCountry,
      region: client.region,
      relationshipStart: dt(client.relationshipStart),
      status: client.status,
      totalEntities: client.totalEntities,
      totalNavMm: d(client.totalNavMm),
      totalCommitmentMm: d(client.totalCommitmentMm),
      revenueL12m: d(client.revenueL12m),
      marginPct: d(client.marginPct),
      teamLead: client.teamLead,
      podId: client.podId,
      serviceLine: client.serviceLine,
      yearFounded: client.yearFounded,
      employeeCount: client.employeeCount,
      website: client.website,
      notes: client.notes,
      createdAt: client.createdAt.toISOString(),
    },
    entities: client.entities.map((e) => ({
      entityId: e.entityId,
      name: e.name,
      entityType: e.entityType,
      assetClass: e.assetClass,
      strategy: e.strategy,
      vintage: e.vintage,
      navMm: d(e.navMm),
      commitmentMm: d(e.commitmentMm),
      lifecycleStatus: e.lifecycleStatus,
      dataQualityScore: d(e.dataQualityScore),
    })),
    communications: communications.map((c) => ({
      id: c.id,
      channel: c.channel,
      direction: c.direction,
      subject: c.subject,
      summary: c.summary,
      fromName: c.fromName,
      toName: c.toName,
      entityName: c.entityName,
      sentiment: c.sentiment,
      urgency: c.urgency,
      status: c.status,
      communicationDate: c.communicationDate.toISOString(),
      followUpDate: dt(c.followUpDate),
    })),
    relationships: relationships.map((r) => ({
      id: r.id,
      sourceId: r.sourceId,
      targetId: r.targetId,
      relationshipType: (r as any).relationshipType ?? (r as any).type ?? null,
      description: (r as any).description ?? null,
      strength: (r as any).strength ?? null,
    })),
  });
}
