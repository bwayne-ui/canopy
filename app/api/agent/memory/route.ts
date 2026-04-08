import { NextResponse } from 'next/server';
import * as fs from 'node:fs';
import * as path from 'node:path';

const MEM_ROOT = path.resolve(process.cwd(), 'agent', 'memory');

// GET /api/agent/memory?file=clients/walker-capital.md → returns memory file contents
// GET /api/agent/memory                                  → returns MEMORY.md index
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const file = searchParams.get('file') ?? 'MEMORY.md';
  // Path safety: stay inside agent/memory/
  const resolved = path.resolve(MEM_ROOT, file);
  if (!resolved.startsWith(MEM_ROOT)) return NextResponse.json({ error: 'invalid path' }, { status: 400 });
  if (!fs.existsSync(resolved)) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ file, content: fs.readFileSync(resolved, 'utf8') });
}

// POST /api/agent/memory  body: { file, content }
// Creates or overwrites a memory file. TODO: add auth + audit-log entry.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!body.file || !body.content) return NextResponse.json({ error: 'file and content required' }, { status: 400 });
  const resolved = path.resolve(MEM_ROOT, body.file);
  if (!resolved.startsWith(MEM_ROOT)) return NextResponse.json({ error: 'invalid path' }, { status: 400 });
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, body.content);
  return NextResponse.json({ ok: true, file: body.file });
}
