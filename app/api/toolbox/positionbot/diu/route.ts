import { NextRequest, NextResponse } from 'next/server';
import { buildDiuData, buildDiuExcel, runValidationChecks } from '@/lib/tools/diu-builder';
import type { JsqPosition, OwnershipRow } from '@/lib/tools/position-parser';
import type { DiuArena } from '@/lib/tools/diu-builder';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    positions: JsqPosition[];
    ownership: OwnershipRow[];
    arena: DiuArena;
    action: 'validate' | 'generate';
  };

  const { positions, ownership, arena, action } = body;

  if (!positions || !positions.length) {
    return NextResponse.json({ error: 'No positions provided' }, { status: 400 });
  }

  const diuData = buildDiuData(positions, ownership ?? [], arena ?? { name: 'Unknown' });
  if (!diuData) {
    return NextResponse.json({ error: 'Failed to build DIU data' }, { status: 500 });
  }

  const checks = runValidationChecks(diuData);

  if (action === 'validate') {
    return NextResponse.json({ checks, summary: diuData['Investor Account'].length });
  }

  // generate: return xlsx
  const buf = buildDiuExcel(diuData);
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `DIU_${(arena?.name ?? 'output').replace(/\s+/g, '_')}_${dateStr}.xlsx`;

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
