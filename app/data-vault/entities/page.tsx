'use client';

import { useEffect, useMemo, useState } from 'react';
import { Building2, DollarSign, CheckCircle, BarChart3, Users, ClipboardCheck, X, Filter, Lock } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { fmtMoney } from '@/lib/utils';
import { PERSONAS, DEFAULT_PERSONA_ID, getPersona } from '@/lib/personas';
import Link from 'next/link';

interface EntityRow {
  id: string;
  entityId: string;
  name: string;
  entityType: string;
  structureType: string;
  strategy: string;
  clientName: string;
  assetClass: string;
  entityRole: string | null;
  fundStructure: string | null;
  domicile: string;
  vintage: number | null;
  navMm: number | null;
  grossIrrPct: number | null;
  lifecycleStatus: string;
  dataQualityScore: number | null;
  investorCount: number;
  taskCount: number;
}

/* ─── filter types ─────────────────────────────────────────────────── */

type FilterKey = 'clientName' | 'entityType' | 'strategy' | 'lifecycleStatus' | 'assetClass';

const FILTER_DEFS: { key: FilterKey; label: string }[] = [
  { key: 'clientName',      label: 'Client' },
  { key: 'entityType',      label: 'Type' },
  { key: 'assetClass',      label: 'Asset Class' },
  { key: 'strategy',        label: 'Strategy' },
  { key: 'lifecycleStatus', label: 'Status' },
];

/* ─── render helpers ───────────────────────────────────────────────── */

const typeBadge = (t: string) => {
  const map: Record<string, string> = {
    'Flagship Fund':       'bg-blue-100 text-blue-700',
    'Master Fund':         'bg-blue-50 text-blue-600',
    'Feeder Fund':         'bg-indigo-100 text-indigo-700',
    'Co-Invest Vehicle':   'bg-purple-100 text-purple-700',
    'GP Entity':           'bg-gray-100 text-gray-600',
    'Management Company':  'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${map[t] ?? 'bg-gray-100 text-gray-600'}`}>
      {t}
    </span>
  );
};

const dqBar = (score: number | null) => {
  if (score == null) return <span className="text-gray-400 text-[11px]">—</span>;
  const pct = Math.round(score);
  const color = pct >= 90 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] font-mono text-gray-600">{pct}%</span>
    </div>
  );
};

/* ─── filter chip component ────────────────────────────────────────── */

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
        active
          ? 'bg-[#00C97B]/10 border-[#00C97B] text-[#00C97B]'
          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  );
}

/* ─── main page ────────────────────────────────────────────────────── */

export default function EntitiesPage() {
  const [allData, setAllData] = useState<EntityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [personaId, setPersonaId] = useState<string>(DEFAULT_PERSONA_ID);
  const [filters, setFilters] = useState<Record<FilterKey, Set<string>>>({
    clientName: new Set(),
    entityType: new Set(),
    assetClass: new Set(),
    strategy: new Set(),
    lifecycleStatus: new Set(),
  });
  const [expandedFilter, setExpandedFilter] = useState<FilterKey | null>(null);

  // sync persona from localStorage (shared with Control Tower)
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('canopy.controlTower.personaId') : null;
    if (saved) setPersonaId(saved);
    const handler = () => {
      const v = localStorage.getItem('canopy.controlTower.personaId');
      if (v) setPersonaId(v);
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  useEffect(() => {
    fetch('/api/entities')
      .then((r) => r.json())
      .then((res) => setAllData(res.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  const persona = useMemo(() => getPersona(personaId), [personaId]);

  // Step 1: permission filter — restrict to persona's entity access
  const permissioned = useMemo(() => {
    if (persona.entityAccess === 'all') return allData;
    return allData.filter((e) => persona.entityAccess.includes(e.clientName));
  }, [allData, persona]);

  // Step 2: tag filters on top of permissions
  const filtered = useMemo(() => {
    return permissioned.filter((e) => {
      for (const { key } of FILTER_DEFS) {
        if (filters[key].size > 0 && !filters[key].has(e[key])) return false;
      }
      return true;
    });
  }, [permissioned, filters]);

  // distinct values for filter chips (from permissioned set, not allData)
  const distinctValues = useMemo(() => {
    const out: Record<FilterKey, string[]> = { clientName: [], entityType: [], assetClass: [], strategy: [], lifecycleStatus: [] };
    for (const { key } of FILTER_DEFS) {
      out[key] = Array.from(new Set(permissioned.map((e) => e[key] as string))).filter(Boolean).sort();
    }
    return out;
  }, [permissioned]);

  const toggleFilter = (key: FilterKey, value: string) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: new Set(prev[key]) };
      if (next[key].has(value)) next[key].delete(value);
      else next[key].add(value);
      return next;
    });
  };

  const clearFilters = () => {
    setFilters({ clientName: new Set(), entityType: new Set(), assetClass: new Set(), strategy: new Set(), lifecycleStatus: new Set() });
    setExpandedFilter(null);
  };

  const activeFilterCount = FILTER_DEFS.reduce((s, { key }) => s + filters[key].size, 0);

  // KPIs from filtered set
  const totalEntities = filtered.length;
  const totalNav = filtered.reduce((s, r) => s + (r.navMm ?? 0), 0);
  const activeEntities = filtered.filter((r) => r.lifecycleStatus === 'Active').length;
  const avgDqScore = totalEntities > 0
    ? filtered.reduce((s, r) => s + (r.dataQualityScore ?? 0), 0) / totalEntities
    : 0;
  const totalInvestors = filtered.reduce((s, r) => s + r.investorCount, 0);
  const totalTasks = filtered.reduce((s, r) => s + r.taskCount, 0);

  const columns: Column[] = [
    {
      key: 'name',
      label: 'Entity',
      sortable: true,
      render: (v: string, row: EntityRow) => (
        <Link href={`/data-vault/entities/${row.entityId}`} className="block group">
          <div className="font-semibold text-gray-900 group-hover:text-[#00C97B] transition-colors">{v}</div>
          <div className="text-[10px] text-gray-400">{row.clientName}</div>
        </Link>
      ),
    },
    {
      key: 'entityType',
      label: 'Type',
      sortable: true,
      render: (v: string) => typeBadge(v ?? ''),
    },
    {
      key: 'assetClass',
      label: 'Asset Class',
      sortable: true,
      render: (v: string) => v ? <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-teal-50 text-teal-700">{v}</span> : <span className="text-gray-300">—</span>,
    },
    { key: 'strategy', label: 'Strategy', sortable: true },
    {
      key: 'vintage',
      label: 'Vintage',
      sortable: true,
      align: 'center',
      render: (v: number | null) => <span className="font-mono text-gray-600">{v ?? '—'}</span>,
    },
    {
      key: 'navMm',
      label: 'NAV ($MM)',
      sortable: true,
      align: 'right',
      render: (v: number | null) => <span className="font-mono">{v != null ? fmtMoney(v) : '—'}</span>,
    },
    {
      key: 'investorCount',
      label: 'Investors',
      sortable: true,
      align: 'center',
      render: (v: number) => <span className="font-mono text-gray-600">{v > 0 ? v : '—'}</span>,
    },
    {
      key: 'taskCount',
      label: 'Tasks',
      sortable: true,
      align: 'center',
      render: (v: number) => <span className="font-mono text-gray-600">{v > 0 ? v : '—'}</span>,
    },
    {
      key: 'dataQualityScore',
      label: 'Data Quality',
      sortable: true,
      render: (v: number | null) => dqBar(v),
    },
    {
      key: 'lifecycleStatus',
      label: 'Status',
      sortable: true,
      render: (v: string) => <StatusBadge status={v} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Entities"
        subtitle="Connected fund and entity management"
        breadcrumbs={[
          { label: 'Data Vault', href: '/data-vault' },
          { label: 'Entities' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {/* persona indicator */}
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-md border border-gray-200">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#00C97B] to-[#1B3A4B] text-white flex items-center justify-center text-[8px] font-bold">
                {persona.avatarInitials}
              </div>
              <span className="font-semibold text-gray-700">{persona.name}</span>
              {persona.entityAccess !== 'all' && (
                <span className="inline-flex items-center gap-0.5 text-[9px] text-amber-600">
                  <Lock className="w-2.5 h-2.5" />{persona.entityAccess.length} clients
                </span>
              )}
            </div>
            {/* persona switcher */}
            <select
              value={personaId}
              onChange={(e) => {
                setPersonaId(e.target.value);
                if (typeof window !== 'undefined') localStorage.setItem('canopy.controlTower.personaId', e.target.value);
                clearFilters();
              }}
              className="text-[11px] border border-gray-200 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-[#00C97B]"
            >
              {PERSONAS.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {p.title}</option>
              ))}
            </select>
          </div>
        }
      />

      {/* ── filter bar ── */}
      <div className="bg-white rounded-lg shadow-sm p-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-3 h-3" /> Filters
          </span>

          {FILTER_DEFS.map(({ key, label }) => (
            <div key={key} className="relative">
              <button
                onClick={() => setExpandedFilter(expandedFilter === key ? null : key)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                  filters[key].size > 0
                    ? 'bg-[#00C97B]/10 border-[#00C97B] text-[#00C97B]'
                    : expandedFilter === key
                    ? 'bg-gray-50 border-gray-300 text-gray-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {label}{filters[key].size > 0 ? ` (${filters[key].size})` : ''}
              </button>

              {expandedFilter === key && (
                <div className="absolute top-full left-0 mt-1 z-20 bg-white rounded-lg shadow-lg border border-gray-200 p-2 min-w-[180px] max-h-56 overflow-y-auto">
                  {distinctValues[key].map((val) => (
                    <FilterChip
                      key={val}
                      label={val}
                      active={filters[key].has(val)}
                      onClick={() => toggleFilter(key, val)}
                    />
                  ))}
                  {distinctValues[key].length === 0 && (
                    <div className="text-[10px] text-gray-400 py-2 text-center">No values</div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* active filter pills */}
          {activeFilterCount > 0 && (
            <>
              <div className="h-4 w-px bg-gray-200 mx-1" />
              {FILTER_DEFS.map(({ key, label }) =>
                Array.from(filters[key]).map((val) => (
                  <span
                    key={`${key}-${val}`}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00C97B]/10 text-[#00C97B] text-[10px] font-semibold"
                  >
                    <span className="text-[#00C97B]/60">{label}:</span> {val}
                    <button onClick={() => toggleFilter(key, val)} className="hover:text-red-500">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))
              )}
              <button
                onClick={clearFilters}
                className="text-[10px] text-gray-400 hover:text-red-500 underline ml-1"
              >
                Clear all
              </button>
            </>
          )}

          {/* entity count summary */}
          <span className="ml-auto text-[10px] text-gray-400">
            {filtered.length} of {allData.length} entities
            {persona.entityAccess !== 'all' && ` · ${permissioned.length} permissioned`}
          </span>
        </div>
      </div>

      {/* ── KPI cards — reflect filtered set ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-3">
        <MetricCard title="Entities" value={totalEntities} icon={<Building2 className="w-4 h-4" />} color="teal" />
        <MetricCard title="Total NAV" value={fmtMoney(totalNav)} icon={<DollarSign className="w-4 h-4" />} color="green" />
        <MetricCard title="Active" value={activeEntities} icon={<CheckCircle className="w-4 h-4" />} color="signal" />
        <MetricCard title="Investors" value={totalInvestors} icon={<Users className="w-4 h-4" />} color="teal" />
        <MetricCard title="Tasks" value={totalTasks} icon={<ClipboardCheck className="w-4 h-4" />} color="amber" />
        <MetricCard title="Avg Data Quality" value={`${Math.round(avgDqScore)}%`} icon={<BarChart3 className="w-4 h-4" />} color={avgDqScore >= 80 ? 'green' : 'amber'} />
      </div>

      {/* ── data table ── */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading entities...</div>
      ) : (
        <DataTable columns={columns} data={filtered} searchPlaceholder="Search entities by name, type, strategy, client..." />
      )}
    </div>
  );
}
