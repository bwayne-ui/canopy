import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { listSkills } from '@/lib/agent-client';

export const runtime = 'nodejs';

// GET /api/agent/skills — DB skill catalog + filesystem agent skills
export async function GET() {
  try {
    const [dbSkills, fsSkills] = await Promise.all([
      prisma.aISkill.findMany({ orderBy: [{ status: 'asc' }, { runCount: 'desc' }] }),
      Promise.resolve(listSkills()),
    ]);
    return NextResponse.json({ skills: dbSkills, agentSkills: fsSkills });
  } catch (err) {
    console.error('[agent/skills] GET error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
