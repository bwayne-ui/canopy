import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { toNum } from '@/lib/utils';

// GET /api/timesheets?userId=...&status=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const where: Record<string, unknown> = {};
  const userId = searchParams.get('userId');
  const status = searchParams.get('status');
  if (userId) where.userId = userId;
  if (status) where.status = status;

  const sheets = await prisma.timesheet.findMany({
    where,
    orderBy: { weekStarting: 'desc' },
    include: { _count: { select: { entries: true } } },
  });
  return NextResponse.json({
    items: sheets.map((s) => ({
      id: s.id,
      timesheetId: s.timesheetId,
      userId: s.userId,
      userName: s.userName,
      weekStarting: s.weekStarting.toISOString().split('T')[0],
      status: s.status,
      totalHours: toNum(s.totalHours),
      billableHours: toNum(s.billableHours),
      utilizationPct: s.utilizationPct ? toNum(s.utilizationPct) : null,
      entryCount: s._count.entries,
      submittedAt: s.submittedAt?.toISOString() ?? null,
      approvedAt: s.approvedAt?.toISOString() ?? null,
      approvedByName: s.approvedByName,
    })),
  });
}

// POST /api/timesheets — create new draft
export async function POST(req: Request) {
  const body = await req.json();
  const count = await prisma.timesheet.count();
  const ts = await prisma.timesheet.create({
    data: {
      timesheetId: `TS-${String(count + 1).padStart(4, '0')}`,
      userId: body.userId,
      userName: body.userName,
      weekStarting: new Date(body.weekStarting),
      status: 'Draft',
    },
  });
  return NextResponse.json({ ok: true, timesheet: ts });
}
