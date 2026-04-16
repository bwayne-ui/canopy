import { NextRequest, NextResponse } from 'next/server';
import { prisma as db } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: { fundId: string } }) {
  try {
    const fund = await db.wfFund.findUnique({
      where: { id: params.fundId },
      include: {
        entity: {
          select: {
            id: true,
            name: true,
            entityId: true,
            client: { select: { id: true, name: true, shortName: true } },
          },
        },
        terms: true,
        waterfallSteps: { orderBy: { stepOrder: 'asc' } },
        investors: { orderBy: { commitment: 'desc' } },
        navSnapshots: { orderBy: { snapshotDate: 'asc' } },
        exceptions: {
          include: { actions: { include: { diuBatches: true } } },
          orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
        },
      },
    });
    if (!fund) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(fund);
  } catch (err) {
    console.error('[waterfall/funds/[fundId]] GET error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
