'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import ActivityFeed from '@/components/ActivityFeed';

function FieldRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-start py-1.5 border-b border-gray-50 last:border-0">
      <span className="w-44 flex-shrink-0 text-xs text-gray-500 font-medium">{label}</span>
      <span className="text-xs text-gray-800 font-medium">{value ?? '—'}</span>
    </div>
  );
}

function FieldSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{title}</div>
      {children}
    </div>
  );
}

function StatBox({ label, value, color = 'teal' }: { label: string; value: string; color?: string }) {
  const colors: Record<string, string> = {
    teal: 'bg-teal-50 border-teal-100', green: 'bg-emerald-50 border-emerald-100',
    blue: 'bg-blue-50 border-blue-100', amber: 'bg-amber-50 border-amber-100',
  };
  return (
    <div className={`rounded-lg border p-3 ${colors[color] ?? colors.teal}`}>
      <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

const TABS = ['Profile', 'Capital Account', 'Compliance & Tax'] as const;
type Tab = typeof TABS[number];

export default function InvestorDetailPage() {
  const { investorId } = useParams<{ investorId: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('Profile');

  useEffect(() => {
    fetch(`/api/investors/${investorId}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [investorId]);

  if (loading) return <div className="text-center py-16 text-gray-400">Loading investor…</div>;
  if (!data?.investor) return <div className="text-center py-16 text-red-400">Investor not found.</div>;

  const inv = data.investor;
  const recentActivity: any[] = data.recentActivity ?? [];

  return (
    <div>
      <PageHeader
        title={inv.name}
        subtitle={`${inv.investorType} · ${inv.domicile}`}
        breadcrumbs={[
          { label: 'Data Vault', href: '/data-vault' },
          { label: 'Investors', href: '/data-vault/investors' },
          { label: inv.investorId },
        ]}
        actions={
          <Link href="/data-vault/investors" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-md">
            <ArrowLeft className="w-3 h-3" /> Back
          </Link>
        }
      />

      <div className="flex items-center gap-3 bg-white rounded-lg shadow-sm px-4 py-2.5 mb-3">
        <StatusBadge status={inv.status} />
        <span className="text-xs text-gray-500">{inv.investorId}</span>
        {inv.entityName && (
          <><div className="h-3 w-px bg-gray-200" />
          <span className="text-xs text-gray-500">Entity: <Link href={`/data-vault/entities/${inv.entityName}`} className="text-[#00C97B] font-semibold hover:underline">{inv.entityName}</Link></span></>
        )}
      </div>

      <div className="flex gap-1 mb-3 bg-white rounded-lg shadow-sm p-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${tab === t ? 'bg-[#00C97B]/10 text-[#00C97B]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Profile' && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-2 items-start">
          <div className="xl:col-span-3 bg-white rounded-lg shadow-sm p-4 max-w-xl">
            <FieldSection title="Investor Details">
              <FieldRow label="Investor ID" value={inv.investorId} />
              <FieldRow label="Name" value={inv.name} />
              <FieldRow label="Type" value={inv.investorType} />
              <FieldRow label="Domicile" value={inv.domicile} />
              <FieldRow label="Status" value={inv.status} />
            </FieldSection>
            <FieldSection title="Contact">
              <FieldRow label="Contact Name" value={inv.contactName} />
              <FieldRow label="Contact Email" value={inv.contactEmail} />
            </FieldSection>
            {inv.entityName && (
              <FieldSection title="Fund">
                <div className="py-1.5">
                  <span className="text-xs text-gray-500 font-medium w-44 inline-block">Entity</span>
                  <Link href={`/data-vault/entities/${inv.entityName}`} className="text-xs text-[#00C97B] font-semibold hover:underline">{inv.entityName}</Link>
                </div>
              </FieldSection>
            )}
          </div>
          <div className="space-y-2">
            {recentActivity.length > 0 && <ActivityFeed items={recentActivity} />}
          </div>
        </div>
      )}

      {tab === 'Capital Account' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox label="Commitment" value={`$${(inv.commitmentMm ?? 0).toFixed(2)}MM`} color="blue" />
            <StatBox label="Called Capital" value={`$${(inv.calledCapitalMm ?? 0).toFixed(2)}MM`} color="teal" />
            <StatBox label="Distributed" value={`$${(inv.distributedMm ?? 0).toFixed(2)}MM`} color="green" />
            <StatBox label="Current NAV" value={`$${(inv.navMm ?? 0).toFixed(2)}MM`} color="amber" />
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 max-w-sm">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Unfunded</div>
            <div className="text-2xl font-bold text-gray-900">
              ${Math.max(0, (inv.commitmentMm ?? 0) - (inv.calledCapitalMm ?? 0)).toFixed(2)}MM
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">Commitment − Called Capital</div>
          </div>
        </div>
      )}

      {tab === 'Compliance & Tax' && (
        <div className="bg-white rounded-lg shadow-sm p-4 max-w-xl">
          <FieldSection title="Compliance">
            <FieldRow label="Tax Exempt" value={inv.taxExempt ? 'Yes' : 'No'} />
            <FieldRow label="ERISA" value={inv.erisa ? 'Yes' : 'No'} />
            <FieldRow label="K-1 Status" value={inv.k1Status} />
          </FieldSection>
        </div>
      )}
    </div>
  );
}
