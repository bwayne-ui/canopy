import { NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import * as path from 'node:path';

// POST /api/agent/eval  body: { skill }
// Triggers the eval runner for a skill. Streams nothing — returns final stdout.
// For long suites this should become an SSE stream like /api/agent/stream.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const skill = body.skill;
  if (!skill || typeof skill !== 'string') {
    return NextResponse.json({ error: 'skill required' }, { status: 400 });
  }
  const runner = path.resolve(process.cwd(), 'agent', 'evaluation', 'runner.ts');
  return new Promise<Response>((resolve) => {
    let stdout = '';
    let stderr = '';
    const proc = spawn('npx', ['tsx', runner, skill], { cwd: process.cwd() });
    proc.stdout.on('data', (d) => (stdout += d.toString()));
    proc.stderr.on('data', (d) => (stderr += d.toString()));
    proc.on('close', (code) => {
      resolve(
        NextResponse.json(
          { ok: code === 0, exit: code, stdout, stderr },
          { status: code === 0 ? 200 : 500 }
        )
      );
    });
  });
}
