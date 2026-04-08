import { NextResponse } from 'next/server';
import { readAudit } from '@/lib/agent-client';

// GET /api/agent/audit?date=YYYY-MM-DD&limit=200
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') ?? undefined;
  const limit = Number(searchParams.get('limit') ?? '200');
  return NextResponse.json({ date: date ?? new Date().toISOString().slice(0, 10), entries: readAudit(date, limit) });
}
