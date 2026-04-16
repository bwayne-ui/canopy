'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { TrendingUp, TrendingDown, Minus, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

/* ─── types ─────────────────────────────────────────────── */
interface RecentAssignment {
  entityName: string;
  dueDate: string;
  stepScore: number;
  stepsOnTime: number;
  stepsTotal: number;
  status: string;
}

interface KPI {
  id: string;
  name: string;
  category: string;
  onTimePct: number;
  onTimeCount: number;
  totalCount: number;
  trend: number | null;
  recentAssignments: RecentAssignment[];
}

/* ─── design-system color helpers ───────────────────────── */
// Brand: #00AA6C  Amber: #d97706  Red: #ef4444
function kpiPalette(pct: number) {
  if (pct >= 90) return {
    border:   'border-l-[#00AA6C]',
    bigText:  'text-[#00AA6C]',
    bar:      'bg-[#00AA6C]',
    bg:       'bg-[#F0FBF6]',
    rowText:  'text-[#00AA6C]',
    icon:     <CheckCircle2 className="w-4 h-4 text-[#00AA6C] flex-shrink-0 mt-0.5" />,
  };
  if (pct >= 75) return {
    border:   'border-l-[#d97706]',
    bigText:  'text-[#d97706]',
    bar:      'bg-[#d97706]',
    bg:       'bg-[#fffbeb]',
    rowText:  'text-[#d97706]',
    icon:     <Clock className="w-4 h-4 text-[#d97706] flex-shrink-0 mt-0.5" />,
  };
  return {
    border:   'border-l-[#ef4444]',
    bigText:  'text-[#ef4444]',
    bar:      'bg-[#ef4444]',
    bg:       'bg-[#fef2f2]',
    rowText:  'text-[#ef4444]',
    icon:     <AlertCircle className="w-4 h-4 text-[#ef4444] flex-shrink-0 mt-0.5" />,
  };
}

/* ─── sub-components ─────────────────────────────────────── */
function TrendChip({ value }: { value: number | null }) {
  if (value === null) return <span className="text-[10px] text-[#9ca3af]">—</span>;
  if (value === 0) return (
    <span className="inline-flex items-center gap-0.5 text-[10px] text-[#6b7280]">
      <Minus className="w-3 h-3" /> 0 pts vs prior 6mo
    </span>
  );
  const up = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${up ? 'text-[#00AA6C]' : 'text-[#ef4444]'}`}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {up ? '+' : ''}{value} pts vs prior 6mo
    </span>
  );
}

function KpiCard({ kpi }: { kpi: KPI }) {
  const [open, setOpen] = useState(false);
  const p = kpiPalette(kpi.onTimePct);

  return (
    <div className={`bg-white rounded-[14px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-[#e5e7eb] border-l-4 ${p.border} overflow-hidden`}>
      <div className="p-5">
        {/* header row */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-0.5">{kpi.category}</div>
            <div className="text-xs font-semibold text-[#1a1a1a] leading-tight">{kpi.name}</div>
          </div>
          {p.icon}
        </div>

        {/* big stat */}
        <div className={`text-4xl font-bold ${p.bigText} leading-none mb-1`}>{kpi.onTimePct}%</div>
        <div className="text-xs text-[#6b7280] mb-3">
          {kpi.onTimeCount} / {kpi.totalCount} steps on-time
        </div>

        {/* progress bar */}
        <div className="w-full h-2 bg-[#f3f4f6] rounded-full overflow-hidden mb-3">
          <div className={`h-full rounded-full transition-all duration-500 ${p.bar}`} style={{ width: `${kpi.onTimePct}%` }} />
        </div>

        <TrendChip value={kpi.trend} />
      </div>

      {/* drill-down */}
      {kpi.recentAssignments.length > 0 && (
        <>
          <button
            onClick={() => setOpen(!open)}
            className="w-full text-[10px] font-semibold text-[#6b7280] hover:text-[#005868] py-2 border-t border-[#e5e7eb] hover:bg-[#FAFAFA] transition-colors"
          >
            {open ? '▲ Hide' : '▼ Show'} recent assignments
          </button>
          {open && (
            <div className="border-t border-[#e5e7eb]">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="bg-[#f3f4f6]">
                    <th className="text-left px-4 py-1.5 text-[#9ca3af] font-bold uppercase tracking-wider">Entity</th>
                    <th className="text-left px-4 py-1.5 text-[#9ca3af] font-bold uppercase tracking-wider">Due</th>
                    <th className="text-left px-4 py-1.5 text-[#9ca3af] font-bold uppercase tracking-wider">Steps</th>
                    <th className="text-left px-4 py-1.5 text-[#9ca3af] font-bold uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {kpi.recentAssignments.map((a, i) => (
                    <tr key={i} className="border-t border-[#e5e7eb] hover:bg-[#F0FBF6]">
                      <td className="px-4 py-2 font-medium text-[#1a1a1a] truncate max-w-[130px]">{a.entityName}</td>
                      <td className="px-4 py-2 text-[#6b7280]">{a.dueDate}</td>
                      <td className="px-4 py-2">
                        <span className={`font-bold ${kpiPalette(a.stepScore).rowText}`}>{a.stepScore}%</span>
                        <span className="text-[#9ca3af] ml-1">({a.stepsOnTime}/{a.stepsTotal})</span>
                      </td>
                      <td className="px-4 py-2"><StatusBadge status={a.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── summary stat cards (gradient style per design system) ─ */
function SummaryCards({ kpis }: { kpis: KPI[] }) {
  const avg = kpis.length > 0 ? Math.round(kpis.reduce((s, k) => s + k.onTimePct, 0) / kpis.length) : 0;
  const green = kpis.filter((k) => k.onTimePct >= 90).length;
  const amber = kpis.filter((k) => k.onTimePct >= 75 && k.onTimePct < 90).length;
  const red   = kpis.filter((k) => k.onTimePct < 75).length;

  const cards = [
    { label: 'Avg On-Time Score', value: `${avg}%`, sub: 'across all KPIs', bg: 'bg-[#F0FBF6]', val: 'text-[#00AA6C]', lbl: 'text-[#005868]' },
    { label: 'On Target',         value: green,      sub: '≥ 90% on-time',    bg: 'bg-[#F0FBF6]', val: 'text-[#00AA6C]', lbl: 'text-[#005868]' },
    { label: 'At Risk',           value: amber,      sub: '75–89% on-time',   bg: 'bg-[#fffbeb]', val: 'text-[#d97706]', lbl: 'text-[#b45309]' },
    { label: 'Off Target',        value: red,        sub: '< 75% on-time',    bg: 'bg-[#fef2f2]', val: 'text-[#ef4444]', lbl: 'text-[#b91c1c]' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
      {cards.map((c) => (
        <div key={c.label} className={`${c.bg} rounded-[14px] p-5 border border-[#e5e7eb]`}>
          <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${c.lbl}`}>{c.label}</div>
          <div className={`text-3xl font-bold leading-none ${c.val}`}>{c.value}</div>
          <div className="text-xs text-[#6b7280] mt-1">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── page ───────────────────────────────────────────────── */
export default function ClientScorecardPage() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/kpis/scorecard')
      .then((r) => r.json())
      .then((d) => {
        if (d?.error) setError(d.error);
        else setKpis(d.kpis ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-3">
      <PageHeader
        title="KPI Scorecard"
        subtitle="Step-level on-time delivery tracking across key fund administration KPIs"
        breadcrumbs={[{ label: 'Dashboards', href: '/dashboards' }, { label: 'KPI Scorecard' }]}
      />

      {loading && (
        <div className="text-center py-16 text-[#9ca3af] text-sm">Loading scorecard…</div>
      )}

      {error && (
        <div className="bg-[#fef2f2] border border-[#ef4444]/20 rounded-[14px] p-5 text-[#b91c1c] text-xs whitespace-pre-wrap">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <SummaryCards kpis={kpis} />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {kpis.map((kpi) => (
              <KpiCard key={kpi.id} kpi={kpi} />
            ))}
          </div>

          <div className="bg-white rounded-[14px] border border-[#e5e7eb] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">How scores are calculated</div>
            <p className="text-xs text-[#6b7280] leading-relaxed">
              Each KPI tracks delivery at the <span className="font-semibold text-[#1a1a1a]">step level</span>. Every SOP has per-step deadlines
              (e.g. "Submit for partner sign-off by 17:00 on due date + 2 days"). A step is{' '}
              <span className="font-semibold text-[#00AA6C]">on-time</span> if completed at or before its deadline, and{' '}
              <span className="font-semibold text-[#ef4444]">missed</span> if the deadline passed without a completion timestamp.
              Only steps whose deadlines have elapsed are counted. Trend compares the current 6-month period to the prior 6 months.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
