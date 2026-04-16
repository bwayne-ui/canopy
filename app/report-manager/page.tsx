'use client';

import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { fmtDate } from '@/lib/utils';

const reports = [
  { id: 'RPT-001', name: 'Monthly NAV Package', category: 'NAV', frequency: 'Monthly', format: 'PDF + Excel', recipients: 'GP, LPs, Auditor', lastGenerated: '2026-03-31', status: 'Active', nextRun: '2026-04-30' },
  { id: 'RPT-002', name: 'Quarterly Capital Account Statement', category: 'Investor Services', frequency: 'Quarterly', format: 'PDF', recipients: 'All LPs', lastGenerated: '2026-03-31', status: 'Active', nextRun: '2026-06-30' },
  { id: 'RPT-003', name: 'Annual K-1 Tax Package', category: 'Tax', frequency: 'Annually', format: 'PDF', recipients: 'US LPs', lastGenerated: '2025-09-15', status: 'Active', nextRun: '2026-09-15' },
  { id: 'RPT-004', name: 'Board Package', category: 'Reporting', frequency: 'Quarterly', format: 'PowerPoint', recipients: 'Board Members', lastGenerated: '2026-03-31', status: 'Active', nextRun: '2026-06-30' },
  { id: 'RPT-005', name: 'Compliance Dashboard', category: 'Compliance', frequency: 'Monthly', format: 'Dashboard', recipients: 'CCO, Compliance Team', lastGenerated: '2026-03-31', status: 'Active', nextRun: '2026-04-30' },
  { id: 'RPT-006', name: 'FATCA/CRS Report', category: 'Regulatory', frequency: 'Annually', format: 'XML', recipients: 'Tax Authorities', lastGenerated: '2026-03-12', status: 'Active', nextRun: '2027-03-15' },
  { id: 'RPT-007', name: 'Bank Reconciliation Report', category: 'Reconciliation', frequency: 'Monthly', format: 'Excel', recipients: 'Fund Accounting', lastGenerated: '2026-03-31', status: 'Active', nextRun: '2026-04-30' },
  { id: 'RPT-008', name: 'Management Fee Invoice', category: 'Fees', frequency: 'Quarterly', format: 'PDF', recipients: 'GP, Fund', lastGenerated: '2026-03-31', status: 'Active', nextRun: '2026-06-30' },
  { id: 'RPT-009', name: 'Carried Interest Waterfall', category: 'Fees', frequency: 'Quarterly', format: 'Excel', recipients: 'GP', lastGenerated: '2026-03-31', status: 'Active', nextRun: '2026-06-30' },
  { id: 'RPT-010', name: 'Portfolio Valuation Report', category: 'Portfolio', frequency: 'Monthly', format: 'PDF + Excel', recipients: 'GP, Board', lastGenerated: '2026-03-31', status: 'Active', nextRun: '2026-04-30' },
  { id: 'RPT-011', name: 'Cash Flow Forecast', category: 'Treasury', frequency: 'Weekly', format: 'Excel', recipients: 'Treasury, CFO', lastGenerated: '2026-03-28', status: 'Active', nextRun: '2026-04-04' },
  { id: 'RPT-012', name: 'Investor Activity Report', category: 'Investor Services', frequency: 'Monthly', format: 'PDF', recipients: 'IR Team', lastGenerated: '2026-03-31', status: 'Active', nextRun: '2026-04-30' },
  { id: 'RPT-013', name: 'AML/KYC Status Report', category: 'Compliance', frequency: 'Quarterly', format: 'Dashboard', recipients: 'Compliance', lastGenerated: '2026-03-31', status: 'Active', nextRun: '2026-06-30' },
  { id: 'RPT-014', name: 'Trial Balance', category: 'Accounting', frequency: 'Monthly', format: 'Excel', recipients: 'Fund Accounting', lastGenerated: '2026-03-31', status: 'Active', nextRun: '2026-04-30' },
  { id: 'RPT-015', name: 'Side Letter Compliance Tracker', category: 'Legal', frequency: 'On-Demand', format: 'Excel', recipients: 'Legal, IR', lastGenerated: '2026-02-15', status: 'Active', nextRun: 'On-Demand' },
  { id: 'RPT-016', name: 'ESG Impact Report', category: 'ESG', frequency: 'Annually', format: 'PDF', recipients: 'All LPs', lastGenerated: '2025-12-31', status: 'Active', nextRun: '2026-12-31' },
  { id: 'RPT-017', name: 'Expense Allocation Report', category: 'Accounting', frequency: 'Quarterly', format: 'Excel', recipients: 'Fund Accounting, GP', lastGenerated: '2026-03-31', status: 'Active', nextRun: '2026-06-30' },
  { id: 'RPT-018', name: 'Subscription Line Usage Report', category: 'Treasury', frequency: 'Monthly', format: 'PDF', recipients: 'Treasury, Lender', lastGenerated: '2026-03-31', status: 'Active', nextRun: '2026-04-30' },
  { id: 'RPT-019', name: 'Audit PBC Tracker', category: 'Audit', frequency: 'On-Demand', format: 'Dashboard', recipients: 'Fund Accounting, Auditor', lastGenerated: '2026-03-20', status: 'Active', nextRun: 'On-Demand' },
  { id: 'RPT-020', name: 'Performance Attribution Report', category: 'Portfolio', frequency: 'Quarterly', format: 'PDF + Excel', recipients: 'GP, Board, LPs', lastGenerated: '2026-03-31', status: 'Active', nextRun: '2026-06-30' },
];

const scheduledCount = reports.filter((r) => r.frequency !== 'On-Demand').length;
const onDemandCount = reports.filter((r) => r.frequency === 'On-Demand').length;

const columns: Column[] = [
  {
    key: 'id',
    label: 'Report ID',
    sortable: true,
    render: (v: string) => <span className="text-xs">{v}</span>,
  },
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    render: (v: string) => <span className="font-semibold">{v}</span>,
  },
  {
    key: 'category',
    label: 'Category',
    sortable: true,
    render: (v: string) => (
      <span className="inline-block rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 text-xs font-medium">
        {v}
      </span>
    ),
  },
  { key: 'frequency', label: 'Frequency', sortable: true },
  { key: 'format', label: 'Format' },
  { key: 'recipients', label: 'Recipients' },
  {
    key: 'lastGenerated',
    label: 'Last Generated',
    sortable: true,
    render: (v: string) => fmtDate(v),
  },
  {
    key: 'nextRun',
    label: 'Next Run',
    sortable: true,
    render: (v: string) => (v === 'On-Demand' ? v : fmtDate(v)),
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (v: string) => <StatusBadge status={v} />,
  },
];

export default function ReportManagerPage() {
  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Report Manager" subtitle="Report generation, scheduling, and distribution" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="Total Reports" value={String(reports.length)} color="teal" />
        <MetricCard title="Scheduled" value={String(scheduledCount)} color="green" />
        <MetricCard title="On-Demand" value={String(onDemandCount)} color="amber" />
        <MetricCard title="Last Generated" value="Today" color="green" />
      </div>

      <DataTable
        columns={columns}
        data={reports}
        searchable
        searchPlaceholder="Search reports..."
      />
    </div>
  );
}
