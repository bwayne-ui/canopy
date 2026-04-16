'use client';

import { useRef, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import {
  GitMerge, Upload, ChevronDown, ChevronRight, Download,
  CheckCircle2, AlertCircle, Clock, FileText, Loader2,
} from 'lucide-react';
import type { ReconResult, MatchedResult, UnplacedCredit, PreviouslyFunded, StillOutstanding } from '@/lib/tools/reconciliation';

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

const matchedCols: Column[] = [
  {
    key: 'investor',
    label: 'Investor',
    sortable: true,
    render: (v: string) => <span className="font-semibold text-gray-900">{v}</span>,
  },
  {
    key: 'expectedAmount',
    label: 'Expected',
    sortable: true,
    render: (v: number) => (
      <span className="font-mono">${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    ),
  },
  {
    key: 'matchedAmount',
    label: 'Matched',
    sortable: true,
    render: (v: number) => (
      <span className="font-mono">${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    ),
  },
  { key: 'date', label: 'Date', sortable: true },
  {
    key: 'description',
    label: 'Description',
    render: (v: string) => <span className="text-gray-600 truncate max-w-xs block">{v}</span>,
  },
  {
    key: 'confidence',
    label: 'Confidence',
    sortable: true,
    render: (v: number) => {
      const color =
        v >= 80 ? 'bg-emerald-100 text-emerald-700' : v >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500';
      return (
        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold font-mono ${color}`}>
          {v.toFixed(1)}%
        </span>
      );
    },
  },
  {
    key: 'matchMethod',
    label: 'Method',
    sortable: true,
    render: (v: string) => {
      const color =
        v === 'strict' ? 'bg-emerald-50 text-emerald-700' : v === 'relaxed' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700';
      return (
        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${color}`}>
          {v}
        </span>
      );
    },
  },
];

const unplacedCols: Column[] = [
  { key: 'date', label: 'Date', sortable: true },
  { key: 'description', label: 'Description' },
  {
    key: 'amount',
    label: 'Amount',
    sortable: true,
    render: (v: number) => (
      <span className="font-mono">${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    ),
  },
];

const fundedCols: Column[] = [
  { key: 'investor', label: 'Investor', sortable: true },
  { key: 'positionId', label: 'Position ID', render: (v: string) => <span className="font-mono text-[10px] text-gray-500">{v}</span> },
  {
    key: 'amount',
    label: 'Amount',
    sortable: true,
    render: (v: number) => (
      <span className="font-mono">${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    ),
  },
  { key: 'notes', label: 'Notes', render: (v: string) => <span className="text-gray-500">{v}</span> },
];

const outstandingCols: Column[] = [
  { key: 'investor', label: 'Investor', sortable: true, render: (v: string) => <span className="font-semibold text-gray-900">{v}</span> },
  { key: 'positionId', label: 'Position ID', render: (v: string) => <span className="font-mono text-[10px] text-gray-500">{v}</span> },
  {
    key: 'expectedAmount',
    label: 'Expected Amount',
    sortable: true,
    render: (v: number) => (
      <span className="font-mono text-red-600">${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    ),
  },
];

// ---------------------------------------------------------------------------
// Collapsible result section
// ---------------------------------------------------------------------------

function ResultSection({
  title,
  count,
  color,
  icon,
  children,
}: {
  title: string;
  count: number;
  color: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
          {icon}
        </div>
        <span className="text-sm font-semibold text-gray-900 flex-1">{title}</span>
        <span className="text-xs font-mono text-gray-500 mr-2">{count} items</span>
        {open ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
      </button>
      {open && <div className="border-t border-gray-100">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// File drop zone
// ---------------------------------------------------------------------------

function FileInput({
  label,
  hint,
  file,
  onChange,
}: {
  label: string;
  hint: string;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1.5">{label}</label>
      <div
        onClick={() => ref.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) onChange(f);
        }}
        className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
          file ? 'border-[#00C97B] bg-[#F0FBF6]' : 'border-gray-200 hover:border-[#00C97B]/50'
        }`}
      >
        <input
          ref={ref}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <div className="flex items-center justify-center gap-2 text-xs text-[#00835A]">
            <FileText className="w-4 h-4" />
            <span className="font-semibold">{file.name}</span>
            <span className="text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-400">
            <Upload className="w-5 h-5" />
            <span className="text-xs font-medium">Drop CSV here or click to browse</span>
            <span className="text-[10px]">{hint}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab helpers
// ---------------------------------------------------------------------------

type Tab = 'instructions' | 'how-it-works' | 'run';

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
        active ? 'bg-[#1B3A4B] text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CapCallReconPage() {
  const [tab, setTab] = useState<Tab>('run');
  const [ccFile, setCcFile] = useState<File | null>(null);
  const [bankFile, setBankFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReconResult | null>(null);
  const [downloading, setDownloading] = useState(false);

  async function runRecon() {
    if (!ccFile || !bankFile) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const fd = new FormData();
    fd.append('capitalCallFile', ccFile);
    fd.append('bankStatementFile', bankFile);

    try {
      const res = await fetch('/api/toolbox/cap-call-recon/reconcile', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Unknown error');
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function downloadExcel() {
    if (!result) return;
    setDownloading(true);
    try {
      const res = await fetch('/api/toolbox/cap-call-recon/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recon_results_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Capital Call Recon"
        subtitle="Reconcile capital call obligations against incoming bank wire transfers"
        breadcrumbs={[
          { label: 'Agentic Center' },
          { label: 'Toolbox', href: '/toolbox' },
          { label: 'Capital Call Recon' },
        ]}
        actions={
          <div className="flex items-center gap-1">
            <TabButton active={tab === 'instructions'} onClick={() => setTab('instructions')}>Instructions</TabButton>
            <TabButton active={tab === 'how-it-works'} onClick={() => setTab('how-it-works')}>How It Works</TabButton>
            <TabButton active={tab === 'run'} onClick={() => setTab('run')}>Run Recon</TabButton>
          </div>
        }
      />

      {/* ---- Instructions tab ---- */}
      {tab === 'instructions' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 text-xs text-gray-700 leading-relaxed">
          <h3 className="text-sm font-semibold text-gray-900">Using Capital Call Recon</h3>
          <div className="space-y-3">
            <div>
              <p className="font-semibold text-gray-800 mb-1">1. Prepare your Capital Call CSV</p>
              <p>Export the capital call schedule with columns for investor/account name, position ID, amount, and optionally a status column. Accepted status values that mark a call as previously funded: <span className="font-mono text-[10px] bg-gray-100 px-1 rounded">funded, paid, done, completed, settled</span>.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800 mb-1">2. Prepare your Bank Statement CSV</p>
              <p>Export the bank statement in CSV format. The tool auto-detects column layout using AI. Common column names (amount, date, description, memo, etc.) are detected automatically — no manual formatting required.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800 mb-1">3. Run Reconciliation</p>
              <p>Upload both files and click "Run Recon". The AI matching pipeline will process your files — this may take up to 2 minutes for large files.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800 mb-1">4. Review Results</p>
              <p>Results are split into four sections: Matched Credits, Unplaced Credits, Previously Funded, and Still Outstanding. Review the confidence scores and match reasons before accepting.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800 mb-1">5. Download Excel</p>
              <p>Export the full results as a four-sheet Excel workbook for delivery or filing.</p>
            </div>
          </div>
        </div>
      )}

      {/* ---- How it works tab ---- */}
      {tab === 'how-it-works' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 text-xs text-gray-700 leading-relaxed">
          <h3 className="text-sm font-semibold text-gray-900">Three-Pass Matching Pipeline</h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">1</div>
              <div>
                <p className="font-semibold text-gray-800">Pass 1 — Strict Match</p>
                <p className="text-gray-600 mt-0.5">Amount within 1% AND investor name is a full substring of the transaction description. Confidence is high. Typical bank wires where the beneficiary name is spelled out.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">2</div>
              <div>
                <p className="font-semibold text-gray-800">Pass 2 — Relaxed Match</p>
                <p className="text-gray-600 mt-0.5">Amount within 5% AND ≥60% of investor name tokens appear in the description. Handles common variations: missing LLC/LP suffixes, abbreviated names, reordered words.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">3</div>
              <div>
                <p className="font-semibold text-gray-800">Pass 3 — AI Agent</p>
                <p className="text-gray-600 mt-0.5">Claude reasons about remaining unmatched items, looking for abbreviations, initials, account references, and other indirect identity signals. <span className="font-semibold text-amber-700">Amount alone is never accepted as a match</span> — Claude must quote description text as evidence for every proposal.</p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800">
              <p className="font-semibold mb-0.5">Hard Rule</p>
              <p>No match is ever accepted on amount proximity alone. Every matched transaction must contain text evidence linking it to the investor. This prevents false positives from similar-sized wires between unrelated parties.</p>
            </div>
          </div>
        </div>
      )}

      {/* ---- Run Recon tab ---- */}
      {tab === 'run' && (
        <div className="space-y-4">
          {/* Upload panel */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Upload Files</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <FileInput
                label="Capital Call CSV"
                hint="Investor name · Position ID · Amount · Status (optional)"
                file={ccFile}
                onChange={setCcFile}
              />
              <FileInput
                label="Bank Statement CSV"
                hint="Date · Description/Memo · Amount — any column layout"
                file={bankFile}
                onChange={setBankFile}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-px" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={runRecon}
                disabled={!ccFile || !bankFile || loading}
                className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-[#00C97B] hover:bg-[#00A866] disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-md transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Running AI Pipeline…
                  </>
                ) : (
                  <>
                    <GitMerge className="w-3.5 h-3.5" />
                    Run Recon
                  </>
                )}
              </button>

              {result && (
                <button
                  onClick={downloadExcel}
                  disabled={downloading}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-[#00835A] bg-[#F0FBF6] hover:bg-[#E0F7ED] border border-[#00C97B]/30 px-4 py-2 rounded-md transition-colors"
                >
                  {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  Download Excel
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          {result && (
            <>
              {/* Summary bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Matched', value: result.summary.matched, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                  { label: 'Unplaced Credits', value: result.summary.unplaced, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                  { label: 'Previously Funded', value: result.summary.funded, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                  { label: 'Still Outstanding', value: result.summary.outstanding, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
                ].map((s) => (
                  <div key={s.label} className={`${s.bg} border ${s.border} rounded-lg p-3`}>
                    <div className={`text-2xl font-bold ${s.color} font-mono`}>{s.value}</div>
                    <div className="text-[10px] font-semibold text-gray-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Matched Credits */}
              <ResultSection
                title="Matched Credits"
                count={result.matched.length}
                color="text-emerald-600 bg-emerald-50"
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                <DataTable columns={matchedCols} data={result.matched} searchPlaceholder="Search matched…" />
              </ResultSection>

              {/* Unplaced Credits */}
              <ResultSection
                title="Unplaced Credits"
                count={result.unplacedCredits.length}
                color="text-amber-600 bg-amber-50"
                icon={<AlertCircle className="w-4 h-4" />}
              >
                <DataTable columns={unplacedCols} data={result.unplacedCredits} searchPlaceholder="Search unplaced…" />
              </ResultSection>

              {/* Previously Funded */}
              <ResultSection
                title="Previously Funded"
                count={result.previouslyFunded.length}
                color="text-blue-600 bg-blue-50"
                icon={<Clock className="w-4 h-4" />}
              >
                <DataTable columns={fundedCols} data={result.previouslyFunded} searchPlaceholder="Search funded…" />
              </ResultSection>

              {/* Still Outstanding */}
              <ResultSection
                title="Still Outstanding"
                count={result.stillOutstanding.length}
                color="text-red-600 bg-red-50"
                icon={<AlertCircle className="w-4 h-4" />}
              >
                <DataTable columns={outstandingCols} data={result.stillOutstanding} searchPlaceholder="Search outstanding…" />
              </ResultSection>
            </>
          )}
        </div>
      )}
    </div>
  );
}
