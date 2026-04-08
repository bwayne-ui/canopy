'use client';

import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import StatusBadge from '@/components/StatusBadge';
import { DollarSign, Receipt, TrendingDown, Calculator } from 'lucide-react';

const feeChain = [
  { step: 1, name: 'Committed Capital', basis: '$2.1B total commitments', rate: '2.00%', period: 'Investment Period (Yr 1-5)', amount: 42000000, status: 'Active' },
  { step: 2, name: 'Invested Capital', basis: '$1.47B deployed', rate: '1.50%', period: 'Post-Investment (Yr 6+)', amount: 22050000, status: 'Active' },
  { step: 3, name: 'Admin & Servicing', basis: 'Per-entity flat fee', rate: 'Flat', period: 'Annual', amount: 312000, status: 'Active' },
  { step: 4, name: 'Offset Credits', basis: 'Portfolio co-invest fees', rate: '100%', period: 'As incurred', amount: -82000, status: 'Applied' },
  { step: 5, name: 'Side Letter Discounts', basis: '3 LPs with MFN', rate: 'Various', period: 'Per agreement', amount: -185000, status: 'Applied' },
];

const netFees = feeChain.reduce((s, f) => s + f.amount, 0);

function fmtM(n: number) { return `$${(Math.abs(n) / 1000000).toFixed(1)}M`; }
function fmtK(n: number) { return n >= 1000000 ? fmtM(n) : `$${(Math.abs(n) / 1000).toFixed(0)}K`; }

export default function FeeCalcPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Fee Calculation Chain" subtitle="Deterministic management fee computation pipeline" breadcrumbs={[{ label: 'Rule Graph', href: '/rule-graph' }, { label: 'Fee Calculation' }]} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="Gross Fees" value={fmtM(feeChain.filter(f => f.amount > 0).reduce((s, f) => s + f.amount, 0))} icon={<DollarSign className="w-4 h-4" />} color="green" />
        <MetricCard title="Net Fees" value={fmtM(netFees)} change="After offsets" changeType="neutral" icon={<Receipt className="w-4 h-4" />} color="teal" />
        <MetricCard title="Offsets Applied" value={fmtK(Math.abs(feeChain.filter(f => f.amount < 0).reduce((s, f) => s + f.amount, 0)))} icon={<TrendingDown className="w-4 h-4" />} color="amber" />
        <MetricCard title="Fee Steps" value={feeChain.length} icon={<Calculator className="w-4 h-4" />} color="teal" />
      </div>

      {/* Fee Chain Visualization */}
      <div className="bg-white rounded-lg shadow-sm p-5">
        <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-4">Calculation Pipeline</h3>
        <div className="flex items-stretch gap-0 overflow-x-auto pb-2">
          {feeChain.map((fee, i) => {
            const isNegative = fee.amount < 0;
            return (
              <div key={i} className="flex items-stretch flex-shrink-0">
                <div className={`w-44 rounded-lg border-2 p-3 ${isNegative ? 'border-red-200 bg-red-50/50' : 'border-emerald-200 bg-emerald-50/30'}`}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${isNegative ? 'bg-red-400' : 'bg-[#00C97B]'}`}>
                      {fee.step}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-500 uppercase">{isNegative ? 'Offset' : 'Fee'}</span>
                  </div>
                  <div className="text-xs font-bold text-gray-900 mb-1">{fee.name}</div>
                  <div className="text-[10px] text-gray-500 mb-2">{fee.basis}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">{fee.rate}</span>
                    <span className={`font-mono text-xs font-bold ${isNegative ? 'text-red-500' : 'text-emerald-600'}`}>
                      {isNegative ? '-' : '+'}{fmtK(fee.amount)}
                    </span>
                  </div>
                </div>
                {i < feeChain.length - 1 && (
                  <div className="flex items-center px-1.5">
                    <span className="text-gray-300 text-lg">→</span>
                  </div>
                )}
              </div>
            );
          })}
          {/* Result */}
          <div className="flex items-stretch flex-shrink-0">
            <div className="flex items-center px-1.5"><span className="text-gray-300 text-lg">=</span></div>
            <div className="w-36 rounded-lg border-2 border-[#00C97B] bg-[#E6F9F0]/50 p-3 flex flex-col justify-center">
              <div className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Net Fees</div>
              <div className="font-mono text-lg font-bold text-[#00C97B]">{fmtM(netFees)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-200">
              <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Step</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Fee Type</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Basis</th>
              <th className="px-3 py-2 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Rate</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Period</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-3 py-2 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {feeChain.map((f) => (
              <tr key={f.step} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-3 py-2 font-mono text-[10px] text-gray-400">{f.step}</td>
                <td className="px-3 py-2 font-medium text-gray-900">{f.name}</td>
                <td className="px-3 py-2 text-gray-500">{f.basis}</td>
                <td className="px-3 py-2 text-center font-mono text-[11px]">{f.rate}</td>
                <td className="px-3 py-2 text-gray-500">{f.period}</td>
                <td className={`px-3 py-2 text-right font-mono text-[11px] ${f.amount < 0 ? 'text-red-500' : 'text-emerald-600'}`}>{f.amount < 0 ? '-' : '+'}{fmtK(f.amount)}</td>
                <td className="px-3 py-2 text-center"><StatusBadge status={f.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
