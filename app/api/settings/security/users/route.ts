import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { deriveRole, deriveTlLevels } from '@/lib/permissions';

export async function GET() {
  const users = await prisma.internalUser.findMany({
    orderBy: [{ department: 'asc' }, { lastName: 'asc' }],
    select: {
      id: true,
      employeeId: true,
      firstName: true,
      lastName: true,
      title: true,
      department: true,
      seniorityLevel: true,
      employmentStatus: true,
      podId: true,
      email: true,
      officeLocation: true,
      managerName: true,
      requiredTrainingComplete: true,
      // security fields
      adminPanelAccess: true,
      vpnAccess: true,
      mfaEnabled: true,
      accountLocked: true,
      failedLoginAttempts: true,
      lastLogin: true,
      lastPasswordChange: true,
      // module access
      crmAccess: true,
      crmRole: true,
      investorPortalAccess: true,
      investorPortalRole: true,
      reportingPlatformAccess: true,
      reportingPlatformRole: true,
      complianceSystemAccess: true,
      dataWarehouseAccess: true,
      biToolAccess: true,
      apiAccess: true,
      documentMgmtAccess: true,
      hrSystemAccess: true,
      githubAccess: true,
    },
  });

  // Build name→managerName map for TL derivation
  const tlInputs = users.map((u) => ({
    name: `${u.firstName} ${u.lastName}`,
    managerName: u.managerName ?? null,
  }));
  const tlMap = deriveTlLevels(tlInputs);

  // Build directReportCount: count how many users have managerName matching this user's display name
  const nameToReportCount = new Map<string, number>();
  for (const u of users) {
    const displayName = `${u.firstName} ${u.lastName}`;
    nameToReportCount.set(displayName, 0);
  }
  for (const u of users) {
    if (u.managerName && nameToReportCount.has(u.managerName)) {
      nameToReportCount.set(u.managerName, (nameToReportCount.get(u.managerName) ?? 0) + 1);
    }
  }

  const items = users.map((u) => {
    const displayName = `${u.firstName} ${u.lastName}`;
    return {
      ...u,
      canopyRole: deriveRole({
        adminPanelAccess: u.adminPanelAccess,
        department: u.department,
        seniorityLevel: u.seniorityLevel,
      }),
      lastLogin: u.lastLogin ? u.lastLogin.toISOString() : null,
      lastPasswordChange: u.lastPasswordChange ? u.lastPasswordChange.toISOString() : null,
      directReportCount: nameToReportCount.get(displayName) ?? 0,
      tlLevel: tlMap.get(displayName) ?? 4,
    };
  });

  return NextResponse.json(items);
}
