import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { toNum } from '@/lib/utils';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const skill = await prisma.aISkill.findUnique({
    where: { id: params.id },
  });

  if (!skill) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const d = (v: any) => v ? toNum(v) : null;

  return NextResponse.json({
    skill: {
      id: skill.id,
      name: skill.name,
      description: skill.description,
      category: skill.category,
      status: skill.status,
      model: skill.model,
      inputType: skill.inputType,
      outputType: skill.outputType,
      accuracy: d(skill.accuracy),
      runCount: skill.runCount,
      lastRun: skill.lastRun?.toISOString() ?? null,
      avgProcessingTime: skill.avgProcessingTime,
      createdAt: skill.createdAt.toISOString(),
      updatedAt: skill.updatedAt.toISOString(),
    },
  });
}
