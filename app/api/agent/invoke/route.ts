import { NextResponse } from 'next/server';
import { invoke } from '@/lib/agent-client';

// POST /api/agent/invoke
// Body: { skill, input, user, approvers? }
// Runs a skill through the agent layer with full governance enforcement.
// TODO: add real auth — currently trusts the `user` field in the body.

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!body.skill || typeof body.skill !== 'string') {
    return NextResponse.json({ error: 'skill required' }, { status: 400 });
  }
  if (!body.user || typeof body.user !== 'string') {
    return NextResponse.json({ error: 'user required' }, { status: 400 });
  }
  const result = await invoke({
    skill: body.skill,
    input: body.input ?? {},
    user: body.user,
    approvers: Array.isArray(body.approvers) ? body.approvers : undefined,
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 403 });
}
