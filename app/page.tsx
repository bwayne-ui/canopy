'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import MetricCard from '@/components/MetricCard';
import ActivityFeed from '@/components/ActivityFeed';
import ScoreBar from '@/components/ScoreBar';
import InsightBlock from '@/components/InsightBlock';
import StrategyPieChart from '@/components/charts/StrategyPieChart';
import TaskCompletionChart from '@/components/charts/TaskCompletionChart';
import EntityTypeChart from '@/components/charts/EntityTypeChart';
import {
  Building2, ClipboardCheck, AlertTriangle,
  FolderKanban, FileText, Shield, FileEdit, Send,
  X, TrendingUp, TrendingDown,
} from 'lucide-react';
import { fmtMoney } from '@/lib/utils';
import type { DashboardData } from '@/types';

// ---------------------------------------------------------------------------
// Drill-down drawer
// ---------------------------------------------------------------------------

function Drawer({ open, onClose, title, eyebrow, children }: {
  open: boolean; onClose: () => void; title: string; eyebrow: string; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/25 backdrop-blur-[2px] z-50" onClick={onClose} />
      {/* Panel */}
      <div className="fixed top-0 right-0 w-[480px] h-full bg-white border-l border-gray-200 z-50 flex flex-col shadow-xl">
        <div className="px-5 pt-5 pb-3 border-b border-gray-200 bg-gradient-to-br from-[#005868]/[0.04] to-transparent">
          <p className="text-[10px] font-semibold uppercase tracking-[3px] text-gray-400">{eyebrow}</p>
          <p className="text-lg font-semibold text-gray-900" style={{ fontFamily: "'Lora', serif" }}>{title}</p>
          <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors" aria-label="Close drawer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function ControlTower() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [timesheets, setTimesheets] = useState<{ draft: number; submitted: number } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerContent, setDrawerContent] = useState<{ title: string; eyebrow: string; key: string }>({ title: '', eyebrow: '', key: '' });

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

  function openDrawer(key: string, title: string, eyebrow: string) {
    setDrawerContent({ key, title, eyebrow });
    setDrawerOpen(true);
  }

  // Derived metrics for score bars
  const closeProgress = useMemo(() => {
    if (!data) return [];
    const total = data.tasksByStatus.reduce((s, t) => s + t.count, 0);
    const complete = data.tasksByStatus.find((t) => t.status === 'Complete')?.count ?? 0;
    const inProgress = data.tasksByStatus.find((t) => t.status === 'In Progress')?.count ?? 0;
    return [
      { label: 'Tasks Complete', value: complete, max: total, color: '#00C97B' },
      { label: 'In Progress', value: inProgress, max: total, color: '#3b82f6' },
      { label: 'Data Quality', value: 94, max: 100, color: '#006E82' },
      { label: 'Recon Coverage', value: 87, max: 100, color: '#f59e0b' },
    ];
  }, [data]);

  if (!data) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-pulse text-gray-400 text-xs">Loading Control Tower...</div>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Header — Vestberry serif style */}
      <div className="pb-2">
        <div className="w-6 h-0.5 bg-gradient-to-r from-[#005868] to-[#00C97B] rounded mb-2" />
        <p className="text-[10px] font-semibold uppercase tracking-[3px] text-gray-400 mb-0.5">Canopy 2.0</p>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Lora', serif" }}>Control Tower</h1>
        <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "'Lora', serif", fontStyle: 'italic' }}>
          Fund Administration Platform &middot; {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Two-column body: left (tiles + charts + scores) | right (activity + insights) */}
      <div className="flex gap-3 items-start">

        {/* Left column */}
        <div className="flex flex-col gap-2.5 flex-1 min-w-0">

          {/* KPI tiles */}
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

          {/* Score bars — operational health at a glance */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-0.5 bg-gradient-to-r from-[#005868] to-[#00C97B] rounded" />
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ fontFamily: "'Lora', serif" }}>Operational Health</h3>
            </div>
            {closeProgress.map((s) => (
              <ScoreBar key={s.label} {...s} />
            ))}
          </div>

          {/* 3 mini-charts side-by-side */}
          <div className="grid grid-cols-3 gap-2">
            <StrategyPieChart data={data.strategyBreakdown} />
            <TaskCompletionChart data={data.tasksByStatus} />
            <EntityTypeChart data={data.entityTypeDistribution} />
          </div>

        </div>

        {/* Right column: Insights + Activity Feed */}
        <div className="w-96 shrink-0 flex flex-col gap-2.5">

          {/* Insight callouts */}
          <div className="space-y-2">
            <InsightBlock variant="green">
              <strong className="text-gray-800">NAV processing on track.</strong> All 19 entities submitted monthly NAV within SLA. Walker III completed 2 hours ahead of deadline.
            </InsightBlock>
            <InsightBlock variant="amber">
              <strong className="text-gray-800">3 timesheets missing.</strong> FA team members have not submitted for the current period.{' '}
              <Link href="/time-tracking" className="text-[#006E82] font-semibold hover:underline">Review &rarr;</Link>
            </InsightBlock>
            {data.overdueTaskCount > 0 && (
              <InsightBlock variant="red">
                <strong className="text-gray-800">{data.overdueTaskCount} overdue task{data.overdueTaskCount !== 1 ? 's' : ''}.</strong> FATCA/CRS filing for WFM Global Opportunities requires immediate attention.{' '}
                <Link href="/activity/task-list" className="text-[#006E82] font-semibold hover:underline">View tasks &rarr;</Link>
              </InsightBlock>
            )}
          </div>

          {/* Top clients mini-table with drill-down */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-0.5 bg-gradient-to-r from-[#005868] to-[#00C97B] rounded" />
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ fontFamily: "'Lora', serif" }}>Top Clients by NAV</h3>
              <button
                type="button"
                onClick={() => openDrawer('clients', 'Client Portfolio', 'Top Clients by NAV')}
                className="ml-auto text-[10px] font-semibold text-[#006E82] bg-[#005868]/[0.06] border border-[#005868]/[0.12] rounded-full px-2.5 py-0.5 hover:bg-[#005868]/[0.12] transition-colors"
              >
                Drill down &rarr;
              </button>
            </div>
            <div className="space-y-0">
              {data.topClients.slice(0, 5).map((c, i) => (
                <Link key={i} href={`/data-vault/clients?search=${encodeURIComponent(c.name)}`} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 rounded px-1 -mx-1 transition-colors">
                  <span className="text-xs font-semibold text-gray-800 truncate">{c.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-emerald-600 font-semibold">{fmtMoney(c.navMm * 1000000)}</span>
                    <span className={`text-[10px] font-semibold ${c.marginPct >= 40 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {c.marginPct >= 40 ? <TrendingUp className="w-2.5 h-2.5 inline" /> : <TrendingDown className="w-2.5 h-2.5 inline" />}
                      {' '}{c.marginPct.toFixed(1)}%
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <ActivityFeed items={data.recentActivity} />
        </div>

      </div>

      {/* Drill-down drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={drawerContent.title}
        eyebrow={drawerContent.eyebrow}
      >
        {drawerContent.key === 'clients' && data.topClients && (
          <div className="space-y-4">
            {data.topClients.map((c, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <Link href={`/data-vault/clients?search=${encodeURIComponent(c.name)}`} className="text-xs font-semibold text-gray-900 hover:text-[#00C97B]">{c.name}</Link>
                  <span className="text-[10px] font-semibold text-gray-400">{c.entities} entities</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">NAV</p>
                    <p className="text-sm font-bold text-gray-900 font-mono">{fmtMoney(c.navMm * 1000000)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Margin</p>
                    <p className={`text-sm font-bold font-mono ${c.marginPct >= 40 ? 'text-emerald-600' : 'text-amber-600'}`}>{c.marginPct.toFixed(1)}%</p>
                  </div>
                </div>
                <ScoreBar label="Margin health" value={c.marginPct} max={60} color={c.marginPct >= 40 ? '#00C97B' : '#f59e0b'} />
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </div>
  );
}
