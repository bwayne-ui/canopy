import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/reports/[id] — full report definition + recent runs
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  // Allow lookup by either DB id or reportId code
  const r = await prisma.report.findFirst({
    where: { OR: [{ id: params.id }, { reportId: params.id }] },
    include: { runs: { orderBy: { startedAt: 'desc' }, take: 20 } },
  });
  if (!r) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({
    ...r,
    parametersSchema: r.parametersSchema ? JSON.parse(r.parametersSchema) : [],
    exportFormats: r.exportFormats.split(',').map((s) => s.trim()).filter(Boolean),
    runs: r.runs.map((run) => ({
      ...run,
      startedAt: run.startedAt.toISOString(),
      finishedAt: run.finishedAt?.toISOString() ?? null,
      parameters: JSON.parse(run.parameters),
    })),
  });
}

// PATCH /api/reports/[id] — edit report definition
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const r = await prisma.report.findFirst({ where: { OR: [{ id: params.id }, { reportId: params.id }] } });
  if (!r) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const updated = await prisma.report.update({
    where: { id: r.id },
    data: {
      name: body.name ?? r.name,
      description: body.description ?? r.description,
      category: body.category ?? r.category,
      format: body.format ?? r.format,
      frequency: body.frequency ?? r.frequency,
      recipients: body.recipients ?? r.recipients,
      querySource: body.querySource ?? r.querySource,
      queryLogic: body.queryLogic !== undefined
        ? (typeof body.queryLogic === 'string' ? body.queryLogic : JSON.stringify(body.queryLogic))
        : r.queryLogic,
      parametersSchema: body.parametersSchema !== undefined
        ? (typeof body.parametersSchema === 'string' ? body.parametersSchema : JSON.stringify(body.parametersSchema))
        : r.parametersSchema,
      visibility: body.visibility ?? r.visibility,
      minGrade: body.minGrade !== undefined ? body.minGrade : r.minGrade,
      exportFormats: body.exportFormats ?? r.exportFormats,
      status: body.status ?? r.status,
      version: body.version ?? r.version,
    },
  });
  return NextResponse.json({ ok: true, report: updated });
}
