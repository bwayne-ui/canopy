import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { toNum } from '@/lib/utils';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');

  let rels;

  if (clientId) {
    // Get all entity IDs belonging to this client
    const entities = await prisma.entity.findMany({
      where: { clientId },
      select: { id: true },
    });
    const entityIds = entities.map((e) => e.id);
    const allIds = [clientId, ...entityIds];

    // Return relationships where either source or target is the client or one of its entities
    rels = await prisma.relationship.findMany({
      where: {
        OR: [
          { sourceId: { in: allIds } },
          { targetId: { in: allIds } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  } else {
    rels = await prisma.relationship.findMany({ orderBy: { createdAt: 'desc' } });
  }

  return NextResponse.json({
    items: rels.map((r) => ({
      id: r.id,
      relationshipId: r.relationshipId,
      sourceType: r.sourceType,
      sourceId: r.sourceId,
      sourceName: r.sourceName,
      targetType: r.targetType,
      targetId: r.targetId,
      targetName: r.targetName,
      relationshipType: r.relationshipType,
      status: r.status,
      ownershipPct: toNum(r.ownershipPct),
    })),
  });
}
