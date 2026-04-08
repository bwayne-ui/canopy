import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { meetsEntitlement } from '@/lib/grades';
import { toNum } from '@/lib/utils';

// GET /api/reports/[id]/export?format=csv|json|xml|html|xlsx&grade=P3
//   Streams the report's underlying rows in the requested format. Same permission gate as /run.
//   Designed to be embedded by other systems via simple HTTP — set Authorization later.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const format = (searchParams.get('format') ?? 'json').toLowerCase();
  const userGrade = searchParams.get('grade');
  const userId = searchParams.get('user') ?? 'anonymous';

  const r = await prisma.report.findFirst({ where: { OR: [{ id: params.id }, { reportId: params.id }] } });
  if (!r) return NextResponse.json({ error: 'not found' }, { status: 404 });

  // Permission
  const allowed = r.exportFormats.split(',').map((s) => s.trim()).filter(Boolean);
  if (!allowed.includes(format)) {
    return NextResponse.json({ error: `format ${format} not enabled for this report. Allowed: ${allowed.join(', ')}` }, { status: 400 });
  }
  const isOwner = userId === r.ownerId;
  if (r.visibility === 'Private' && !isOwner) {
    return NextResponse.json({ error: 'Private report' }, { status: 403 });
  }
  if (!meetsEntitlement(userGrade, r.minGrade)) {
    return NextResponse.json({ error: `Entitlement: requires ${r.minGrade ?? 'a grade'}+, you have ${userGrade ?? 'none'}` }, { status: 403 });
  }

  // Fetch rows according to querySource
  const rows = await fetchRows(r);

  // Audit
  await prisma.reportRun.create({
    data: {
      runId: `EXP-${Date.now()}`,
      reportId: r.id,
      triggeredById: userId,
      triggeredBy: userId,
      parameters: JSON.stringify({ via: 'export', format }),
      status: 'Success',
      rowCount: rows.length,
      durationMs: 0,
      outputRef: `export:${format}`,
      finishedAt: new Date(),
    },
  });
  await prisma.report.update({ where: { id: r.id }, data: { lastRunAt: new Date(), runCount: { increment: 1 } } });

  const safeName = r.reportId.toLowerCase();
  const ts = new Date().toISOString().slice(0, 10);
  const filename = `${safeName}-${ts}.${format === 'xlsx' ? 'xlsx' : format}`;

  if (format === 'json') {
    return new NextResponse(JSON.stringify({ reportId: r.reportId, name: r.name, generatedAt: new Date().toISOString(), rowCount: rows.length, rows }, null, 2), {
      headers: { 'content-type': 'application/json', 'content-disposition': `attachment; filename="${filename}"` },
    });
  }
  if (format === 'csv' || format === 'xlsx') {
    return new NextResponse(toCsv(rows), {
      headers: {
        'content-type': format === 'xlsx' ? 'application/vnd.ms-excel' : 'text/csv',
        'content-disposition': `attachment; filename="${filename}"`,
      },
    });
  }
  if (format === 'xml') {
    return new NextResponse(toXml(r.reportId, rows), {
      headers: { 'content-type': 'application/xml', 'content-disposition': `attachment; filename="${filename}"` },
    });
  }
  if (format === 'html') {
    return new NextResponse(toHtml(r.name, r.reportId, rows), {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }
  return NextResponse.json({ error: 'unsupported format' }, { status: 400 });
}

// ── Row fetcher (shared with /run later if we want) ──────────
async function fetchRows(r: { querySource: string; queryLogic: string }): Promise<Record<string, unknown>[]> {
  if (r.querySource === 'prisma') {
    try {
      const cfg = JSON.parse(r.queryLogic);
      const model = (prisma as unknown as Record<string, { findMany: (a?: unknown) => Promise<unknown[]> }>)[cfg.model];
      if (!model) return [];
      const rows = await model.findMany({ take: 500 });
      return (rows as Record<string, unknown>[]).map(serializeRow);
    } catch {
      return [];
    }
  }
  if (r.querySource === 'sql') {
    return [{ note: 'Raw SQL execution disabled in demo. Wire prisma.$queryRawUnsafe with allowlist before enabling.' }];
  }
  if (r.querySource === 'skill') {
    try {
      const cfg = JSON.parse(r.queryLogic);
      return [{ skill: cfg.skill, status: 'queued', note: 'Run via /api/agent/invoke to materialize live data.' }];
    } catch {
      return [];
    }
  }
  if (r.querySource === 'composite') {
    return [{ note: 'Composite report — see component sub-reports for materialized rows.' }];
  }
  return [];
}

function serializeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === null || v === undefined) out[k] = '';
    else if (v instanceof Date) out[k] = v.toISOString().split('T')[0];
    else if (typeof v === 'object' && v !== null && 'toFixed' in (v as object)) out[k] = toNum(v as never);
    else if (typeof v === 'object') out[k] = JSON.stringify(v);
    else out[k] = v;
  }
  return out;
}

// ── Format helpers ─────────────────────────────────────────
function csvEscape(v: unknown): string {
  const s = v == null ? '' : String(v);
  if (s.includes('"') || s.includes(',') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(','));
  }
  return lines.join('\n');
}

function xmlEscape(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toXml(reportId: string, rows: Record<string, unknown>[]): string {
  const inner = rows
    .map((row) => {
      const fields = Object.entries(row)
        .map(([k, v]) => `    <${k}>${xmlEscape(v)}</${k}>`)
        .join('\n');
      return `  <row>\n${fields}\n  </row>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<report id="${xmlEscape(reportId)}" generatedAt="${new Date().toISOString()}" rowCount="${rows.length}">\n${inner}\n</report>\n`;
}

function toHtml(name: string, reportId: string, rows: Record<string, unknown>[]): string {
  const headers = rows.length ? Array.from(new Set(rows.flatMap((r) => Object.keys(r)))) : [];
  const head = headers.map((h) => `<th>${xmlEscape(h)}</th>`).join('');
  const body = rows
    .map((row) => '<tr>' + headers.map((h) => `<td>${xmlEscape(row[h])}</td>`).join('') + '</tr>')
    .join('');
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${xmlEscape(name)} — ${xmlEscape(reportId)}</title>
<style>
body{font-family:Inter,system-ui,sans-serif;margin:24px;color:#111}
h1{font-size:20px;margin:0 0 4px}.meta{color:#888;font-size:11px;margin-bottom:16px}
table{border-collapse:collapse;width:100%;font-size:12px}
th,td{border:1px solid #e5e7eb;padding:6px 10px;text-align:left}
th{background:#f9fafb;font-weight:600;text-transform:uppercase;font-size:10px;color:#6b7280}
tr:nth-child(even) td{background:#fafafa}
</style></head><body>
<h1>${xmlEscape(name)}</h1>
<div class="meta">${xmlEscape(reportId)} · generated ${new Date().toISOString()} · ${rows.length} rows</div>
<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
</body></html>`;
}
