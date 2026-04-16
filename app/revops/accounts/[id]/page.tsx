'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Globe,
  Linkedin,
  Mail,
  Phone,
  Users,
  FileText,
  Calendar,
  ArrowLeft,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { fmtMoney, toNum } from '@/lib/utils';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Account {
  id: string;
  accountId: string;
  name: string;
  industry: string | null;
  hqCity: string | null;
  hqState: string | null;
  region: string | null;
  aumMm: number | null;
  status: string;
  ownerName: string | null;
  website: string | null;
  domain: string | null;
  linkedInUrl: string | null;
  contacts: Contact[];
  opportunities: Opportunity[];
  activities: Activity[];
  contracts: Contract[];
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  title: string | null;
  email: string | null;
  contactType: string | null;
  isPrimary: boolean;
}

interface Opportunity {
  id: string;
  opportunityId: string;
  name: string;
  stage: string;
  amount: number | null;
  closeDate: string | null;
  probability: number | null;
  ownerName: string | null;
}

interface Activity {
  id: string;
  activityDate: string | null;
  type: string;
  subject: string;
  description: string | null;
  ownerName: string | null;
}

interface Contract {
  id: string;
  contractId: string;
  name: string;
  status: string;
  annualValue: number | null;
  billingFrequency: string | null;
  startDate: string | null;
  endDate: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  return d.slice(0, 10);
}

function activityIcon(type: string) {
  const t = (type ?? '').toLowerCase();
  if (t.includes('call') || t.includes('phone')) return <Phone className="w-3.5 h-3.5" />;
  if (t.includes('email') || t.includes('mail')) return <Mail className="w-3.5 h-3.5" />;
  if (t.includes('meeting') || t.includes('meet')) return <Users className="w-3.5 h-3.5" />;
  return <FileText className="w-3.5 h-3.5" />;
}

type Tab = 'opportunities' | 'contacts' | 'activities' | 'contracts';

const TABS: { key: Tab; label: string }[] = [
  { key: 'opportunities', label: 'Opportunities' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'activities', label: 'Activities' },
  { key: 'contracts', label: 'Contracts' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('opportunities');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/revops/accounts/${id}`)
      .then((r) => r.json())
      .then((res) => setAccount(res ?? null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-gray-400 text-xs">Loading account…</div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="text-center py-16">
        <p className="text-xs text-gray-400">Account not found.</p>
        <Link
          href="/revops/accounts"
          className="mt-3 inline-flex items-center gap-1 text-xs text-[#00C97B] hover:underline"
        >
          <ArrowLeft className="w-3 h-3" /> Back to Accounts
        </Link>
      </div>
    );
  }

  const opps: Opportunity[] = account.opportunities ?? [];
  const contacts: Contact[] = account.contacts ?? [];
  const activities: Activity[] = account.activities ?? [];
  const contracts: Contract[] = account.contracts ?? [];

  return (
    <div>
      <PageHeader
        title={account.name}
        breadcrumbs={[
          { label: 'Revenue Ops', href: '/revops' },
          { label: 'Accounts', href: '/revops/accounts' },
          { label: account.name },
        ]}
        actions={
          <Link
            href="/revops/accounts"
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-md"
          >
            <ArrowLeft className="w-3 h-3" /> Back
          </Link>
        }
      />

      {/* Hero Card */}
      <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-l-[#00C97B] mb-4 flex flex-col sm:flex-row gap-4">
        {/* Left */}
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm font-bold text-gray-900">{account.name}</p>
          {account.industry && (
            <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700">
              {account.industry}
            </span>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
            {account.region && (
              <span className="text-xs text-gray-500 font-medium">{account.region}</span>
            )}
            {account.aumMm != null && (
              <span className="text-xs font-semibold text-gray-700 font-mono">
                {`$${Math.round(toNum(account.aumMm))}M`} AUM
              </span>
            )}
            {account.ownerName && (
              <span className="text-xs text-gray-500">
                Owner: <span className="font-semibold text-gray-700">{account.ownerName}</span>
              </span>
            )}
          </div>
          {account.website && (
            <a
              href={account.website.startsWith('http') ? account.website : `https://${account.website}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#00C97B] hover:underline mt-0.5"
            >
              <Globe className="w-3 h-3" />
              {account.website}
            </a>
          )}
        </div>

        {/* Right */}
        <div className="flex flex-col gap-1 text-right min-w-[160px]">
          <div className="flex justify-end">
            <StatusBadge status={account.status} />
          </div>
          {(account.hqCity || account.hqState) && (
            <p className="text-xs text-gray-500">
              {[account.hqCity, account.hqState].filter(Boolean).join(', ')}
            </p>
          )}
          {account.domain && (
            <p className="text-xs text-gray-400 font-mono">{account.domain}</p>
          )}
          {account.linkedInUrl && (
            <a
              href={account.linkedInUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-end gap-1 text-xs text-blue-600 hover:underline"
            >
              <Linkedin className="w-3 h-3" />
              LinkedIn
            </a>
          )}
        </div>
      </div>

      {/* Tab Strip */}
      <div className="flex items-center gap-0 border-b border-gray-200 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-[#00C97B] text-[#00835A]'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            {tab.label}
            {tab.key === 'opportunities' && opps.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5 font-semibold">
                {opps.length}
              </span>
            )}
            {tab.key === 'contacts' && contacts.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5 font-semibold">
                {contacts.length}
              </span>
            )}
            {tab.key === 'activities' && activities.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5 font-semibold">
                {activities.length}
              </span>
            )}
            {tab.key === 'contracts' && contracts.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5 font-semibold">
                {contracts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Opportunities Tab ── */}
      {activeTab === 'opportunities' && (
        <div>
          {opps.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No opportunities found.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {opps.map((opp) => (
                <Link
                  key={opp.id}
                  href={`/revops/opportunities/${opp.id}`}
                  className={`bg-white rounded-lg shadow-sm border border-gray-100 border-l-4 ${
                    STAGE_BORDER[opp.stage] ?? 'border-l-gray-300'
                  } p-3 hover:shadow-md transition-shadow block`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-xs font-semibold text-gray-900 leading-snug">{opp.name}</p>
                    <span
                      className={`shrink-0 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${stageBadgeClass(
                        opp.stage,
                      )}`}
                    >
                      {opp.stage}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    {opp.amount != null ? (
                      <span className="text-xs font-semibold text-emerald-600 font-mono">
                        {fmtMoney(toNum(opp.amount))}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                    <span className="text-[10px] text-gray-400 font-mono">{fmtDate(opp.closeDate)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Contacts Tab ── */}
      {activeTab === 'contacts' && (
        <div>
          {contacts.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No contacts found.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 flex flex-col gap-1.5"
                >
                  <div className="flex items-center gap-2.5">
                    {/* Initials Avatar */}
                    <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-[10px] font-semibold shrink-0">
                      {initials(`${contact.firstName} ${contact.lastName}`)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 leading-tight truncate">
                        {contact.firstName} {contact.lastName}
                      </p>
                      {contact.title && (
                        <p className="text-[10px] text-gray-400 truncate">{contact.title}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 items-center">
                    {contact.contactType && (
                      <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700">
                        {contact.contactType}
                      </span>
                    )}
                    {contact.isPrimary && (
                      <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                        Primary
                      </span>
                    )}
                  </div>

                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-1 text-[10px] text-[#00C97B] hover:underline truncate"
                    >
                      <Mail className="w-3 h-3 shrink-0" />
                      {contact.email}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Activities Tab ── */}
      {activeTab === 'activities' && (
        <div>
          {activities.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No activities found.</p>
          ) : (
            <div className="relative ml-2">
              {/* Vertical line */}
              <div className="absolute left-3.5 top-0 bottom-0 w-px bg-gray-200" />

              <div className="flex flex-col gap-4">
                {activities.map((act) => (
                  <div key={act.id} className="relative flex gap-3 pl-10">
                    {/* Icon bubble */}
                    <div className="absolute left-0 top-0 w-7 h-7 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500">
                      {activityIcon(act.type)}
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <p className="text-xs font-semibold text-gray-900">{act.subject}</p>
                        <span className="text-[10px] text-gray-400 font-mono shrink-0">
                          {fmtDate(act.activityDate)}
                        </span>
                      </div>
                      {act.description && (
                        <p className="text-[10px] text-gray-500 leading-relaxed">{act.description}</p>
                      )}
                      {act.ownerName && (
                        <p className="text-[10px] text-gray-400 mt-1">{act.ownerName}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Contracts Tab ── */}
      {activeTab === 'contracts' && (
        <div>
          {contracts.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No contracts found.</p>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200">
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
                      Contract ID
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
                      Name
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
                      Status
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                      Annual Value
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
                      Billing
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
                      Period
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((c, i) => (
                    <tr
                      key={c.id}
                      className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${
                        i === contracts.length - 1 ? 'border-b-0' : ''
                      }`}
                    >
                      <td className="px-3 py-2 font-mono text-gray-500">{c.contractId}</td>
                      <td className="px-3 py-2 font-semibold text-gray-900">{c.name}</td>
                      <td className="px-3 py-2">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-emerald-600 font-semibold">
                        {c.annualValue != null ? fmtMoney(toNum(c.annualValue)) : '—'}
                      </td>
                      <td className="px-3 py-2 text-gray-500">{c.billingFrequency || '—'}</td>
                      <td className="px-3 py-2 font-mono text-[10px] text-gray-500 whitespace-nowrap">
                        {fmtDate(c.startDate)}
                        {c.startDate && c.endDate ? ' – ' : ''}
                        {fmtDate(c.endDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
