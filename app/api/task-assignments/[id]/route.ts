import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const assignment = await prisma.taskAssignment.findUnique({
    where: { id: params.id },
    include: {
      taskDefinition: true,
      assignedTo: {
        select: {
          employeeId: true, firstName: true, lastName: true,
          title: true, department: true, email: true,
        },
      },
    },
  });

  if (!assignment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const dt = (v: Date | null | undefined) => v?.toISOString().slice(0, 10) ?? null;

  let steps: string[] = [];
  try { steps = JSON.parse(assignment.taskDefinition.steps); } catch {}

  return NextResponse.json({
    assignment: {
      id: assignment.id,
      taskCode: assignment.taskDefinition.taskCode,
      taskName: assignment.taskDefinition.name,
      entityName: assignment.entityName,
      status: assignment.status,
      priority: assignment.priority,
      dueDate: dt(assignment.dueDate),
      periodEnd: assignment.periodEnd,
      completedDate: dt(assignment.completedDate),
      notes: assignment.notes,
      createdAt: assignment.createdAt.toISOString(),
      updatedAt: assignment.updatedAt.toISOString(),
    },
    taskDefinition: {
      taskCode: assignment.taskDefinition.taskCode,
      name: assignment.taskDefinition.name,
      description: assignment.taskDefinition.description,
      category: assignment.taskDefinition.category,
      frequency: assignment.taskDefinition.frequency,
      estimatedMinutes: assignment.taskDefinition.estimatedMinutes,
      department: assignment.taskDefinition.department,
      priority: assignment.taskDefinition.priority,
      steps,
    },
    assignedTo: assignment.assignedTo
      ? {
          employeeId: assignment.assignedTo.employeeId,
          name: `${assignment.assignedTo.firstName} ${assignment.assignedTo.lastName}`,
          title: assignment.assignedTo.title,
          department: assignment.assignedTo.department,
          email: assignment.assignedTo.email,
        }
      : null,
  });
}
