import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Get current week bounds (Mon 00:00 → Sun 23:59:59)
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0 = Sun, 1 = Mon ...
    const daysFromMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() - daysFromMon);
    weekStart.setUTCHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 7);

    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setUTCDate(todayStart.getUTCDate() + 1);

    // All active employees
    const employees = await prisma.internalUser.findMany({
      where: { employmentStatus: 'Active' },
      select: {
        id: true, firstName: true, lastName: true, department: true,
        title: true, capacityHours: true,
        entityAssignments: {
          where: { status: 'Active' },
          select: { entityName: true, clientName: true, department: true, serviceLine: true, role: true, coveragePct: true },
        },
      },
      orderBy: { department: 'asc' },
    });

    // Task assignments due this week (non-complete)
    const weekTasks = await prisma.taskAssignment.findMany({
      where: {
        dueDate: { gte: weekStart, lt: weekEnd },
        status: { not: 'Complete' },
        assignedToId: { not: null },
      },
      include: { taskDefinition: { select: { name: true, estimatedMinutes: true, department: true } } },
    });

    // Task assignments due today
    const todayTasks = await prisma.taskAssignment.findMany({
      where: {
        dueDate: { gte: todayStart, lt: todayEnd },
        status: { not: 'Complete' },
        assignedToId: { not: null },
      },
      include: { taskDefinition: { select: { name: true, estimatedMinutes: true, department: true } } },
    });

    const result = employees.map((emp) => {
      const capacity = emp.capacityHours ?? 40;
      const dailyCapacity = capacity / 5;

      const myWeekTasks = weekTasks.filter((t) => t.assignedToId === emp.id);
      const myTodayTasks = todayTasks.filter((t) => t.assignedToId === emp.id);

      const weeklyAssignedHours = myWeekTasks.reduce((sum, t) => sum + (t.taskDefinition.estimatedMinutes / 60), 0);
      const dailyAssignedHours  = myTodayTasks.reduce((sum, t) => sum + (t.taskDefinition.estimatedMinutes / 60), 0);

      const weeklyUtilPct  = capacity > 0 ? Math.round((weeklyAssignedHours / capacity) * 100) : 0;
      const dailyUtilPct   = dailyCapacity > 0 ? Math.round((dailyAssignedHours / dailyCapacity) * 100) : 0;

      return {
        id: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        department: emp.department,
        title: emp.title,
        capacityHours: capacity,
        dailyCapacityHours: dailyCapacity,
        // Weekly
        weeklyAssignedHours: Math.round(weeklyAssignedHours * 10) / 10,
        weeklyUtilPct,
        weeklyOverloaded: weeklyUtilPct > 100,
        // Daily
        dailyAssignedHours: Math.round(dailyAssignedHours * 10) / 10,
        dailyUtilPct,
        dailyOverloaded: dailyUtilPct > 100,
        // Standing entity assignments
        entityAssignments: emp.entityAssignments,
        // Active tasks this week
        weekTasks: myWeekTasks.map((t) => ({
          taskName: t.taskDefinition.name,
          entityName: t.entityName,
          dueDate: t.dueDate.toISOString().slice(0, 10),
          estimatedHours: Math.round((t.taskDefinition.estimatedMinutes / 60) * 10) / 10,
          status: t.status,
          priority: t.priority,
        })),
      };
    });

    return NextResponse.json({ workload: result });
  } catch (err: any) {
    console.error('[capacity/workload GET]', err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
