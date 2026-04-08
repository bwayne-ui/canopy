import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const assignments = await prisma.taskAssignment.findMany({
    include: { taskDefinition: true, assignedTo: true },
    orderBy: { dueDate: 'asc' },
  });
  return NextResponse.json({
    items: assignments.map((a) => ({
      id: a.id, taskName: a.taskDefinition.name, taskCode: a.taskDefinition.taskCode,
      entityName: a.entityName,
      assignedTo: a.assignedTo ? `${a.assignedTo.firstName} ${a.assignedTo.lastName}` : null,
      status: a.status, dueDate: a.dueDate.toISOString().split('T')[0],
      periodEnd: a.periodEnd, priority: a.priority,
    })),
  });
}
