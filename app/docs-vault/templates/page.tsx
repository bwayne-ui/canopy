'use client';

import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import { FileText, Download, Clock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { templates } from '@/lib/docs-vault-data';

const categoryColors: Record<string, string> = {
  Notices: 'bg-blue-50 text-blue-700',
  'Investor Relations': 'bg-indigo-50 text-indigo-700',
  Governance: 'bg-purple-50 text-purple-700',
  Legal: 'bg-amber-50 text-amber-700',
  Tax: 'bg-emerald-50 text-emerald-700',
  Onboarding: 'bg-teal-50 text-teal-700',
  Compliance: 'bg-red-50 text-red-700',
  'Fund Accounting': 'bg-cyan-50 text-cyan-700',
  Valuations: 'bg-orange-50 text-orange-700',
  Operations: 'bg-gray-100 text-gray-700',
};

export default function TemplatesPage() {
  return (
    <div className="space-y-3">
      <PageHeader title="Templates" subtitle="Standardized document templates and forms" breadcrumbs={[{ label: 'Document Library', href: '/docs-vault' }, { label: 'Templates' }]} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
        <MetricCard title="Total Templates" value={templates.length} icon={<FileText className="w-4 h-4" />} color="teal" />
        <MetricCard title="Total Uses" value={templates.reduce((s, t) => s + t.usageCount, 0)} icon={<Download className="w-4 h-4" />} color="green" />
        <MetricCard title="Categories" value={new Set(templates.map(t => t.category)).size} icon={<CheckCircle2 className="w-4 h-4" />} color="signal" />
        <MetricCard title="Avg Version" value={`v${(templates.reduce((s, t) => s + parseFloat(t.version.slice(1)), 0) / templates.length).toFixed(1)}`} icon={<Clock className="w-4 h-4" />} color="teal" />
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {templates.map((t) => (
          <Link key={t.id} href={`/docs-vault/templates/${t.id}`} className="block group">
            <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow duration-200 hover:border-[#00C97B] border border-transparent">
              <div className="flex items-start justify-between mb-2">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${categoryColors[t.category] || 'bg-gray-100 text-gray-600'}`}>{t.category}</span>
                <span className="text-[10px] text-gray-400">{t.version}</span>
              </div>
              <h4 className="text-xs font-semibold text-gray-900 group-hover:text-[#00C97B] mb-1 transition-colors">{t.name}</h4>
              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <span>{t.owner}</span>
                <span>{t.usageCount} uses</span>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[10px] text-gray-400">Updated {t.lastUpdated}</span>
                <span className="text-[10px] font-medium text-[#00C97B]">View →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
