import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { toNum } from '@/lib/utils';

export async function GET() {
  const skills = await prisma.aISkill.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json({
    items: skills.map((s) => ({
      id: s.id, name: s.name, description: s.description, category: s.category,
      status: s.status, accuracy: s.accuracy ? toNum(s.accuracy) : null,
      model: s.model, runCount: s.runCount,
      lastRun: s.lastRun ? s.lastRun.toISOString().split('T')[0] : null,
    })),
  });
}
