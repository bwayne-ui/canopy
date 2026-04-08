'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import ActivityFeed from '@/components/ActivityFeed';
import DataTable, { Column } from '@/components/DataTable';
import AumTrendChart from '@/components/charts/AumTrendChart';
import StrategyPieChart from '@/components/charts/StrategyPieChart';
import TaskCompletionChart from '@/components/charts/TaskCompletionChart';
import EntityTypeChart from '@/components/charts/EntityTypeChart';
import {
  DollarSign, Building2, Layers, ClipboardCheck, AlertTriangle, MessageSquare,
  FolderKanban, Landmark, Users, FileText, Shield, TrendingUp, CircleDollarSign,
  BarChart3, Clock, CheckCircle2
} from 'lucide-react';
import type { DashboardData } from '@/types';
import { fmtMoney } from '@/lib/utils';

const clientColumns: Column[] = [
  { key: 'name', label: 'Client', sortable: true, render: (v) => <span className="font-medium text-gray-900">{v}</span> },
  { key: 'navMm', label: 'NAV ($MM)', sortable: true, align: 'right', render: (v) => <span className="font-mono text-[11px]">{fmtMoney(v)}</span> },
  { key: 'entities', label: 'Entities', sortable: true, align: 'right' },
  { key: 'marginPct', label: 'Margin %', sortable: true, align: 'right', render: (v) => <span className="font-mono text-[11px]">{v.toFixed(1)}%</span> },
];

export default function ControlTower() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch('/api/dashboard').then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <div className="flex items-center justify-center h-96"><div className="animate-pulse text-gray-400 text-xs">Loading Control Tower...</div></div>;

  return (
    <div className="space-y-5">
      <PageHeader title="Control Tower" subtitle="Canopy Fund Administration Platform" />

      {/* KPI Grid — 4x4 = 16 cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard title="Total AUM" value={fmtMoney(data.totalAum)} change="+3.2% vs prior month" changeType="up" icon={<DollarSign className="w-4 h-4" />} color="green" />
        <MetricCard title="Active GPs" value={String(data.totalClients)} change={`${data.totalEntities} entities`} changeType="neutral" icon={<Building2 className="w-4 h-4" />} color="teal" />
        <MetricCard title="Total NAV" value={fmtMoney(data.totalAum * 0.94)} change="+2.8% MTD" changeType="up" icon={<CircleDollarSign className="w-4 h-4" />} color="green" />
        <MetricCard title="Total Commitments" value={fmtMoney(data.totalAum * 1.35)} change="85% called" changeType="neutral" icon={<BarChart3 className="w-4 h-4" />} color="teal" />

        <MetricCard title="Active Tasks" value={String(data.activeTaskAssignments)} change={`${data.completedTaskCount} completed`} changeType="up" icon={<ClipboardCheck className="w-4 h-4" />} color="signal" />
        <MetricCard title="Overdue Tasks" value={String(data.overdueTaskCount)} change="Requires attention" changeType="down" icon={<AlertTriangle className="w-4 h-4" />} color="red" />
        <MetricCard title="Open Tasks" value={String(Math.max(data.activeTaskAssignments - data.completedTaskCount, 0))} change="In progress" changeType="neutral" icon={<Clock className="w-4 h-4" />} color="amber" />
        <MetricCard title="Pending Approvals" value={String(Math.round(data.activeTaskAssignments * 0.15))} change="Awaiting sign-off" changeType="neutral" icon={<CheckCircle2 className="w-4 h-4" />} color="amber" />

        <MetricCard title="Fee Revenue" value={fmtMoney(data.totalAum * 0.018)} change="+5.1% YoY" changeType="up" icon={<TrendingUp className="w-4 h-4" />} color="green" />
        <MetricCard title="Net Margin %" value="42.3%" change="+1.2pp vs prior Q" changeType="up" icon={<Shield className="w-4 h-4" />} color="signal" />
        <MetricCard title="Entities" value={String(data.totalEntities)} change="15 active" changeType="neutral" icon={<Layers className="w-4 h-4" />} color="teal" />
        <MetricCard title="Active Investors" value={String(Math.round(data.totalEntities * 3.2))} change="12 institutional" changeType="neutral" icon={<Users className="w-4 h-4" />} color="teal" />

        <MetricCard title="Communications" value={String(data.totalCommunications)} change="Last 30 days" changeType="neutral" icon={<MessageSquare className="w-4 h-4" />} color="teal" />
        <MetricCard title="Active Projects" value={String(data.totalProjects)} change="3 at risk" changeType="neutral" icon={<FolderKanban className="w-4 h-4" />} color="teal" />
        <MetricCard title="Documents Pending" value={String(Math.round(data.totalProjects * 1.8))} change="Review required" changeType="neutral" icon={<FileText className="w-4 h-4" />} color="amber" />
        <MetricCard title="Treasury Balance" value={fmtMoney(data.totalTreasuryBalance)} change="Across 8 accounts" changeType="neutral" icon={<Landmark className="w-4 h-4" />} color="green" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AumTrendChart data={data.aumTrend} />
        <StrategyPieChart data={data.strategyBreakdown} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TaskCompletionChart data={data.tasksByStatus} />
        <EntityTypeChart data={data.entityTypeDistribution} />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Top GPs by AUM</h3>
          <DataTable columns={clientColumns} data={data.topClients} searchable={false} />
        </div>
        <ActivityFeed items={data.recentActivity} />
      </div>
    </div>
  );
}
