'use client';

import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { BadgeDollarSign, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';
import { fmtMoney } from '@/lib/utils';

const capitalActivity = [
  { id: 'CA-001', date: '2026-04-05', fund: 'Walker Enterprise Fund III', type: 'Capital Call', investor: 'CalPERS', amount: 8500000, status: 'Settled', noticeDate: '2026-03-20' },
  { id: 'CA-002', date: '2026-04-05', fund: 'Walker Enterprise Fund III', type: 'Capital Call', investor: 'ADIA', amount: 5000000, status: 'Settled', noticeDate: '2026-03-20' },
  { id: 'CA-003', date: '2026-04-05', fund: 'Walker Enterprise Fund III', type: 'Capital Call', investor: 'Yale Endowment', amount: 5000000, status: 'Pending', noticeDate: '2026-03-20' },
  { id: 'CA-004', date: '2026-04-04', fund: 'White Senior Credit Fund V', type: 'Distribution', investor: 'Ontario Teachers', amount: 1250000, status: 'Settled', noticeDate: '2026-03-25' },
  { id: 'CA-005', date: '2026-04-04', fund: 'White Senior Credit Fund V', type: 'Distribution', investor: 'GIC Singapore', amount: 1500000, status: 'Settled', noticeDate: '2026-03-25' },
  { id: 'CA-006', date: '2026-04-03', fund: 'Campbell Growth Fund IV', type: 'Capital Call', investor: 'Harvard Mgmt Co', amount: 3200000, status: 'Settled', noticeDate: '2026-03-18' },
  { id: 'CA-007', date: '2026-04-02', fund: 'Rodriguez EM FoF I', type: 'Capital Call', investor: 'CalSTRS', amount: 4100000, status: 'Settled', noticeDate: '2026-03-15' },
  { id: 'CA-008', date: '2026-04-02', fund: 'Rodriguez EM FoF I', type: 'Capital Call', investor: 'CPP Investments', amount: 4100000, status: 'Pending', noticeDate: '2026-03-15' },
  { id: 'CA-009', date: '2026-04-01', fund: 'Sullivan Alpha Fund', type: 'Redemption', investor: 'NBIM', amount: 2800000, status: 'Processing', noticeDate: '2026-03-01' },
  { id: 'CA-010', date: '2026-04-01', fund: 'Cruz Ventures Fund II', type: 'Capital Call', investor: 'Texas Teachers', amount: 2500000, status: 'Settled', noticeDate: '2026-03-10' },
  { id: 'CA-011', date: '2026-03-31', fund: 'Lopez RE Opportunities III', type: 'Distribution', investor: 'CalPERS', amount: 3750000, status: 'Settled', noticeDate: '2026-03-15' },
  { id: 'CA-012', date: '2026-03-31', fund: 'Walker Enterprise Fund I', type: 'Distribution', investor: 'Yale Endowment', amount: 6200000, status: 'Settled', noticeDate: '2026-03-10' },
];

const calls = capitalActivity.filter((c) => c.type === 'Capital Call');
const dists = capitalActivity.filter((c) => c.type === 'Distribution');
const totalCalled = calls.reduce((s, c) => s + c.amount, 0);
const totalDistributed = dists.reduce((s, c) => s + c.amount, 0);

const columns: Column[] = [
  { key: 'date', label: 'Date', sortable: true, render: (v) => <span className="text-xs">{v}</span> },
  { key: 'fund', label: 'Fund', sortable: true, render: (v: string) => <Link href={`/data-vault/entities?search=${encodeURIComponent(v)}`} className="font-medium text-gray-900 hover:text-[#00C97B] transition-colors">{v}</Link> },
  { key: 'type', label: 'Type', render: (v: string) => {
    const colors: Record<string, string> = { 'Capital Call': 'bg-emerald-50 text-emerald-700', 'Distribution': 'bg-blue-50 text-blue-700', 'Redemption': 'bg-amber-50 text-amber-700' };
    return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${colors[v] || 'bg-gray-100 text-gray-600'}`}>{v}</span>;
  }},
  { key: 'investor', label: 'Investor', sortable: true, render: (v: string) => <Link href={`/data-vault/investors?search=${encodeURIComponent(v)}`} className="text-[#00C97B] hover:underline hover:text-[#00A866] transition-colors">{v}</Link> },
  { key: 'amount', label: 'Amount', align: 'right', sortable: true, render: (v) => <span className="text-xs">{fmtMoney(v)}</span> },
  { key: 'noticeDate', label: 'Notice Date', render: (v) => <span className="text-xs text-gray-400">{v}</span> },
  { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
];

export default function CapitalPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Capital Activity" subtitle="Capital calls, distributions, and redemptions" breadcrumbs={[{ label: 'Activity' }, { label: 'Capital' }]} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="Total Activity" value={capitalActivity.length} icon={<BadgeDollarSign className="w-4 h-4" />} color="teal" href="/activity/capital" />
        <MetricCard title="Capital Called" value={fmtMoney(totalCalled)} icon={<ArrowUpRight className="w-4 h-4" />} color="green" href="/activity/capital" />
        <MetricCard title="Distributed" value={fmtMoney(totalDistributed)} icon={<ArrowDownRight className="w-4 h-4" />} color="signal" href="/activity/capital" />
        <MetricCard title="Unfunded" value={fmtMoney(totalCalled * 0.42)} icon={<Layers className="w-4 h-4" />} color="amber" href="/activity/capital" />
      </div>
      <DataTable columns={columns} data={capitalActivity} searchPlaceholder="Search capital activity..." />
    </div>
  );
}
