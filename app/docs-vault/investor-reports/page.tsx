'use client';

import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Eye, FileText, Clock, CheckCircle2 } from 'lucide-react';

const reports = [
  { id: 'IR-001', name: 'Q1 2026 Quarterly Letter — Walker III', fund: 'Walker Enterprise Fund III', type: 'Quarterly Letter', period: 'Q1 2026', dueDate: '2026-04-25', status: 'In Progress' },
  { id: 'IR-002', name: 'Q1 2026 Quarterly Letter — Campbell IV', fund: 'Campbell Growth Fund IV', type: 'Quarterly Letter', period: 'Q1 2026', dueDate: '2026-04-25', status: 'Draft' },
  { id: 'IR-003', name: 'Annual Report FY2025 — Sullivan Alpha', fund: 'Sullivan Alpha Fund', type: 'Annual Report', period: 'FY2025', dueDate: '2026-03-31', status: 'Distributed' },
  { id: 'IR-004', name: 'Capital Account Statement Q4 — All Funds', fund: 'All Funds', type: 'Capital Account', period: 'Q4 2025', dueDate: '2026-02-28', status: 'Distributed' },
  { id: 'IR-005', name: 'K-1 Package FY2025 — Walker III', fund: 'Walker Enterprise Fund III', type: 'Tax (K-1)', period: 'FY2025', dueDate: '2026-04-15', status: 'In Progress' },
  { id: 'IR-006', name: 'Performance Summary — Campbell IV', fund: 'Campbell Growth Fund IV', type: 'Performance', period: 'Q1 2026', dueDate: '2026-05-01', status: 'Not Started' },
  { id: 'IR-007', name: 'ESG Report — CalPERS Portfolio', fund: 'Walker Enterprise Fund III', type: 'ESG', period: 'Annual', dueDate: '2026-06-30', status: 'Scheduled' },
  { id: 'IR-008', name: 'Board Deck — Walker III Q1 Meeting', fund: 'Walker Enterprise Fund III', type: 'Board Materials', period: 'Q1 2026', dueDate: '2026-04-13', status: 'Under Review' },
  { id: 'IR-009', name: 'Investor Day Materials — Campbell IV', fund: 'Campbell Growth Fund IV', type: 'Event Materials', period: 'Apr 2026', dueDate: '2026-04-20', status: 'In Progress' },
  { id: 'IR-010', name: 'Capital Call Notice — Rodriguez EM FoF', fund: 'Rodriguez EM FoF I', type: 'Notice', period: 'Apr 2026', dueDate: '2026-04-10', status: 'Draft' },
];

const columns: Column[] = [
  { key: 'name', label: 'Report', sortable: true, render: (v) => <span className="font-medium text-gray-900">{v}</span> },
  { key: 'type', label: 'Type', render: (v) => <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">{v}</span> },
  { key: 'period', label: 'Period', sortable: true },
  { key: 'dueDate', label: 'Due Date', sortable: true, render: (v) => <span className="font-mono text-[11px]">{v}</span> },
  { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
];

export default function InvestorReportsPage() {
  return (
    <div className="space-y-3">
      <PageHeader title="Investor Reports" subtitle="Quarterly letters, K-1s, performance reports, and board materials" breadcrumbs={[{ label: 'Docs Vault', href: '/docs-vault' }, { label: 'Investor Reports' }]} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
        <MetricCard title="Total Reports" value={reports.length} icon={<Eye className="w-4 h-4" />} color="teal" />
        <MetricCard title="Distributed" value={reports.filter(r => r.status === 'Distributed').length} icon={<CheckCircle2 className="w-4 h-4" />} color="green" />
        <MetricCard title="In Progress" value={reports.filter(r => r.status === 'In Progress' || r.status === 'Draft').length} icon={<FileText className="w-4 h-4" />} color="signal" />
        <MetricCard title="Upcoming" value={reports.filter(r => r.status === 'Scheduled' || r.status === 'Not Started').length} icon={<Clock className="w-4 h-4" />} color="amber" />
      </div>
      <DataTable columns={columns} data={reports} searchPlaceholder="Search investor reports..." />
    </div>
  );
}
