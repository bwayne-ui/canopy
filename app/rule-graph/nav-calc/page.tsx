'use client';

import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import { DollarSign, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

const steps = [
  { label: 'Beginning NAV', amount: 3820000000, type: 'base' },
  { label: '+ Contributions (Capital Calls)', amount: 32400000, type: 'add' },
  { label: '- Distributions', amount: -12750000, type: 'sub' },
  { label: '+/- Unrealized Gains', amount: 98500000, type: 'add' },
  { label: '+/- Realized Gains', amount: 22300000, type: 'add' },
  { label: '- Management Fees', amount: -4800000, type: 'sub' },
  { label: '- Fund Expenses', amount: -1950000, type: 'sub' },
  { label: '- Performance Fees (Accrued)', amount: -8600000, type: 'sub' },
  { label: '+/- FX Translation', amount: -5100000, type: 'sub' },
];

const endingNav = steps.reduce((s, step) => s + step.amount, 0);
const totalChanges = endingNav - steps[0].amount;
const changePct = ((totalChanges / steps[0].amount) * 100).toFixed(1);

function fmtB(n: number) { return `$${(Math.abs(n) / 1000000000).toFixed(2)}B`; }
function fmtM(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1000000000) return `$${(abs / 1000000000).toFixed(2)}B`;
  return `$${(abs / 1000000).toFixed(1)}M`;
}

export default function NavCalcPage() {
  let running = 0;

  return (
    <div className="space-y-5">
      <PageHeader title="NAV Calculation Chain" subtitle="Step-by-step NAV build — All Funds Aggregate" breadcrumbs={[{ label: 'Rule Graph', href: '/rule-graph' }, { label: 'NAV Calculation' }]} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="Beginning NAV" value={fmtB(steps[0].amount)} icon={<DollarSign className="w-4 h-4" />} color="teal" />
        <MetricCard title="Period Changes" value={`${totalChanges >= 0 ? '+' : ''}${fmtM(totalChanges)}`} change={`${changePct}%`} changeType="up" icon={<TrendingUp className="w-4 h-4" />} color="green" />
        <MetricCard title="Ending NAV" value={fmtB(endingNav)} change="As of Apr 5, 2026" changeType="neutral" icon={<BarChart3 className="w-4 h-4" />} color="green" />
        <MetricCard title="Change %" value={`+${changePct}%`} change="MTD" changeType="up" icon={<TrendingDown className="w-4 h-4" />} color="signal" />
      </div>

      {/* NAV Build Statement */}
      <div className="bg-white rounded-lg shadow-sm p-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">NAV Reconciliation Statement</h3>
        <div className="space-y-0">
          {steps.map((step, i) => {
            running += step.amount;
            const isBase = step.type === 'base';
            const isPositive = step.amount >= 0;

            return (
              <div key={i}>
                <div className={`flex items-center py-2.5 px-3 rounded ${isBase ? 'bg-gray-50' : 'hover:bg-gray-50/50'} ${i === steps.length - 1 ? 'border-b-2 border-gray-300' : 'border-b border-gray-100'}`}>
                  <div className="flex-1">
                    <span className={`text-xs ${isBase ? 'font-bold text-gray-900' : 'text-gray-700'} ${!isBase && step.type === 'sub' ? 'pl-4' : !isBase ? 'pl-4' : ''}`}>
                      {step.label}
                    </span>
                  </div>
                  <div className="w-32 text-right">
                    <span className={`text-xs ${isBase ? 'font-bold text-gray-900' : isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isBase ? '' : isPositive ? '+' : '-'}{fmtM(step.amount)}
                    </span>
                  </div>
                  <div className="w-36 text-right">
                    <span className="text-xs text-gray-400">{fmtB(running)}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {/* Ending NAV */}
          <div className="flex items-center py-3 px-3 bg-[#E6F9F0]/50 rounded-b">
            <div className="flex-1">
              <span className="text-xs font-bold text-gray-900">= Ending NAV</span>
            </div>
            <div className="w-32 text-right">
              <span className="text-xs font-bold text-[#00C97B]">{fmtB(endingNav)}</span>
            </div>
            <div className="w-36 text-right">
              <span className="text-xs font-bold text-[#00C97B]">+{changePct}%</span>
            </div>
          </div>
        </div>

        {/* Column Labels */}
        <div className="flex items-center mt-1 px-3 text-[10px] text-gray-400 uppercase tracking-wider">
          <div className="flex-1">Line Item</div>
          <div className="w-32 text-right">Amount</div>
          <div className="w-36 text-right">Running Total</div>
        </div>
      </div>
    </div>
  );
}
