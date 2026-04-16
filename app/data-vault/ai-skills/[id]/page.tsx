'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Cpu, Activity, Code2 } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';

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

function ScoreBar({ score }: { score: number | null }) {
  if (score == null) return <span className="text-gray-300 text-xs">—</span>;
  const pct = Math.round(score);
  const color = pct >= 90 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-700 font-semibold">{pct}%</span>
    </div>
  );
}

const TABS = ['Overview', 'Performance', 'Technical'] as const;
type Tab = typeof TABS[number];

export default function AISkillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('Overview');

  useEffect(() => {
    fetch(`/api/ai-skills/${id}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-16 text-gray-400">Loading AI skill…</div>;
  if (!data?.skill) return <div className="text-center py-16 text-red-400">AI Skill not found.</div>;

  const s = data.skill;

  return (
    <div>
      <PageHeader
        title={s.name}
        subtitle={`${s.category} · ${s.model}`}
        breadcrumbs={[
          { label: 'Data Vault', href: '/data-vault' },
          { label: 'AI Skills', href: '/data-vault/ai-skills' },
          { label: s.name },
        ]}
        actions={
          <Link href="/data-vault/ai-skills" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-md">
            <ArrowLeft className="w-3 h-3" /> Back
          </Link>
        }
      />

      <div className="flex items-center gap-3 bg-white rounded-lg shadow-sm px-4 py-2.5 mb-3">
        <StatusBadge status={s.status} />
        <span className="text-xs text-gray-500">{s.category}</span>
        <div className="h-3 w-px bg-gray-200" />
        <span className="text-xs text-gray-500">{s.model}</span>
        {s.accuracy != null && (
          <><div className="h-3 w-px bg-gray-200" />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-500">Accuracy:</span>
            <ScoreBar score={s.accuracy} />
          </div></>
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

      {tab === 'Overview' && (
        <div className="bg-white rounded-lg shadow-sm p-4 max-w-xl">
          <FieldSection title="Skill Details">
            <FieldRow label="Name" value={s.name} />
            <FieldRow label="Category" value={s.category} />
            <FieldRow label="Status" value={s.status} />
          </FieldSection>
          <FieldSection title="Description">
            <p className="text-xs text-gray-700">{s.description}</p>
          </FieldSection>
        </div>
      )}

      {tab === 'Performance' && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{s.runCount?.toLocaleString()}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Total Runs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{s.avgProcessingTime ?? '—'}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Avg Processing Time</div>
            </div>
            <div className="text-center">
              <ScoreBar score={s.accuracy} />
              <div className="text-[10px] text-gray-500 mt-0.5">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-xs font-semibold text-gray-700">{s.lastRun ? s.lastRun.slice(0, 10) : '—'}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Last Run</div>
            </div>
          </div>
        </div>
      )}

      {tab === 'Technical' && (
        <div className="bg-white rounded-lg shadow-sm p-4 max-w-xl">
          <FieldSection title="Technical Specs">
            <FieldRow label="Model" value={s.model} />
            <FieldRow label="Input Type" value={s.inputType} />
            <FieldRow label="Output Type" value={s.outputType} />
          </FieldSection>
        </div>
      )}
    </div>
  );
}
