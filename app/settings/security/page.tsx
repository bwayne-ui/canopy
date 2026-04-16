'use client';

import { useEffect, useState } from 'react';
import {
  Shield, ShieldCheck, ShieldAlert, Users, Lock, Unlock,
  ChevronDown, ChevronUp, ChevronRight, Loader2, Search, Filter,
  MonitorSmartphone, Key, FileText, CheckCircle2, XCircle,
  AlertTriangle, EyeOff, Network, Layers,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import {
  ROLE_META, SCOPE_MATRIX, DEV_CURRENT_USER,
  type CanopyRole,
} from '@/lib/permissions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SecurityUser {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  title: string;
  department: string;
  seniorityLevel: string | null;
  employmentStatus: string;
  podId: string | null;
  email: string;
  officeLocation: string | null;
  managerName: string | null;
  requiredTrainingComplete: boolean;
  canopyRole: CanopyRole;
  // security
  adminPanelAccess: boolean;
  vpnAccess: boolean;
  mfaEnabled: boolean;
  accountLocked: boolean;
  failedLoginAttempts: number;
  lastLogin: string | null;
  lastPasswordChange: string | null;
  // modules
  crmAccess: boolean;
  crmRole: string | null;
  investorPortalAccess: boolean;
  reportingPlatformAccess: boolean;
  complianceSystemAccess: boolean;
  dataWarehouseAccess: boolean;
  biToolAccess: boolean;
  apiAccess: boolean;
  documentMgmtAccess: boolean;
  hrSystemAccess: boolean;
  githubAccess: boolean;
  // computed
  directReportCount: number;
  tlLevel: number;
}

interface OrgNode {
  id: string;
  name: string;
  title: string;
  department: string;
  canopyRole: string;
  directReports: number;
  tlLevel: number;
  children: OrgNode[];
}

type Tab = 'matrix' | 'org-tree' | 'swimlanes' | 'roles' | 'audit';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function RoleBadge({ role }: { role: CanopyRole }) {
  const meta = ROLE_META[role];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5 ${meta.badgeColor}`}>
      {role === 'SYSTEM_ADMIN' && <Shield className="w-2.5 h-2.5" />}
      {meta.label}
    </span>
  );
}

// tl is raw derived level. Display = tl - 1. TL0 (CEO) gets no badge.
function TlBadge({ tl }: { tl: number }) {
  if (tl === 0) return null;
  const display = tl - 1;
  const colors: Record<number, string> = {
    0: 'bg-red-100 text-red-700',
    1: 'bg-purple-100 text-purple-700',
    2: 'bg-teal-100 text-teal-700',
    3: 'bg-blue-100 text-blue-700',
    4: 'bg-orange-100 text-orange-700',
    5: 'bg-amber-100 text-amber-700',
    6: 'bg-lime-100 text-lime-700',
    7: 'bg-pink-100 text-pink-700',
    8: 'bg-indigo-100 text-indigo-700',
    9: 'bg-gray-100 text-gray-600',
  };
  const cls = colors[display] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${cls}`}>
      TL{display}{display === 0 && ' · SLT'}
    </span>
  );
}

function AccessChip({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold rounded px-1.5 py-0.5 ${
      active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-300'
    }`}>
      {active ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
      {label}
    </span>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ProgressBar({ pct, color }: { pct: number; color: 'green' | 'amber' | 'red' }) {
  const bgColor = color === 'green' ? 'bg-emerald-500' : color === 'amber' ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${bgColor} transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

function scoreColor(pct: number): 'green' | 'amber' | 'red' {
  if (pct >= 95) return 'green';
  if (pct >= 80) return 'amber';
  return 'red';
}

function scoreTextColor(pct: number): string {
  if (pct >= 95) return 'text-emerald-600';
  if (pct >= 80) return 'text-amber-600';
  return 'text-red-600';
}

// ---------------------------------------------------------------------------
// Compliance Scorecard
// ---------------------------------------------------------------------------

function ComplianceScorecard({ users }: { users: SecurityUser[] }) {
  const total = users.length;
  if (total === 0) return null;

  const mfaCount = users.filter((u) => u.mfaEnabled).length;
  const mfaPct = Math.round((mfaCount / total) * 100);

  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const freshPwCount = users.filter((u) => u.lastPasswordChange && new Date(u.lastPasswordChange) >= ninetyDaysAgo).length;
  const freshPwPct = Math.round((freshPwCount / total) * 100);

  const trainingCount = users.filter((u) => u.requiredTrainingComplete).length;
  const trainingPct = Math.round((trainingCount / total) * 100);

  const cards = [
    { title: 'MFA Coverage', value: `${mfaPct}%`, sub: `${mfaCount}/${total}`, pct: mfaPct },
    { title: 'Password Freshness', value: `${freshPwPct}%`, sub: `${freshPwCount}/${total} within 90d`, pct: freshPwPct },
    { title: 'Training Completion', value: `${trainingPct}%`, sub: `${trainingCount}/${total} complete`, pct: trainingPct },
    { title: 'Access Review', value: 'Current', sub: 'Last reviewed: Apr 2026', pct: 100 },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c) => {
        const col = scoreColor(c.pct);
        return (
          <div key={c.title} className="bg-white rounded-xl border border-gray-200 p-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{c.title}</p>
            <p className={`text-lg font-bold mt-1 ${scoreTextColor(c.pct)}`}>{c.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5 mb-2">{c.sub}</p>
            <ProgressBar pct={c.pct} color={col} />
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// User Row
// ---------------------------------------------------------------------------

function UserRow({ user, isAdmin }: { user: SecurityUser; isAdmin: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const isSystemAdmin = user.canopyRole === 'SYSTEM_ADMIN';

  return (
    <>
      <tr
        className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${
          isSystemAdmin ? 'bg-red-50/30' : ''
        }`}
      >
        {/* Name */}
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
              isSystemAdmin ? 'bg-red-100 text-red-700' : 'bg-[#00C97B]/10 text-[#00835A]'
            }`}>
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-gray-900 leading-tight">
                  {user.firstName} {user.lastName}
                </p>
                <TlBadge tl={user.tlLevel} />
              </div>
              <p className="text-[10px] text-gray-400 font-mono">{user.employeeId}</p>
            </div>
          </div>
        </td>

        {/* Department / Role */}
        <td className="px-3 py-2.5">
          <p className="text-xs text-gray-700">{user.department}</p>
          <p className="text-[10px] text-gray-400">{user.title}</p>
        </td>

        {/* Canopy Role */}
        <td className="px-3 py-2.5">
          <RoleBadge role={user.canopyRole} />
        </td>

        {/* Security status */}
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            {user.mfaEnabled
              ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              : <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />}
            {user.vpnAccess && <MonitorSmartphone className="w-3.5 h-3.5 text-blue-400" />}
            {user.accountLocked && <Lock className="w-3.5 h-3.5 text-red-500" />}
            {user.failedLoginAttempts > 3 && (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            )}
          </div>
        </td>

        {/* Module chips */}
        <td className="px-3 py-2.5">
          <div className="flex flex-wrap gap-1">
            <AccessChip active={user.crmAccess} label="CRM" />
            <AccessChip active={user.investorPortalAccess} label="LP Portal" />
            <AccessChip active={user.reportingPlatformAccess} label="Reporting" />
            <AccessChip active={user.complianceSystemAccess} label="Compliance" />
            <AccessChip active={user.dataWarehouseAccess} label="DW" />
            <AccessChip active={user.biToolAccess} label="BI" />
            <AccessChip active={user.apiAccess} label="API" />
            {user.adminPanelAccess && <AccessChip active label="Admin" />}
          </div>
        </td>

        {/* Last login */}
        <td className="px-3 py-2.5 font-mono text-[10px] text-gray-400">
          {formatDate(user.lastLogin)}
        </td>

        {/* Actions */}
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="text-[10px] text-gray-400 hover:text-gray-700 transition-colors"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {isAdmin && (
              <button
                type="button"
                title={user.accountLocked ? 'Unlock account' : 'Lock account'}
                className={`text-[10px] rounded px-1.5 py-0.5 font-semibold transition-colors ${
                  user.accountLocked
                    ? 'text-red-600 bg-red-50 hover:bg-red-100'
                    : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {user.accountLocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr className="bg-gray-50/70 border-b border-gray-100">
          <td colSpan={7} className="px-4 py-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px]">
              <div>
                <p className="text-gray-400 mb-0.5">Email</p>
                <p className="text-gray-700 font-mono">{user.email}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-0.5">Last Login</p>
                <p className="text-gray-700 font-mono">{formatDate(user.lastLogin)}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-0.5">Password Changed</p>
                <p className="text-gray-700 font-mono">{formatDate(user.lastPasswordChange)}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-0.5">Failed Login Attempts</p>
                <p className={`font-mono font-semibold ${user.failedLoginAttempts > 0 ? 'text-amber-600' : 'text-gray-700'}`}>
                  {user.failedLoginAttempts}
                </p>
              </div>
              <div>
                <p className="text-gray-400 mb-0.5">MFA</p>
                <p className={`font-semibold ${user.mfaEnabled ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {user.mfaEnabled ? 'Enabled' : 'Not enabled'}
                </p>
              </div>
              <div>
                <p className="text-gray-400 mb-0.5">VPN Access</p>
                <p className={user.vpnAccess ? 'text-emerald-600 font-semibold' : 'text-gray-400'}>
                  {user.vpnAccess ? 'Granted' : 'None'}
                </p>
              </div>
              <div>
                <p className="text-gray-400 mb-0.5">Manager</p>
                <p className="text-gray-700">{user.managerName ?? '—'}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-0.5">Direct Reports</p>
                <p className="text-gray-700 font-mono">{user.directReportCount}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-0.5">Office</p>
                <p className="text-gray-700">{user.officeLocation ?? '—'}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-0.5">Training Complete</p>
                <p className={`font-semibold ${user.requiredTrainingComplete ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {user.requiredTrainingComplete ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <p className="text-gray-400 mb-0.5">Pod</p>
                <p className="text-gray-700 font-mono">{user.podId ?? '—'}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-0.5">Status</p>
                <p className={`font-semibold ${user.employmentStatus === 'Active' ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {user.employmentStatus}
                </p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Tab 1 — User Access Matrix with pagination
// ---------------------------------------------------------------------------

function UserAccessMatrix({ users, isAdmin }: { users: SecurityUser[]; isAdmin: boolean }) {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const depts = Array.from(new Set(users.map((u) => u.department))).sort();

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchQ = !q || `${u.firstName} ${u.lastName} ${u.email} ${u.employeeId} ${u.department}`.toLowerCase().includes(q);
    const matchDept = deptFilter === 'all' || u.department === deptFilter;
    return matchQ && matchDept;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paged = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [search, deptFilter]);

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00C97B]/40 focus:border-[#00C97B]"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-3 h-3 text-gray-400" />
          <select
            aria-label="Filter by department"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#00C97B]/40"
          >
            <option value="all">All departments</option>
            {depts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <span className="text-[10px] text-gray-400">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-3 py-2 text-left font-semibold text-gray-500 text-[10px] uppercase tracking-wide">User</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-500 text-[10px] uppercase tracking-wide">Department</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-500 text-[10px] uppercase tracking-wide">Canopy Role</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-500 text-[10px] uppercase tracking-wide">Security</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-500 text-[10px] uppercase tracking-wide">Module Access</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-500 text-[10px] uppercase tracking-wide">Last Login</th>
              <th className="px-3 py-2" scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-xs text-gray-400">No users match the current filter.</td>
              </tr>
            ) : (
              paged.map((u) => (
                <UserRow key={u.id} user={u} isAdmin={isAdmin} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-[10px] text-gray-400">
            Showing {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
            >
              Prev
            </button>
            <span className="text-[10px] text-gray-400 px-2">Page {safePage + 1} of {totalPages}</span>
            <button
              type="button"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <p className="text-[10px] text-gray-400 font-semibold">Legend:</p>
        <div className="flex items-center gap-1 text-[10px] text-gray-500">
          <ShieldCheck className="w-3 h-3 text-emerald-500" /> MFA enabled
        </div>
        <div className="flex items-center gap-1 text-[10px] text-gray-500">
          <ShieldAlert className="w-3 h-3 text-amber-500" /> MFA missing
        </div>
        <div className="flex items-center gap-1 text-[10px] text-gray-500">
          <MonitorSmartphone className="w-3 h-3 text-blue-400" /> VPN access
        </div>
        <div className="flex items-center gap-1 text-[10px] text-gray-500">
          <Lock className="w-3 h-3 text-red-500" /> Account locked
        </div>
        <div className="flex items-center gap-1 text-[10px] text-gray-500">
          <AlertTriangle className="w-3 h-3 text-amber-500" /> Failed login attempts
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2 — Org Tree
// ---------------------------------------------------------------------------

function OrgTreeNode({ node, defaultExpanded }: { node: OrgNode; defaultExpanded: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasChildren = node.children.length > 0;
  const initials = node.name.split(' ').map((n) => n[0]).join('').slice(0, 2);

  return (
    <div>
      <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50/50 transition-colors group">
        {/* Expand/collapse */}
        <button
          type="button"
          onClick={() => hasChildren && setExpanded((e) => !e)}
          className={`w-4 h-4 flex items-center justify-center flex-shrink-0 ${hasChildren ? 'text-gray-400 hover:text-gray-700' : 'text-transparent'}`}
          disabled={!hasChildren}
        >
          {hasChildren && (
            expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
          )}
        </button>

        {/* Avatar */}
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
          node.tlLevel === 0 ? 'bg-red-100 text-red-700' : 'bg-[#00C97B]/10 text-[#00835A]'
        }`}>
          {initials}
        </div>

        {/* Info */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-gray-900 truncate">{node.name}</span>
          <TlBadge tl={node.tlLevel} />
          <span className="text-[10px] text-gray-400 truncate">{node.title}</span>
          <span className="text-[10px] font-semibold rounded-full px-1.5 py-0.5 bg-gray-100 text-gray-500 flex-shrink-0">
            {node.department}
          </span>
          {node.directReports > 0 && (
            <span className="text-[10px] text-gray-400 flex-shrink-0">{node.directReports} reports</span>
          )}
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div className="ml-5 border-l border-gray-200 pl-2">
          {node.children.map((child) => (
            <OrgTreeNode
              key={child.id}
              node={child}
              defaultExpanded={child.tlLevel <= 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OrgTree() {
  const [tree, setTree] = useState<OrgNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings/security/org-tree')
      .then((r) => r.json())
      .then((d) => setTree(Array.isArray(d) ? d : []))
      .catch(() => setTree([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-gray-400 text-xs">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading org tree...
        </div>
      </div>
    );
  }

  if (tree.length === 0) {
    return <p className="text-xs text-gray-400 py-8 text-center">No org data available.</p>;
  }

  return (
    <div className="space-y-0.5">
      {tree.map((root) => (
        <OrgTreeNode key={root.id} node={root} defaultExpanded />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3 — Department Swimlanes
// ---------------------------------------------------------------------------

function getDeptGroup(dept: string): string {
  if (dept.startsWith('FA -') || dept === 'FA - General') return 'Fund Administration';
  if (dept.startsWith('Sales -') || dept === 'Sales - General') return 'Sales';
  if (dept.startsWith('GPX -') || dept === 'GPX - General') return 'GPX';
  if (dept.startsWith('Office of the')) return 'Office of the CEO';
  return dept;
}

interface DeptGroup {
  name: string;
  users: SecurityUser[];
  headcount: number;
  tlCounts: number[]; // index = raw tlLevel; raw 0=CEO (no badge), raw 1=TL0 SLT, raw 2=TL1 ...
  mfaPct: number;
  tl0User: SecurityUser | null;
  tl1Leaders: SecurityUser[];
  moduleAccess: Record<string, number>;
}

function buildDeptGroups(users: SecurityUser[]): DeptGroup[] {
  const groupMap = new Map<string, SecurityUser[]>();
  for (const u of users) {
    const g = getDeptGroup(u.department);
    if (!groupMap.has(g)) groupMap.set(g, []);
    groupMap.get(g)!.push(u);
  }

  const groups: DeptGroup[] = [];
  for (const [name, members] of Array.from(groupMap.entries())) {
    const tlCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // index = raw tlLevel (0=CEO, 1=TL0 SLT, 2=TL1 ...)
    for (const u of members) {
      const idx = Math.min(u.tlLevel, 9);
      tlCounts[idx]++;
    }
    const mfaCount = members.filter((u: SecurityUser) => u.mfaEnabled).length;

    // Find TL0 user (department head)
    const tl0User = members.find((u: SecurityUser) => u.tlLevel === 0) ?? null;
    const tl1Leaders = members
      .filter((u: SecurityUser) => u.tlLevel === 1)
      .sort((a: SecurityUser, b: SecurityUser) => b.directReportCount - a.directReportCount);

    // Module access counts
    const modules: Record<string, number> = {
      CRM: 0, 'LP Portal': 0, Reporting: 0, Compliance: 0, DW: 0, BI: 0, API: 0, Admin: 0,
    };
    for (const u of members) {
      if (u.crmAccess) modules['CRM']++;
      if (u.investorPortalAccess) modules['LP Portal']++;
      if (u.reportingPlatformAccess) modules['Reporting']++;
      if (u.complianceSystemAccess) modules['Compliance']++;
      if (u.dataWarehouseAccess) modules['DW']++;
      if (u.biToolAccess) modules['BI']++;
      if (u.apiAccess) modules['API']++;
      if (u.adminPanelAccess) modules['Admin']++;
    }

    groups.push({
      name,
      users: members,
      headcount: members.length,
      tlCounts,
      mfaPct: members.length > 0 ? Math.round((mfaCount / members.length) * 100) : 0,
      tl0User,
      tl1Leaders,
      moduleAccess: modules,
    });
  }

  // Sort by headcount descending
  groups.sort((a, b) => b.headcount - a.headcount);
  return groups;
}

const TL_COLORS = [
  'bg-gray-300', 'bg-red-400', 'bg-purple-400', 'bg-teal-400', 'bg-blue-400',
  'bg-orange-400', 'bg-amber-400', 'bg-lime-400', 'bg-pink-400', 'bg-indigo-400',
];
const TL_LABELS = ['CEO', 'TL0', 'TL1', 'TL2', 'TL3', 'TL4', 'TL5', 'TL6', 'TL7', 'TL8'];

function DeptSwimlanCard({ group }: { group: DeptGroup }) {
  const maxModule = Math.max(...Object.values(group.moduleAccess), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">{group.name}</h4>
          <p className="text-[10px] text-gray-400">{group.headcount} employee{group.headcount !== 1 ? 's' : ''}</p>
        </div>
        {group.tl0User && (
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-700">{group.tl0User.firstName} {group.tl0User.lastName}</p>
            <p className="text-[10px] text-gray-400">{group.tl0User.title}</p>
          </div>
        )}
      </div>

      {/* TL1 leaders (for large depts) */}
      {group.tl1Leaders.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {group.tl1Leaders.slice(0, 6).map((l) => (
            <div key={l.id} className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                {l.firstName[0]}{l.lastName[0]}
              </div>
              <span className="text-[10px] text-gray-600">{l.firstName} {l.lastName}</span>
              <span className="text-[10px] text-gray-400 font-mono">{l.directReportCount} HC</span>
            </div>
          ))}
        </div>
      )}

      {/* TL distribution bar */}
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">TL Distribution</p>
        <div className="flex h-2 rounded-full overflow-hidden">
          {group.tlCounts.map((count, i) => {
            if (count === 0) return null;
            const pct = (count / group.headcount) * 100;
            return (
              <div
                key={i}
                className={`${TL_COLORS[i]} transition-all`}
                style={{ width: `${pct}%` }}
                title={`${TL_LABELS[i]}: ${count}`}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {group.tlCounts.map((count, i) => count > 0 ? (
            <span key={i} className="text-[10px] text-gray-400">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${TL_COLORS[i]} mr-0.5`} />
              {TL_LABELS[i]}: {count}
            </span>
          ) : null)}
        </div>
      </div>

      {/* MFA coverage */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">MFA Coverage</p>
          <p className={`text-[10px] font-semibold ${scoreTextColor(group.mfaPct)}`}>{group.mfaPct}%</p>
        </div>
        <ProgressBar pct={group.mfaPct} color={scoreColor(group.mfaPct)} />
      </div>

      {/* Module access mini bars */}
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Module Access</p>
        <div className="space-y-1">
          {Object.entries(group.moduleAccess).map(([mod, count]) => {
            if (count === 0) return null;
            const pct = (count / maxModule) * 100;
            return (
              <div key={mod} className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 w-16 text-right flex-shrink-0">{mod}</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#00C97B] transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] text-gray-400 font-mono w-6 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DeptSwimlanes({ users }: { users: SecurityUser[] }) {
  const groups = buildDeptGroups(users);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {groups.map((g) => (
        <DeptSwimlanCard key={g.name} group={g} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 4 — Role Definitions (kept from original)
// ---------------------------------------------------------------------------

// Client-side scope check (mirrors lib/permissions ROLE_SCOPES)
const CLIENT_ROLE_SCOPES: Record<CanopyRole, string[]> = {
  SYSTEM_ADMIN: ['clients.all', 'entities.all', 'waterfall.all', 'investors.all', 'users.all', 'security.edit', 'security.view', 'security.audit', 'financials.all', 'pipeline.all', 'tax.all', 'engineering.all'],
  SLT: ['clients.all', 'entities.all', 'waterfall.summary', 'investors.all', 'users.all', 'security.view', 'financials.all', 'pipeline.all'],
  FA_POD_LEAD: ['clients.pod', 'entities.pod', 'waterfall.pod', 'investors.pod', 'users.pod'],
  FA_STAFF: ['clients.assigned', 'entities.assigned', 'waterfall.pod', 'investors.pod', 'users.self'],
  TAX: ['clients.all', 'entities.all', 'waterfall.summary', 'tax.all', 'users.self'],
  COMPLIANCE: ['clients.all', 'entities.all', 'waterfall.all', 'investors.kyc', 'users.all', 'security.audit'],
  FINANCE: ['waterfall.summary', 'financials.all', 'pipeline.arr', 'users.self'],
  REVOPS: ['pipeline.all', 'financials.arr', 'users.self'],
  ENGINEERING: ['engineering.all', 'users.self'],
  READ_ONLY: ['users.self'],
};

function checkScopeForRole(role: CanopyRole, scope: string): boolean {
  return CLIENT_ROLE_SCOPES[role]?.includes(scope) ?? false;
}

function RoleDefinitions() {
  const [open, setOpen] = useState<CanopyRole | null>('SYSTEM_ADMIN');
  const roles = Object.keys(ROLE_META) as CanopyRole[];

  return (
    <div className="space-y-1">
      {roles.map((role) => {
        const meta = ROLE_META[role];
        const isOpen = open === role;
        return (
          <div key={role} className={`rounded-xl border ${isOpen ? 'border-[#00C97B] ring-1 ring-[#00C97B]/10' : 'border-gray-100'} overflow-hidden`}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : role)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <RoleBadge role={role} />
                <span className="text-xs text-gray-500">{meta.description}</span>
              </div>
              {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
            </button>
            {isOpen && (
              <div className="px-4 pb-4 border-t border-gray-50">
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                  {SCOPE_MATRIX.map((row) => (
                    <div key={row.area} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">{row.area}</p>
                      <div className="space-y-1">
                        {row.scopes.map((s) => {
                          const granted = checkScopeForRole(role, s.scope);
                          return (
                            <div key={s.scope} className="flex items-center gap-1.5">
                              {granted
                                ? <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                                : <XCircle className="w-3 h-3 text-gray-200 flex-shrink-0" />}
                              <span className={`text-[10px] ${granted ? 'text-gray-700' : 'text-gray-300'}`}>{s.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 5 — Audit Log (kept from original)
// ---------------------------------------------------------------------------

interface AuditEntry {
  id: string;
  ts: string;
  actor: string;
  subject: string;
  action: string;
  detail: string;
}

function AuditLog() {
  const [entries] = useState<AuditEntry[]>([
    {
      id: '1',
      ts: '2026-04-15T09:12:00Z',
      actor: 'Billy Wayne',
      subject: 'James Park',
      action: 'role_change',
      detail: 'FA_STAFF \u2192 FA_POD_LEAD (pod POD-FA-03)',
    },
    {
      id: '2',
      ts: '2026-04-14T14:33:00Z',
      actor: 'Billy Wayne',
      subject: 'Sofia Martinez',
      action: 'module_access_granted',
      detail: 'dataWarehouseAccess enabled',
    },
    {
      id: '3',
      ts: '2026-04-14T11:05:00Z',
      actor: 'System',
      subject: 'Christopher Bell',
      action: 'account_locked',
      detail: '5 consecutive failed login attempts',
    },
    {
      id: '4',
      ts: '2026-04-13T16:48:00Z',
      actor: 'Billy Wayne',
      subject: 'Fatima Hassan',
      action: 'module_access_granted',
      detail: 'complianceSystemAccess enabled, vpnAccess enabled',
    },
    {
      id: '5',
      ts: '2026-04-12T10:20:00Z',
      actor: 'System',
      subject: 'Elena Petrova',
      action: 'mfa_enforcement',
      detail: 'MFA enabled via Entra Conditional Access policy',
    },
  ]);

  const actionColor: Record<string, string> = {
    role_change: 'bg-purple-50 text-purple-700',
    module_access_granted: 'bg-emerald-50 text-emerald-700',
    module_access_revoked: 'bg-red-50 text-red-700',
    account_locked: 'bg-red-50 text-red-700',
    account_unlocked: 'bg-amber-50 text-amber-700',
    mfa_enforcement: 'bg-blue-50 text-blue-700',
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-100">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="px-3 py-2 text-left font-semibold text-gray-500 text-[10px] uppercase tracking-wide">Timestamp</th>
            <th className="px-3 py-2 text-left font-semibold text-gray-500 text-[10px] uppercase tracking-wide">Actor</th>
            <th className="px-3 py-2 text-left font-semibold text-gray-500 text-[10px] uppercase tracking-wide">Subject User</th>
            <th className="px-3 py-2 text-left font-semibold text-gray-500 text-[10px] uppercase tracking-wide">Action</th>
            <th className="px-3 py-2 text-left font-semibold text-gray-500 text-[10px] uppercase tracking-wide">Detail</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50/50">
              <td className="px-3 py-2.5 font-mono text-[10px] text-gray-400">{formatDate(e.ts)}</td>
              <td className="px-3 py-2.5 text-xs text-gray-700 font-semibold">{e.actor}</td>
              <td className="px-3 py-2.5 text-xs text-gray-700">{e.subject}</td>
              <td className="px-3 py-2.5">
                <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${actionColor[e.action] ?? 'bg-gray-100 text-gray-600'}`}>
                  {e.action.replace(/_/g, ' ')}
                </span>
              </td>
              <td className="px-3 py-2.5 text-[10px] text-gray-500">{e.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SecurityCenterPage() {
  const [users, setUsers] = useState<SecurityUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('matrix');

  const currentUser = DEV_CURRENT_USER;
  const isAdmin = currentUser.role === 'SYSTEM_ADMIN';

  useEffect(() => {
    fetch('/api/settings/security/users')
      .then((r) => r.json())
      .then((d) => setUsers(Array.isArray(d) ? d : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  // KPIs
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.employmentStatus === 'Active').length;
  const mfaCount = users.filter((u) => u.mfaEnabled).length;
  const mfaPct = totalUsers > 0 ? Math.round((mfaCount / totalUsers) * 100) : 0;
  const lockedCount = users.filter((u) => u.accountLocked).length;

  const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
    { id: 'matrix', label: 'User Access Matrix', icon: <Users className="w-3 h-3" /> },
    { id: 'org-tree', label: 'Org Tree', icon: <Network className="w-3 h-3" /> },
    { id: 'swimlanes', label: 'Dept Swimlanes', icon: <Layers className="w-3 h-3" /> },
    { id: 'roles', label: 'Role Definitions', icon: <Key className="w-3 h-3" /> },
    { id: 'audit', label: 'Audit Log', icon: <FileText className="w-3 h-3" /> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2 text-gray-400 text-xs">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading security data...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Security & Permissions"
        subtitle="RBAC access matrix, role definitions, and permission audit log"
        breadcrumbs={[
          { label: 'Settings' },
          { label: 'Security & Permissions' },
        ]}
      />

      {/* System Admin context banner */}
      {isAdmin && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
          <Shield className="w-4 h-4 text-red-600 flex-shrink-0" />
          <div>
            <span className="text-xs font-semibold text-red-800">System Administrator</span>
            <span className="text-xs text-red-600 ml-2">
              You have unrestricted access to all Canopy data and security controls.
              Auth: Microsoft Entra ID (dev mode — real session active when
              <span className="font-mono ml-1">AZURE_AD_CLIENT_ID</span> is set)
            </span>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard title="Total Users"   value={String(totalUsers)}  icon={<Users className="w-4 h-4" />}       color="teal" />
        <MetricCard title="Active Users"  value={String(activeUsers)} icon={<ShieldCheck className="w-4 h-4" />} color="green" />
        <MetricCard title="MFA Enforced"  value={`${mfaPct}%`}        icon={<Shield className="w-4 h-4" />}      color="signal" />
        <MetricCard title="Locked Accounts" value={String(lockedCount)} icon={<Lock className="w-4 h-4" />}    color={lockedCount > 0 ? 'signal' : 'teal'} />
      </div>

      {/* Compliance Scorecard */}
      <ComplianceScorecard users={users} />

      {/* Tabs + content */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Tab bar */}
        <div className="px-4 pt-3 pb-0 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900">Security Center</h3>
          </div>
          <div className="flex items-center gap-0.5">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-semibold transition-colors border-b-2 -mb-px ${
                  tab === t.id
                    ? 'border-[#00C97B] text-[#00835A]'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {/* Tab 1 — User Access Matrix */}
          {tab === 'matrix' && (
            <UserAccessMatrix users={users} isAdmin={isAdmin} />
          )}

          {/* Tab 2 — Org Tree */}
          {tab === 'org-tree' && <OrgTree />}

          {/* Tab 3 — Dept Swimlanes */}
          {tab === 'swimlanes' && <DeptSwimlanes users={users} />}

          {/* Tab 4 — Role Definitions */}
          {tab === 'roles' && <RoleDefinitions />}

          {/* Tab 5 — Audit Log */}
          {tab === 'audit' && (
            isAdmin || users.some((u) => u.complianceSystemAccess)
              ? <AuditLog />
              : (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <EyeOff className="w-6 h-6 text-gray-300" />
                  <p className="text-xs text-gray-400">Audit log is restricted to System Admins and Compliance users.</p>
                </div>
              )
          )}
        </div>
      </div>
    </div>
  );
}
