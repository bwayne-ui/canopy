import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: { taskCode: string } }) {
  const taskDef = await prisma.taskDefinition.findUnique({
    where: { taskCode: params.taskCode },
    include: {
      assignments: {
        include: {
          assignedTo: {
            select: { employeeId: true, firstName: true, lastName: true, title: true },
          },
        },
        orderBy: { dueDate: 'asc' },
      },
    },
  });

  if (!taskDef) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let steps: string[] = [];
  try { steps = JSON.parse(taskDef.steps); } catch {}

  return NextResponse.json({
    taskDefinition: {
      id: taskDef.id,
      taskCode: taskDef.taskCode,
      name: taskDef.name,
      description: taskDef.description,
      category: taskDef.category,
      frequency: taskDef.frequency,
      estimatedMinutes: taskDef.estimatedMinutes,
      priority: taskDef.priority,
      department: taskDef.department,
      steps,
      createdAt: taskDef.createdAt.toISOString(),
    },
    assignments: taskDef.assignments.map((a) => ({
      id: a.id,
      entityName: a.entityName,
      assignedTo: a.assignedTo
        ? {
            employeeId: a.assignedTo.employeeId,
            name: `${a.assignedTo.firstName} ${a.assignedTo.lastName}`,
            title: a.assignedTo.title,
          }
        : null,
      status: a.status,
      priority: a.priority,
      dueDate: a.dueDate.toISOString().slice(0, 10),
      periodEnd: a.periodEnd,
    })),
  });
}
