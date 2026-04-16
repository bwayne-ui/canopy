import { NextResponse } from 'next/server';
import { prisma as db } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const exceptions = await db.wfException.findMany({
      include: {
        fund: { select: { id: true, name: true, shortName: true } },
        actions: { include: { diuBatches: true } },
      },
      orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
    });
    return NextResponse.json(exceptions);
  } catch (err) {
    console.error('[waterfall/exceptions] GET error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
