import { NextResponse } from 'next/server';
import { prisma as db } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // Return clients that have at least one entity with carry/waterfall economics
    const clients = await db.client.findMany({
      where: {
        entities: {
          some: {
            carryPct: { not: null },
          },
        },
      },
      select: {
        id: true,
        name: true,
        shortName: true,
        primaryStrategy: true,
        entities: {
          where: { carryPct: { not: null } },
          select: {
            id: true,
            name: true,
            entityId: true,
            strategy: true,
            vintage: true,
            waterfallType: true,
            carryPct: true,
            prefRatePct: true,
            wfFund: { select: { id: true } },
          },
          orderBy: { vintage: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(clients);
  } catch (err) {
    console.error('[waterfall/clients] GET error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
