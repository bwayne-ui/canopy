'use client';

import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import { FileText, Download, Clock, CheckCircle2 } from 'lucide-react';

const templates = [
  { name: 'Capital Call Notice', category: 'Notices', version: 'v3.0', lastUpdated: '2026-03-22', usageCount: 48, owner: 'Jason Cooper' },
  { name: 'Distribution Notice', category: 'Notices', version: 'v2.4', lastUpdated: '2026-02-15', usageCount: 32, owner: 'Jason Cooper' },
  { name: 'Quarterly Letter Template', category: 'Investor Relations', version: 'v4.1', lastUpdated: '2026-01-10', usageCount: 60, owner: 'Megan Moore' },
  { name: 'Board Deck Template', category: 'Governance', version: 'v2.0', lastUpdated: '2025-12-01', usageCount: 24, owner: 'Megan Moore' },
  { name: 'LPA Amendment Template', category: 'Legal', version: 'v1.3', lastUpdated: '2025-10-15', usageCount: 8, owner: 'Katherine Brooks' },
  { name: 'Side Letter Template', category: 'Legal', version: 'v2.1', lastUpdated: '2026-01-20', usageCount: 15, owner: 'Katherine Brooks' },
  { name: 'K-1 Cover Letter', category: 'Tax', version: 'v1.8', lastUpdated: '2026-03-01', usageCount: 45, owner: 'Diana Smith' },
  { name: 'Subscription Agreement', category: 'Onboarding', version: 'v3.5', lastUpdated: '2025-11-10', usageCount: 28, owner: 'Jessica Cruz' },
  { name: 'KYC Checklist', category: 'Compliance', version: 'v2.2', lastUpdated: '2026-02-28', usageCount: 52, owner: 'Sarah Garcia' },
  { name: 'Expense Allocation Memo', category: 'Fund Accounting', version: 'v1.5', lastUpdated: '2026-01-05', usageCount: 18, owner: 'Steven Wright' },
  { name: 'Valuation Summary Template', category: 'Valuations', version: 'v1.2', lastUpdated: '2025-09-15', usageCount: 12, owner: 'Daniel Foster' },
  { name: 'Wire Instructions Form', category: 'Operations', version: 'v4.0', lastUpdated: '2026-03-10', usageCount: 96, owner: 'Rebecca Sanders' },
];

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
    <div className="space-y-5">
      <PageHeader title="Templates" subtitle="Standardized document templates and forms" breadcrumbs={[{ label: 'Docs Vault', href: '/docs-vault' }, { label: 'Templates' }]} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="Total Templates" value={templates.length} icon={<FileText className="w-4 h-4" />} color="teal" />
        <MetricCard title="Total Uses" value={templates.reduce((s, t) => s + t.usageCount, 0)} icon={<Download className="w-4 h-4" />} color="green" />
        <MetricCard title="Categories" value={new Set(templates.map(t => t.category)).size} icon={<CheckCircle2 className="w-4 h-4" />} color="signal" />
        <MetricCard title="Avg Version" value={`v${(templates.reduce((s, t) => s + parseFloat(t.version.slice(1)), 0) / templates.length).toFixed(1)}`} icon={<Clock className="w-4 h-4" />} color="teal" />
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {templates.map((t, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between mb-2">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${categoryColors[t.category] || 'bg-gray-100 text-gray-600'}`}>{t.category}</span>
              <span className="font-mono text-[10px] text-gray-400">{t.version}</span>
            </div>
            <h4 className="text-xs font-semibold text-gray-900 mb-1">{t.name}</h4>
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>{t.owner}</span>
              <span>{t.usageCount} uses</span>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[10px] text-gray-400">Updated {t.lastUpdated}</span>
              <button className="text-[10px] font-medium text-[#00C97B] hover:text-[#00A866] transition-colors">Use Template</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
