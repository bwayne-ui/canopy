'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Users, Building2, DollarSign, TrendingUp, Briefcase, ArrowLeft } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { fmtMoney, fmtPct } from '@/lib/utils';

interface PodData {
  pod: {
    id: string;
    name: string;
    totalClients: number;
    totalEntities: number;
    totalNavMm: number;
    totalCommitmentMm: number;
    revenueL12m: number;
    headcount: number;
    avgUtilization: number;
    statusBreakdown: Record<string, number>;
    departmentBreakdown: Record<string, number>;
  };
  clients: Array<{
    id: string;
    name: string;
    shortName: string | null;
    primaryStrategy: string;
    status: string;
    region: string;
    hqCity: string;
    teamLead: string;
    serviceLine: string;
    totalEntities: number;
    aumMm: number | null;
    totalNavMm: number;
    revenueL12m: number;
    marginPct: number;
  }>;
  entities: Array<{
    entityId: string;
    name: string;
    entityType: string;
    strategy: string;
    domicile: string;
    vintage: number | null;
    lifecycleStatus: string;
    scopeStatus: string | null;
    navMm: number | null;
    commitmentMm: number | null;
    clientName: string;
  }>;
  employees: Array<{
    id: string;
    employeeId: string;
    name: string;
    title: string;
    role: string;
    department: string;
    email: string;
    officeLocation: string | null;
    seniorityLevel: string | null;
    performanceRating: string | null;
    utilizationActual: number | null;
    utilizationTarget: number | null;
    clientsManaged: number;
    entitiesManaged: number;
    profilePhotoUrl: string | null;
  }>;
}

const SCOPE_STYLES: Record<string, string> = {
  Contracted: 'bg-[#F0FBF6] text-[#00AA6C]',
  Scoped: 'bg-blue-50 text-blue-700',
  Identified: 'bg-gray-100 text-gray-600',
  Terminated: 'bg-red-50 text-red-600',
  'De-scoped': 'bg-amber-50 text-amber-700',
};

export default function PodDetailPage() {
  const { podId } = useParams<{ podId: string }>();
  const [data, setData] = useState<PodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'Overview' | 'Clients' | 'Entities' | 'Team'>('Overview');

  useEffect(() => {
    fetch(`/api/pods/${podId}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [podId]);

  if (loading) return <div className="text-center py-16 text-gray-400 text-xs">Loading pod…</div>;
  if (!data) return <div className="text-center py-16 text-red-400 text-xs">Pod not found.</div>;

  const { pod, clients, entities, employees } = data;

  const clientColumns: Column[] = [
    { key: 'name', label: 'Client', sortable: true, render: (v: string, row: any) => (
      <Link href={`/data-vault/clients/${row.id}`} className="font-semibold text-gray-900 hover:text-[#00AA6C]">{v}</Link>
    ) },
    { key: 'primaryStrategy', label: 'Strategy', sortable: true },
    { key: 'status', label: 'Status', sortable: true, render: (v: string) => <StatusBadge status={v} /> },
    { key: 'region', label: 'Region', sortable: true },
    { key: 'teamLead', label: 'Team Lead', sortable: true },
    { key: 'totalEntities', label: 'Entities', sortable: true, align: 'center' },
    { key: 'aumMm', label: 'AUM', sortable: true, align: 'right', render: (v: number | null) => v != null ? fmtMoney(v) : '—' },
    { key: 'revenueL12m', label: 'Revenue L12M', sortable: true, align: 'right', render: (v: number) => v ? fmtMoney(v) : '—' },
    { key: 'marginPct', label: 'Margin %', sortable: true, align: 'right', render: (v: number) => v != null ? fmtPct(v) : '—' },
  ];

  const entityColumns: Column[] = [
    { key: 'name', label: 'Entity', sortable: true, render: (v: string, row: any) => (
      <Link href={`/data-vault/entities/${row.entityId}`} className="block group">
        <div className="font-semibold text-gray-900 group-hover:text-[#00AA6C]">{v}</div>
        <div className="text-[10px] text-gray-400">{row.clientName}</div>
      </Link>
    ) },
    { key: 'entityType', label: 'Type', sortable: true },
    { key: 'strategy', label: 'Strategy', sortable: true },
    { key: 'vintage', label: 'Vintage', sortable: true, align: 'center', render: (v: number | null) => v ?? '—' },
    { key: 'commitmentMm', label: 'Commitment', sortable: true, align: 'right', render: (v: number | null) => v != null ? fmtMoney(v) : '—' },
    { key: 'domicile', label: 'Domicile', sortable: true },
    { key: 'navMm', label: 'NAV', sortable: true, align: 'right', render: (v: number | null) => v != null ? fmtMoney(v) : '—' },
    { key: 'lifecycleStatus', label: 'Lifecycle', sortable: true, render: (v: string) => <StatusBadge status={v} /> },
    { key: 'scopeStatus', label: 'Scope', sortable: true, render: (v: string | null) => v ? (
      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${SCOPE_STYLES[v] ?? 'bg-gray-100 text-gray-500'}`}>{v}</span>
    ) : <span className="text-gray-300">—</span> },
  ];

  const employeeColumns: Column[] = [
    { key: 'name', label: 'Team Member', sortable: true, render: (v: string, row: any) => (
      <div>
        <div className="font-semibold text-gray-900">{v}</div>
        <div className="text-[10px] text-gray-400">{row.email}</div>
      </div>
    ) },
    { key: 'title', label: 'Title', sortable: true },
    { key: 'department', label: 'Department', sortable: true },
    { key: 'seniorityLevel', label: 'Level', sortable: true, render: (v: string | null) => v ?? '—' },
    { key: 'officeLocation', label: 'Office', sortable: true, render: (v: string | null) => v ?? '—' },
    { key: 'performanceRating', label: 'Performance', sortable: true, render: (v: string | null) => v ?? '—' },
    { key: 'utilizationActual', label: 'Utilization', sortable: true, align: 'right', render: (v: number | null, row: any) => {
      if (v == null) return '—';
      const target = row.utilizationTarget ?? 80;
      const color = v >= target ? 'text-emerald-600' : v >= target * 0.9 ? 'text-amber-600' : 'text-red-600';
      return <span className={`font-semibold ${color}`}>{v.toFixed(0)}%</span>;
    } },
    { key: 'clientsManaged', label: 'Clients', sortable: true, align: 'center' },
    { key: 'entitiesManaged', label: 'Entities', sortable: true, align: 'center' },
  ];

  return (
    <div>
      <PageHeader
        title={`Pod ${pod.name}`}
        subtitle={`${pod.totalClients} clients · ${pod.totalEntities} entities · ${pod.headcount} team members · ${fmtMoney(pod.totalNavMm)} NAV`}
        breadcrumbs={[
          { label: 'Data Vault', href: '/data-vault' },
          { label: 'Pods' },
          { label: pod.name },
        ]}
        actions={
          <Link href="/data-vault/clients" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-md">
            <ArrowLeft className="w-3 h-3" /> Back to Clients
          </Link>
        }
      />

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-3">
        <MetricCard title="Clients" value={pod.totalClients.toString()} icon={<Users className="w-4 h-4" />} color="teal" />
        <MetricCard title="Entities" value={pod.totalEntities.toString()} icon={<Building2 className="w-4 h-4" />} color="teal" />
        <MetricCard title="Total NAV" value={fmtMoney(pod.totalNavMm)} icon={<DollarSign className="w-4 h-4" />} color="green" />
        <MetricCard title="Commitment" value={fmtMoney(pod.totalCommitmentMm)} icon={<DollarSign className="w-4 h-4" />} color="green" />
        <MetricCard title="L12M Revenue" value={fmtMoney(pod.revenueL12m)} icon={<TrendingUp className="w-4 h-4" />} color="signal" />
        <MetricCard title="Headcount" value={pod.headcount.toString()} icon={<Briefcase className="w-4 h-4" />} color="amber" />
      </div>

      {/* ── Breakdown strip ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <div className="bg-white rounded-lg shadow-sm p-3">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Client Status Mix</div>
          <div className="space-y-1">
            {Object.entries(pod.statusBreakdown).map(([s, n]) => (
              <div key={s} className="flex justify-between text-xs">
                <span className="text-gray-600">{s}</span>
                <span className="font-semibold text-gray-900">{n}</span>
              </div>
            ))}
            {Object.keys(pod.statusBreakdown).length === 0 && <div className="text-[10px] text-gray-400">No clients assigned</div>}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-3">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Team by Department</div>
          <div className="space-y-1">
            {Object.entries(pod.departmentBreakdown).map(([d, n]) => (
              <div key={d} className="flex justify-between text-xs">
                <span className="text-gray-600 truncate">{d}</span>
                <span className="font-semibold text-gray-900">{n}</span>
              </div>
            ))}
            {Object.keys(pod.departmentBreakdown).length === 0 && <div className="text-[10px] text-gray-400">No team members assigned</div>}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-3">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Pod Health</div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Avg Utilization</span>
              <span className="font-semibold text-gray-900">{pod.avgUtilization.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Clients per Staff</span>
              <span className="font-semibold text-gray-900">{pod.headcount ? (pod.totalClients / pod.headcount).toFixed(2) : '—'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Entities per Staff</span>
              <span className="font-semibold text-gray-900">{pod.headcount ? (pod.totalEntities / pod.headcount).toFixed(2) : '—'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Revenue per Staff</span>
              <span className="font-semibold text-gray-900">{pod.headcount ? fmtMoney(Math.round(pod.revenueL12m / pod.headcount)) : '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── tabs ── */}
      <div className="flex gap-1 mb-3 bg-white rounded-lg shadow-sm p-1 w-fit">
        {(['Overview', 'Clients', 'Entities', 'Team'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${tab === t ? 'bg-[#00AA6C]/10 text-[#00AA6C]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            {t}
            {t === 'Clients' && <span className="ml-1 text-[10px] text-gray-400">{clients.length}</span>}
            {t === 'Entities' && <span className="ml-1 text-[10px] text-gray-400">{entities.length}</span>}
            {t === 'Team' && <span className="ml-1 text-[10px] text-gray-400">{employees.length}</span>}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="bg-white rounded-lg shadow-sm p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Top Clients by NAV</div>
              <button type="button" onClick={() => setTab('Clients')} className="text-[10px] text-[#00AA6C] hover:underline">See all</button>
            </div>
            <div className="space-y-1">
              {[...clients].sort((a, b) => b.totalNavMm - a.totalNavMm).slice(0, 5).map((c) => (
                <Link key={c.id} href={`/data-vault/clients/${c.id}`} className="flex items-center justify-between py-1 px-2 rounded hover:bg-gray-50">
                  <div>
                    <div className="text-xs font-semibold text-gray-900">{c.name}</div>
                    <div className="text-[10px] text-gray-500">{c.primaryStrategy} · {c.status}</div>
                  </div>
                  <div className="text-xs font-semibold text-gray-700">{fmtMoney(c.totalNavMm)}</div>
                </Link>
              ))}
              {clients.length === 0 && <div className="text-[10px] text-gray-400 py-2">No clients in this pod.</div>}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Team Leads</div>
              <button type="button" onClick={() => setTab('Team')} className="text-[10px] text-[#00AA6C] hover:underline">See all</button>
            </div>
            <div className="space-y-1">
              {employees.filter((e) => /Director|VP|Lead|Senior Manager|Manager/i.test(e.title)).slice(0, 5).map((e) => (
                <div key={e.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-gray-50">
                  <div>
                    <div className="text-xs font-semibold text-gray-900">{e.name}</div>
                    <div className="text-[10px] text-gray-500">{e.title}</div>
                  </div>
                  <div className="text-[10px] text-gray-500">{e.department}</div>
                </div>
              ))}
              {employees.length === 0 && <div className="text-[10px] text-gray-400 py-2">No team members in this pod.</div>}
            </div>
          </div>
        </div>
      )}

      {tab === 'Clients' && (
        <DataTable columns={clientColumns} data={clients} searchPlaceholder="Search clients in this pod..." />
      )}

      {tab === 'Entities' && (
        <DataTable columns={entityColumns} data={entities} searchPlaceholder="Search entities in this pod..." />
      )}

      {tab === 'Team' && (
        <DataTable columns={employeeColumns} data={employees} searchPlaceholder="Search team members in this pod..." />
      )}
    </div>
  );
}
