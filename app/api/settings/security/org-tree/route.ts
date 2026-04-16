import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { deriveRole, deriveTlLevels } from '@/lib/permissions';

interface OrgNode {
  id: string;
  name: string;
  title: string;
  department: string;
  canopyRole: string;
  directReports: number;
  tlLevel: number;
  children: OrgNode[];
}

export async function GET() {
  const users = await prisma.internalUser.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      title: true,
      department: true,
      seniorityLevel: true,
      adminPanelAccess: true,
      managerName: true,
    },
  });

  // Build TL levels
  const tlInputs = users.map((u) => ({
    name: `${u.firstName} ${u.lastName}`,
    managerName: u.managerName ?? null,
  }));
  const tlMap = deriveTlLevels(tlInputs);

  // Create maps
  const nameToUser = new Map<string, (typeof users)[number]>();
  const nameToChildren = new Map<string, string[]>();

  for (const u of users) {
    const name = `${u.firstName} ${u.lastName}`;
    nameToUser.set(name, u);
    nameToChildren.set(name, []);
  }

  // Build parent→children relationships
  for (const u of users) {
    const name = `${u.firstName} ${u.lastName}`;
    const mgr = u.managerName;
    if (mgr && nameToChildren.has(mgr)) {
      nameToChildren.get(mgr)!.push(name);
    }
  }

  // Find roots (no manager or manager not found in dataset)
  const roots: string[] = [];
  for (const u of users) {
    const name = `${u.firstName} ${u.lastName}`;
    if (!u.managerName || !nameToUser.has(u.managerName)) {
      roots.push(name);
    }
  }

  // Recursive tree builder
  function buildNode(name: string): OrgNode {
    const u = nameToUser.get(name)!;
    const children = (nameToChildren.get(name) ?? [])
      .sort((a, b) => {
        // Sort children by TL level ascending, then by name
        const tlA = tlMap.get(a) ?? 4;
        const tlB = tlMap.get(b) ?? 4;
        if (tlA !== tlB) return tlA - tlB;
        return a.localeCompare(b);
      })
      .map(buildNode);

    return {
      id: u.id,
      name,
      title: u.title,
      department: u.department,
      canopyRole: deriveRole({
        adminPanelAccess: u.adminPanelAccess,
        department: u.department,
        seniorityLevel: u.seniorityLevel,
      }),
      directReports: (nameToChildren.get(name) ?? []).length,
      tlLevel: tlMap.get(name) ?? 0,
      children,
    };
  }

  const tree = roots
    .sort((a, b) => {
      const tlA = tlMap.get(a) ?? 0;
      const tlB = tlMap.get(b) ?? 0;
      if (tlA !== tlB) return tlA - tlB;
      return a.localeCompare(b);
    })
    .map(buildNode);

  return NextResponse.json(tree);
}
