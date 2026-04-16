import { NextResponse } from 'next/server';
import { prisma as db } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const logs = await db.wfAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json(logs);
  } catch (err) {
    console.error('[waterfall/audit] GET error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
