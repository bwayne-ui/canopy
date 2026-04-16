'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import {
  UserCog, Users, Building2, AlertTriangle, CheckCircle2, Clock,
  ChevronDown, ChevronRight, Briefcase,
} from 'lucide-react';

/* ─── types ─────────────────────────────────────────────── */
interface EmployeeWorkload {
  id: string;
  name: string;
  department: string;
  title: string;
  capacityHours: number;
  dailyCapacityHours: number;
  weeklyAssignedHours: number;
  weeklyUtilPct: number;
  weeklyOverloaded: boolean;
  dailyAssignedHours: number;
  dailyUtilPct: number;
  dailyOverloaded: boolean;
  entityAssignments: { entityName: string | null; clientName: string | null; department: string; serviceLine: string; role: string; coveragePct: number }[];
  weekTasks: { taskName: string; entityName: string; dueDate: string; estimatedHours: number; status: string; priority: string }[];
}

interface AssignmentRow {
  id: string;
  employee: string;
  department: string;
  serviceLine: string;
  clientName: string | null;
  entityName: string | null;
  role: string;
  coveragePct: number;
  startDate: string | null;
  status: string;
}

/* ─── helpers ────────────────────────────────────────────── */
function roleBadge(role: string) {
  const map: Record<string, string> = {
    Primary:   'bg-[#F0FBF6] text-[#00AA6C] border border-[#00AA6C]/20',
    Secondary: 'bg-[#f3f4f6] text-[#6b7280] border border-[#e5e7eb]',
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${map[role] ?? 'bg-gray-100 text-gray-600'}`}>
      {role}
    </span>
  );
}

function UtilBar({ pct, label }: { pct: number; label: string }) {
  const capped = Math.min(pct, 150);
  const color = pct > 100 ? '#ef4444' : pct > 80 ? '#d97706' : '#00AA6C';
  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <div className="flex-1 h-2 bg-[#f3f4f6] rounded-full overflow-hidden relative">
        {/* 100% marker */}
        <div className="absolute right-[33.3%] top-0 bottom-0 w-px bg-[#e5e7eb] z-10" />
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(capped / 150) * 100}%`, backgroundColor: color }}
        />
      </div>
      <span className={`text-[10px] font-bold w-9 text-right ${pct > 100 ? 'text-[#ef4444]' : pct > 80 ? 'text-[#d97706]' : 'text-[#00AA6C]'}`}>
        {pct}%
      </span>
      <span className="text-[10px] text-[#9ca3af] hidden lg:block">{label}</span>
    </div>
  );
}

/* ─── capacity heatmap card ──────────────────────────────── */
function CapacityCard({ emp }: { emp: EmployeeWorkload }) {
  const [open, setOpen] = useState(false);
  const overloaded = emp.weeklyOverloaded || emp.dailyOverloaded;

  return (
    <div className={`bg-white rounded-[14px] border shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden ${overloaded ? 'border-[#ef4444]/40' : 'border-[#e5e7eb]'}`}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="font-semibold text-xs text-[#1a1a1a]">{emp.name}</div>
            <div className="text-[10px] text-[#9ca3af] mt-0.5">{emp.title}</div>
            <div className="text-[10px] font-semibold text-[#005868] uppercase tracking-wider mt-0.5">{emp.department}</div>
          </div>
          {overloaded
            ? <AlertTriangle className="w-4 h-4 text-[#ef4444] flex-shrink-0" />
            : <CheckCircle2 className="w-4 h-4 text-[#00AA6C] flex-shrink-0" />
          }
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#6b7280]">This week</span>
            <UtilBar pct={emp.weeklyUtilPct} label={`${emp.weeklyAssignedHours}h / ${emp.capacityHours}h`} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#6b7280]">Today</span>
            <UtilBar pct={emp.dailyUtilPct} label={`${emp.dailyAssignedHours}h / ${emp.dailyCapacityHours}h`} />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3 text-[10px] text-[#9ca3af]">
          <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{emp.entityAssignments.length} entities</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{emp.weekTasks.length} tasks due this wk</span>
        </div>
      </div>

      {emp.weekTasks.length > 0 && (
        <>
          <button
            onClick={() => setOpen(!open)}
            className="w-full flex items-center justify-center gap-1 text-[10px] font-semibold text-[#6b7280] hover:text-[#005868] py-1.5 border-t border-[#e5e7eb] hover:bg-[#FAFAFA] transition-colors"
          >
            {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {open ? 'Hide' : 'Show'} this week's tasks
          </button>
          {open && (
            <div className="border-t border-[#e5e7eb]">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="bg-[#f3f4f6]">
                    <th className="text-left px-3 py-1.5 text-[#9ca3af] font-bold uppercase tracking-wider">Task</th>
                    <th className="text-left px-3 py-1.5 text-[#9ca3af] font-bold uppercase tracking-wider">Entity</th>
                    <th className="text-right px-3 py-1.5 text-[#9ca3af] font-bold uppercase tracking-wider">Hrs</th>
                    <th className="text-left px-3 py-1.5 text-[#9ca3af] font-bold uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {emp.weekTasks.map((t, i) => (
                    <tr key={i} className="border-t border-[#e5e7eb] hover:bg-[#F0FBF6]">
                      <td className="px-3 py-2 font-medium text-[#1a1a1a] max-w-[120px] truncate">{t.taskName}</td>
                      <td className="px-3 py-2 text-[#6b7280] max-w-[110px] truncate">{t.entityName}</td>
                      <td className="px-3 py-2 text-right text-[#6b7280]">{t.estimatedHours}h</td>
                      <td className="px-3 py-2"><StatusBadge status={t.status} /></td>
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

/* ─── assignments table ──────────────────────────────────── */
function AssignmentsTable({ items }: { items: AssignmentRow[] }) {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  const depts = ['All', ...Array.from(new Set(items.map((i) => i.department))).sort()];
  const filtered = items.filter((i) => {
    const q = search.toLowerCase();
    const matchSearch = !q || i.employee.toLowerCase().includes(q) || (i.entityName ?? '').toLowerCase().includes(q) || i.serviceLine.toLowerCase().includes(q);
    const matchDept = deptFilter === 'All' || i.department === deptFilter;
    return matchSearch && matchDept;
  });

  return (
    <div className="bg-white rounded-[14px] border border-[#e5e7eb] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="p-4 border-b border-[#e5e7eb] flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search assignments…"
          className="border border-[#e5e7eb] rounded-lg px-3 py-1.5 text-xs text-[#1a1a1a] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#00AA6C] w-56"
        />
        <div className="flex gap-1">
          {depts.map((d) => (
            <button
              key={d}
              onClick={() => setDeptFilter(d)}
              className={`text-[10px] px-2.5 py-1 rounded-full font-semibold transition-colors ${deptFilter === d ? 'bg-[#00AA6C] text-white' : 'bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb]'}`}
            >
              {d}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[10px] text-[#9ca3af]">{filtered.length} assignments</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#f3f4f6] border-b border-[#e5e7eb]">
              <th className="text-left px-4 py-2 text-[#9ca3af] font-bold uppercase tracking-wider">Employee</th>
              <th className="text-left px-4 py-2 text-[#9ca3af] font-bold uppercase tracking-wider">Department</th>
              <th className="text-left px-4 py-2 text-[#9ca3af] font-bold uppercase tracking-wider">Service Line</th>
              <th className="text-left px-4 py-2 text-[#9ca3af] font-bold uppercase tracking-wider">Client</th>
              <th className="text-left px-4 py-2 text-[#9ca3af] font-bold uppercase tracking-wider">Entity</th>
              <th className="text-left px-4 py-2 text-[#9ca3af] font-bold uppercase tracking-wider">Role</th>
              <th className="text-right px-4 py-2 text-[#9ca3af] font-bold uppercase tracking-wider">Coverage</th>
              <th className="text-left px-4 py-2 text-[#9ca3af] font-bold uppercase tracking-wider">Start</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-t border-[#e5e7eb] hover:bg-[#F0FBF6] transition-colors">
                <td className="px-4 py-2.5 font-medium text-[#1a1a1a]">{row.employee}</td>
                <td className="px-4 py-2.5 text-[#6b7280]">{row.department}</td>
                <td className="px-4 py-2.5 text-[#6b7280]">{row.serviceLine}</td>
                <td className="px-4 py-2.5 text-[#6b7280]">{row.clientName ?? '—'}</td>
                <td className="px-4 py-2.5 text-[#6b7280] max-w-[160px] truncate">{row.entityName ?? '—'}</td>
                <td className="px-4 py-2.5">{roleBadge(row.role)}</td>
                <td className="px-4 py-2.5 text-right text-[#6b7280]">{row.coveragePct}%</td>
                <td className="px-4 py-2.5 text-[#9ca3af]">{row.startDate ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── page ───────────────────────────────────────────────── */
export default function EmployeeAssignmentsPage() {
  const [workload, setWorkload] = useState<EmployeeWorkload[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'capacity' | 'assignments'>('capacity');

  useEffect(() => {
    Promise.all([
      fetch('/api/capacity/workload').then((r) => r.json()),
      fetch('/api/employee-assignments').then((r) => r.json()),
    ])
      .then(([cap, asgn]) => {
        if (cap.error) { setError(cap.error); return; }
        setWorkload(cap.workload ?? []);
        setAssignments(asgn.items ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const overloaded  = workload.filter((e) => e.weeklyOverloaded || e.dailyOverloaded).length;
  const totalEntities = new Set(assignments.map((a) => a.entityName).filter(Boolean)).size;
  const primary = assignments.filter((a) => a.role === 'Primary').length;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Employee Assignments"
        subtitle="Coverage assignments and real-time capacity tracking by department"
        breadcrumbs={[{ label: 'Relationships' }, { label: 'Employee Assignments' }]}
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Active Employees', value: workload.length, icon: <Users className="w-4 h-4 text-[#00AA6C]" />, bg: 'bg-[#F0FBF6]', val: 'text-[#00AA6C]', sub: 'in Canopy' },
          { label: 'Overloaded', value: overloaded, icon: <AlertTriangle className="w-4 h-4 text-[#ef4444]" />, bg: 'bg-[#fef2f2]', val: 'text-[#ef4444]', sub: '>100% this wk or today' },
          { label: 'Entities Covered', value: totalEntities, icon: <Building2 className="w-4 h-4 text-[#005868]" />, bg: 'bg-[#F0FBF6]', val: 'text-[#005868]', sub: 'across all depts' },
          { label: 'Primary Roles', value: primary, icon: <UserCog className="w-4 h-4 text-[#d97706]" />, bg: 'bg-[#fffbeb]', val: 'text-[#d97706]', sub: 'of all assignments' },
        ].map((c) => (
          <div key={c.label} className={`${c.bg} rounded-[14px] p-4 border border-[#e5e7eb]`}>
            <div className="flex items-center gap-2 mb-1">{c.icon}<span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">{c.label}</span></div>
            <div className={`text-3xl font-bold leading-none ${c.val}`}>{loading ? '—' : c.value}</div>
            <div className="text-xs text-[#9ca3af] mt-0.5">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Overload callout */}
      {!loading && overloaded > 0 && (
        <div className="bg-[#fef2f2] border border-[#ef4444]/30 rounded-[14px] px-5 py-3 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-[#ef4444] flex-shrink-0" />
          <p className="text-xs text-[#b91c1c]">
            <span className="font-bold">{overloaded} employee{overloaded > 1 ? 's' : ''}</span> exceed 100% capacity this week or today.
            Review the cards below and consider rebalancing task assignments.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-[#fef2f2] border border-[#ef4444]/20 rounded-[14px] p-5 text-[#b91c1c] text-xs whitespace-pre-wrap">{error}</div>
      )}

      {/* View toggle */}
      <div className="flex gap-2">
        {(['capacity', 'assignments'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-colors ${view === v ? 'bg-[#00AA6C] text-white' : 'bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb]'}`}
          >
            {v === 'capacity' ? 'Capacity Heatmap' : 'Assignment List'}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-16 text-[#9ca3af] text-sm">Loading…</div>}

      {!loading && !error && view === 'capacity' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {workload.map((emp) => <CapacityCard key={emp.id} emp={emp} />)}
        </div>
      )}

      {!loading && !error && view === 'assignments' && (
        <AssignmentsTable items={assignments} />
      )}

      {/* Legend */}
      {!loading && view === 'capacity' && (
        <div className="bg-white rounded-[14px] border border-[#e5e7eb] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">How capacity is calculated</div>
          <p className="text-xs text-[#6b7280] leading-relaxed">
            Each employee has a <span className="font-semibold text-[#1a1a1a]">weekly capacity</span> (default 40 h).
            Tasks with a due date <span className="font-semibold text-[#1a1a1a]">this week</span> that are not yet complete contribute
            their <span className="font-semibold text-[#1a1a1a]">estimated hours</span> from the SOP definition.
            Daily capacity is capacity ÷ 5; tasks due <span className="font-semibold text-[#1a1a1a]">today</span> drive the daily utilization bar.
            The bar turns <span className="font-semibold text-[#d97706]">amber above 80%</span> and <span className="font-semibold text-[#ef4444]">red above 100%</span>.
          </p>
        </div>
      )}
    </div>
  );
}
