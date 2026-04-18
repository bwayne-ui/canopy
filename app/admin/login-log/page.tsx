'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';

interface Attempt {
  id: string;
  createdAt: string;
  emailLower: string;
  outcome: string;
  ipAddress: string | null;
  userAgent: string | null;
}

interface UserStat {
  username: string;
  logins: number;
  uniqueIpCount: number;
  lastLogin: string;
  flagged: boolean;
}

interface Summary {
  loginSuccess: { d7: number; d30: number; all: number };
  loginFailed: { d7: number; d30: number; all: number };
  uniqueUsers: number;
  avgUniqueIps: number;
}

const OUTCOME_STYLE: Record<string, string> = {
  login_success: 'bg-[#F0FBF6] text-[#00AA6C]',
  login_failed: 'bg-[#fef2f2] text-[#b91c1c]',
};

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-[14px] border border-[#e5e7eb] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4">
      <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1">{label}</div>
      <div className="text-2xl font-bold text-[#1a1a1a]">{value}</div>
      {sub && <div className="text-[10px] text-[#6b7280] mt-0.5">{sub}</div>}
    </div>
  );
}

export default function LoginLogPage() {
  const [recent, setRecent] = useState<Attempt[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [userStats, setUserStats] = useState<UserStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/login-log')
      .then((r) => r.json())
      .then((d) => {
        setRecent(d.recent ?? []);
        setSummary(d.summary ?? null);
        setUserStats(d.userStats ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Login Log"
        subtitle="Successful and failed sign-ins. Flags users who sign in from an unusually high number of IPs."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Login Log' }]}
      />

      {loading ? (
        <div className="text-center py-12 text-xs text-[#9ca3af]">Loading…</div>
      ) : (
        <>
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <StatCard label="Successful · 7d" value={summary.loginSuccess.d7} sub={`${summary.loginSuccess.d30} in 30d · ${summary.loginSuccess.all} all-time`} />
              <StatCard label="Failed · 7d" value={summary.loginFailed.d7} sub={`${summary.loginFailed.d30} in 30d · ${summary.loginFailed.all} all-time`} />
              <StatCard label="Unique users" value={summary.uniqueUsers} sub="Distinct usernames used" />
              <StatCard label="Avg IPs / user" value={summary.avgUniqueIps} sub="Sharing signal: high variance" />
            </div>
          )}

          {userStats.length > 0 && (
            <div className="bg-white rounded-[14px] border border-[#e5e7eb] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden mb-4">
              <div className="px-3 py-2 bg-[#f3f4f6] text-[10px] font-bold text-[#6b7280] uppercase tracking-widest">
                Users & IP spread
              </div>
              <table className="w-full text-xs">
                <thead className="bg-[#fafafa] text-[#6b7280]">
                  <tr>
                    <th className="text-left font-semibold px-3 py-2">Username</th>
                    <th className="text-left font-semibold px-3 py-2">Logins</th>
                    <th className="text-left font-semibold px-3 py-2">Unique IPs</th>
                    <th className="text-left font-semibold px-3 py-2">Last login</th>
                    <th className="text-left font-semibold px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  {userStats.map((u) => (
                    <tr key={u.username} className={u.flagged ? 'bg-[#fffbeb]' : 'hover:bg-[#FAFAFA]'}>
                      <td className="px-3 py-2 font-semibold text-[#1a1a1a]">{u.username}</td>
                      <td className="px-3 py-2 font-mono text-[10px] text-[#6b7280]">{u.logins}</td>
                      <td className="px-3 py-2 font-mono text-[10px] text-[#1a1a1a]">{u.uniqueIpCount}</td>
                      <td className="px-3 py-2 font-mono text-[10px] text-[#6b7280]">{new Date(u.lastLogin).toLocaleString()}</td>
                      <td className="px-3 py-2">
                        {u.flagged ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#fffbeb] text-[#b45309]">
                            Possible sharing
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#9ca3af]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="bg-white rounded-[14px] border border-[#e5e7eb] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-3 py-2 bg-[#f3f4f6] text-[10px] font-bold text-[#6b7280] uppercase tracking-widest">
              Recent events (last 200)
            </div>
            <table className="w-full text-xs">
              <thead className="bg-[#fafafa] text-[#6b7280]">
                <tr>
                  <th className="text-left font-semibold px-3 py-2">When</th>
                  <th className="text-left font-semibold px-3 py-2">Username</th>
                  <th className="text-left font-semibold px-3 py-2">Outcome</th>
                  <th className="text-left font-semibold px-3 py-2">IP</th>
                  <th className="text-left font-semibold px-3 py-2">User agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {recent.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-[#9ca3af]">No attempts logged yet.</td></tr>
                )}
                {recent.map((a) => (
                  <tr key={a.id} className="hover:bg-[#FAFAFA]">
                    <td className="px-3 py-2 font-mono text-[10px] text-[#6b7280]">{new Date(a.createdAt).toLocaleString()}</td>
                    <td className="px-3 py-2 text-[#1a1a1a]">{a.emailLower || <span className="text-[#9ca3af]">—</span>}</td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${OUTCOME_STYLE[a.outcome] ?? 'bg-[#f3f4f6] text-[#6b7280]'}`}>
                        {a.outcome}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-[10px] text-[#6b7280]">{a.ipAddress ?? '—'}</td>
                    <td className="px-3 py-2 font-mono text-[10px] text-[#9ca3af] truncate max-w-[280px]">{a.userAgent ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
