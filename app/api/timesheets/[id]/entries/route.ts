import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const ts = await prisma.timesheet.findFirst({ where: { OR: [{ id: params.id }, { timesheetId: params.id }] } });
  if (!ts) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (ts.status !== 'Draft' && ts.status !== 'Rejected') {
    return NextResponse.json({ error: 'Cannot edit a submitted/approved timesheet' }, { status: 403 });
  }
  const entry = await prisma.timesheetEntry.create({
    data: {
      timesheetId: ts.id,
      date: new Date(body.date),
      clientName: body.clientName ?? null,
      entityName: body.entityName ?? null,
      projectName: body.projectName ?? null,
      taskCode: body.taskCode ?? null,
      category: body.category ?? 'Billable',
      description: body.description,
      hours: Number(body.hours),
      billable: body.billable ?? true,
      billRate: body.billRate ?? null,
    },
  });
  return NextResponse.json({ ok: true, entry });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const entryId = searchParams.get('entryId');
  if (!entryId) return NextResponse.json({ error: 'entryId required' }, { status: 400 });
  await prisma.timesheetEntry.delete({ where: { id: entryId } });
  return NextResponse.json({ ok: true });
}
