'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import {
  Users, UserCheck, Shield, ChevronLeft, Home, Search, X,
  Mail, MapPin, Building2, ChevronRight,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import { ROLE_META, type CanopyRole } from '@/lib/permissions';

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
  adminPanelAccess: boolean;
  vpnAccess: boolean;
  mfaEnabled: boolean;
  accountLocked: boolean;
  failedLoginAttempts: number;
  lastLogin: string | null;
  lastPasswordChange: string | null;
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
  directReportCount: number;
  tlLevel: number;
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function getTlBorderColor(tl: number): string {
  const map: Record<number, string> = {
    0: 'border-l-red-500',
    1: 'border-l-purple-500',
    2: 'border-l-teal-500',
    3: 'border-l-blue-500',
    4: 'border-l-orange-400',
    5: 'border-l-amber-400',
    6: 'border-l-lime-400',
    7: 'border-l-pink-400',
    8: 'border-l-indigo-400',
    9: 'border-l-gray-300',
  };
  return map[tl] ?? 'border-l-gray-300';
}

function getTlAvatarColor(tl: number): string {
  const map: Record<number, string> = {
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
  return map[tl] ?? 'bg-gray-100 text-gray-600';
}

function getInitials(user: SecurityUser): string {
  return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
}

function getModuleAccessChips(user: SecurityUser): string[] {
  const chips: string[] = [];
  if (user.adminPanelAccess) chips.push('Admin');
  if (user.crmAccess) chips.push('CRM');
  if (user.investorPortalAccess) chips.push('Investor Portal');
  if (user.reportingPlatformAccess) chips.push('Reporting');
  if (user.complianceSystemAccess) chips.push('Compliance');
  if (user.dataWarehouseAccess) chips.push('Data Warehouse');
  if (user.biToolAccess) chips.push('BI Tool');
  if (user.apiAccess) chips.push('API');
  if (user.documentMgmtAccess) chips.push('Docs');
  if (user.hrSystemAccess) chips.push('HR System');
  if (user.githubAccess) chips.push('GitHub');
  return chips;
}

function buildAncestryChain(
  user: SecurityUser,
  nameToUser: Map<string, SecurityUser>
): SecurityUser[] {
  const chain: SecurityUser[] = [user];
  const visited = new Set<string>([user.id]);
  let current = user;
  let hops = 0;
  while (current.managerName && hops < 20) {
    const mgr = nameToUser.get(current.managerName);
    if (!mgr || visited.has(mgr.id)) break;
    visited.add(mgr.id);
    chain.unshift(mgr);
    current = mgr;
    hops++;
  }
  return chain;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TlBadge({ tl }: { tl: number }) {
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
  const cls = colors[tl] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${cls}`}>
      TL{tl}{tl === 0 && ' · SLT'}
    </span>
  );
}

function RoleBadge({ role }: { role: CanopyRole }) {
  const meta = ROLE_META[role];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5 ${meta.badgeColor}`}>
      {role === 'SYSTEM_ADMIN' && <Shield className="w-2.5 h-2.5" />}
      {meta.label}
    </span>
  );
}

function HeroCard({
  user,
  onDrillDown,
}: {
  user: SecurityUser;
  onDrillDown: (u: SecurityUser) => void;
}) {
  const chips = getModuleAccessChips(user);
  const borderColor = getTlBorderColor(user.tlLevel);
  const avatarColor = getTlAvatarColor(user.tlLevel);

  return (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 ${borderColor} p-4 mb-4`}>
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${avatarColor}`}>
          {getInitials(user)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-bold text-gray-900">{user.firstName} {user.lastName}</span>
            <TlBadge tl={user.tlLevel} />
            <RoleBadge role={user.canopyRole} />
          </div>
          <p className="text-xs text-gray-500 font-medium mb-1">{user.title}</p>
          <div className="flex items-center gap-4 flex-wrap text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {user.department}
            </span>
            {user.officeLocation && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {user.officeLocation}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {user.email}
            </span>
          </div>
          {user.directReportCount > 0 && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => onDrillDown(user)}
                className="text-xs font-semibold text-[#00C97B] hover:text-[#00835A] transition-colors"
              >
                {user.directReportCount} direct report{user.directReportCount !== 1 ? 's' : ''} ↓
              </button>
            </div>
          )}
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center text-[10px] font-semibold rounded px-1.5 py-0.5 bg-emerald-50 text-emerald-700"
                >
                  {chip}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReportCard({
  user,
  onClick,
}: {
  user: SecurityUser;
  onClick: () => void;
}) {
  const borderColor = getTlBorderColor(user.tlLevel);
  const avatarColor = getTlAvatarColor(user.tlLevel);
  const chips = getModuleAccessChips(user).slice(0, 4);

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-sm border-l-4 ${borderColor} p-3 cursor-pointer hover:shadow-md hover:bg-gray-50/50 transition-all duration-150`}
    >
      <div className="flex items-start gap-2.5 mb-2">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColor}`}>
          {getInitials(user)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <span className="text-xs font-semibold text-gray-900 truncate">{user.firstName} {user.lastName}</span>
            <TlBadge tl={user.tlLevel} />
          </div>
          <p className="text-[10px] text-gray-400 font-medium truncate">{user.title}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold rounded px-1.5 py-0.5 bg-gray-100 text-gray-500 truncate max-w-[120px]">
          {user.department}
        </span>
        {user.directReportCount > 0 ? (
          <span className="text-[10px] font-semibold text-[#00835A]">
            {user.directReportCount} reports →
          </span>
        ) : (
          <span className="text-[10px] text-gray-300 font-medium">IC</span>
        )}
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {chips.map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center text-[10px] font-semibold rounded px-1 py-0.5 bg-emerald-50 text-emerald-700"
            >
              {chip}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SearchDropdown({
  query,
  results,
  onSelect,
  onClear,
}: {
  query: string;
  results: SecurityUser[];
  onSelect: (u: SecurityUser) => void;
  onClear: () => void;
}) {
  if (!query || results.length === 0) return null;
  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 z-50 max-h-64 overflow-y-auto">
      {results.slice(0, 10).map((u) => (
        <button
          key={u.id}
          type="button"
          onClick={() => { onSelect(u); onClear(); }}
          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${getTlAvatarColor(u.tlLevel)}`}>
            {getInitials(u)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-gray-900">{u.firstName} {u.lastName}</span>
              <TlBadge tl={u.tlLevel} />
            </div>
            <p className="text-[10px] text-gray-400 truncate">{u.title} · {u.department}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OrgChartPage() {
  const [allUsers, setAllUsers] = useState<SecurityUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [path, setPath] = useState<SecurityUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [reportFilter, setReportFilter] = useState('');
  const [showAllReports, setShowAllReports] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/settings/security/users')
      .then((r) => r.json())
      .then((data: SecurityUser[]) => {
        setAllUsers(data);
        setLoading(false);
      });
  }, []);

  const { nameToUser, reportMap } = useMemo(() => {
    const nameToUser = new Map<string, SecurityUser>();
    const reportMap = new Map<string, SecurityUser[]>();
    for (const u of allUsers) {
      const name = `${u.firstName} ${u.lastName}`;
      nameToUser.set(name, u);
      reportMap.set(name, []);
    }
    for (const u of allUsers) {
      if (u.managerName) {
        const list = reportMap.get(u.managerName);
        if (list) list.push(u);
      }
    }
    for (const [, list] of Array.from(reportMap.entries())) {
      list.sort(
        (a, b) =>
          b.directReportCount - a.directReportCount ||
          a.firstName.localeCompare(b.firstName)
      );
    }
    return { nameToUser, reportMap };
  }, [allUsers]);

  const root = useMemo(
    () =>
      allUsers
        .filter((u) => u.tlLevel === 0)
        .sort((a, b) => b.directReportCount - a.directReportCount)[0] ?? null,
    [allUsers]
  );

  const current = path.length > 0 ? path[path.length - 1] : root;

  const directReports = useMemo(() => {
    if (!current) return [];
    const name = `${current.firstName} ${current.lastName}`;
    return reportMap.get(name) ?? [];
  }, [current, reportMap]);

  const filteredReports = useMemo(() => {
    if (!reportFilter) return directReports;
    const q = reportFilter.toLowerCase();
    return directReports.filter(
      (u) =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        u.title.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q)
    );
  }, [directReports, reportFilter]);

  const visibleReports = showAllReports
    ? filteredReports
    : filteredReports.slice(0, 50);

  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return allUsers
      .filter(
        (u) =>
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
          u.title.toLowerCase().includes(q) ||
          u.department.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [searchQuery, allUsers]);

  const avgSpan = useMemo(() => {
    const managers = allUsers.filter((u) => u.directReportCount > 0);
    if (managers.length === 0) return '0.0';
    const total = managers.reduce((s, u) => s + u.directReportCount, 0);
    return (total / managers.length).toFixed(1);
  }, [allUsers]);

  const maxTlLevel = useMemo(
    () => (allUsers.length > 0 ? Math.max(...allUsers.map((u) => u.tlLevel)) : 0),
    [allUsers]
  );

  const drillDown = (user: SecurityUser) => {
    setPath((prev) => [...prev, user]);
    setReportFilter('');
    setShowAllReports(false);
  };

  const goBack = () => {
    setPath((prev) => prev.slice(0, -1));
    setReportFilter('');
    setShowAllReports(false);
  };

  const jumpTo = (idx: number) => {
    setPath((prev) => prev.slice(0, idx + 1));
    setReportFilter('');
    setShowAllReports(false);
  };

  const jumpToRoot = () => {
    setPath([]);
    setReportFilter('');
    setShowAllReports(false);
  };

  const jumpToUser = (user: SecurityUser) => {
    const chain = buildAncestryChain(user, nameToUser);
    setPath(chain.slice(1));
    setReportFilter('');
    setShowAllReports(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xs text-gray-400 animate-pulse">Loading org chart…</div>
      </div>
    );
  }

  if (!root) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xs text-gray-400">No employees found.</div>
      </div>
    );
  }

  return (
    <div className="px-6 py-4">
      {/* Page Header */}
      <PageHeader
        title="Org Chart"
        subtitle={`${allUsers.length.toLocaleString()} employees · Navigate from CEO to individual contributors`}
        breadcrumbs={[{ label: 'Org & Assignments' }, { label: 'Org Chart' }]}
        actions={
          <div className="relative w-64" ref={searchRef}>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-md px-2.5 py-1.5">
              <Search className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Jump to any employee…"
                className="flex-1 text-xs outline-none placeholder-gray-300 bg-transparent"
              />
              {searchQuery && (
                <button type="button" aria-label="Clear search" onClick={() => setSearchQuery('')}>
                  <X className="w-3 h-3 text-gray-300 hover:text-gray-500" />
                </button>
              )}
            </div>
            <SearchDropdown
              query={searchQuery}
              results={searchResults}
              onSelect={jumpToUser}
              onClear={() => setSearchQuery('')}
            />
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <MetricCard
          title="Total Employees"
          value={allUsers.length}
          icon={<Users className="w-5 h-5" />}
          color="green"
        />
        <MetricCard
          title="Avg Span of Control"
          value={avgSpan}
          icon={<UserCheck className="w-5 h-5" />}
          color="teal"
        />
        <MetricCard
          title="Org Depth"
          value={`${maxTlLevel + 1} levels`}
          icon={<Shield className="w-5 h-5" />}
          color="signal"
        />
      </div>

      {/* Breadcrumb nav bar */}
      <div className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-3 py-2 mb-4 shadow-sm">
        <div className="flex items-center gap-1 flex-wrap flex-1 min-w-0">
          <button
            type="button"
            onClick={jumpToRoot}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#00C97B] transition-colors px-1.5 py-0.5 rounded"
          >
            <Home className="w-3 h-3" />
            <span className="font-medium">{root.firstName} {root.lastName}</span>
          </button>
          {path.map((u, idx) => (
            <span key={u.id} className="flex items-center gap-1">
              <ChevronRight className="w-3 h-3 text-gray-200 flex-shrink-0" />
              {idx === path.length - 1 ? (
                <span className="text-xs font-semibold text-gray-900 bg-gray-100 rounded px-1.5 py-0.5">
                  {u.firstName} {u.lastName}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => jumpTo(idx)}
                  className="text-xs text-gray-400 hover:text-[#00C97B] transition-colors px-1.5 py-0.5 rounded font-medium"
                >
                  {u.firstName} {u.lastName}
                </button>
              )}
            </span>
          ))}
        </div>
        {path.length > 0 && (
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors ml-3 flex-shrink-0 border border-gray-200 rounded px-2 py-1"
          >
            <ChevronLeft className="w-3 h-3" />
            Back
          </button>
        )}
      </div>

      {/* Hero Card */}
      {current && <HeroCard user={current} onDrillDown={drillDown} />}

      {/* Direct Reports */}
      {current && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-gray-900">
                Direct Reports ({directReports.length})
              </h2>
              {directReports.length > 0 && (
                <div className="relative flex items-center">
                  <Search className="w-3 h-3 text-gray-300 absolute left-2 pointer-events-none" />
                  <input
                    type="text"
                    value={reportFilter}
                    onChange={(e) => {
                      setReportFilter(e.target.value);
                      setShowAllReports(false);
                    }}
                    placeholder="Filter reports…"
                    className="text-xs pl-6 pr-6 py-1 border border-gray-200 rounded outline-none placeholder-gray-300 w-44"
                  />
                  {reportFilter && (
                    <button
                      type="button"
                      aria-label="Clear filter"
                      onClick={() => setReportFilter('')}
                      className="absolute right-2"
                    >
                      <X className="w-3 h-3 text-gray-300 hover:text-gray-500" />
                    </button>
                  )}
                </div>
              )}
            </div>
            {filteredReports.length > 50 && !showAllReports && (
              <button
                type="button"
                onClick={() => setShowAllReports(true)}
                className="text-xs font-semibold text-[#00C97B] hover:text-[#00835A] transition-colors"
              >
                Show all {filteredReports.length}
              </button>
            )}
          </div>

          {directReports.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
              <div className="text-xs font-semibold text-gray-400">
                Individual Contributor — No direct reports
              </div>
              <div className="text-[10px] text-gray-300 mt-1">
                {current.firstName} {current.lastName} · {current.title}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {visibleReports.map((u) => (
                  <ReportCard key={u.id} user={u} onClick={() => drillDown(u)} />
                ))}
              </div>
              {filteredReports.length > 50 && !showAllReports && (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setShowAllReports(true)}
                    className="text-xs font-semibold text-[#00C97B] hover:text-[#00835A] transition-colors border border-[#00C97B]/30 rounded-md px-4 py-2"
                  >
                    Show all {filteredReports.length} reports
                  </button>
                </div>
              )}
              {showAllReports && filteredReports.length > 50 && (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setShowAllReports(false)}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Collapse
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
