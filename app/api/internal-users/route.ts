import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { toNum } from '@/lib/utils';

export async function GET() {
  const users = await prisma.internalUser.findMany({ orderBy: { lastName: 'asc' } });
  return NextResponse.json({
    items: users.map((u) => ({
      id: u.id, employeeId: u.employeeId, firstName: u.firstName, lastName: u.lastName,
      title: u.title, role: u.role, department: u.department, email: u.email,
      officeLocation: u.officeLocation, employmentStatus: u.employmentStatus,
      utilizationActual: u.utilizationActual ? toNum(u.utilizationActual) : null,
      utilizationTarget: u.utilizationTarget ? toNum(u.utilizationTarget) : null,
      clientsManaged: u.clientsManaged, tasksAssigned: u.tasksAssigned, tasksOverdue: u.tasksOverdue,
      segment: u.segment, serviceGroup: u.serviceGroup, licenseType: u.licenseType, podId: u.podId,
    })),
  });
}
