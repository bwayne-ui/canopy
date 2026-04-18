'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';

interface Attempt {
  id: string;
  createdAt: string;
  emailLower: string;
  domain: string;
  domainAllowed: boolean;
  outcome: string;
  ipAddress: string | null;
  userAgent: string | null;
}

interface Summary {
  codesSent: { d7: number; d30: number; all: number };
  domainRejected: { d7: number; d30: number; all: number };
  uniqueVerifiedEmails: number;
}

const OUTCOME_STYLE: Record<string, string> = {
  code_sent: 'bg-[#eff6ff] text-[#2563eb]',
  code_verified: 'bg-[#F0FBF6] text-[#00AA6C]',
  code_invalid: 'bg-[#fff7ed] text-[#c2410c]',
  code_expired: 'bg-[#fffbeb] text-[#b45309]',
  domain_rejected: 'bg-[#fef2f2] text-[#b91c1c]',
  pending_missing: 'bg-[#f3f4f6] text-[#6b7280]',
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/login-log')
      .then((r) => r.json())
      .then((d) => {
        setRecent(d.recent ?? []);
        setSummary(d.summary ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Login Log"
        subtitle="Access-gate activity: codes sent, verifications, and rejected emails."
        breadcrumbs={[{ label: 'Admin' }, { label: 'Login Log' }]}
      />

      {loading ? (
        <div className="text-center py-12 text-xs text-[#9ca3af]">Loading…</div>
      ) : (
        <>
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <StatCard label="Codes sent · 7d" value={summary.codesSent.d7} sub={`${summary.codesSent.d30} in 30d · ${summary.codesSent.all} all-time`} />
              <StatCard label="Rejected (non-JS) · 7d" value={summary.domainRejected.d7} sub={`${summary.domainRejected.d30} in 30d · ${summary.domainRejected.all} all-time`} />
              <StatCard label="Unique verified users" value={summary.uniqueVerifiedEmails} sub="@junipersquare.com" />
              <StatCard label="Recent events" value={recent.length} sub="last 200" />
            </div>
          )}

          <div className="bg-white rounded-[14px] border border-[#e5e7eb] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-[#f3f4f6] text-[#6b7280]">
                <tr>
                  <th className="text-left font-semibold px-3 py-2">When</th>
                  <th className="text-left font-semibold px-3 py-2">Email</th>
                  <th className="text-left font-semibold px-3 py-2">Domain</th>
                  <th className="text-left font-semibold px-3 py-2">Outcome</th>
                  <th className="text-left font-semibold px-3 py-2">IP</th>
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
                    <td className="px-3 py-2 font-mono text-[10px] text-[#6b7280]">{a.domain || '—'}</td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${OUTCOME_STYLE[a.outcome] ?? 'bg-[#f3f4f6] text-[#6b7280]'}`}>
                        {a.outcome}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-[10px] text-[#6b7280]">{a.ipAddress ?? '—'}</td>
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
