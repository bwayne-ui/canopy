import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/reports/[id]/run
// Body: { user: { id, name, role }, parameters: {...} }
// Permission check → optional skill dispatch → create ReportRun row → return result.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const userObj = body.user ?? { id: 'anonymous', name: 'Anonymous', role: 'Guest' };
  const parameters = body.parameters ?? {};

  const r = await prisma.report.findFirst({ where: { OR: [{ id: params.id }, { reportId: params.id }] } });
  if (!r) return NextResponse.json({ error: 'not found' }, { status: 404 });

  // ── Permission gate ────────────────────────────────────────
  // Visibility = Private → only owner can run
  // Visibility = Team/Org/Public → require min role if set
  const isOwner = userObj.id === r.ownerId;
  const roleHierarchy = ['Guest', 'Analyst', 'IR', 'Tax', 'Legal', 'Compliance', 'Treasury', 'Fund Accountant', 'Manager', 'Controller', 'CFO', 'Admin'];
  const userRoleIdx = roleHierarchy.indexOf(userObj.role ?? 'Guest');
  const requiredIdx = r.requiredRole ? roleHierarchy.indexOf(r.requiredRole) : -1;

  let blocked: string | null = null;
  if (r.visibility === 'Private' && !isOwner) blocked = 'Private report — only owner may execute';
  else if (requiredIdx >= 0 && userRoleIdx < requiredIdx)
    blocked = `Requires role ≥ ${r.requiredRole}, you have ${userObj.role}`;

  // Create the run row regardless (for audit) — but mark Blocked when denied.
  const runCount = await prisma.reportRun.count();
  const runId = `RUN-${String(runCount + 1).padStart(4, '0')}`;
  const startedAt = new Date();

  if (blocked) {
    const denied = await prisma.reportRun.create({
      data: {
        runId,
        reportId: r.id,
        triggeredById: userObj.id,
        triggeredBy: userObj.name,
        parameters: JSON.stringify(parameters),
        status: 'Blocked',
        error: blocked,
        finishedAt: new Date(),
      },
    });
    return NextResponse.json({ ok: false, blocked, run: denied }, { status: 403 });
  }

  // ── Execute (lightweight stub matching the report's querySource) ─────
  let rowCount = 0;
  let outputRef: string | null = null;
  let error: string | null = null;
  try {
    if (r.querySource === 'prisma') {
      const cfg = JSON.parse(r.queryLogic);
      const model = (prisma as unknown as Record<string, { findMany: (a?: unknown) => Promise<unknown[]> }>)[cfg.model];
      if (model) {
        const rows = await model.findMany({ take: 200 });
        rowCount = rows.length;
        outputRef = `inline:${rowCount} rows`;
      } else {
        error = `Unknown model: ${cfg.model}`;
      }
    } else if (r.querySource === 'sql') {
      // SAFETY: never execute arbitrary user-provided SQL in production. Stub only.
      rowCount = -1;
      outputRef = 'sql:stub (raw SQL execution disabled in demo)';
    } else if (r.querySource === 'skill') {
      const cfg = JSON.parse(r.queryLogic);
      outputRef = `skill:${cfg.skill} (would dispatch via /api/agent/invoke)`;
      rowCount = 1;
    } else if (r.querySource === 'composite') {
      outputRef = 'composite:stub';
      rowCount = 1;
    }
  } catch (err) {
    error = String(err);
  }

  const run = await prisma.reportRun.create({
    data: {
      runId,
      reportId: r.id,
      triggeredById: userObj.id,
      triggeredBy: userObj.name,
      parameters: JSON.stringify(parameters),
      status: error ? 'Failed' : 'Success',
      rowCount: rowCount >= 0 ? rowCount : null,
      durationMs: Date.now() - startedAt.getTime(),
      outputRef,
      error,
      finishedAt: new Date(),
    },
  });

  await prisma.report.update({
    where: { id: r.id },
    data: { lastRunAt: new Date(), runCount: { increment: 1 } },
  });

  return NextResponse.json({ ok: !error, run });
}
