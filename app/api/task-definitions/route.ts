import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const defs = await prisma.taskDefinition.findMany({ include: { _count: { select: { assignments: true } } }, orderBy: { taskCode: 'asc' } });
  return NextResponse.json({
    items: defs.map((d) => ({
      id: d.id, taskCode: d.taskCode, name: d.name, category: d.category,
      frequency: d.frequency, estimatedMinutes: d.estimatedMinutes, priority: d.priority,
      department: d.department, assignmentCount: d._count.assignments,
    })),
  });
}
