import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { toNum } from '@/lib/utils';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const ts = await prisma.timesheet.findFirst({
    where: { OR: [{ id: params.id }, { timesheetId: params.id }] },
    include: { entries: { orderBy: { date: 'asc' } } },
  });
  if (!ts) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({
    id: ts.id,
    timesheetId: ts.timesheetId,
    userId: ts.userId,
    userName: ts.userName,
    weekStarting: ts.weekStarting.toISOString().split('T')[0],
    status: ts.status,
    totalHours: toNum(ts.totalHours),
    billableHours: toNum(ts.billableHours),
    utilizationPct: ts.utilizationPct ? toNum(ts.utilizationPct) : null,
    submittedAt: ts.submittedAt?.toISOString() ?? null,
    approvedAt: ts.approvedAt?.toISOString() ?? null,
    approvedByName: ts.approvedByName,
    notes: ts.notes,
    entries: ts.entries.map((e) => ({
      id: e.id,
      date: e.date.toISOString().split('T')[0],
      clientName: e.clientName,
      entityName: e.entityName,
      projectName: e.projectName,
      taskCode: e.taskCode,
      category: e.category,
      description: e.description,
      hours: toNum(e.hours),
      billable: e.billable,
      billRate: e.billRate ? toNum(e.billRate) : null,
      approved: e.approved,
    })),
  });
}

// PATCH — submit / approve / reject + recompute totals
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const ts = await prisma.timesheet.findFirst({ where: { OR: [{ id: params.id }, { timesheetId: params.id }] }, include: { entries: true } });
  if (!ts) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.action === 'submit') { data.status = 'Submitted'; data.submittedAt = new Date(); }
  if (body.action === 'approve') { data.status = 'Approved'; data.approvedAt = new Date(); data.approvedById = body.approverId; data.approvedByName = body.approverName; }
  if (body.action === 'reject') { data.status = 'Rejected'; data.rejectedReason = body.reason ?? 'No reason given'; }

  // Recompute totals from entries
  const total = ts.entries.reduce((s, e) => s + Number(e.hours), 0);
  const billable = ts.entries.filter((e) => e.billable).reduce((s, e) => s + Number(e.hours), 0);
  data.totalHours = total;
  data.billableHours = billable;
  data.utilizationPct = (billable / 40) * 100;

  const updated = await prisma.timesheet.update({ where: { id: ts.id }, data });
  return NextResponse.json({ ok: true, timesheet: updated });
}
