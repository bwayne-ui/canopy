'use client';

import PageHeader from '@/components/PageHeader';

const flowTypes = [
  { type: 'Capital Call', code: 'CC', direction: 'Inflow', impact: 'Increase NAV' },
  { type: 'Distribution', code: 'DIST', direction: 'Outflow', impact: 'Decrease NAV' },
  { type: 'Management Fee', code: 'MGMT', direction: 'Outflow', impact: 'Expense' },
  { type: 'Carried Interest', code: 'CARRY', direction: 'Outflow', impact: 'GP Allocation' },
  { type: 'Dividend', code: 'DIV', direction: 'Inflow', impact: 'Income' },
  { type: 'Redemption', code: 'RED', direction: 'Outflow', impact: 'Decrease NAV' },
  { type: 'Investment', code: 'INV', direction: 'Outflow', impact: 'Portfolio' },
  { type: 'Interest', code: 'INT', direction: 'Inflow', impact: 'Income' },
  { type: 'Credit Facility Draw', code: 'CFD', direction: 'Inflow', impact: 'Leverage' },
  { type: 'Credit Facility Repay', code: 'CFR', direction: 'Outflow', impact: 'Deleveraging' },
  { type: 'Payroll', code: 'PAY', direction: 'Outflow', impact: 'Operating' },
  { type: 'Fee Income', code: 'FEE', direction: 'Inflow', impact: 'Revenue' },
];

const settlementRules = [
  { category: 'Capital Call', days: 'T+3', currency: 'Fund Currency', autoReconcile: 'Yes' },
  { category: 'Distribution', days: 'T+5', currency: 'Fund Currency', autoReconcile: 'Yes' },
  { category: 'Management Fee', days: 'T+0', currency: 'USD', autoReconcile: 'Yes' },
  { category: 'Investment', days: 'T+2', currency: 'Variable', autoReconcile: 'No' },
  { category: 'Redemption', days: 'T+30', currency: 'Fund Currency', autoReconcile: 'No' },
  { category: 'Dividend', days: 'T+1', currency: 'Issuer Currency', autoReconcile: 'Yes' },
];

const approvalThresholds = [
  { range: '< $100K', approvals: 'Auto-approved', escalation: 'None' },
  { range: '$100K - $1M', approvals: 'Team Lead', escalation: '24 hours' },
  { range: '$1M - $10M', approvals: 'Director + Compliance', escalation: '48 hours' },
  { range: '$10M - $50M', approvals: 'Managing Director', escalation: '72 hours' },
  { range: '> $50M', approvals: 'Partner + Board', escalation: '5 business days' },
];

const accountingTreatment = [
  { type: 'Capital Call', debit: 'Cash', credit: 'Capital Account', journal: 'JE-CC' },
  { type: 'Distribution', debit: 'Capital Account', credit: 'Cash', journal: 'JE-DIST' },
  { type: 'Mgmt Fee', debit: 'Fund Expense', credit: 'Cash', journal: 'JE-FEE' },
  { type: 'Carried Interest', debit: 'Carry Payable', credit: 'GP Capital', journal: 'JE-CARRY' },
];

function ParamCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

function ParamTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-50/80">
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-gray-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TransParametersPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Transaction Parameters" subtitle="Transaction categorization rules and processing parameters" breadcrumbs={[{ label: 'Data Vault' }, { label: 'Trans Parameters' }]} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ParamCard title="Flow Type Classification">
          <ParamTable
            headers={['Flow Type', 'Code', 'Direction', 'Impact']}
            rows={flowTypes.map((r) => [r.type, r.code, r.direction, r.impact])}
          />
        </ParamCard>

        <ParamCard title="Settlement Rules">
          <ParamTable
            headers={['Category', 'Settlement Days', 'Currency', 'Auto-Reconcile']}
            rows={settlementRules.map((r) => [r.category, r.days, r.currency, r.autoReconcile])}
          />
        </ParamCard>

        <ParamCard title="Approval Thresholds">
          <ParamTable
            headers={['Amount Range', 'Required Approvals', 'Escalation']}
            rows={approvalThresholds.map((r) => [r.range, r.approvals, r.escalation])}
          />
        </ParamCard>

        <ParamCard title="Accounting Treatment">
          <ParamTable
            headers={['Transaction Type', 'Debit Account', 'Credit Account', 'Journal Type']}
            rows={accountingTreatment.map((r) => [r.type, r.debit, r.credit, r.journal])}
          />
        </ParamCard>
      </div>
    </div>
  );
}
