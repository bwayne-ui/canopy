import { NextResponse } from 'next/server';
import * as fs from 'node:fs';
import * as path from 'node:path';

const MEM_ROOT = path.resolve(process.cwd(), 'agent', 'memory');

interface MemoryEntry {
  file: string;
  name: string;
  type: string;
  description: string;
  content: string;
  preview: string;
}

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)/);
  if (!match) return { meta: {}, body: raw.trim() };
  const meta: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const [k, ...rest] = line.split(':');
    if (k && rest.length) meta[k.trim()] = rest.join(':').trim();
  }
  return { meta, body: match[2].trim() };
}

function walkMemory(dir: string, base: string): MemoryEntry[] {
  const entries: MemoryEntry[] = [];
  if (!fs.existsSync(dir)) return entries;
  for (const dirent of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, dirent.name);
    const relPath = base ? path.join(base, dirent.name) : dirent.name;
    if (dirent.isDirectory()) {
      entries.push(...walkMemory(fullPath, relPath));
    } else if (dirent.name.endsWith('.md') && dirent.name !== 'MEMORY.md') {
      const raw = fs.readFileSync(fullPath, 'utf8');
      const { meta, body } = parseFrontmatter(raw);
      const preview = body.replace(/^#+\s+.*/gm, '').replace(/\*\*/g, '').replace(/`/g, '').trim().slice(0, 200);
      entries.push({
        file: relPath,
        name: meta.name ?? dirent.name.replace('.md', ''),
        type: meta.type ?? path.dirname(relPath).split(path.sep).pop() ?? 'general',
        description: meta.description ?? '',
        content: raw,
        preview,
      });
    }
  }
  return entries;
}

// GET /api/agent/memory?list=1      → returns all memory entries parsed
// GET /api/agent/memory?file=x.md   → returns single file contents
// GET /api/agent/memory             → returns MEMORY.md index
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  if (searchParams.get('list') === '1') {
    const entries = walkMemory(MEM_ROOT, '');
    return NextResponse.json(entries);
  }

  const file = searchParams.get('file') ?? 'MEMORY.md';
  const resolved = path.resolve(MEM_ROOT, file);
  if (!resolved.startsWith(MEM_ROOT)) return NextResponse.json({ error: 'invalid path' }, { status: 400 });
  if (!fs.existsSync(resolved)) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ file, content: fs.readFileSync(resolved, 'utf8') });
}

// POST /api/agent/memory  body: { file, content }
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as { file?: string; content?: string };
  if (!body.file || !body.content) return NextResponse.json({ error: 'file and content required' }, { status: 400 });
  const resolved = path.resolve(MEM_ROOT, body.file);
  if (!resolved.startsWith(MEM_ROOT)) return NextResponse.json({ error: 'invalid path' }, { status: 400 });
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, body.content);
  return NextResponse.json({ ok: true, file: body.file });
}
