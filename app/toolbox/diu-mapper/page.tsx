'use client';

import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import { Shuffle, Plus, ArrowRight, FileText, CheckCircle2, Layers } from 'lucide-react';

export default function DiuMapperPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="DIU Mapper"
        subtitle="Multi-step data onboarding wizard for normalizing, mapping, and validating investor data for Investran import"
        breadcrumbs={[
          { label: 'Agentic Center' },
          { label: 'Toolbox', href: '/toolbox' },
          { label: 'DIU Mapper' },
        ]}
        actions={
          <Link
            href="/toolbox/diu-mapper/onboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#00C97B] hover:bg-[#00A866] px-3 py-1.5 rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New Onboarding
          </Link>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <MetricCard title="Steps" value="6" icon={<Layers className="w-4 h-4" />} color="teal" />
        <MetricCard title="Supported Formats" value="XLSX, CSV" icon={<FileText className="w-4 h-4" />} color="signal" />
        <MetricCard title="Output" value="DIU Excel" icon={<CheckCircle2 className="w-4 h-4" />} color="green" />
      </div>

      {/* What it does */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">6-Step Onboarding Wizard</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { n: 1, label: 'Upload', desc: 'Drop any Excel or CSV file — wide or long format auto-detected' },
            { n: 2, label: 'Normalise', desc: 'Preview parsed data, fix column headers, handle wide-format unpivoting' },
            { n: 3, label: 'Transform', desc: 'Filter empty rows, deduplicate, apply business rule transforms' },
            { n: 4, label: 'Map', desc: 'Map source columns to the standard DIU Investran schema' },
            { n: 5, label: 'Validate', desc: 'Required field checks, date formats, debit/credit, currency codes' },
            { n: 6, label: 'Export', desc: 'Download the validated DIU Excel file for Investran import' },
          ].map((step) => (
            <div key={step.n} className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="w-5 h-5 rounded-full bg-[#00C97B]/10 text-[#00835A] flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                {step.n}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900">{step.label}</p>
                <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <Link
            href="/toolbox/diu-mapper/onboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#00C97B] hover:bg-[#00A866] px-4 py-2 rounded-md transition-colors"
          >
            <Shuffle className="w-3.5 h-3.5" /> Start New Onboarding <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
