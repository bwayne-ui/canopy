'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { fmtPct } from '@/lib/utils';
import Link from 'next/link';
import { Users, UserCheck, Building, BarChart3 } from 'lucide-react';

interface InternalUserRow {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  title: string;
  role: string;
  department: string;
  email: string;
  officeLocation: string;
  employmentStatus: string;
  utilizationActual: number | null;
  utilizationTarget: number | null;
  clientsManaged: number;
  tasksAssigned: number;
  tasksOverdue: number;
  segment: string | null;
  serviceGroup: string | null;
  licenseType: string | null;
  podId: string | null;
}

const utilizationCell = (actual: number | null, target: number | null) => {
  if (actual === null) return <span className="text-gray-400">—</span>;
  const t = target ?? 100;
  const color = actual >= t ? 'text-emerald-600' : actual >= t - 5 ? 'text-amber-600' : 'text-red-600';
  return <span className={`text-sm ${color}`}>{fmtPct(actual)}</span>;
};

const tasksCell = (assigned: number, overdue: number) => (
  <span className="text-sm">
    {assigned} assigned{' / '}
    <span className={overdue > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}>{overdue} overdue</span>
  </span>
);

const columns: Column[] = [
  { key: 'employeeId', label: 'Employee ID', sortable: true, render: (v) => <span className="text-gray-600">{v}</span> },
  { key: 'lastName', label: 'Name', sortable: true, render: (_: any, row: any) => (
    <Link href={`/data-vault/internal-users/${row.employeeId}`} className="block group">
      <div className="font-semibold text-gray-900 group-hover:text-[#00C97B] transition-colors">{row.firstName} {row.lastName}</div>
      <div className="text-[10px] text-gray-400">{row.employeeId}</div>
    </Link>
  ) },
  { key: 'title', label: 'Title', sortable: true },
  { key: 'role', label: 'Role', sortable: true },
  { key: 'department', label: 'Department', sortable: true },
  { key: 'officeLocation', label: 'Location', sortable: true, render: (v) => v || '—' },
  { key: 'segment', label: 'Segment', sortable: true, render: (v) => v ? <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#F0FBF6] text-[#005868]">{v}</span> : <span className="text-gray-400">—</span> },
  { key: 'serviceGroup', label: 'Service Group', sortable: true, render: (v) => v || <span className="text-gray-400">—</span> },
  { key: 'licenseType', label: 'License Type', sortable: true, render: (v) => v ? <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{v}</span> : <span className="text-gray-400">—</span> },
  { key: 'utilizationActual', label: 'Utilization', sortable: true, align: 'right', render: (_, row) => utilizationCell(row.utilizationActual, row.utilizationTarget) },
  { key: 'tasksAssigned', label: 'Tasks', sortable: true, render: (_, row) => tasksCell(row.tasksAssigned, row.tasksOverdue) },
  { key: 'employmentStatus', label: 'Status', sortable: true, render: (v) => <StatusBadge status={v} /> },
];

export default function InternalUsersPage() {
  const [items, setItems] = useState<InternalUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInit, setSearchInit] = useState('');

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('search');
    if (q) setSearchInit(q);
  }, []);

  useEffect(() => {
    fetch('/api/internal-users')
      .then((r) => r.json())
      .then((data) => setItems(data.items))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="animate-pulse text-gray-400">Loading internal users...</div></div>;
  }

  const total = items.length;
  const active = items.filter((i) => i.employmentStatus === 'Active').length;
  const departments = new Set(items.map((i) => i.department)).size;
  const utilizations = items.map((i) => i.utilizationActual).filter((u): u is number => u !== null);
  const avgUtilization = utilizations.length > 0 ? utilizations.reduce((s, u) => s + u, 0) / utilizations.length : 0;

  return (
    <div className="space-y-3">
      <PageHeader
        title="Internal Users"
        subtitle="Staff directory and utilization tracking"
        breadcrumbs={[
          { label: 'Data Vault', href: '/data-vault' },
          { label: 'Internal Users' },
        ]}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Total Staff" value={String(total)} icon={<Users className="w-4 h-4" />} color="teal" />
        <MetricCard title="Active" value={String(active)} icon={<UserCheck className="w-4 h-4" />} color="green" />
        <MetricCard title="Departments" value={String(departments)} icon={<Building className="w-4 h-4" />} color="teal" />
        <MetricCard title="Avg Utilization" value={fmtPct(avgUtilization)} icon={<BarChart3 className="w-4 h-4" />} color="signal" />
      </div>

      <DataTable columns={columns} data={items} searchPlaceholder="Search staff..." initialSearch={searchInit} />
    </div>
  );
}
