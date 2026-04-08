import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const rels = await prisma.relationship.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({
    items: rels.map((r) => ({
      id: r.id, relationshipId: r.relationshipId,
      sourceType: r.sourceType, sourceName: r.sourceName,
      targetType: r.targetType, targetName: r.targetName,
      relationshipType: r.relationshipType, status: r.status,
    })),
  });
}
