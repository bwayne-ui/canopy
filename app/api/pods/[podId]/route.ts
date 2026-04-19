import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { toNum } from '@/lib/utils';

export async function GET(_req: Request, { params }: { params: { podId: string } }) {
  const podId = params.podId;

  const [clients, employees] = await Promise.all([
    prisma.client.findMany({
      where: { podId },
      include: {
        entities: { select: { id: true, entityId: true, name: true, entityType: true, strategy: true, lifecycleStatus: true, scopeStatus: true, domicile: true, vintage: true, navMm: true, commitmentMm: true } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.internalUser.findMany({
      where: { podId },
      select: {
        id: true, employeeId: true, firstName: true, lastName: true, title: true, role: true,
        department: true, email: true, officeLocation: true, seniorityLevel: true,
        performanceRating: true, utilizationActual: true, utilizationTarget: true,
        clientsManaged: true, entitiesManaged: true,
        profilePhotoUrl: true,
      },
      orderBy: { lastName: 'asc' },
    }),
  ]);

  const totalNavMm = clients.reduce((s, c) => s + (c.totalNavMm ? Number(c.totalNavMm) : 0), 0);
  const totalCommitmentMm = clients.reduce((s, c) => s + (c.totalCommitmentMm ? Number(c.totalCommitmentMm) : 0), 0);
  const totalRevenue = clients.reduce((s, c) => s + (c.revenueL12m ? Number(c.revenueL12m) : 0), 0);
  const totalEntities = clients.reduce((s, c) => s + c.entities.length, 0);

  const statusBreakdown: Record<string, number> = {};
  for (const c of clients) statusBreakdown[c.status] = (statusBreakdown[c.status] ?? 0) + 1;

  const avgUtilization = employees.length
    ? employees.reduce((s, e) => s + (e.utilizationActual ? Number(e.utilizationActual) : 0), 0) / employees.length
    : 0;

  const departmentBreakdown: Record<string, number> = {};
  for (const e of employees) departmentBreakdown[e.department] = (departmentBreakdown[e.department] ?? 0) + 1;

  return NextResponse.json({
    pod: {
      id: podId,
      name: podId,
      totalClients: clients.length,
      totalEntities,
      totalNavMm: Math.round(totalNavMm),
      totalCommitmentMm: Math.round(totalCommitmentMm),
      revenueL12m: Math.round(totalRevenue),
      headcount: employees.length,
      avgUtilization: Number(avgUtilization.toFixed(1)),
      statusBreakdown,
      departmentBreakdown,
    },
    clients: clients.map((c) => ({
      id: c.id,
      name: c.name,
      shortName: c.shortName,
      primaryStrategy: c.primaryStrategy,
      status: c.status,
      region: c.region,
      hqCity: c.hqCity,
      hqCountry: c.hqCountry,
      teamLead: c.teamLead,
      serviceLine: c.serviceLine,
      totalEntities: c.entities.length,
      aumMm: c.aumMm,
      totalNavMm: toNum(c.totalNavMm),
      revenueL12m: toNum(c.revenueL12m),
      marginPct: toNum(c.marginPct),
    })),
    entities: clients.flatMap((c) => c.entities.map((e) => ({
      entityId: e.entityId,
      name: e.name,
      entityType: e.entityType,
      strategy: e.strategy,
      domicile: e.domicile,
      vintage: e.vintage,
      lifecycleStatus: e.lifecycleStatus,
      scopeStatus: e.scopeStatus,
      navMm: e.navMm ? toNum(e.navMm) : null,
      commitmentMm: e.commitmentMm ? toNum(e.commitmentMm) : null,
      clientName: c.name,
    }))),
    employees: employees.map((e) => ({
      id: e.id,
      employeeId: e.employeeId,
      name: `${e.firstName} ${e.lastName}`,
      title: e.title,
      role: e.role,
      department: e.department,
      email: e.email,
      officeLocation: e.officeLocation,
      seniorityLevel: e.seniorityLevel,
      performanceRating: e.performanceRating,
      utilizationActual: e.utilizationActual ? Number(e.utilizationActual) : null,
      utilizationTarget: e.utilizationTarget ? Number(e.utilizationTarget) : null,
      clientsManaged: e.clientsManaged,
      entitiesManaged: e.entitiesManaged,
      profilePhotoUrl: e.profilePhotoUrl,
    })),
  });
}
