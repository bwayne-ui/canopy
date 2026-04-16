import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { toNum } from '@/lib/utils';

export async function GET() {
  const [clients, entities, taskAssignments, communications, projects, treasuryAccounts] = await Promise.all([
    prisma.client.findMany(),
    prisma.entity.findMany(),
    prisma.taskAssignment.findMany(),
    prisma.communication.count(),
    prisma.project.count(),
    prisma.treasuryAccount.findMany(),
  ]);

  const totalAum = clients.reduce((s, c) => s + toNum(c.totalNavMm), 0);
  const totalTreasuryBalance = treasuryAccounts.reduce((s, a) => s + toNum(a.currentBalance), 0);

  const statusCounts: Record<string, number> = {};
  taskAssignments.forEach((t) => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });
  const tasksByStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

  const strategyCounts: Record<string, { aum: number; count: number }> = {};
  entities.forEach((e) => {
    if (!strategyCounts[e.strategy]) strategyCounts[e.strategy] = { aum: 0, count: 0 };
    strategyCounts[e.strategy].aum += toNum(e.navMm) || 0;
    strategyCounts[e.strategy].count += 1;
  });
  const strategyBreakdown = Object.entries(strategyCounts).map(([strategy, v]) => ({ strategy, ...v }));

  const typeCounts: Record<string, number> = {};
  entities.forEach((e) => { typeCounts[e.entityType] = (typeCounts[e.entityType] || 0) + 1; });
  const entityTypeDistribution = Object.entries(typeCounts).map(([type, count]) => ({ type, count }));

  // Synthetic AUM trend (12 months)
  const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
  const baseAum = totalAum * 0.88;
  const aumTrend = months.map((month, i) => ({
    month: `${month} ${i < 8 ? '25' : '26'}`,
    aum: Math.round(baseAum + (totalAum - baseAum) * (i / 11) + (Math.sin(i * 0.8) * totalAum * 0.02)),
  }));

  const topClients = clients
    .sort((a, b) => toNum(b.totalNavMm) - toNum(a.totalNavMm))
    .slice(0, 5)
    .map((c) => ({ name: c.name, navMm: toNum(c.totalNavMm), entities: c.totalEntities, marginPct: toNum(c.marginPct) }));

  const recentActivity = [
    { id: '1', action: 'Completed', subject: 'Monthly NAV — Walker Enterprise Fund III', timestamp: '2 hours ago', user: 'Diana Smith', icon: 'completed', href: '/dashboards/nav' },
    { id: '2', action: 'Uploaded', subject: 'FY2025 Audited Financials — Sullivan Alpha', timestamp: '5 hours ago', user: 'Richard Thornton', icon: 'uploaded', href: '/docs-vault/fund-documents' },
    { id: '3', action: 'Overdue', subject: 'FATCA/CRS Filing — WFM Global Opportunities', timestamp: '1 day ago', user: 'Sarah Garcia', icon: 'overdue', href: '/activity/task-list' },
    { id: '4', action: 'Assigned', subject: 'K-1 Preparation — Cruz Ventures II', timestamp: '1 day ago', user: 'Megan Moore', icon: 'assigned', href: '/activity/task-list' },
    { id: '5', action: 'Communication', subject: 'PwC — Additional PBC Items for Walker III', timestamp: '1 day ago', user: 'Diana Smith', icon: 'communication', href: '/communications' },
    { id: '6', action: 'Completed', subject: 'Capital Call Processing — Campbell Growth IV', timestamp: '2 days ago', user: 'Steven Wright', icon: 'completed', href: '/activity/capital' },
    { id: '7', action: 'Transaction', subject: '$18.5M Capital Call — Walker III', timestamp: '2 days ago', icon: 'transaction', href: '/activity/capital' },
    { id: '8', action: 'Created', subject: 'Rodriguez EM FoF I — LPA Draft v0.7', timestamp: '3 days ago', user: 'Jessica Cruz', icon: 'created', href: '/docs-vault/legal' },
    { id: '9', action: 'Scheduled', subject: 'Walker III Q1 Board Meeting — Apr 15', timestamp: '3 days ago', user: 'Megan Moore', icon: 'scheduled', href: '/calendar' },
    { id: '10', action: 'Communication', subject: 'ADIA — Commitment Increase Request', timestamp: '3 days ago', user: 'Megan Moore', icon: 'communication', href: '/communications' },
  ];

  return NextResponse.json({
    totalAum,
    totalClients: clients.length,
    totalEntities: entities.length,
    activeTaskAssignments: taskAssignments.length,
    overdueTaskCount: statusCounts['Overdue'] || 0,
    completedTaskCount: statusCounts['Complete'] || 0,
    aumTrend,
    strategyBreakdown,
    tasksByStatus,
    recentActivity,
    topClients,
    entityTypeDistribution,
    totalCommunications: communications,
    totalProjects: projects,
    totalTreasuryBalance,
  });
}
