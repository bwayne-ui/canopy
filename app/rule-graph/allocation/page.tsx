'use client';

import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import { Users, DollarSign, PieChart, Shield } from 'lucide-react';

const partners = [
  { name: 'CalPERS', commitment: 250000000, ownershipPct: 11.9, allocatedGain: 1476000, taxAllocation: 1402200, netDistribution: 2950000 },
  { name: 'ADIA', commitment: 200000000, ownershipPct: 9.5, allocatedGain: 1180800, taxAllocation: 1121760, netDistribution: 2360000 },
  { name: 'Yale Endowment', commitment: 150000000, ownershipPct: 7.1, allocatedGain: 885600, taxAllocation: 0, netDistribution: 1770000 },
  { name: 'Ontario Teachers', commitment: 175000000, ownershipPct: 8.3, allocatedGain: 1033200, taxAllocation: 981540, netDistribution: 2065000 },
  { name: 'GIC Singapore', commitment: 180000000, ownershipPct: 8.6, allocatedGain: 1065600, taxAllocation: 0, netDistribution: 2130000 },
  { name: 'Harvard Mgmt Co', commitment: 125000000, ownershipPct: 6.0, allocatedGain: 738000, taxAllocation: 0, netDistribution: 1475000 },
  { name: 'CalSTRS', commitment: 160000000, ownershipPct: 7.6, allocatedGain: 948000, taxAllocation: 900600, netDistribution: 1895000 },
  { name: 'CPP Investments', commitment: 200000000, ownershipPct: 9.5, allocatedGain: 1180800, taxAllocation: 1121760, netDistribution: 2360000 },
  { name: 'NBIM', commitment: 140000000, ownershipPct: 6.7, allocatedGain: 828000, taxAllocation: 0, netDistribution: 1660000 },
  { name: 'Texas Teachers', commitment: 120000000, ownershipPct: 5.7, allocatedGain: 713400, taxAllocation: 677730, netDistribution: 1425000 },
  { name: 'CPPIB', commitment: 100000000, ownershipPct: 4.8, allocatedGain: 590400, taxAllocation: 560880, netDistribution: 1180000 },
  { name: 'Other LPs (4)', commitment: 300000000, ownershipPct: 14.3, allocatedGain: 1760200, taxAllocation: 880100, netDistribution: 3530000 },
];

const totalAllocation = partners.reduce((s, p) => s + p.allocatedGain, 0);
const erisaAllocation = partners.filter(p => p.taxAllocation > 0).reduce((s, p) => s + p.allocatedGain, 0);

function fmtM(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  return `$${(n / 1000).toFixed(0)}K`;
}

const allocationTiers = [
  { name: 'Pro-Rata by Commitment', description: 'Base allocation proportional to capital commitments', pct: 100, color: 'bg-[#00C97B]' },
  { name: 'Special Allocations', description: 'Side letter provisions and co-invest adjustments', pct: 12, color: 'bg-blue-400' },
  { name: 'Tax Allocations', description: 'ERISA, tax-exempt, and foreign partner allocations', pct: 65, color: 'bg-amber-400' },
  { name: 'Carried Interest', description: '20% GP carry after 8% preferred return', pct: 20, color: 'bg-purple-400' },
];

export default function AllocationPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Partner Allocation Engine" subtitle="Gain/loss allocation tiers and partner-level distribution" breadcrumbs={[{ label: 'Rule Graph', href: '/rule-graph' }, { label: 'Partner Allocation' }]} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="Total Allocation" value={fmtM(totalAllocation)} icon={<DollarSign className="w-4 h-4" />} color="green" />
        <MetricCard title="Partners" value={partners.length} change="Including GP" changeType="neutral" icon={<Users className="w-4 h-4" />} color="teal" />
        <MetricCard title="Avg Allocation" value={fmtM(totalAllocation / partners.length)} icon={<PieChart className="w-4 h-4" />} color="signal" />
        <MetricCard title="ERISA Partners" value={`${((erisaAllocation / totalAllocation) * 100).toFixed(0)}%`} change="Tax-sensitive" changeType="neutral" icon={<Shield className="w-4 h-4" />} color="amber" />
      </div>

      {/* Allocation Tiers */}
      <div className="bg-white rounded-lg shadow-sm p-5">
        <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-4">Allocation Tiers</h3>
        <div className="space-y-3">
          {allocationTiers.map((tier, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <span className="text-xs font-semibold text-gray-800">{tier.name}</span>
                  <span className="text-[10px] text-gray-400 ml-2">{tier.description}</span>
                </div>
                <span className="text-xs font-mono font-bold text-gray-600">{tier.pct}%</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${tier.color} rounded-full transition-all duration-700`} style={{ width: `${tier.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Partner Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-3 py-2.5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Partner Allocation Detail</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200">
                <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Partner / LP</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Commitment</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Ownership %</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Allocated Gain</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Tax Alloc.</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Net Dist.</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-3 py-2 font-medium text-gray-900">{p.name}</td>
                  <td className="px-3 py-2 text-right font-mono text-[11px]">{fmtM(p.commitment)}</td>
                  <td className="px-3 py-2 text-right font-mono text-[11px]">{p.ownershipPct}%</td>
                  <td className="px-3 py-2 text-right font-mono text-[11px] text-emerald-600">{fmtM(p.allocatedGain)}</td>
                  <td className="px-3 py-2 text-right font-mono text-[11px] text-gray-400">{p.taxAllocation > 0 ? fmtM(p.taxAllocation) : '—'}</td>
                  <td className="px-3 py-2 text-right font-mono text-[11px] font-semibold">{fmtM(p.netDistribution)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
