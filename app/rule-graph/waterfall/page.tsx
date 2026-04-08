'use client';

import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import { DollarSign, Users, TrendingUp, Target } from 'lucide-react';

const tiers = [
  { name: 'Return of Capital', threshold: '$30.0M contributed', lpShare: 100, gpShare: 0, cumulative: 30000000, amount: 30000000, status: 'Complete' },
  { name: 'Preferred Return (8%)', threshold: '8% IRR hurdle', lpShare: 100, gpShare: 0, cumulative: 34800000, amount: 4800000, status: 'Complete' },
  { name: 'GP Catch-Up', threshold: '20% of total profit', lpShare: 0, gpShare: 100, cumulative: 36000000, amount: 1200000, status: 'Complete' },
  { name: 'Carried Interest Split', threshold: '80/20 thereafter', lpShare: 80, gpShare: 20, cumulative: 42800000, amount: 6800000, status: 'In Progress' },
];

const totalDist = 42800000;
const lpTotal = 30000000 + 4800000 + (6800000 * 0.8);
const gpTotal = 1200000 + (6800000 * 0.2);

function fmtM(n: number) {
  return `$${(n / 1000000).toFixed(1)}M`;
}

export default function WaterfallPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Waterfall Deterministic Tree" subtitle="PE fund distribution waterfall — Walker Enterprise Fund III" breadcrumbs={[{ label: 'Rule Graph', href: '/rule-graph' }, { label: 'Waterfall Tree' }]} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="Total Distribution" value={fmtM(totalDist)} icon={<DollarSign className="w-4 h-4" />} color="green" />
        <MetricCard title="LP Share" value={fmtM(lpTotal)} change={`${((lpTotal / totalDist) * 100).toFixed(1)}%`} changeType="neutral" icon={<Users className="w-4 h-4" />} color="teal" />
        <MetricCard title="GP Carry" value={fmtM(gpTotal)} change={`${((gpTotal / totalDist) * 100).toFixed(1)}%`} changeType="up" icon={<TrendingUp className="w-4 h-4" />} color="signal" />
        <MetricCard title="Preferred Hurdle" value="8.0%" icon={<Target className="w-4 h-4" />} color="amber" />
      </div>

      {/* Waterfall Visualization */}
      <div className="bg-white rounded-lg shadow-sm p-5">
        <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-4">Distribution Waterfall</h3>
        <div className="space-y-1">
          {tiers.map((tier, i) => {
            const pct = (tier.amount / totalDist) * 100;
            const cumPct = (tier.cumulative / totalDist) * 100;
            const isGp = tier.gpShare > tier.lpShare;
            return (
              <div key={i} className="group">
                <div className="flex items-center gap-3 py-2">
                  <div className="w-44 flex-shrink-0">
                    <div className="text-xs font-semibold text-gray-800">{tier.name}</div>
                    <div className="text-[10px] text-gray-400">{tier.threshold}</div>
                  </div>
                  <div className="flex-1 relative h-8">
                    <div className="absolute inset-0 bg-gray-50 rounded" />
                    <div
                      className={`absolute left-0 top-0 h-full rounded transition-all duration-500 ${isGp ? 'bg-amber-400' : 'bg-[#00C97B]'}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                    <div className="absolute inset-0 flex items-center px-3">
                      <span className="text-[10px] font-bold text-white drop-shadow-sm">{fmtM(tier.amount)}</span>
                    </div>
                  </div>
                  <div className="w-20 text-right">
                    <div className="text-[10px] font-mono text-gray-500">{cumPct.toFixed(0)}%</div>
                    <div className="text-[10px] text-gray-400">{fmtM(tier.cumulative)}</div>
                  </div>
                  <div className="w-16">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${tier.status === 'Complete' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>{tier.status}</span>
                  </div>
                </div>
                {i < tiers.length - 1 && (
                  <div className="ml-[88px] w-px h-3 bg-gray-200" />
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#00C97B]" /><span className="text-[10px] text-gray-500">LP Distribution</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-400" /><span className="text-[10px] text-gray-500">GP Carry / Catch-Up</span></div>
        </div>
      </div>

      {/* Detail Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-200">
              <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Tier</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Threshold</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">LP Share</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">GP Share</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Cumulative</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((t, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-3 py-2 font-medium text-gray-900">{t.name}</td>
                <td className="px-3 py-2 text-gray-500">{t.threshold}</td>
                <td className="px-3 py-2 text-right font-mono text-[11px]">{t.lpShare}%</td>
                <td className="px-3 py-2 text-right font-mono text-[11px]">{t.gpShare}%</td>
                <td className="px-3 py-2 text-right font-mono text-[11px]">{fmtM(t.amount)}</td>
                <td className="px-3 py-2 text-right font-mono text-[11px]">{fmtM(t.cumulative)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
