import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/reports — list all reports with summary fields
export async function GET() {
  const reports = await prisma.report.findMany({
    orderBy: { reportId: 'asc' },
    include: { _count: { select: { runs: true } } },
  });
  return NextResponse.json({
    items: reports.map((r) => ({
      id: r.id,
      reportId: r.reportId,
      name: r.name,
      description: r.description,
      category: r.category,
      format: r.format,
      frequency: r.frequency,
      recipients: r.recipients,
      querySource: r.querySource,
      ownerName: r.ownerName,
      visibility: r.visibility,
      minGrade: r.minGrade,
      exportFormats: r.exportFormats.split(',').map((s) => s.trim()).filter(Boolean),
      status: r.status,
      version: r.version,
      lastRunAt: r.lastRunAt?.toISOString() ?? null,
      nextRunAt: r.nextRunAt?.toISOString() ?? null,
      runCount: r.runCount,
      tags: r.tags,
      runHistoryCount: r._count.runs,
    })),
  });
}

// POST /api/reports — create a new report
export async function POST(req: Request) {
  const body = await req.json();
  if (!body.name || !body.queryLogic || !body.ownerId) {
    return NextResponse.json({ error: 'name, queryLogic, ownerId required' }, { status: 400 });
  }
  const count = await prisma.report.count();
  const reportId = `RPT-${String(count + 1).padStart(3, '0')}`;
  const created = await prisma.report.create({
    data: {
      reportId,
      name: body.name,
      description: body.description ?? null,
      category: body.category ?? 'Custom',
      format: body.format ?? 'PDF',
      frequency: body.frequency ?? 'On-Demand',
      recipients: body.recipients ?? null,
      querySource: body.querySource ?? 'prisma',
      queryLogic: typeof body.queryLogic === 'string' ? body.queryLogic : JSON.stringify(body.queryLogic),
      parametersSchema: body.parametersSchema ? (typeof body.parametersSchema === 'string' ? body.parametersSchema : JSON.stringify(body.parametersSchema)) : null,
      ownerId: body.ownerId,
      ownerName: body.ownerName ?? null,
      visibility: body.visibility ?? 'Private',
      minGrade: body.minGrade ?? null,
      exportFormats: body.exportFormats ?? 'csv,json,xml,html,xlsx',
      status: 'Draft',
      version: '0.1.0',
    },
  });
  return NextResponse.json({ ok: true, report: created });
}
