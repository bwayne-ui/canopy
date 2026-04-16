'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutGrid,
  List,
  Plus,
  DollarSign,
  TrendingUp,
  BarChart2,
  Briefcase,
  X,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { fmtMoney, toNum } from '@/lib/utils';

interface Opp {
  id: string;
  opportunityId: string;
  name: string;
  accountId: string | null;
  accountName: string;
  stage: string;
  probability: number;
  closeDate: string | null;
  amount: number | null;
  ownerName: string | null;
  entityCount: number | null;
  dealType: string | null;
  clientId: string | null;
  clientName: string | null;
}

function stageBadgeClass(stage: string): string {
  const map: Record<string, string> = {
    Prospecting: 'bg-gray-100 text-gray-600',
    Discovery: 'bg-blue-100 text-blue-700',
    Proposal: 'bg-amber-100 text-amber-700',
    Negotiation: 'bg-purple-100 text-purple-700',
    'Closed Won': 'bg-emerald-100 text-emerald-700',
    'Closed Lost': 'bg-red-100 text-red-700',
  };
  return map[stage] ?? 'bg-gray-100 text-gray-600';
}

const STAGE_BORDER: Record<string, string> = {
  Prospecting: 'border-l-gray-400',
  Discovery: 'border-l-blue-400',
  Proposal: 'border-l-amber-400',
  Negotiation: 'border-l-purple-400',
  'Closed Won': 'border-l-emerald-500',
  'Closed Lost': 'border-l-red-400',
};

const STAGES = ['Prospecting', 'Discovery', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

function initials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function fmtClose(date: string | null): string {
  if (!date) return '—';
  return date.slice(0, 10);
}

export default function RevOpsDashboard() {
  const router = useRouter();
  const [allOpps, setAllOpps] = useState<Opp[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [newOppModal, setNewOppModal] = useState(false);

  useEffect(() => {
    fetch('/api/revops/opportunities')
      .then((r) => r.json())
      .then((res) => setAllOpps(res.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(() => {
    const closedStages = new Set(['Closed Won', 'Closed Lost']);
    const open = allOpps.filter((o) => !closedStages.has(o.stage));
    const won = allOpps.filter((o) => o.stage === 'Closed Won');
    const lost = allOpps.filter((o) => o.stage === 'Closed Lost');

    const openPipeline = open.reduce((s, o) => s + toNum(o.amount), 0);
    const weighted = open.reduce(
      (s, o) => s + toNum(o.amount) * ((o.probability ?? 0) / 100),
      0,
    );
    const winRate =
      won.length + lost.length > 0
        ? ((won.length / (won.length + lost.length)) * 100).toFixed(0)
        : '0';

    return {
      openPipeline,
      weighted,
      winRate,
      openCount: open.length,
    };
  }, [allOpps]);

  const oppsByStage = useMemo(() => {
    const map: Record<string, Opp[]> = {};
    for (const s of STAGES) map[s] = [];
    for (const o of allOpps) {
      if (map[o.stage]) map[o.stage].push(o);
      else map[o.stage] = [o];
    }
    return map;
  }, [allOpps]);

  const listColumns: Column[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (_v: string, row: Opp) => (
        <Link
          href={`/revops/opportunities/${row.id}`}
          className="font-semibold text-gray-900 hover:text-[#00C97B] transition-colors"
        >
          {row.name}
        </Link>
      ),
    },
    {
      key: 'accountName',
      label: 'Account',
      sortable: true,
      render: (v: string) => <span className="text-xs">{v || '—'}</span>,
    },
    {
      key: 'dealType',
      label: 'Type',
      sortable: true,
      render: (v: string | null) => {
        if (!v) return <span className="text-gray-400">—</span>;
        const cls = v === 'Expansion'
          ? 'bg-teal-100 text-teal-700'
          : 'bg-violet-100 text-violet-700';
        return <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>{v}</span>;
      },
    },
    {
      key: 'stage',
      label: 'Stage',
      sortable: true,
      render: (v: string) => (
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${stageBadgeClass(v)}`}
        >
          {v}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      align: 'right',
      render: (v: number | null) =>
        v != null ? (
          <span className="font-mono text-emerald-600 font-semibold">{fmtMoney(toNum(v))}</span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: 'closeDate',
      label: 'Close Date',
      sortable: true,
      render: (v: string | null) => (
        <span className="font-mono text-[10px] text-gray-500">{fmtClose(v)}</span>
      ),
    },
    {
      key: 'probability',
      label: 'Probability',
      sortable: true,
      align: 'right',
      render: (v: number) => <span className="font-mono">{v ?? 0}%</span>,
    },
    {
      key: 'ownerName',
      label: 'Owner',
      sortable: true,
      render: (v: string | null) => <span>{v || '—'}</span>,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-gray-400 text-xs">Loading pipeline…</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Revenue Ops"
        subtitle="Quote-to-cash pipeline"
        breadcrumbs={[{ label: 'Revenue Ops' }]}
        actions={
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
              <button
                onClick={() => setView('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${
                  view === 'kanban'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Kanban
              </button>
              <button
                onClick={() => setView('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors border-l border-gray-200 ${
                  view === 'list'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                List
              </button>
            </div>

            {/* New Opportunity */}
            <button
              onClick={() => setNewOppModal(true)}
              className="flex items-center gap-1.5 bg-[#00C97B] text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-[#00835A] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Opportunity
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <MetricCard
          title="Open Pipeline"
          value={fmtMoney(metrics.openPipeline)}
          icon={<DollarSign className="w-5 h-5" />}
          color="green"
        />
        <MetricCard
          title="Weighted Pipeline"
          value={fmtMoney(metrics.weighted)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="teal"
        />
        <MetricCard
          title="Win Rate"
          value={`${metrics.winRate}%`}
          icon={<BarChart2 className="w-5 h-5" />}
          color="signal"
        />
        <MetricCard
          title="Open Deals"
          value={metrics.openCount}
          icon={<Briefcase className="w-5 h-5" />}
          color="amber"
        />
      </div>

      {/* Views */}
      {view === 'kanban' ? (
        <div className="grid grid-cols-6 gap-3">
          {STAGES.map((stage) => {
            const cards = oppsByStage[stage] ?? [];
            const colTotal = cards.reduce((s, o) => s + toNum(o.amount), 0);
            return (
              <div key={stage} className="flex flex-col min-h-0">
                {/* Column Header */}
                <div className="flex flex-col gap-0.5 mb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">{stage}</span>
                    <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5">
                      {cards.length}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {colTotal > 0 ? fmtMoney(colTotal) : '—'}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2">
                  {cards.length === 0 ? (
                    <div className="text-[10px] text-gray-300 text-center py-4 border border-dashed border-gray-200 rounded-lg">
                      Empty
                    </div>
                  ) : (
                    cards.map((opp) => (
                      <div
                        key={opp.id}
                        onClick={() => router.push(`/revops/opportunities/${opp.id}`)}
                        className={`bg-white rounded-lg shadow-sm border border-gray-100 border-l-4 ${
                          STAGE_BORDER[opp.stage] ?? 'border-l-gray-300'
                        } p-2.5 cursor-pointer hover:shadow-md transition-shadow`}
                      >
                        <p className="text-xs font-semibold text-gray-900 leading-snug mb-0.5 line-clamp-2">
                          {opp.name}
                        </p>
                        <div className="flex items-center gap-1 mb-1">
                          <p className="text-[10px] text-gray-400 truncate">{opp.accountName || '—'}</p>
                          {opp.dealType === 'Expansion' && (
                            <span className="flex-shrink-0 inline-block rounded-full px-1.5 py-0 text-[10px] font-semibold bg-teal-100 text-teal-700">Exp</span>
                          )}
                          {opp.dealType === 'New Logo' && (
                            <span className="flex-shrink-0 inline-block rounded-full px-1.5 py-0 text-[10px] font-semibold bg-violet-100 text-violet-700">New</span>
                          )}
                        </div>
                        {opp.amount != null && toNum(opp.amount) > 0 && (
                          <p className="text-xs font-semibold text-emerald-600 mb-1 font-mono">
                            {fmtMoney(toNum(opp.amount))}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-400 font-mono">
                            {fmtClose(opp.closeDate)}
                          </span>
                          {opp.ownerName && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-[10px] font-semibold">
                              {initials(opp.ownerName)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <DataTable
          columns={listColumns}
          data={allOpps}
          searchable
          searchPlaceholder="Search opportunities…"
          emptyMessage="No opportunities found."
        />
      )}

      {/* New Opp Modal placeholder */}
      {newOppModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-6 w-80">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-800">New Opportunity</h2>
              <button
                onClick={() => setNewOppModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500">Coming soon — opportunity creation is under construction.</p>
            <button
              onClick={() => setNewOppModal(false)}
              className="mt-4 w-full bg-[#00C97B] text-white text-xs font-semibold py-2 rounded-md hover:bg-[#00835A] transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
