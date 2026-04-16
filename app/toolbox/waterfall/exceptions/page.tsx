'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import { AlertTriangle, CheckCircle2, Loader2, Zap, ChevronRight } from 'lucide-react';
import { fmtMoney } from '@/lib/utils';

interface WfException {
  id: string;
  fundId: string;
  exceptionType: string;
  severity: string;
  title: string;
  description: string;
  impactAmount: number;
  recommendedFix: string;
  confidence: number;
  status: string;
  createdAt: string;
  fund: { id: string; name: string; shortName: string };
  actions: Array<{
    id: string;
    status: string;
    diuBatches: Array<{ id: string; batchRef: string; status: string }>;
  }>;
}

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  high: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  low: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
};

function SeverityBadge({ severity }: { severity: string }) {
  const sc = SEVERITY_COLORS[severity] ?? { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold border ${sc.bg} ${sc.text} ${sc.border} capitalize`}>
      {severity}
    </span>
  );
}

function ExceptionCard({
  exc,
  onGenerateDiu,
  generating,
}: {
  exc: WfException;
  onGenerateDiu: (id: string) => void;
  generating: string | null;
}) {
  const sc = SEVERITY_COLORS[exc.severity] ?? SEVERITY_COLORS.low;
  const hasDiu = exc.actions.some((a) => a.diuBatches.length > 0);
  const isGenerating = generating === exc.id;

  return (
    <div className={`bg-white rounded-xl border overflow-hidden ${sc.border}`}>
      <div className={`px-4 py-3 border-b ${sc.bg} ${sc.border} flex items-start gap-3`}>
        <SeverityBadge severity={exc.severity} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-900">{exc.title}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">
            {exc.fund.shortName} · {exc.exceptionType.replace(/_/g, ' ')} · Impact: {fmtMoney(exc.impactAmount)}
          </p>
        </div>
        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
          exc.status === 'open' ? 'bg-red-100 text-red-700' :
          exc.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
          'bg-emerald-100 text-emerald-700'
        } capitalize`}>
          {exc.status.replace('_', ' ')}
        </span>
      </div>
      <div className="px-4 py-3 space-y-2">
        <p className="text-xs text-gray-600 leading-relaxed">{exc.description}</p>
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5">
          <p className="text-[10px] font-semibold text-blue-700 mb-0.5">Recommended Fix</p>
          <p className="text-xs text-blue-600 leading-relaxed">{exc.recommendedFix}</p>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-gray-400 font-mono">
            Confidence: {(exc.confidence * 100).toFixed(0)}%
          </span>
          <div className="flex items-center gap-2">
            {hasDiu && (
              <Link
                href="/toolbox/waterfall/actions"
                className="text-[10px] font-semibold text-[#00835A] hover:underline"
              >
                View DIU Batch →
              </Link>
            )}
            {!hasDiu && exc.status !== 'resolved' && (
              <button
                onClick={() => onGenerateDiu(exc.id)}
                disabled={isGenerating}
                className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-white bg-[#00C97B] hover:bg-[#00A866] disabled:opacity-50 px-2.5 py-1 rounded-md transition-colors"
              >
                {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                Generate DIU
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExceptionsPage() {
  const [exceptions, setExceptions] = useState<WfException[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  async function loadExceptions() {
    const data = await fetch('/api/toolbox/waterfall/exceptions').then((r) => r.json());
    setExceptions(data);
    setLoading(false);
  }

  useEffect(() => { loadExceptions(); }, []);

  async function handleGenerateDiu(exceptionId: string) {
    setGenerating(exceptionId);
    try {
      await fetch('/api/toolbox/waterfall/diu/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exceptionId }),
      });
      await loadExceptions();
    } finally {
      setGenerating(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2 text-gray-400 text-xs">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading exceptions…
        </div>
      </div>
    );
  }

  const open = exceptions.filter((e) => e.status === 'open' || e.status === 'in_progress');
  const resolved = exceptions.filter((e) => e.status === 'resolved');
  const critical = open.filter((e) => e.severity === 'critical').length;
  const high = open.filter((e) => e.severity === 'high').length;
  const totalImpact = open.reduce((s, e) => s + e.impactAmount, 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Exceptions Console"
        subtitle="Open exceptions requiring investigation and correcting entries"
        breadcrumbs={[
          { label: 'Agentic Center' },
          { label: 'Toolbox', href: '/toolbox' },
          { label: 'Waterfall Engine', href: '/toolbox/waterfall' },
          { label: 'Exceptions' },
        ]}
        actions={
          <Link
            href="/toolbox/waterfall/actions"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-md transition-colors"
          >
            DIU Actions <ChevronRight className="w-3 h-3" />
          </Link>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard title="Open" value={String(open.length)} icon={<AlertTriangle className="w-4 h-4" />} color="red" />
        <MetricCard title="Critical" value={String(critical)} icon={<AlertTriangle className="w-4 h-4" />} color="red" />
        <MetricCard title="High" value={String(high)} icon={<AlertTriangle className="w-4 h-4" />} color="amber" />
        <MetricCard title="Total Impact" value={fmtMoney(totalImpact)} icon={<CheckCircle2 className="w-4 h-4" />} color="signal" />
      </div>

      {/* Open exceptions by severity */}
      {(['critical', 'high', 'medium', 'low'] as const).map((sev) => {
        const group = open.filter((e) => e.severity === sev);
        if (!group.length) return null;
        const sc = SEVERITY_COLORS[sev];
        return (
          <div key={sev}>
            <h3 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${sc.text} flex items-center gap-2`}>
              <span className={`inline-block w-2 h-2 rounded-full ${sc.bg.replace('50', '400').replace('bg-', 'bg-')}`} />
              {sev} · {group.length} exception{group.length > 1 ? 's' : ''}
            </h3>
            <div className="space-y-3">
              {group.map((exc) => (
                <ExceptionCard key={exc.id} exc={exc} onGenerateDiu={handleGenerateDiu} generating={generating} />
              ))}
            </div>
          </div>
        );
      })}

      {open.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-700">All clear</p>
          <p className="text-xs text-gray-400 mt-1">No open exceptions</p>
        </div>
      )}

      {/* Resolved */}
      {resolved.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Resolved · {resolved.length}</h3>
          <div className="space-y-2">
            {resolved.map((exc) => (
              <div key={exc.id} className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 flex items-center gap-3 opacity-60">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="text-xs text-gray-600">{exc.title}</span>
                <span className="text-[10px] text-gray-400 ml-auto">{exc.fund.shortName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
