'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import DataTable, { Column } from '@/components/DataTable';
import MetricCard from '@/components/MetricCard';
import StatusBadge from '@/components/StatusBadge';
import { Layers, Users, AlertTriangle, TrendingUp, Loader2, ChevronRight } from 'lucide-react';
import { fmtMoney } from '@/lib/utils';

interface WfFundDetail {
  id: string;
  name: string;
  shortName: string;
  strategy: string;
  waterfallType: string;
  status: string;
  vintage: number;
  totalCommitment: number;
  totalNav: number;
  totalDistributed: number;
  entity: {
    id: string;
    name: string;
    entityId: string;
    client: { id: string; name: string; shortName: string };
  } | null;
  terms: {
    hurdleRate: number;
    carryPct: number;
    catchupType: string;
    mgmtFeeRate: number;
    mgmtFeeBasis: string;
    fundLife: number;
    investmentPeriod: number;
  } | null;
  waterfallSteps: Array<{
    id: string;
    stepOrder: number;
    stepName: string;
    lpSplit: number;
    gpSplit: number;
    description: string;
  }>;
  investors: Array<{
    id: string;
    investorName: string;
    investorType: string;
    investorClass: string;
    commitment: number;
    contributed: number;
    distributed: number;
    nav: number;
    overrideHurdle?: number;
    overrideCarryPct?: number;
    hasEqualization: boolean;
  }>;
  exceptions: Array<{
    id: string;
    severity: string;
    title: string;
    status: string;
    impactAmount: number;
  }>;
  navSnapshots: Array<{
    snapshotDate: string;
    totalNav: number;
  }>;
}

type Tab = 'overview' | 'investors' | 'exceptions';

const investorCols: Column[] = [
  {
    key: 'investorName',
    label: 'Investor',
    sortable: true,
    render: (v: string, row: any) => (
      <div>
        <div className="font-semibold text-gray-900">{v}</div>
        <div className="text-[10px] text-gray-400">Class {row.investorClass} · {row.investorType}</div>
      </div>
    ),
  },
  {
    key: 'commitment',
    label: 'Commitment',
    sortable: true,
    render: (v: number) => <span className="font-mono">{fmtMoney(v)}</span>,
  },
  {
    key: 'contributed',
    label: 'Contributed',
    sortable: true,
    render: (v: number) => <span className="font-mono">{fmtMoney(v)}</span>,
  },
  {
    key: 'distributed',
    label: 'Distributed',
    sortable: true,
    render: (v: number) => <span className="font-mono text-emerald-600">{fmtMoney(v)}</span>,
  },
  {
    key: 'nav',
    label: 'NAV',
    sortable: true,
    render: (v: number) => <span className="font-mono">{fmtMoney(v)}</span>,
  },
  {
    key: 'overrideCarryPct',
    label: 'Side Letter',
    render: (v: number | null) => v != null ? (
      <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold bg-purple-50 text-purple-700">
        Carry {(v * 100).toFixed(0)}%
      </span>
    ) : <span className="text-gray-300 text-[10px]">—</span>,
  },
];

export default function FundDetailPage() {
  const params = useParams();
  const fundId = params.fundId as string;
  const [fund, setFund] = useState<WfFundDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');

  useEffect(() => {
    fetch(`/api/toolbox/waterfall/funds/${fundId}`)
      .then((r) => r.json())
      .then((d) => { setFund(d); setLoading(false); });
  }, [fundId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2 text-gray-400 text-xs">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading fund…
        </div>
      </div>
    );
  }
  if (!fund) return <div className="p-4 text-xs text-gray-400">Fund not found.</div>;

  const openExceptions = fund.exceptions.filter((e) => e.status !== 'resolved');

  return (
    <div className="space-y-4">
      <PageHeader
        title={fund.shortName}
        subtitle={`${fund.entity ? `${fund.entity.client.shortName} · ` : ''}${fund.strategy} · ${fund.waterfallType} waterfall · Vintage ${fund.vintage}`}
        breadcrumbs={[
          { label: 'Agentic Center' },
          { label: 'Toolbox', href: '/toolbox' },
          { label: 'Waterfall Engine', href: '/toolbox/waterfall' },
          { label: fund.shortName },
        ]}
        actions={
          openExceptions.length > 0 ? (
            <Link
              href="/toolbox/waterfall/exceptions"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-md hover:bg-red-100 transition-colors"
            >
              <AlertTriangle className="w-3 h-3" />
              {openExceptions.length} exception{openExceptions.length > 1 ? 's' : ''} open
              <ChevronRight className="w-3 h-3" />
            </Link>
          ) : undefined
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard title="Committed" value={`$${(fund.totalCommitment / 1e6).toFixed(0)}M`} icon={<TrendingUp className="w-4 h-4" />} color="teal" />
        <MetricCard title="NAV" value={`$${(fund.totalNav / 1e6).toFixed(0)}M`} icon={<Layers className="w-4 h-4" />} color="green" />
        <MetricCard title="Distributed" value={`$${(fund.totalDistributed / 1e6).toFixed(0)}M`} icon={<TrendingUp className="w-4 h-4" />} color="signal" />
        <MetricCard title="Investors" value={String(fund.investors.length)} icon={<Users className="w-4 h-4" />} color="teal" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        {(['overview', 'investors', 'exceptions'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-xs font-semibold transition-colors border-b-2 -mb-px ${
              tab === t ? 'border-[#00C97B] text-[#00835A]' : 'border-transparent text-gray-500 hover:text-gray-800'
            } capitalize`}
          >
            {t}
            {t === 'exceptions' && openExceptions.length > 0 && (
              <span className="ml-1.5 bg-red-100 text-red-700 rounded-full px-1.5 text-[10px] font-bold">{openExceptions.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Fund Terms */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Fund Economics</h3>
            {fund.terms ? (
              <dl className="space-y-2">
                {[
                  { label: 'Hurdle Rate', value: `${(fund.terms.hurdleRate * 100).toFixed(0)}%` },
                  { label: 'Carry %', value: `${(fund.terms.carryPct * 100).toFixed(0)}%` },
                  { label: 'Catch-up Type', value: fund.terms.catchupType },
                  { label: 'Mgmt Fee Rate', value: `${(fund.terms.mgmtFeeRate * 100).toFixed(2)}%` },
                  { label: 'Mgmt Fee Basis', value: fund.terms.mgmtFeeBasis },
                  { label: 'Fund Life', value: `${fund.terms.fundLife} years` },
                  { label: 'Investment Period', value: `${fund.terms.investmentPeriod} years` },
                ].map((r) => (
                  <div key={r.label} className="flex justify-between items-center text-xs">
                    <dt className="text-gray-500">{r.label}</dt>
                    <dd className="font-semibold text-gray-900 font-mono capitalize">{r.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-xs text-gray-400">No terms configured</p>
            )}
          </div>

          {/* Waterfall Steps */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Waterfall Structure</h3>
            <div className="space-y-2">
              {fund.waterfallSteps.map((step) => (
                <div key={step.id} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#00C97B]/10 text-[#00835A] flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                    {step.stepOrder}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900">{step.stepName}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{step.description}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] bg-blue-50 text-blue-700 rounded-full px-1.5 py-0.5 font-semibold">
                        LP {(step.lpSplit * 100).toFixed(0)}%
                      </span>
                      <span className="text-[10px] bg-purple-50 text-purple-700 rounded-full px-1.5 py-0.5 font-semibold">
                        GP {(step.gpSplit * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Investors tab */}
      {tab === 'investors' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">{fund.investors.length} Investors</h3>
          </div>
          <DataTable columns={investorCols} data={fund.investors} searchPlaceholder="Search investors…" />
        </div>
      )}

      {/* Exceptions tab */}
      {tab === 'exceptions' && (
        <div className="space-y-3">
          {fund.exceptions.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <p className="text-xs text-gray-400">No exceptions for this fund</p>
            </div>
          ) : (
            fund.exceptions.map((exc) => (
              <div key={exc.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
                <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                  exc.severity === 'critical' ? 'text-red-500' : exc.severity === 'high' ? 'text-orange-500' : 'text-amber-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900">{exc.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Impact: {fmtMoney(exc.impactAmount)}</p>
                </div>
                <StatusBadge status={exc.status} />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
