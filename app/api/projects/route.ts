import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const projects = await prisma.project.findMany({ orderBy: { startDate: 'desc' } });
  return NextResponse.json({
    items: projects.map((p) => ({
      id: p.id, projectId: p.projectId, name: p.name, description: p.description,
      projectType: p.projectType, status: p.status, priority: p.priority,
      clientName: p.clientName, leadName: p.leadName,
      startDate: p.startDate.toISOString().split('T')[0],
      targetEndDate: p.targetEndDate.toISOString().split('T')[0],
      completionPct: p.completionPct, totalTasks: p.totalTasks, completedTasks: p.completedTasks,
    })),
  });
}
