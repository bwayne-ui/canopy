'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import ActivityFeed from '@/components/ActivityFeed';
import StrategyPieChart from '@/components/charts/StrategyPieChart';
import TaskCompletionChart from '@/components/charts/TaskCompletionChart';
import EntityTypeChart from '@/components/charts/EntityTypeChart';
import {
  Building2, ClipboardCheck, AlertTriangle,
  FolderKanban, FileText, Shield, FileEdit, Send,
} from 'lucide-react';
import type { DashboardData } from '@/types';

export default function ControlTower() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [timesheets, setTimesheets] = useState<{ draft: number; submitted: number } | null>(null);

  useEffect(() => {
    fetch('/api/dashboard').then((r) => r.json()).then(setData);
  }, []);

  useEffect(() => {
    fetch('/api/timesheets')
      .then((r) => r.json())
      .then((d) => {
        const items: Array<{ status: string }> = d.items ?? [];
        setTimesheets({
          draft: items.filter((s) => s.status === 'Draft').length,
          submitted: items.filter((s) => s.status === 'Submitted').length,
        });
      });
  }, []);

  if (!data) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-pulse text-gray-400 text-xs">Loading Control Tower...</div>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      <PageHeader title="Control Tower" subtitle="Canopy Fund Administration Platform" />

      {/* Two-column body: left (tiles + charts) | right (activity feed) */}
      <div className="flex gap-3 items-start">

        {/* Left column */}
        <div className="flex flex-col gap-2 flex-1 min-w-0">

          {/* KPI tiles — always-visible 6 + conditional timesheet alerts */}
          <div className={`grid gap-2 ${(timesheets?.draft ?? 0) > 0 || (timesheets?.submitted ?? 0) > 0 ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <MetricCard title="Active GPs" value={String(data.totalClients)} change={`${data.totalEntities} entities`} changeType="neutral" icon={<Building2 className="w-4 h-4" />} color="teal" href="/data-vault/clients" />
            <MetricCard title="Incomplete Tasks" value="27" change={`${data.completedTaskCount} completed`} changeType="up" icon={<ClipboardCheck className="w-4 h-4" />} color="signal" href="/activity/task-list" />
            <MetricCard title="Overdue Tasks" value={String(data.overdueTaskCount)} change="Requires attention" changeType="down" icon={<AlertTriangle className="w-4 h-4" />} color="red" href="/activity/task-list" />
            <MetricCard title="Net Margin %" value="42.3%" change="+1.2pp vs prior Q" changeType="up" icon={<Shield className="w-4 h-4" />} color="signal" href="/dashboards/gp-direct-margin" />
            <MetricCard title="Active Projects" value={String(data.totalProjects)} change="3 at risk" changeType="neutral" icon={<FolderKanban className="w-4 h-4" />} color="teal" href="/projects" />
            <MetricCard title="Documents Pending" value={String(Math.round(data.totalProjects * 1.8))} change="Review required" changeType="neutral" icon={<FileText className="w-4 h-4" />} color="amber" href="/docs-vault" />
            {timesheets && timesheets.draft > 0 && (
              <MetricCard title="Missing Timesheets" value={String(timesheets.draft)} change="Submit required" changeType="down" icon={<FileEdit className="w-4 h-4" />} color="amber" href="/time-tracking" />
            )}
            {timesheets && timesheets.submitted > 0 && (
              <MetricCard title="Pending Approvals" value={String(timesheets.submitted)} change="Awaiting manager" changeType="neutral" icon={<Send className="w-4 h-4" />} color="signal" href="/time-tracking" />
            )}
          </div>

          {/* 3 mini-charts side-by-side */}
          <div className="grid grid-cols-3 gap-2">
            <StrategyPieChart data={data.strategyBreakdown} />
            <TaskCompletionChart data={data.tasksByStatus} />
            <EntityTypeChart data={data.entityTypeDistribution} />
          </div>

        </div>

        {/* Right column: Activity Feed — top to bottom */}
        <div className="w-96 shrink-0">
          <ActivityFeed items={data.recentActivity} />
        </div>

      </div>
    </div>
  );
}
