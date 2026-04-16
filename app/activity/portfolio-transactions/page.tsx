'use client';

import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { ArrowLeftRight, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { fmtMoney } from '@/lib/utils';

const trades = [
  { id: 'PT-001', tradeDate: '2026-04-04', security: 'AAPL — Apple Inc.', type: 'Buy', quantity: 5000, price: 198.50, amount: 992500, broker: 'Goldman Sachs', status: 'Settled' },
  { id: 'PT-002', tradeDate: '2026-04-04', security: 'MSFT — Microsoft Corp', type: 'Sell', quantity: 3200, price: 425.30, amount: 1360960, broker: 'Morgan Stanley', status: 'Settled' },
  { id: 'PT-003', tradeDate: '2026-04-03', security: 'UST 10Y 4.25% 2035', type: 'Buy', quantity: 10000000, price: 98.75, amount: 9875000, broker: 'JPMorgan', status: 'Settled' },
  { id: 'PT-004', tradeDate: '2026-04-03', security: 'Blackstone RE Partners IX', type: 'Buy', quantity: 1, price: 15000000, amount: 15000000, broker: 'Direct', status: 'Pending Settlement' },
  { id: 'PT-005', tradeDate: '2026-04-02', security: 'NVDA — NVIDIA Corp', type: 'Sell', quantity: 2000, price: 875.20, amount: 1750400, broker: 'Goldman Sachs', status: 'Settled' },
  { id: 'PT-006', tradeDate: '2026-04-02', security: 'SPX Apr 5200 Put', type: 'Buy', quantity: 50, price: 12500, amount: 625000, broker: 'Citadel', status: 'Settled' },
  { id: 'PT-007', tradeDate: '2026-04-01', security: 'KKR Global Infrastructure IV', type: 'Buy', quantity: 1, price: 8500000, amount: 8500000, broker: 'Direct', status: 'Pending Settlement' },
  { id: 'PT-008', tradeDate: '2026-04-01', security: 'AMZN — Amazon.com', type: 'Buy', quantity: 4500, price: 192.80, amount: 867600, broker: 'Morgan Stanley', status: 'Settled' },
  { id: 'PT-009', tradeDate: '2026-03-31', security: 'Corp Bond — GS 5.1% 2030', type: 'Sell', quantity: 5000000, price: 101.25, amount: 5062500, broker: 'JPMorgan', status: 'Settled' },
  { id: 'PT-010', tradeDate: '2026-03-31', security: 'TSLA — Tesla Inc', type: 'Buy', quantity: 1500, price: 245.60, amount: 368400, broker: 'Goldman Sachs', status: 'Settled' },
  { id: 'PT-011', tradeDate: '2026-03-30', security: 'Ares Capital Corp V', type: 'Buy', quantity: 1, price: 12000000, amount: 12000000, broker: 'Direct', status: 'Settled' },
  { id: 'PT-012', tradeDate: '2026-03-30', security: 'EUR/USD FX Forward 90d', type: 'Buy', quantity: 1, price: 3400000, amount: 3400000, broker: 'Citibank', status: 'Settled' },
];

const buys = trades.filter((t) => t.type === 'Buy');
const sells = trades.filter((t) => t.type === 'Sell');
const buyVol = buys.reduce((s, t) => s + t.amount, 0);
const sellVol = sells.reduce((s, t) => s + t.amount, 0);
const pending = trades.filter((t) => t.status === 'Pending Settlement').length;

const columns: Column[] = [
  { key: 'tradeDate', label: 'Trade Date', sortable: true, render: (v) => <span className="text-xs">{v}</span> },
  { key: 'security', label: 'Security', sortable: true, render: (v: string) => <Link href={`/data-vault/security-master?search=${encodeURIComponent(v)}`} className="font-medium text-gray-900 hover:text-[#00C97B] transition-colors">{v}</Link> },
  { key: 'type', label: 'Type', render: (v: string) => <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${v === 'Buy' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>{v}</span> },
  { key: 'amount', label: 'Amount', align: 'right', sortable: true, render: (v: number) => <span className="text-xs">{fmtMoney(v)}</span> },
  { key: 'broker', label: 'Broker', sortable: true, render: (v: string) => v === 'Direct' ? <span className="text-gray-500">{v}</span> : <Link href={`/data-vault/external-contacts?search=${encodeURIComponent(v)}`} className="text-[#00C97B] hover:underline hover:text-[#00A866] transition-colors">{v}</Link> },
  { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
];

export default function PortfolioTransactionsPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Portfolio Transactions" subtitle="Investment trade activity and settlement" breadcrumbs={[{ label: 'Activity' }, { label: 'Portfolio Transactions' }]} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="Total Trades" value={trades.length} icon={<ArrowLeftRight className="w-4 h-4" />} color="teal" />
        <MetricCard title="Buy Volume" value={fmtMoney(buyVol)} icon={<TrendingUp className="w-4 h-4" />} color="green" />
        <MetricCard title="Sell Volume" value={fmtMoney(sellVol)} icon={<TrendingDown className="w-4 h-4" />} color="red" />
        <MetricCard title="Pending Settlement" value={pending} icon={<Clock className="w-4 h-4" />} color="amber" />
      </div>
      <DataTable columns={columns} data={trades} searchPlaceholder="Search trades..." />
    </div>
  );
}
