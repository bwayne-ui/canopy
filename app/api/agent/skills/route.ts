import { NextResponse } from 'next/server';
import { listSkills } from '@/lib/agent-client';

// GET /api/agent/skills — list available skills with descriptions.
export async function GET() {
  return NextResponse.json({ items: listSkills() });
}
