import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const assignments = await prisma.employeeEntityAssignment.findMany({
      where: { status: 'Active' },
      include: {
        employee: {
          select: {
            id: true, firstName: true, lastName: true, department: true,
            title: true, capacityHours: true, employmentStatus: true,
          },
        },
      },
      orderBy: [{ employee: { department: 'asc' } }, { employee: { lastName: 'asc' } }],
    });

    return NextResponse.json({
      items: assignments.map((a) => ({
        id: a.id,
        employeeId: a.employee.id,
        employee: `${a.employee.firstName} ${a.employee.lastName}`,
        department: a.department,
        serviceLine: a.serviceLine,
        clientName: a.clientName,
        entityName: a.entityName,
        role: a.role,
        coveragePct: a.coveragePct,
        startDate: a.startDate ? a.startDate.toISOString().slice(0, 10) : null,
        status: a.status,
        title: a.employee.title,
        capacityHours: a.employee.capacityHours,
      })),
    });
  } catch (err: any) {
    console.error('[employee-assignments GET]', err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
