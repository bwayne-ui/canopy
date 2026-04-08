'use client';

import { useParams } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import StatusBadge from '@/components/StatusBadge';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  DollarSign, TrendingUp, Shield, Users, Clock, BarChart3, AlertCircle,
  CheckCircle2, FileText, Activity, Eye, Target, Wallet, PieChart as PieIcon,
  Gauge, Receipt, Brain, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════
   CHART PALETTE
   ═══════════════════════════════════════════════════════════════════ */
const C = {
  green: '#00C97B', greenLight: '#E6F9F0', teal: '#1B3A4B', signal: '#00A866',
  blue: '#3B82F6', indigo: '#6366F1', purple: '#8B5CF6', amber: '#F59E0B',
  red: '#EF4444', sky: '#0EA5E9', pink: '#EC4899', slate: '#64748B',
  cyan: '#06B6D4', orange: '#F97316', emerald: '#10B981', lime: '#84CC16',
};
const PIE_COLORS = [C.green, C.blue, C.indigo, C.amber, C.purple, C.teal, C.sky, C.pink];

/* ═══════════════════════════════════════════════════════════════════
   SHARED MICRO-COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */
function Panel({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
      {title && <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">{title}</h3>}
      {children}
    </div>
  );
}

function RankRow({ rank, label, value, bar, max, color = C.green }: { rank: number; label: string; value: string; bar: number; max: number; color?: string }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-5 text-[10px] font-bold text-gray-300 text-right">{rank}</span>
      <span className="text-xs font-medium text-gray-800 w-40 truncate">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(bar / max) * 100}%`, backgroundColor: color }} />
      </div>
      <span className="font-mono text-xs text-gray-600 w-16 text-right">{value}</span>
    </div>
  );
}

function Heatmap({ items, title }: { items: { label: string; cells: { tip: string; s: 'g' | 'a' | 'r' | 'x' }[] }[]; title: string }) {
  const bg = { g: 'bg-emerald-400', a: 'bg-amber-400', r: 'bg-red-400', x: 'bg-gray-200' };
  return (
    <Panel title={title}>
      <div className="space-y-2">
        {items.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-28 text-[10px] font-medium text-gray-700 truncate flex-shrink-0">{row.label}</span>
            <div className="flex gap-1 flex-1">
              {row.cells.map((c, j) => (
                <div key={j} className="group relative">
                  <div className={`w-7 h-7 rounded ${bg[c.s]} transition-transform hover:scale-110`} />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap">{c.tip}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-3 pt-2 border-t border-gray-100">
        {[['bg-emerald-400', 'On Track'], ['bg-amber-400', 'Attention'], ['bg-red-400', 'Critical']].map(([bg, l]) => (
          <div key={l} className="flex items-center gap-1"><div className={`w-3 h-3 rounded ${bg}`} /><span className="text-[9px] text-gray-500">{l}</span></div>
        ))}
      </div>
    </Panel>
  );
}

function DataRows({ headers, rows, title, className = '' }: { headers: string[]; rows: (string | React.ReactNode)[][]; title: string; className?: string }) {
  return (
    <Panel className={`!p-0 overflow-hidden ${className}`}>
      <div className="px-3 py-2.5 border-b border-gray-100"><h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{title}</h3></div>
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-50/80 border-b border-gray-200">
            {headers.map((h, i) => <th key={i} className={`px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider ${i > 0 ? 'text-right' : 'text-left'}`}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
              {row.map((cell, j) => <td key={j} className={`px-3 py-2 ${j > 0 ? 'text-right' : ''}`}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CUSTOM TOOLTIP
   ═══════════════════════════════════════════════════════════════════ */
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-[10px] px-2 py-1.5 rounded shadow-lg">
      {label && <div className="font-semibold mb-0.5">{label}</div>}
      {payload.map((p, i) => <div key={i} className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />{p.name}: <span className="font-mono">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span></div>)}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DASHBOARD CONFIGS
   ═══════════════════════════════════════════════════════════════════ */
interface MetricConfig { title: string; value: string; change?: string; changeType?: 'up' | 'down' | 'neutral'; color: 'green' | 'teal' | 'signal' | 'amber' | 'red'; icon: React.ReactNode }
interface DashConfig { title: string; subtitle: string; metrics: MetricConfig[]; content: React.ReactNode }

const dashboards: Record<string, DashConfig> = {

  /* ──────────── CASH ──────────── */
  cash: {
    title: 'Cash Dashboard', subtitle: 'Cash positions, balances, and liquidity overview',
    metrics: [
      { title: 'Total Cash', value: '$142.8M', change: '+$8.2M MTD', changeType: 'up', color: 'green', icon: <Wallet className="w-4 h-4" /> },
      { title: 'Operating Cash', value: '$68.5M', change: '48% of total', changeType: 'neutral', color: 'teal', icon: <DollarSign className="w-4 h-4" /> },
      { title: 'Committed Unfunded', value: '$312M', change: '22% drawn', changeType: 'neutral', color: 'amber', icon: <BarChart3 className="w-4 h-4" /> },
      { title: 'Next 30d Net Flow', value: '+$24.5M', change: '3 calls pending', changeType: 'up', color: 'signal', icon: <TrendingUp className="w-4 h-4" /> },
    ],
    content: (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Panel title="Cash Balance Trend (12M)" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={[
              { m: 'May', cash: 98 }, { m: 'Jun', cash: 105 }, { m: 'Jul', cash: 112 }, { m: 'Aug', cash: 108 },
              { m: 'Sep', cash: 118 }, { m: 'Oct', cash: 125 }, { m: 'Nov', cash: 120 }, { m: 'Dec', cash: 131 },
              { m: 'Jan', cash: 128 }, { m: 'Feb', cash: 135 }, { m: 'Mar', cash: 138 }, { m: 'Apr', cash: 143 },
            ]}>
              <defs>
                <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.green} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.green} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="m" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}M`} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="cash" stroke={C.green} fill="url(#cashGrad)" strokeWidth={2} name="Cash ($M)" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Upcoming Cash Events">
          <div className="space-y-0">
            {[
              { d: 'Apr 8', t: 'Walker III capital call receipt', a: '+$18.5M', dir: 'in' as const },
              { d: 'Apr 10', t: 'GS MM interest credit', a: '+$42.5K', dir: 'in' as const },
              { d: 'Apr 12', t: 'White Credit V distribution', a: '-$2.75M', dir: 'out' as const },
              { d: 'Apr 15', t: 'Q1 mgmt fee collection', a: '+$4.2M', dir: 'in' as const },
              { d: 'Apr 15', t: 'Cruz II facility repayment', a: '-$5.0M', dir: 'out' as const },
              { d: 'Apr 25', t: 'Rodriguez EM FoF call', a: '+$8.2M', dir: 'in' as const },
              { d: 'Apr 30', t: 'Monthly payroll', a: '-$892K', dir: 'out' as const },
            ].map((e, i) => (
              <div key={i} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${e.dir === 'in' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                <span className="font-mono text-[10px] text-gray-400 w-12 flex-shrink-0">{e.d}</span>
                <span className="text-[11px] text-gray-700 flex-1 truncate">{e.t}</span>
                <span className={`font-mono text-[11px] font-semibold ${e.dir === 'in' ? 'text-emerald-600' : 'text-red-500'}`}>{e.a}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    ),
  },

  /* ──────────── PORTFOLIO SUMMARY ──────────── */
  'portfolio-summary': {
    title: 'Portfolio Summary', subtitle: 'Cross-fund allocation and performance overview',
    metrics: [
      { title: 'Total AUM', value: '$4.2B', change: '+3.2% MTD', changeType: 'up', color: 'green', icon: <PieIcon className="w-4 h-4" /> },
      { title: 'Net IRR', value: '18.7%', change: 'Since inception', changeType: 'up', color: 'green', icon: <TrendingUp className="w-4 h-4" /> },
      { title: 'Weighted MOIC', value: '1.82x', change: 'Across 15 funds', changeType: 'up', color: 'signal', icon: <BarChart3 className="w-4 h-4" /> },
      { title: 'Active Funds', value: '15', change: '3 in harvesting', changeType: 'neutral', color: 'teal', icon: <Target className="w-4 h-4" /> },
    ],
    content: (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <Panel title="AUM by Strategy" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Buyout/PE', value: 1470 }, { name: 'Credit', value: 924 },
                  { name: 'Real Estate', value: 756 }, { name: 'Venture', value: 420 },
                  { name: 'Infrastructure', value: 336 }, { name: 'Fund of Funds', value: 294 },
                ]}
                cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {PIE_COLORS.map((c, i) => <Cell key={i} fill={c} />)}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Fund Performance Rankings" className="lg:col-span-3">
          {[
            { fund: 'Campbell Growth IV', irr: 24.3, moic: '2.1x' },
            { fund: 'Walker Enterprise III', irr: 19.8, moic: '1.8x' },
            { fund: 'Lopez RE Opps III', irr: 17.2, moic: '1.6x' },
            { fund: 'Cruz Ventures II', irr: 15.8, moic: '1.5x' },
            { fund: 'Sullivan Alpha', irr: 11.5, moic: '1.3x' },
            { fund: 'White Senior Credit V', irr: 8.2, moic: '1.1x' },
            { fund: 'Rodriguez EM FoF I', irr: 6.8, moic: '0.9x' },
          ].map((f, i) => <RankRow key={i} rank={i + 1} label={f.fund} value={`${f.irr}% · ${f.moic}`} bar={f.irr} max={30} color={f.irr > 15 ? C.green : f.irr > 10 ? C.amber : C.red} />)}
        </Panel>
      </div>
    ),
  },

  /* ──────────── NAV ──────────── */
  nav: {
    title: 'NAV Dashboard', subtitle: 'Fund net asset values and month-to-date changes',
    metrics: [
      { title: 'Aggregate NAV', value: '$3.94B', change: '+2.8% MTD', changeType: 'up', color: 'green', icon: <DollarSign className="w-4 h-4" /> },
      { title: 'NAV Increases', value: '12 funds', change: 'Positive MTD', changeType: 'up', color: 'signal', icon: <TrendingUp className="w-4 h-4" /> },
      { title: 'NAV Decreases', value: '3 funds', change: 'FX/market', changeType: 'down', color: 'red', icon: <AlertCircle className="w-4 h-4" /> },
      { title: 'Pending Adj.', value: '4', change: 'Valuation updates', changeType: 'neutral', color: 'amber', icon: <Clock className="w-4 h-4" /> },
    ],
    content: (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Panel title="NAV Trend (6Q)" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[
              { q: 'Q3 \'24', nav: 3280 }, { q: 'Q4 \'24', nav: 3410 }, { q: 'Q1 \'25', nav: 3530 },
              { q: 'Q2 \'25', nav: 3350 }, { q: 'Q3 \'25', nav: 3650 }, { q: 'Q4 \'25', nav: 3820 }, { q: 'Q1 \'26', nav: 3940 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="q" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(1)}B`} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="nav" name="NAV ($M)" fill={C.teal} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Heatmap title="Control Check Matrix" items={[
          { label: 'Walker III', cells: [{ tip: 'Pricing ✓', s: 'g' }, { tip: 'Cash Rec ✓', s: 'g' }, { tip: 'Tolerance ✓', s: 'g' }, { tip: 'Side Letters ✓', s: 'g' }, { tip: 'FX ✓', s: 'g' }] },
          { label: 'Campbell IV', cells: [{ tip: 'Pricing ✓', s: 'g' }, { tip: 'Cash Rec ✓', s: 'g' }, { tip: 'Tolerance ✓', s: 'g' }, { tip: 'Side Letters ⚠', s: 'a' }, { tip: 'FX ✓', s: 'g' }] },
          { label: 'Sullivan Alpha', cells: [{ tip: 'Pricing ✓', s: 'g' }, { tip: 'Cash Rec ⚠', s: 'a' }, { tip: 'Tolerance ✓', s: 'g' }, { tip: 'Side Letters ✓', s: 'g' }, { tip: 'FX ✓', s: 'g' }] },
          { label: 'White Credit V', cells: [{ tip: 'Pricing ⚠', s: 'a' }, { tip: 'Cash Rec ✓', s: 'g' }, { tip: 'Tolerance ✓', s: 'g' }, { tip: 'Side Letters ✗', s: 'r' }, { tip: 'FX ✓', s: 'g' }] },
          { label: 'Cruz Ventures II', cells: [{ tip: 'Pricing ✓', s: 'g' }, { tip: 'Cash Rec ✓', s: 'g' }, { tip: 'Tolerance ⚠', s: 'a' }, { tip: 'Side Letters ✓', s: 'g' }, { tip: 'FX ✓', s: 'g' }] },
          { label: 'Lopez RE III', cells: [{ tip: 'Pricing ⚠', s: 'a' }, { tip: 'Cash Rec ✓', s: 'g' }, { tip: 'Tolerance ✓', s: 'g' }, { tip: 'Side Letters ✓', s: 'g' }, { tip: 'FX ✓', s: 'g' }] },
          { label: 'Rodriguez EM', cells: [{ tip: 'Pricing ✓', s: 'g' }, { tip: 'Cash Rec ✓', s: 'g' }, { tip: 'Tolerance ✗', s: 'r' }, { tip: 'Side Letters ✓', s: 'g' }, { tip: 'FX ✗', s: 'r' }] },
        ]} />
      </div>
    ),
  },

  /* ──────────── CONTROL CHECKS ──────────── */
  'control-checks': {
    title: 'Control Checks', subtitle: 'Operational control status and exceptions',
    metrics: [
      { title: 'Total Controls', value: '48', change: 'Across all funds', changeType: 'neutral', color: 'teal', icon: <Shield className="w-4 h-4" /> },
      { title: 'Passed', value: '42', change: '87.5% pass rate', changeType: 'up', color: 'green', icon: <CheckCircle2 className="w-4 h-4" /> },
      { title: 'Exceptions', value: '4', change: 'Under review', changeType: 'down', color: 'red', icon: <AlertCircle className="w-4 h-4" /> },
      { title: 'Pending', value: '2', change: 'Awaiting sign-off', changeType: 'neutral', color: 'amber', icon: <Clock className="w-4 h-4" /> },
    ],
    content: (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Panel title="Pass Rate by Category">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart layout="vertical" data={[
              { cat: 'NAV', passed: 11, failed: 1 }, { cat: 'Cash', passed: 7, failed: 1 },
              { cat: 'Compliance', passed: 8, failed: 2 }, { cat: 'Investor', passed: 8, failed: 0 },
              { cat: 'Reporting', passed: 10, failed: 0 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="cat" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={80} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="passed" stackId="a" fill={C.green} radius={[0, 0, 0, 0]} name="Passed" />
              <Bar dataKey="failed" stackId="a" fill={C.red} radius={[0, 4, 4, 0]} name="Failed" />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Active Exceptions">
          <div className="space-y-0">
            {[
              { ctrl: 'NAV-07: Cash Rec Variance', fund: 'Walker III', detail: 'Variance >$10K — bank timing', status: 'Under Review' },
              { ctrl: 'CASH-03: Settlement Timing', fund: 'Cruz Ventures II', detail: 'T+3 breach on wire transfer', status: 'Escalated' },
              { ctrl: 'COMP-02: KYC Refresh', fund: 'Rodriguez EM FoF', detail: '3 investors past due date', status: 'Overdue' },
              { ctrl: 'COMP-05: Side Letter MFN', fund: 'White Credit V', detail: 'Unverified MFN clause', status: 'In Progress' },
            ].map((e, i) => (
              <div key={i} className="py-2.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-900">{e.ctrl}</span>
                  <StatusBadge status={e.status} />
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">{e.fund} — {e.detail}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    ),
  },

  /* ──────────── ANALYTICS ──────────── */
  analytics: {
    title: 'Analytics', subtitle: 'Cross-platform operational and financial analytics',
    metrics: [
      { title: 'Data Points', value: '1.2M', change: '+45K this week', changeType: 'up', color: 'teal', icon: <BarChart3 className="w-4 h-4" /> },
      { title: 'Avg Response', value: '1.2s', change: '-0.3s MoM', changeType: 'up', color: 'green', icon: <Clock className="w-4 h-4" /> },
      { title: 'Automation', value: '78%', change: '+5pp QoQ', changeType: 'up', color: 'signal', icon: <Activity className="w-4 h-4" /> },
      { title: 'Data Quality', value: '96.4%', change: 'Confidence', changeType: 'neutral', color: 'green', icon: <CheckCircle2 className="w-4 h-4" /> },
    ],
    content: (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Panel title="Automation Rate Trend" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={[
              { m: 'Jul', rate: 58, target: 75 }, { m: 'Aug', rate: 61, target: 75 }, { m: 'Sep', rate: 64, target: 75 },
              { m: 'Oct', rate: 67, target: 75 }, { m: 'Nov', rate: 70, target: 75 }, { m: 'Dec', rate: 72, target: 75 },
              { m: 'Jan', rate: 73, target: 80 }, { m: 'Feb', rate: 75, target: 80 }, { m: 'Mar', rate: 78, target: 80 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="m" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} domain={[50, 90]} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="target" stroke={C.slate} strokeDasharray="5 5" strokeWidth={1.5} dot={false} name="Target %" />
              <Line type="monotone" dataKey="rate" stroke={C.green} strokeWidth={2.5} dot={{ r: 3, fill: C.green }} name="Actual %" />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Process Automation">
          {[
            { label: 'NAV Automation', pct: 94 }, { label: 'Capital Call Processing', pct: 94 },
            { label: 'Doc Classification', pct: 97 }, { label: 'Cash Reconciliation', pct: 89 },
            { label: 'Investor Onboarding', pct: 72 },
          ].map((p, i) => (
            <div key={i} className="mb-2.5 last:mb-0">
              <div className="flex justify-between mb-1">
                <span className="text-[11px] font-medium text-gray-700">{p.label}</span>
                <span className="font-mono text-[10px] text-gray-500">{p.pct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p.pct}%`, backgroundColor: p.pct >= 90 ? C.green : p.pct >= 80 ? C.amber : C.red }} />
              </div>
            </div>
          ))}
        </Panel>
      </div>
    ),
  },

  /* ──────────── WORKFLOW ──────────── */
  workflow: {
    title: 'Workflow Dashboard', subtitle: 'Task pipeline and bottleneck analysis',
    metrics: [
      { title: 'Active Workflows', value: '24', change: '6 critical path', changeType: 'neutral', color: 'teal', icon: <Activity className="w-4 h-4" /> },
      { title: 'Avg Cycle Time', value: '3.2 days', change: '-0.8d vs avg', changeType: 'up', color: 'green', icon: <Clock className="w-4 h-4" /> },
      { title: 'Bottlenecks', value: '3', change: 'Review stage', changeType: 'down', color: 'red', icon: <AlertCircle className="w-4 h-4" /> },
      { title: 'Completion Rate', value: '89%', change: '+4% this month', changeType: 'up', color: 'signal', icon: <CheckCircle2 className="w-4 h-4" /> },
    ],
    content: (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <Panel title="Pipeline Funnel" className="lg:col-span-3">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[
              { stage: 'Not Started', count: 4, fill: C.slate },
              { stage: 'In Progress', count: 12, fill: C.blue },
              { stage: 'Under Review', count: 5, fill: C.amber },
              { stage: 'Approved', count: 3, fill: C.green },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="stage" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" name="Tasks" radius={[4, 4, 0, 0]}>
                {[C.slate, C.blue, C.amber, C.green].map((c, i) => <Cell key={i} fill={c} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Bottleneck Detail" className="lg:col-span-2">
          {[
            { task: 'Walker III Q1 NAV Review', days: 4, owner: 'Megan Moore', status: 'Blocked' },
            { task: 'Campbell IV Board Deck Approval', days: 3, owner: 'Jason Cooper', status: 'Under Review' },
            { task: 'Rodriguez KYC Refresh', days: 6, owner: 'Sarah Garcia', status: 'Overdue' },
          ].map((b, i) => (
            <div key={i} className="py-2.5 border-b border-gray-50 last:border-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-900">{b.task}</span>
                <StatusBadge status={b.status} />
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">{b.owner} · {b.days} days in queue</div>
            </div>
          ))}
        </Panel>
      </div>
    ),
  },

  /* ──────────── AI SUMMARY ──────────── */
  'ai-summary': {
    title: 'AI Summary', subtitle: 'AI skill usage, accuracy, and automation metrics',
    metrics: [
      { title: 'AI Skills Active', value: '8', change: '3 in beta', changeType: 'neutral', color: 'teal', icon: <Brain className="w-4 h-4" /> },
      { title: 'Total Runs', value: '12,847', change: '+2,100 this month', changeType: 'up', color: 'green', icon: <Activity className="w-4 h-4" /> },
      { title: 'Avg Accuracy', value: '96.2%', change: '+1.1pp QoQ', changeType: 'up', color: 'signal', icon: <Target className="w-4 h-4" /> },
      { title: 'Time Saved', value: '842 hrs', change: 'This quarter', changeType: 'up', color: 'green', icon: <Clock className="w-4 h-4" /> },
    ],
    content: (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Panel title="Skill Run Volume (6M)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[
              { m: 'Nov', runs: 1420 }, { m: 'Dec', runs: 1680 }, { m: 'Jan', runs: 1920 },
              { m: 'Feb', runs: 2080 }, { m: 'Mar', runs: 2340 }, { m: 'Apr', runs: 2100 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="m" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="runs" name="Runs" fill={C.indigo} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Heatmap title="Skill Performance Matrix" items={[
          { label: 'NAV Anomaly Det.', cells: [{ tip: 'Accuracy 98%', s: 'g' }, { tip: 'Speed: Fast', s: 'g' }, { tip: 'Volume: High', s: 'g' }, { tip: 'Errors: 0', s: 'g' }] },
          { label: 'Doc Classifier', cells: [{ tip: 'Accuracy 97%', s: 'g' }, { tip: 'Speed: Fast', s: 'g' }, { tip: 'Volume: High', s: 'g' }, { tip: 'Errors: 2', s: 'a' }] },
          { label: 'Cash Recon', cells: [{ tip: 'Accuracy 96%', s: 'g' }, { tip: 'Speed: Med', s: 'a' }, { tip: 'Volume: Med', s: 'g' }, { tip: 'Errors: 1', s: 'g' }] },
          { label: 'K-1 Extraction', cells: [{ tip: 'Accuracy 94%', s: 'a' }, { tip: 'Speed: Slow', s: 'r' }, { tip: 'Volume: Med', s: 'g' }, { tip: 'Errors: 5', s: 'a' }] },
          { label: 'Investor Match', cells: [{ tip: 'Accuracy 92%', s: 'a' }, { tip: 'Speed: Fast', s: 'g' }, { tip: 'Volume: Low', s: 'x' }, { tip: 'Errors: 3', s: 'a' }] },
        ]} />
      </div>
    ),
  },

  /* ──────────── TIMESHEET ANALYTICS ──────────── */
  'timesheet-analytics': {
    title: 'Timesheet Analytics', subtitle: 'Team utilization and billing analysis',
    metrics: [
      { title: 'Avg Utilization', value: '82.4%', change: '+3.2pp vs target', changeType: 'up', color: 'green', icon: <Clock className="w-4 h-4" /> },
      { title: 'Billable Hours', value: '2,480', change: 'This month', changeType: 'neutral', color: 'teal', icon: <BarChart3 className="w-4 h-4" /> },
      { title: 'Revenue/Hour', value: '$185', change: '+$12 vs prior Q', changeType: 'up', color: 'signal', icon: <DollarSign className="w-4 h-4" /> },
      { title: 'Non-Billable', value: '17.6%', change: 'Training & admin', changeType: 'neutral', color: 'amber', icon: <Target className="w-4 h-4" /> },
    ],
    content: (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Panel title="Utilization by Department" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart layout="vertical" data={[
              { dept: 'Tax', util: 91, target: 85 }, { dept: 'Fund Accounting', util: 88, target: 85 },
              { dept: 'Operations', util: 84, target: 80 }, { dept: 'Compliance', util: 76, target: 80 },
              { dept: 'IR', util: 72, target: 80 }, { dept: 'Technology', util: 68, target: 75 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="dept" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={100} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="util" name="Utilization %" fill={C.green} radius={[0, 4, 4, 0]} barSize={14} />
              <Bar dataKey="target" name="Target %" fill={C.slate} radius={[0, 4, 4, 0]} barSize={14} opacity={0.3} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Billing Mix">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={[{ name: 'Billable', value: 82.4 }, { name: 'Admin', value: 8.2 }, { name: 'Training', value: 5.4 }, { name: 'PTO', value: 4.0 }]} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                {[C.green, C.slate, C.blue, C.amber].map((c, i) => <Cell key={i} fill={c} />)}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    ),
  },

  /* ──────────── GP DIRECT MARGIN ──────────── */
  'gp-direct-margin': {
    title: 'GP Direct Margin', subtitle: 'Profitability analysis by general partner',
    metrics: [
      { title: 'Avg GP Margin', value: '42.3%', change: '+1.2pp YoY', changeType: 'up', color: 'green', icon: <TrendingUp className="w-4 h-4" /> },
      { title: 'Total Revenue', value: '$18.5M', change: 'L12M', changeType: 'neutral', color: 'teal', icon: <DollarSign className="w-4 h-4" /> },
      { title: 'Direct Costs', value: '$10.7M', change: '57.7%', changeType: 'neutral', color: 'amber', icon: <BarChart3 className="w-4 h-4" /> },
      { title: 'Top Margin', value: '48.2%', change: 'Walker', changeType: 'up', color: 'signal', icon: <Target className="w-4 h-4" /> },
    ],
    content: (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <Panel title="Revenue vs Cost by GP" className="lg:col-span-3">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={[
              { gp: 'Walker', rev: 3.8, cost: 1.97 }, { gp: 'Campbell', rev: 2.9, cost: 1.59 },
              { gp: 'White', rev: 2.4, cost: 1.35 }, { gp: 'Lopez', rev: 2.1, cost: 1.27 },
              { gp: 'Sullivan', rev: 1.8, cost: 1.06 }, { gp: 'Rodriguez', rev: 1.6, cost: 1.02 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="gp" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}M`} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="rev" name="Revenue" fill={C.green} radius={[4, 4, 0, 0]} />
              <Bar dataKey="cost" name="Direct Costs" fill={C.red} radius={[4, 4, 0, 0]} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Margin Rankings" className="lg:col-span-2">
          {[
            { gp: 'Walker Asset Mgmt', margin: 48.2, trend: '+2.1pp' },
            { gp: 'Campbell Capital', margin: 45.1, trend: '+1.8pp' },
            { gp: 'White Advisors', margin: 43.8, trend: 'flat' },
            { gp: 'Sullivan Investments', margin: 41.2, trend: '-0.8pp' },
            { gp: 'Lopez Asset Partners', margin: 39.5, trend: '+0.5pp' },
            { gp: 'Rodriguez Capital', margin: 36.2, trend: '-1.4pp' },
          ].map((g, i) => (
            <div key={i} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
              <span className="w-5 text-[10px] font-bold text-gray-300 text-right">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-900 truncate">{g.gp}</div>
              </div>
              <span className={`font-mono text-xs font-bold ${g.margin >= 42 ? 'text-emerald-600' : g.margin >= 38 ? 'text-amber-600' : 'text-red-500'}`}>{g.margin}%</span>
              <span className={`text-[10px] ${g.trend.startsWith('+') ? 'text-emerald-500' : g.trend.startsWith('-') ? 'text-red-500' : 'text-gray-400'}`}>{g.trend}</span>
            </div>
          ))}
        </Panel>
      </div>
    ),
  },

  /* ──────────── TEAM LEAD MARGINS ──────────── */
  'team-lead-margins': {
    title: 'Team Lead Margins', subtitle: 'Margin analysis by team lead and pod',
    metrics: [
      { title: 'Team Leads', value: '5', change: 'Active pods', changeType: 'neutral', color: 'teal', icon: <Users className="w-4 h-4" /> },
      { title: 'Best Margin', value: '46.8%', change: 'Pod Alpha', changeType: 'up', color: 'green', icon: <TrendingUp className="w-4 h-4" /> },
      { title: 'Lowest', value: '35.2%', change: 'Pod Delta', changeType: 'down', color: 'red', icon: <AlertCircle className="w-4 h-4" /> },
      { title: 'Avg Revenue', value: '$3.7M', change: 'Per lead', changeType: 'neutral', color: 'signal', icon: <DollarSign className="w-4 h-4" /> },
    ],
    content: (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Panel title="Pod Margin Comparison">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[
              { pod: 'Alpha', margin: 46.8 }, { pod: 'Beta', margin: 44.1 }, { pod: 'Gamma', margin: 42.3 },
              { pod: 'Epsilon', margin: 40.5 }, { pod: 'Delta', margin: 35.2 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="pod" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[30, 50]} tickFormatter={v => `${v}%`} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="margin" name="Margin %" radius={[4, 4, 0, 0]}>
                {[C.green, C.green, C.green, C.amber, C.red].map((c, i) => <Cell key={i} fill={c} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <DataRows title="Pod Performance Detail" headers={['Pod', 'Lead', 'GPs', 'Revenue', 'Margin']} rows={[
          ['Pod Alpha', 'Megan Moore', '4', '$4.2M', <span key="m" className="font-mono text-emerald-600 font-bold">46.8%</span>],
          ['Pod Beta', 'Diana Smith', '3', '$3.5M', <span key="m" className="font-mono text-emerald-600 font-bold">44.1%</span>],
          ['Pod Gamma', 'Jason Cooper', '3', '$3.8M', <span key="m" className="font-mono text-emerald-600 font-bold">42.3%</span>],
          ['Pod Epsilon', 'Sarah Garcia', '2', '$3.9M', <span key="m" className="font-mono text-amber-600 font-bold">40.5%</span>],
          ['Pod Delta', 'Steven Wright', '3', '$3.1M', <span key="m" className="font-mono text-red-500 font-bold">35.2%</span>],
        ]} />
      </div>
    ),
  },

  /* ──────────── GP OS INVOICES ──────────── */
  'gp-os-invoices': {
    title: 'GP Outstanding Invoices', subtitle: 'Accounts receivable and aging analysis',
    metrics: [
      { title: 'Total Outstanding', value: '$2.8M', change: '8 invoices', changeType: 'neutral', color: 'teal', icon: <Receipt className="w-4 h-4" /> },
      { title: 'Current (<30d)', value: '$1.9M', change: '5 invoices', changeType: 'neutral', color: 'green', icon: <DollarSign className="w-4 h-4" /> },
      { title: '30-60 Days', value: '$620K', change: '2 invoices', changeType: 'neutral', color: 'amber', icon: <Clock className="w-4 h-4" /> },
      { title: '60+ Days', value: '$280K', change: '1 — escalated', changeType: 'down', color: 'red', icon: <AlertCircle className="w-4 h-4" /> },
    ],
    content: (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Panel title="Aging Distribution">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={[{ name: 'Current', value: 1900 }, { name: '30-60d', value: 620 }, { name: '60+', value: 280 }]} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                {[C.green, C.amber, C.red].map((c, i) => <Cell key={i} fill={c} />)}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
        <DataRows className="lg:col-span-2" title="Outstanding Detail" headers={['GP', 'Amount', 'Days', 'Status']} rows={[
          [<span key="g" className="font-medium text-gray-900">Walker Asset Management</span>, '$820K', '12', <StatusBadge key="s" status="Current" />],
          [<span key="g" className="font-medium text-gray-900">Campbell Capital Partners</span>, '$620K', <span key="d" className="font-mono text-amber-600">32</span>, <StatusBadge key="s" status="Follow-up Sent" />],
          [<span key="g" className="font-medium text-gray-900">Sullivan Investments</span>, '$480K', '18', <StatusBadge key="s" status="Current" />],
          [<span key="g" className="font-medium text-gray-900">Lopez Asset Partners</span>, '$350K', '8', <StatusBadge key="s" status="Current" />],
          [<span key="g" className="font-medium text-gray-900">Rodriguez Capital</span>, <span key="a" className="font-mono text-red-500">$280K</span>, <span key="d" className="font-mono text-red-500 font-bold">68</span>, <StatusBadge key="s" status="Overdue" />],
        ]} />
      </div>
    ),
  },

  /* ──────────── CFO PERSONA ──────────── */
  'cfo-persona': {
    title: 'CFO Dashboard', subtitle: 'Executive financial overview and key decisions',
    metrics: [
      { title: 'Total AUM', value: '$4.2B', change: '+3.2% QoQ', changeType: 'up', color: 'green', icon: <DollarSign className="w-4 h-4" /> },
      { title: 'Net Revenue', value: '$18.5M', change: '+8.1% YoY', changeType: 'up', color: 'green', icon: <TrendingUp className="w-4 h-4" /> },
      { title: 'Operating Margin', value: '42.3%', change: '+1.2pp', changeType: 'up', color: 'signal', icon: <Gauge className="w-4 h-4" /> },
      { title: 'Cash Position', value: '$142.8M', change: 'Liquid', changeType: 'neutral', color: 'teal', icon: <Wallet className="w-4 h-4" /> },
    ],
    content: (
      <div className="space-y-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard title="Headcount" value="42 FTEs" change="+2 open roles" changeType="neutral" color="teal" icon={<Users className="w-4 h-4" />} />
          <MetricCard title="Tech Spend" value="$1.4M" change="7.6% of rev" changeType="neutral" color="teal" icon={<BarChart3 className="w-4 h-4" />} />
          <MetricCard title="Pipeline" value="$2.1M" change="New mandates Q2" changeType="up" color="signal" icon={<Target className="w-4 h-4" />} />
          <MetricCard title="AR Aging" value="$280K" change="60+ days" changeType="down" color="red" icon={<AlertCircle className="w-4 h-4" />} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          <Panel title="Revenue & Margin Trend" className="lg:col-span-3">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={[
                { q: 'Q1 \'25', rev: 15.2, margin: 38 }, { q: 'Q2 \'25', rev: 16.1, margin: 39.5 },
                { q: 'Q3 \'25', rev: 16.8, margin: 40.2 }, { q: 'Q4 \'25', rev: 17.4, margin: 41.1 }, { q: 'Q1 \'26', rev: 18.5, margin: 42.3 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="q" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}M`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                <Line yAxisId="left" type="monotone" dataKey="rev" stroke={C.green} strokeWidth={2.5} dot={{ r: 3 }} name="Revenue ($M)" />
                <Line yAxisId="right" type="monotone" dataKey="margin" stroke={C.indigo} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} name="Margin %" />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title="Key Decisions" className="lg:col-span-2">
            {[
              { item: 'Approve Rodriguez EM FoF II launch', detail: '$500M target — Investment Committee Apr 15', icon: <ArrowUpRight className="w-3 h-3 text-emerald-500" /> },
              { item: 'Cruz II credit facility renewal', detail: '$25M facility, Morgan Stanley — expires May 31', icon: <AlertCircle className="w-3 h-3 text-amber-500" /> },
              { item: 'Headcount: 2 Fund Accountants', detail: 'Tax season demand — $180K budget', icon: <Users className="w-3 h-3 text-blue-500" /> },
              { item: 'Tech: Migrate doc storage to S3', detail: '$48K annual savings — CTO recommends', icon: <CheckCircle2 className="w-3 h-3 text-green-500" /> },
            ].map((d, i) => (
              <div key={i} className="flex items-start gap-2 py-2 border-b border-gray-50 last:border-0">
                <div className="mt-0.5">{d.icon}</div>
                <div>
                  <div className="text-xs font-medium text-gray-900">{d.item}</div>
                  <div className="text-[10px] text-gray-400">{d.detail}</div>
                </div>
              </div>
            ))}
          </Panel>
        </div>
      </div>
    ),
  },

  /* ──────────── IR PERSONA ──────────── */
  'ir-persona': {
    title: 'IR Dashboard', subtitle: 'Investor relations activity and engagement',
    metrics: [
      { title: 'Active LPs', value: '48', change: '12 institutional', changeType: 'neutral', color: 'teal', icon: <Users className="w-4 h-4" /> },
      { title: 'NPS Score', value: '72', change: '+4 vs prior', changeType: 'up', color: 'green', icon: <Target className="w-4 h-4" /> },
      { title: 'Open Requests', value: '7', change: '3 urgent', changeType: 'neutral', color: 'amber', icon: <FileText className="w-4 h-4" /> },
      { title: 'Portal Logins', value: '342', change: 'Last 30d', changeType: 'up', color: 'signal', icon: <Eye className="w-4 h-4" /> },
    ],
    content: (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <Panel title="Portal Activity (12W)" className="lg:col-span-3">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={[
              { w: 'W1', logins: 62 }, { w: 'W2', logins: 58 }, { w: 'W3', logins: 71 }, { w: 'W4', logins: 84 },
              { w: 'W5', logins: 78 }, { w: 'W6', logins: 92 }, { w: 'W7', logins: 88 }, { w: 'W8', logins: 95 },
              { w: 'W9', logins: 102 }, { w: 'W10', logins: 98 }, { w: 'W11', logins: 110 }, { w: 'W12', logins: 105 },
            ]}>
              <defs>
                <linearGradient id="irGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.indigo} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.indigo} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="w" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="logins" stroke={C.indigo} fill="url(#irGrad)" strokeWidth={2} name="Logins" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Top Engaged LPs" className="lg:col-span-2">
          {[
            { lp: 'CalPERS', visits: 28, detail: '4 downloads, ESG inquiry', status: 'Active' },
            { lp: 'Yale Endowment', visits: 22, detail: 'Co-invest discussions', status: 'Active' },
            { lp: 'ADIA', visits: 18, detail: '$25M→$40M increase', status: 'In Progress' },
            { lp: 'Ontario Teachers', visits: 15, detail: 'Dist. timing inquiry', status: 'Pending' },
            { lp: 'GIC Singapore', visits: 12, detail: 'Annual review sched.', status: 'Scheduled' },
          ].map((lp, i) => (
            <div key={i} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
              <span className="w-5 text-[10px] font-bold text-gray-300 text-right">{lp.visits}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-900">{lp.lp}</div>
                <div className="text-[10px] text-gray-400 truncate">{lp.detail}</div>
              </div>
              <StatusBadge status={lp.status} />
            </div>
          ))}
        </Panel>
      </div>
    ),
  },

  /* ──────────── AUDITOR PERSONA ──────────── */
  'auditor-persona': {
    title: 'Auditor Dashboard', subtitle: 'Audit-ready compliance and documentation view',
    metrics: [
      { title: 'Audit Status', value: 'In Progress', change: 'FY2025', changeType: 'neutral', color: 'amber', icon: <Eye className="w-4 h-4" /> },
      { title: 'PBC Items', value: '42/58', change: '72%', changeType: 'up', color: 'signal', icon: <CheckCircle2 className="w-4 h-4" /> },
      { title: 'Findings', value: '3', change: '0 material', changeType: 'neutral', color: 'teal', icon: <AlertCircle className="w-4 h-4" /> },
      { title: 'Days to Close', value: '18', change: 'Target: Apr 23', changeType: 'neutral', color: 'teal', icon: <Clock className="w-4 h-4" /> },
    ],
    content: (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Panel title="PBC Completion by Fund">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart layout="vertical" data={[
              { fund: 'Walker III', done: 12, pending: 3 }, { fund: 'Campbell IV', done: 8, pending: 2 },
              { fund: 'Sullivan Alpha', done: 10, pending: 2 }, { fund: 'White Credit V', done: 6, pending: 3 },
              { fund: 'Other Funds', done: 6, pending: 6 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="fund" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={100} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="done" stackId="a" fill={C.green} name="Complete" />
              <Bar dataKey="pending" stackId="a" fill={C.amber} radius={[0, 4, 4, 0]} name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Audit Findings">
          {[
            { finding: 'F-01: Revenue Recognition Timing', severity: 'Low', fund: 'Sullivan Alpha', detail: 'Q4 fee accrual recorded in Q1 — $12K', status: 'Resolved' },
            { finding: 'F-02: Cash Rec Variance', severity: 'Low', fund: 'Walker III', detail: 'Bank timing — cleared Jan 3', status: 'Resolved' },
            { finding: 'F-03: Side Letter Completeness', severity: 'Med', fund: 'White Credit V', detail: 'Missing countersigned copy — counsel follow-up', status: 'In Progress' },
          ].map((f, i) => (
            <div key={i} className="py-2.5 border-b border-gray-50 last:border-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-900">{f.finding}</span>
                <StatusBadge status={f.status} />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${f.severity === 'Med' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>{f.severity}</span>
                <span className="text-[10px] text-gray-400">{f.fund} — {f.detail}</span>
              </div>
            </div>
          ))}
        </Panel>
      </div>
    ),
  },

  /* ──────────── COMPLIANCE ──────────── */
  compliance: {
    title: 'Compliance Dashboard', subtitle: 'Regulatory compliance status and tracking',
    metrics: [
      { title: 'Score', value: '94.2%', change: '+2.1pp QoQ', changeType: 'up', color: 'green', icon: <Shield className="w-4 h-4" /> },
      { title: 'Open Items', value: '6', change: '2 critical', changeType: 'neutral', color: 'amber', icon: <AlertCircle className="w-4 h-4" /> },
      { title: 'Filings Due', value: '3', change: 'Next 30 days', changeType: 'neutral', color: 'teal', icon: <FileText className="w-4 h-4" /> },
      { title: 'KYC Current', value: '92%', change: '4 refreshes due', changeType: 'neutral', color: 'signal', icon: <CheckCircle2 className="w-4 h-4" /> },
    ],
    content: (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <Panel title="Compliance Score Trend" className="lg:col-span-3">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={[
              { m: 'Oct', score: 88, target: 90 }, { m: 'Nov', score: 89.5, target: 90 }, { m: 'Dec', score: 91, target: 90 },
              { m: 'Jan', score: 92.1, target: 92 }, { m: 'Feb', score: 93.5, target: 92 }, { m: 'Mar', score: 94.2, target: 92 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="m" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[85, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="target" stroke={C.slate} strokeDasharray="5 5" strokeWidth={1.5} dot={false} name="Target" />
              <Line type="monotone" dataKey="score" stroke={C.green} strokeWidth={2.5} dot={{ r: 3, fill: C.green }} name="Score" />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Regulatory Calendar" className="lg:col-span-2">
          {[
            { filing: 'FATCA/CRS Filing', date: 'Apr 15', status: 'At Risk' },
            { filing: 'CalPERS Questionnaire', date: 'Apr 22', status: 'In Progress' },
            { filing: 'Form PF Annual', date: 'Apr 30', status: 'Not Started' },
            { filing: 'ADV Amendment', date: 'May 15', status: 'Scheduled' },
            { filing: 'KYC Refresh — Rodriguez', date: 'Overdue', status: 'Overdue' },
          ].map((f, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <div className="text-xs font-medium text-gray-900">{f.filing}</div>
                <div className="text-[10px] text-gray-400">{f.date}</div>
              </div>
              <StatusBadge status={f.status} />
            </div>
          ))}
        </Panel>
      </div>
    ),
  },

  /* ──────────── RISK ──────────── */
  risk: {
    title: 'Risk Dashboard', subtitle: 'Portfolio risk metrics and alerts',
    metrics: [
      { title: 'Risk Score', value: '3.2/10', change: 'Low-mod', changeType: 'neutral', color: 'green', icon: <Shield className="w-4 h-4" /> },
      { title: 'Active Alerts', value: '5', change: '1 critical', changeType: 'down', color: 'red', icon: <AlertCircle className="w-4 h-4" /> },
      { title: 'Concentration', value: '28%', change: 'Top GP', changeType: 'neutral', color: 'amber', icon: <PieIcon className="w-4 h-4" /> },
      { title: 'Liquidity', value: '1.8x', change: '>1.5x min', changeType: 'up', color: 'signal', icon: <Gauge className="w-4 h-4" /> },
    ],
    content: (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Panel title="Risk Exposure by Type">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[
              { type: 'Market', current: 2.8, limit: 5 }, { type: 'Credit', current: 1.5, limit: 4 },
              { type: 'Liquidity', current: 1.2, limit: 3 }, { type: 'FX', current: 3.8, limit: 4 },
              { type: 'Concentration', current: 2.4, limit: 3 }, { type: 'Operational', current: 1.8, limit: 4 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="type" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 6]} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="current" name="Current" fill={C.amber} radius={[4, 4, 0, 0]} />
              <Bar dataKey="limit" name="Limit" fill={C.slate} radius={[4, 4, 0, 0]} opacity={0.2} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Active Risk Alerts">
          {[
            { alert: 'FX Exposure: EUR unhedged > $15M', detail: 'Hedge execution in progress — target Apr 10', status: 'Overdue' },
            { alert: 'Concentration: Walker at 28% (30% limit)', detail: 'Under monitoring — no new allocations', status: 'At Risk' },
            { alert: 'Credit Facility: Cruz II at 72%', detail: '$5M repayment scheduled Apr 15', status: 'In Progress' },
            { alert: 'Counterparty: Goldman at 18% of cash', detail: 'Within limits, monitoring', status: 'Active' },
          ].map((a, i) => (
            <div key={i} className="py-2.5 border-b border-gray-50 last:border-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-900">{a.alert}</span>
                <StatusBadge status={a.status} />
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">{a.detail}</div>
            </div>
          ))}
        </Panel>
      </div>
    ),
  },

  /* ──────────── TREASURY CENTER ──────────── */
  'treasury-center': {
    title: 'Treasury Center', subtitle: 'Bank accounts, credit facilities, and cash management',
    metrics: [
      { title: 'Total Balances', value: '$142.8M', change: 'Across 12 accounts', changeType: 'neutral', color: 'teal', icon: <Wallet className="w-4 h-4" /> },
      { title: 'Credit Available', value: '$68M', change: '$25M drawn', changeType: 'neutral', color: 'green', icon: <DollarSign className="w-4 h-4" /> },
      { title: 'Yield (WA)', value: '4.82%', change: 'MM + T-bills', changeType: 'up', color: 'signal', icon: <TrendingUp className="w-4 h-4" /> },
      { title: 'Pending Wires', value: '4', change: '$8.2M total', changeType: 'neutral', color: 'amber', icon: <Clock className="w-4 h-4" /> },
    ],
    content: (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Panel title="Cash Allocation" className="lg:col-span-1">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={[
                { name: 'Money Market', value: 68 }, { name: 'T-Bills', value: 32 },
                { name: 'Operating', value: 28 }, { name: 'Escrow', value: 14.8 },
              ]} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {[C.green, C.blue, C.teal, C.amber].map((c, i) => <Cell key={i} fill={c} />)}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
        <DataRows className="lg:col-span-2" title="Bank Accounts" headers={['Account', 'Bank', 'Balance', 'Yield', 'Type']} rows={[
          ['Operating — Walker III', 'JPMorgan', '$28.5M', '0.15%', 'DDA'],
          ['MM — Primary', 'Goldman Sachs', '$42.0M', '5.12%', 'MM'],
          ['MM — Secondary', 'Morgan Stanley', '$26.0M', '5.08%', 'MM'],
          ['T-Bills', 'JPMorgan Custody', '$32.0M', '4.85%', 'T-Bills'],
          ['Escrow — Cruz II', 'Bank of NY', '$8.5M', '4.20%', 'Escrow'],
          ['Escrow — Lopez RE', 'Bank of NY', '$5.8M', '4.20%', 'Escrow'],
        ]} />
      </div>
    ),
  },

  /* ──────────── AUM TRACKER ──────────── */
  'aum-tracker': {
    title: 'AUM Tracker', subtitle: 'Assets under management trending and analysis',
    metrics: [
      { title: 'Current AUM', value: '$4.2B', change: '+$380M YTD', changeType: 'up', color: 'green', icon: <TrendingUp className="w-4 h-4" /> },
      { title: 'Organic Growth', value: '+$220M', change: 'New commitments', changeType: 'up', color: 'signal', icon: <ArrowUpRight className="w-4 h-4" /> },
      { title: 'Market Impact', value: '+$160M', change: 'Appreciation', changeType: 'up', color: 'green', icon: <BarChart3 className="w-4 h-4" /> },
      { title: 'Redemptions', value: '-$42M', change: '1% of AUM', changeType: 'down', color: 'red', icon: <ArrowDownRight className="w-4 h-4" /> },
    ],
    content: (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Panel title="AUM Growth (8Q)" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={[
              { q: 'Q2 \'24', aum: 2940 }, { q: 'Q3 \'24', aum: 3120 }, { q: 'Q4 \'24', aum: 3350 },
              { q: 'Q1 \'25', aum: 3530 }, { q: 'Q2 \'25', aum: 3350 }, { q: 'Q3 \'25', aum: 3650 },
              { q: 'Q4 \'25', aum: 3820 }, { q: 'Q1 \'26', aum: 4200 },
            ]}>
              <defs>
                <linearGradient id="aumGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.teal} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.teal} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="q" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(1)}B`} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="aum" stroke={C.teal} fill="url(#aumGrad)" strokeWidth={2.5} name="AUM ($M)" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Pipeline">
          {[
            { fund: 'Rodriguez EM FoF II', target: '$500M', timing: 'Q3 2026', stage: 'Fundraising' },
            { fund: 'Campbell Growth V', target: '$750M', timing: 'Q4 2026', stage: 'Launch' },
            { fund: 'Walker Infra I', target: '$400M', timing: 'Under review', stage: 'Consideration' },
          ].map((p, i) => (
            <div key={i} className="py-2.5 border-b border-gray-50 last:border-0">
              <div className="text-xs font-semibold text-gray-900">{p.fund}</div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-gray-400">{p.target} · {p.timing}</span>
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">{p.stage}</span>
              </div>
            </div>
          ))}
          <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[10px] font-medium text-gray-500">Total Pipeline</span>
            <span className="font-mono text-sm font-bold text-gray-900">$1.65B</span>
          </div>
        </Panel>
      </div>
    ),
  },

  /* ──────────── FEE RECONCILIATION ──────────── */
  'fee-reconciliation': {
    title: 'Fee Reconciliation', subtitle: 'Management and performance fee calculation status',
    metrics: [
      { title: 'Fees Calculated', value: '$4.8M', change: 'This quarter', changeType: 'neutral', color: 'teal', icon: <DollarSign className="w-4 h-4" /> },
      { title: 'Reconciled', value: '92%', change: '11/12 funds', changeType: 'up', color: 'green', icon: <CheckCircle2 className="w-4 h-4" /> },
      { title: 'Variances', value: '3', change: '>$5K threshold', changeType: 'neutral', color: 'amber', icon: <AlertCircle className="w-4 h-4" /> },
      { title: 'Pending', value: '$1.2M', change: '4 invoices', changeType: 'neutral', color: 'signal', icon: <Receipt className="w-4 h-4" /> },
    ],
    content: (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Panel title="Fee Breakdown by Type">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={[{ name: 'Management', value: 3100 }, { name: 'Performance', value: 1200 }, { name: 'Admin', value: 312 }, { name: 'Offsets', value: 82 }]} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4} dataKey="value">
                {[C.green, C.blue, C.indigo, C.red].map((c, i) => <Cell key={i} fill={c} />)}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
        <DataRows className="lg:col-span-2" title="Reconciliation Detail" headers={['Fund', 'Fee Type', 'Calculated', 'Collected', 'Variance']} rows={[
          [<span key="f" className="font-medium text-gray-900">Walker III</span>, 'Mgmt (2.0%)', '$892K', '$892K', <span key="v" className="font-mono text-emerald-500">$0</span>],
          [<span key="f" className="font-medium text-gray-900">Campbell IV</span>, 'Mgmt (1.5%)', '$654K', '$654K', <span key="v" className="font-mono text-emerald-500">$0</span>],
          [<span key="f" className="font-medium text-gray-900">Sullivan Alpha</span>, 'Mgmt (1.75%)', '$382K', '$370K', <span key="v" className="font-mono text-red-500">$12K</span>],
          [<span key="f" className="font-medium text-gray-900">White Credit V</span>, 'Mgmt (1.5%)', '$445K', '$437K', <span key="v" className="font-mono text-amber-500">$8K</span>],
          [<span key="f" className="font-medium text-gray-900">Rodriguez EM</span>, 'Admin (flat)', '$52K', '$46.8K', <span key="v" className="font-mono text-amber-500">$5.2K</span>],
        ]} />
      </div>
    ),
  },

  /* ──────────── INVESTOR RELATIONS ──────────── */
  'investor-relations': {
    title: 'Investor Relations', subtitle: 'LP engagement and communication tracking',
    metrics: [
      { title: 'Total LPs', value: '48', change: '15 institutional', changeType: 'neutral', color: 'teal', icon: <Users className="w-4 h-4" /> },
      { title: 'Engagement', value: '8.2/10', change: '+0.4 QoQ', changeType: 'up', color: 'green', icon: <Target className="w-4 h-4" /> },
      { title: 'Portal Logins', value: '342', change: '30 days', changeType: 'up', color: 'signal', icon: <Eye className="w-4 h-4" /> },
      { title: 'Tickets', value: '7', change: '2 high', changeType: 'neutral', color: 'amber', icon: <FileText className="w-4 h-4" /> },
    ],
    content: (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <Panel title="LP Commitment by Type" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={[
                { name: 'Pension', value: 1680 }, { name: 'Endowment', value: 840 },
                { name: 'Sovereign', value: 720 }, { name: 'Insurance', value: 480 },
                { name: 'Family Office', value: 320 }, { name: 'Other', value: 160 },
              ]} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {PIE_COLORS.map((c, i) => <Cell key={i} fill={c} />)}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Communications Calendar" className="lg:col-span-3">
          {[
            { item: 'Q1 Quarterly Letters — all funds', date: 'Apr 25', status: 'In Progress' },
            { item: 'Capital Call Notice — Rodriguez EM FoF', date: 'Apr 15', status: 'Draft' },
            { item: 'Annual Meeting Invite — Walker III', date: 'Apr 28', status: 'Scheduled' },
            { item: 'Performance Summary — all funds', date: 'May 1', status: 'Not Started' },
            { item: 'ESG Report — CalPERS portfolio', date: 'Jun 30', status: 'Scheduled' },
          ].map((c, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <div className="text-xs font-medium text-gray-900">{c.item}</div>
                <div className="text-[10px] text-gray-400">{c.date}</div>
              </div>
              <StatusBadge status={c.status} />
            </div>
          ))}
        </Panel>
      </div>
    ),
  },

  /* ──────────── FUND PERFORMANCE ──────────── */
  'fund-performance': {
    title: 'Fund Performance', subtitle: 'IRR, MOIC, TVPI, and DPI across all funds',
    metrics: [
      { title: 'Avg Net IRR', value: '18.7%', change: 'Since inception', changeType: 'up', color: 'green', icon: <TrendingUp className="w-4 h-4" /> },
      { title: 'Avg MOIC', value: '1.82x', change: '15 funds', changeType: 'up', color: 'signal', icon: <BarChart3 className="w-4 h-4" /> },
      { title: 'Avg TVPI', value: '1.65x', change: 'Total value', changeType: 'neutral', color: 'teal', icon: <Gauge className="w-4 h-4" /> },
      { title: 'Avg DPI', value: '0.92x', change: 'Distributed', changeType: 'neutral', color: 'teal', icon: <DollarSign className="w-4 h-4" /> },
    ],
    content: (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Panel title="IRR Distribution" className="lg:col-span-1">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart layout="vertical" data={[
              { fund: 'Campbell IV', irr: 24.3 }, { fund: 'Walker III', irr: 19.8 }, { fund: 'Lopez RE III', irr: 17.2 },
              { fund: 'Cruz Ventures II', irr: 15.8 }, { fund: 'Sullivan Alpha', irr: 11.5 },
              { fund: 'White Credit V', irr: 8.2 }, { fund: 'Rodriguez EM', irr: 6.8 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="fund" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={85} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="irr" name="Net IRR %" radius={[0, 4, 4, 0]}>
                {[C.green, C.green, C.green, C.green, C.amber, C.red, C.red].map((c, i) => <Cell key={i} fill={c} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <DataRows className="lg:col-span-2" title="Performance Summary" headers={['Fund', 'IRR', 'MOIC', 'TVPI', 'DPI', 'Status']} rows={[
          [<span key="f" className="font-medium text-gray-900">Campbell Growth IV</span>, <span key="i" className="font-mono text-emerald-600 font-bold">24.3%</span>, '2.1x', '1.8x', '1.2x', <StatusBadge key="s" status="Active" />],
          [<span key="f" className="font-medium text-gray-900">Walker Enterprise III</span>, <span key="i" className="font-mono text-emerald-600 font-bold">19.8%</span>, '1.8x', '1.6x', '1.1x', <StatusBadge key="s" status="Active" />],
          [<span key="f" className="font-medium text-gray-900">Lopez RE Opps III</span>, <span key="i" className="font-mono text-emerald-600">17.2%</span>, '1.6x', '1.4x', '0.9x', <StatusBadge key="s" status="Active" />],
          [<span key="f" className="font-medium text-gray-900">Cruz Ventures II</span>, '15.8%', '1.5x', '1.3x', '0.8x', <StatusBadge key="s" status="Active" />],
          [<span key="f" className="font-medium text-gray-900">Sullivan Alpha</span>, <span key="i" className="font-mono text-amber-600">11.5%</span>, '1.3x', '1.2x', '0.7x', <StatusBadge key="s" status="Under Review" />],
          [<span key="f" className="font-medium text-gray-900">White Senior Credit V</span>, <span key="i" className="font-mono text-red-500">8.2%</span>, '1.1x', '1.0x', '0.6x', <StatusBadge key="s" status="At Risk" />],
          [<span key="f" className="font-medium text-gray-900">Rodriguez EM FoF I</span>, <span key="i" className="font-mono text-red-500">6.8%</span>, '0.9x', '0.8x', '0.1x', <StatusBadge key="s" status="J-Curve" />],
        ]} />
      </div>
    ),
  },
};

/* ═══════════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const params = useParams();
  const slug = params.slug as string;
  const config = dashboards[slug];

  if (!config) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-400">Dashboard not found</p>
          <p className="text-[10px] text-gray-300 mt-1">No dashboard configured for &quot;{slug}&quot;</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title={config.title} subtitle={config.subtitle} breadcrumbs={[{ label: 'Dashboards' }, { label: config.title }]} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {config.metrics.map((m, i) => (
          <MetricCard key={i} title={m.title} value={m.value} change={m.change} changeType={m.changeType} color={m.color} icon={m.icon} />
        ))}
      </div>

      {config.content}
    </div>
  );
}
