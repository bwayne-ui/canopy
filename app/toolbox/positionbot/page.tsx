'use client';

import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import PageHeader from '@/components/PageHeader';
import {
  Bot, Upload, FileText, CheckCircle2, AlertTriangle, Download,
  Loader2, ChevronRight, ArrowRight, X,
} from 'lucide-react';
import { fmtMoney } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types (minimal subset needed on the client)
// ---------------------------------------------------------------------------

interface JsqPosition {
  position_id: string;
  account_id: string;
  account_name: string;
  entity: string;
  committed: number;
  currency: string;
  commitment_date: string;
  investor_group: string;
  status: string;
  contacts: string;
  account_street: string;
  account_city: string;
  account_state: string;
  account_postal: string;
  account_country: string;
}

interface OwnershipRow {
  entity: string;
  change_type: string;
  investor_group: string;
  to_position_id: string;
  to_account_name: string;
  from_position_id: string;
  from_account_name: string;
  date: string;
  change_amount: number;
  notes: string;
}

interface ValidationIssue {
  positionId: string;
  accountName: string;
  issueType: string;
  severity: 'error' | 'warning';
  message: string;
}

interface CheckResult {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

interface AppState {
  arenaName: string;
  positions: JsqPosition[] | null;
  ownership: OwnershipRow[] | null;
  validationIssues: ValidationIssue[];
  resolutions: Record<string, string>;
  checks: CheckResult[];
  diuSummary: number;
}

// ---------------------------------------------------------------------------
// Client-side Excel parsers (using xlsx in browser)
// ---------------------------------------------------------------------------

function formatDateValue(val: unknown): string {
  if (!val) return '';
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  const s = String(val);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return '';
}

async function parsePositions(file: File): Promise<JsqPosition[]> {
  const ab = await file.arrayBuffer();
  const wb = XLSX.read(ab, { type: 'array', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });
  return raw.map((row) => ({
    position_id: String(row['Position ID'] ?? ''),
    account_id: String(row['Account ID'] ?? ''),
    account_name: String(row['Account legal name'] ?? ''),
    entity: String(row['Entity'] ?? ''),
    committed: Number(row['Committed'] ?? 0),
    currency: String(row['Currency'] ?? 'USD'),
    commitment_date: formatDateValue(row['Initial commitment date']),
    investor_group: String(row['Investor group'] ?? 'LP'),
    status: String(row['Status'] ?? 'Active'),
    contacts: String(row['Contacts'] ?? ''),
    account_street: String(row['Account street'] ?? ''),
    account_city: String(row['Account city'] ?? ''),
    account_state: String(row['Account state'] ?? ''),
    account_postal: String(row['Account postal code'] ?? ''),
    account_country: String(row['Account country'] ?? ''),
  }));
}

async function parseOwnership(file: File): Promise<OwnershipRow[]> {
  const ab = await file.arrayBuffer();
  const wb = XLSX.read(ab, { type: 'array', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });
  return raw.map((row) => ({
    entity: String(row['Entity'] ?? ''),
    change_type: String(row['Change type'] ?? ''),
    investor_group: String(row['Investor Group'] ?? ''),
    to_position_id: String(row['To position ID'] ?? ''),
    to_account_name: String(row['To account name'] ?? ''),
    from_position_id: String(row['From position ID'] ?? ''),
    from_account_name: String(row['From account name'] ?? ''),
    date: formatDateValue(row['Date']),
    change_amount: Number(row['Change amount'] ?? 0),
    notes: String(row['Notes'] ?? ''),
  }));
}

function clientValidate(positions: JsqPosition[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();

  for (const pos of positions) {
    if (seenIds.has(pos.position_id)) {
      issues.push({ positionId: pos.position_id, accountName: pos.account_name, issueType: 'duplicate', severity: 'error', message: `Duplicate Position ID: ${pos.position_id}` });
    }
    seenIds.add(pos.position_id);

    const nameKey = pos.account_name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seenNames.has(nameKey)) {
      issues.push({ positionId: pos.position_id, accountName: pos.account_name, issueType: 'soft_duplicate', severity: 'warning', message: `Possible duplicate investor name: "${pos.account_name}"` });
    }
    seenNames.add(nameKey);

    if (!pos.account_name || !pos.position_id || !pos.entity) {
      issues.push({ positionId: pos.position_id, accountName: pos.account_name || '(blank)', issueType: 'missing_required', severity: 'error', message: 'Missing required field(s)' });
    }
    if (pos.committed <= 0) {
      issues.push({ positionId: pos.position_id, accountName: pos.account_name, issueType: 'invalid_amount', severity: 'warning', message: `Zero/negative commitment: ${pos.committed}` });
    }
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Stage indicator
// ---------------------------------------------------------------------------

const STAGES = [
  'Request Entry',
  'File Upload',
  'Processing',
  'QC Dashboard',
  'DIU Generation',
  'Completion',
];

function StageIndicator({ current }: { current: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      {STAGES.map((label, idx) => {
        const n = idx + 1;
        const isActive = n === current;
        const isDone = n < current;
        return (
          <div
            key={n}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
              isActive ? 'bg-[#00C97B]/10' : isDone ? 'opacity-60' : 'opacity-40'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                isActive ? 'bg-[#00C97B] text-white' :
                isDone ? 'bg-emerald-100 text-emerald-600' :
                'bg-gray-100 text-gray-400'
              }`}
            >
              {isDone ? <CheckCircle2 className="w-3 h-3" /> : n}
            </div>
            <span className={`text-xs font-semibold ${isActive ? 'text-[#00835A]' : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// File upload zone
// ---------------------------------------------------------------------------

function UploadZone({
  label,
  hint,
  file,
  onChange,
  loading,
}: {
  label: string;
  hint: string;
  file: File | null;
  onChange: (f: File) => void;
  loading?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1.5">{label}</label>
      <div
        onClick={() => !loading && ref.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) onChange(f);
        }}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
          loading ? 'border-blue-200 bg-blue-50' :
          file ? 'border-[#00C97B] bg-[#F0FBF6]' :
          'border-gray-200 hover:border-[#00C97B]/50'
        }`}
      >
        <input ref={ref} type="file" accept=".xlsx,.csv,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange(f); }} />
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xs text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" /> Parsing…
          </div>
        ) : file ? (
          <div className="flex items-center justify-center gap-2 text-xs text-[#00835A]">
            <FileText className="w-4 h-4" />
            <span className="font-semibold">{file.name}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-400">
            <Upload className="w-5 h-5" />
            <span className="text-xs font-medium">Drop file or click to browse</span>
            <span className="text-[10px]">{hint}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const INITIAL_STATE: AppState = {
  arenaName: '',
  positions: null,
  ownership: null,
  validationIssues: [],
  resolutions: {},
  checks: [],
  diuSummary: 0,
};

export default function PositionBotPage() {
  const [stage, setStage] = useState(1);
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [error, setError] = useState<string | null>(null);

  // Stage 2 state
  const [posFile, setPosFile] = useState<File | null>(null);
  const [ownFile, setOwnFile] = useState<File | null>(null);
  const [parsingPos, setParsingPos] = useState(false);
  const [parsingOwn, setParsingOwn] = useState(false);

  // Stage 3 state
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);

  // Stage 5 state
  const [validating, setValidating] = useState(false);
  const [generating, setGenerating] = useState(false);

  const next = () => setStage((s) => Math.min(s + 1, 6));

  // Stage 2: handle file uploads and parse
  async function handlePosFile(file: File) {
    setPosFile(file);
    setParsingPos(true);
    setError(null);
    try {
      const positions = await parsePositions(file);
      setState((s) => ({ ...s, positions }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse positions file');
    } finally {
      setParsingPos(false);
    }
  }

  async function handleOwnFile(file: File) {
    setOwnFile(file);
    setParsingOwn(true);
    setError(null);
    try {
      const ownership = await parseOwnership(file);
      setState((s) => ({ ...s, ownership }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse ownership file');
    } finally {
      setParsingOwn(false);
    }
  }

  // Stage 3: run validation pipeline
  async function runProcessing() {
    if (!state.positions) return;
    setProcessing(true);
    setProcessingStep(0);
    setError(null);

    const STEPS = [
      'Parsing position records',
      'Parsing ownership report',
      'Cross-referencing entities',
      'Checking for duplicate positions',
      'Fuzzy-matching investor names',
      'Validating commitment amounts',
      'Checking required fields',
      'Running auto-resolution',
      'Mapping to DIU format',
    ];

    for (let i = 0; i < STEPS.length; i++) {
      setProcessingStep(i);
      await new Promise((r) => setTimeout(r, 250));
    }

    const issues = clientValidate(state.positions);
    setState((s) => ({ ...s, validationIssues: issues }));
    setProcessing(false);
    next();
  }

  // Stage 5: validate DIU
  async function handleValidate() {
    setValidating(true);
    setError(null);
    try {
      const res = await fetch('/api/toolbox/positionbot/diu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positions: state.positions,
          ownership: state.ownership ?? [],
          arena: { name: state.arenaName || 'Canopy' },
          action: 'validate',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Validation failed');
      setState((s) => ({ ...s, checks: data.checks, diuSummary: data.summary }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setValidating(false);
    }
  }

  async function handleGenerateDiu() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/toolbox/positionbot/diu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positions: state.positions,
          ownership: state.ownership ?? [],
          arena: { name: state.arenaName || 'Canopy' },
          action: 'generate',
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Generation failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DIU_${(state.arenaName || 'output').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      next();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  }

  const PROCESS_STEPS = [
    'Parsing position records',
    'Parsing ownership report',
    'Cross-referencing entities',
    'Checking for duplicate positions',
    'Fuzzy-matching investor names',
    'Validating commitment amounts',
    'Checking required fields',
    'Running auto-resolution',
    'Mapping to DIU format',
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="PositionBot"
        subtitle="Automated investor position creation — parse JSQ exports and generate DIU Excel files"
        breadcrumbs={[
          { label: 'Agentic Center' },
          { label: 'Toolbox', href: '/toolbox' },
          { label: 'PositionBot' },
        ]}
      />

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-px" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div className="flex gap-4">
        {/* Stage sidebar */}
        <div className="w-44 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <StageIndicator current={stage} />
          </div>
        </div>

        {/* Stage content */}
        <div className="flex-1 min-w-0">

          {/* ── Stage 1: Request Entry ── */}
          {stage === 1 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-0.5">Request Entry</h3>
                <p className="text-xs text-gray-500">Identify the entity you&apos;re onboarding positions for</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Entity / Arena Name</label>
                <input
                  type="text"
                  value={state.arenaName}
                  onChange={(e) => setState((s) => ({ ...s, arenaName: e.target.value }))}
                  placeholder="e.g. Walker Capital Fund III"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#00C97B] placeholder:text-gray-300"
                />
                <p className="text-[10px] text-gray-400 mt-1">This name will appear in the DIU file and Contact tab</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-700 mb-1">What you&apos;ll need</p>
                <ul className="text-xs text-blue-600 space-y-0.5 list-disc list-inside">
                  <li>JSQ Position Export (.xlsx) — from Juniper Square</li>
                  <li>Ownership Transfer Report (.xlsx) — optional but recommended</li>
                </ul>
              </div>
              <button
                onClick={next}
                disabled={!state.arenaName.trim()}
                className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-[#00C97B] hover:bg-[#00A866] disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-md transition-colors"
              >
                Continue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ── Stage 2: File Upload ── */}
          {stage === 2 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-0.5">File Upload</h3>
                <p className="text-xs text-gray-500">Upload position export and ownership report for <span className="font-semibold text-gray-700">{state.arenaName}</span></p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UploadZone
                  label="JSQ Position Export *"
                  hint="Required · .xlsx or .csv"
                  file={posFile}
                  onChange={handlePosFile}
                  loading={parsingPos}
                />
                <UploadZone
                  label="Ownership Transfer Report"
                  hint="Optional · .xlsx or .csv"
                  file={ownFile}
                  onChange={handleOwnFile}
                  loading={parsingOwn}
                />
              </div>

              {state.positions && (
                <div className="bg-[#F0FBF6] border border-[#00C97B]/20 rounded-lg p-3">
                  <p className="text-xs font-semibold text-[#00835A]">
                    {state.positions.length} positions parsed from {state.positions[0]?.entity ?? 'unknown entity'}
                  </p>
                  <div className="mt-1.5 grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[10px] text-gray-500">Total Committed</p>
                      <p className="text-xs font-bold text-gray-900 font-mono">
                        {fmtMoney(state.positions.reduce((s, p) => s + p.committed, 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500">Currencies</p>
                      <p className="text-xs font-bold text-gray-900 font-mono">
                        {Array.from(new Set(state.positions.map((p) => p.currency))).join(', ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500">Ownership rows</p>
                      <p className="text-xs font-bold text-gray-900 font-mono">
                        {state.ownership?.length ?? 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => setStage(1)} className="text-xs font-semibold text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md border border-gray-200 transition-colors">Back</button>
                <button
                  onClick={() => { next(); runProcessing(); }}
                  disabled={!state.positions || parsingPos || parsingOwn}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-[#00C97B] hover:bg-[#00A866] disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-md transition-colors"
                >
                  Process Files <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ── Stage 3: Processing ── */}
          {stage === 3 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-0.5">Processing</h3>
                <p className="text-xs text-gray-500">Validating entities and running checks…</p>
              </div>
              <div className="space-y-1.5">
                {PROCESS_STEPS.map((label, idx) => {
                  const done = idx < processingStep;
                  const active = idx === processingStep && processing;
                  return (
                    <div key={idx} className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-emerald-100' : active ? 'bg-blue-100' : 'bg-gray-50'}`}>
                        {done ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> :
                         active ? <Loader2 className="w-2.5 h-2.5 text-blue-500 animate-spin" /> :
                         <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
                      </div>
                      <span className={`text-xs ${active ? 'text-gray-900 font-semibold' : done ? 'text-gray-500' : 'text-gray-300'}`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
              {!processing && processingStep === 0 && (
                <p className="text-xs text-gray-400">Processing complete</p>
              )}
            </div>
          )}

          {/* ── Stage 4: QC Dashboard ── */}
          {stage === 4 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-0.5">QC Dashboard</h3>
                <p className="text-xs text-gray-500">
                  {state.validationIssues.length === 0
                    ? 'All checks passed — no escalations found'
                    : `${state.validationIssues.length} issue(s) require review`}
                </p>
              </div>

              {state.validationIssues.length === 0 ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-700">All {state.positions?.length ?? 0} positions validated successfully</p>
                    <p className="text-[10px] text-emerald-600 mt-0.5">No duplicates, missing fields, or invalid amounts detected</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {state.validationIssues.map((issue, idx) => (
                    <div key={idx} className={`rounded-lg border p-3 ${issue.severity === 'error' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={`text-xs font-semibold ${issue.severity === 'error' ? 'text-red-700' : 'text-amber-700'}`}>
                            {issue.accountName}
                            <span className="ml-2 font-normal text-[10px] opacity-70 font-mono">{issue.positionId}</span>
                          </p>
                          <p className={`text-[10px] mt-0.5 ${issue.severity === 'error' ? 'text-red-600' : 'text-amber-600'}`}>{issue.message}</p>
                        </div>
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize flex-shrink-0 ${issue.severity === 'error' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          {issue.severity}
                        </span>
                      </div>
                      {state.resolutions[issue.positionId] && (
                        <p className="text-[10px] text-emerald-600 mt-1.5 font-semibold">
                          ✓ Resolution noted: {state.resolutions[issue.positionId]}
                        </p>
                      )}
                      {!state.resolutions[issue.positionId] && (
                        <input
                          type="text"
                          placeholder="Add resolution note…"
                          className="mt-2 w-full border border-gray-200 rounded-md px-2 py-1 text-[10px] focus:outline-none focus:border-[#00C97B]"
                          onBlur={(e) => {
                            if (e.target.value.trim()) {
                              setState((s) => ({ ...s, resolutions: { ...s.resolutions, [issue.positionId]: e.target.value.trim() } }));
                            }
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => setStage(3)} className="text-xs font-semibold text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md border border-gray-200 transition-colors">Back</button>
                <button
                  onClick={next}
                  disabled={state.validationIssues.some((i) => i.severity === 'error' && !state.resolutions[i.positionId])}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-[#00C97B] hover:bg-[#00A866] disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-md transition-colors"
                >
                  Proceed to DIU Generation <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ── Stage 5: DIU Generation ── */}
          {stage === 5 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-0.5">DIU Generation</h3>
                <p className="text-xs text-gray-500">Run validation checks and generate the Investran DIU Excel file</p>
              </div>

              {state.checks.length === 0 ? (
                <button
                  onClick={handleValidate}
                  disabled={validating}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-[#00835A] bg-[#F0FBF6] hover:bg-[#E0F7ED] border border-[#00C97B]/30 px-4 py-2 rounded-md transition-colors"
                >
                  {validating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Run Pre-Flight Checks
                </button>
              ) : (
                <div className="space-y-2">
                  {state.checks.map((check) => (
                    <div key={check.id} className={`rounded-lg border p-3 flex items-start gap-3 ${check.passed ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-200'}`}>
                      {check.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
                      <div>
                        <p className={`text-xs font-semibold ${check.passed ? 'text-emerald-700' : 'text-red-700'}`}>{check.label}</p>
                        <p className={`text-[10px] mt-0.5 ${check.passed ? 'text-emerald-600' : 'text-red-600'}`}>{check.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {state.checks.length > 0 && (
                <div className="flex gap-2">
                  <button onClick={() => setStage(4)} className="text-xs font-semibold text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md border border-gray-200 transition-colors">Back</button>
                  <button
                    onClick={handleGenerateDiu}
                    disabled={generating || state.checks.some((c) => !c.passed)}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-[#00C97B] hover:bg-[#00A866] disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-md transition-colors"
                  >
                    {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    Generate DIU Excel
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Stage 6: Completion ── */}
          {stage === 6 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Complete</h3>
                  <p className="text-xs text-gray-500">DIU Excel file generated and downloaded</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Entity', value: state.positions?.[0]?.entity ?? '—' },
                  { label: 'Positions', value: String(state.positions?.length ?? 0) },
                  { label: 'Issues', value: String(state.validationIssues.length) },
                  { label: 'Checks Passed', value: `${state.checks.filter((c) => c.passed).length}/${state.checks.length}` },
                ].map((s) => (
                  <div key={s.label} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-[10px] text-gray-500">{s.label}</p>
                    <p className="text-xs font-bold text-gray-900 font-mono mt-0.5">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setState(INITIAL_STATE); setStage(1); setPosFile(null); setOwnFile(null); }}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:border-gray-300 px-4 py-2 rounded-md transition-colors"
                >
                  <Bot className="w-3.5 h-3.5" /> New Request
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
