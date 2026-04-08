'use client';

import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { UserCog, Users, Building2, Briefcase } from 'lucide-react';

const assignments = [
  { id: 'EA-001', employee: 'Megan Moore', department: 'Fund Accounting', serviceLine: 'NAV Calculation', clientEntity: 'Walker Enterprise Fund III', role: 'Primary', coverage: 100, startDate: '2024-06-01', status: 'Active' },
  { id: 'EA-002', employee: 'Megan Moore', department: 'Fund Accounting', serviceLine: 'Financial Reporting', clientEntity: 'Walker Enterprise Fund II', role: 'Primary', coverage: 75, startDate: '2024-06-01', status: 'Active' },
  { id: 'EA-003', employee: 'Diana Smith', department: 'Tax', serviceLine: 'K-1 Preparation', clientEntity: 'Campbell Growth Fund IV', role: 'Primary', coverage: 100, startDate: '2025-01-15', status: 'Active' },
  { id: 'EA-004', employee: 'Diana Smith', department: 'Tax', serviceLine: 'Tax Compliance', clientEntity: 'White Senior Credit Fund V', role: 'Secondary', coverage: 50, startDate: '2025-03-01', status: 'Active' },
  { id: 'EA-005', employee: 'Steven Wright', department: 'Fund Accounting', serviceLine: 'Capital Call Processing', clientEntity: 'Cruz Ventures Fund II', role: 'Primary', coverage: 100, startDate: '2024-09-15', status: 'Active' },
  { id: 'EA-006', employee: 'Steven Wright', department: 'Fund Accounting', serviceLine: 'Distribution Processing', clientEntity: 'Walker Enterprise Fund I', role: 'Lead', coverage: 80, startDate: '2024-09-15', status: 'Active' },
  { id: 'EA-007', employee: 'Richard Thornton', department: 'Audit & Compliance', serviceLine: 'Audit Support', clientEntity: 'Sullivan Alpha Fund', role: 'Lead', coverage: 100, startDate: '2025-02-01', status: 'Active' },
  { id: 'EA-008', employee: 'Richard Thornton', department: 'Audit & Compliance', serviceLine: 'PBC List Management', clientEntity: 'Lopez RE Opportunities III', role: 'Secondary', coverage: 40, startDate: '2025-04-01', status: 'Active' },
  { id: 'EA-009', employee: 'Sarah Garcia', department: 'Compliance', serviceLine: 'FATCA/CRS Filing', clientEntity: 'White Fund Management', role: 'Primary', coverage: 100, startDate: '2024-08-01', status: 'Active' },
  { id: 'EA-010', employee: 'Sarah Garcia', department: 'Compliance', serviceLine: 'KYC/AML Review', clientEntity: 'Rodriguez Capital', role: 'Lead', coverage: 75, startDate: '2025-01-10', status: 'Active' },
  { id: 'EA-011', employee: 'Jason Cooper', department: 'Investor Relations', serviceLine: 'Statement Distribution', clientEntity: 'Walker Asset Management', role: 'Primary', coverage: 100, startDate: '2024-07-01', status: 'Active' },
  { id: 'EA-012', employee: 'Jason Cooper', department: 'Investor Relations', serviceLine: 'LP Communications', clientEntity: 'Campbell Capital Partners', role: 'Secondary', coverage: 60, startDate: '2024-10-01', status: 'Active' },
  { id: 'EA-013', employee: 'Jessica Cruz', department: 'Onboarding', serviceLine: 'New Fund Setup', clientEntity: 'Rodriguez EM FoF I', role: 'Lead', coverage: 100, startDate: '2025-06-01', status: 'Active' },
  { id: 'EA-014', employee: 'Jessica Cruz', department: 'Onboarding', serviceLine: 'LPA Documentation', clientEntity: 'Rodriguez EM FoF I', role: 'Primary', coverage: 80, startDate: '2025-06-01', status: 'Active' },
  { id: 'EA-015', employee: 'Daniel Foster', department: 'Valuations', serviceLine: 'Quarterly Valuation', clientEntity: 'Lopez RE Opportunities III', role: 'Primary', coverage: 100, startDate: '2025-01-01', status: 'Active' },
  { id: 'EA-016', employee: 'Daniel Foster', department: 'Valuations', serviceLine: 'Fair Value Assessment', clientEntity: 'White Senior Credit Fund V', role: 'Lead', coverage: 75, startDate: '2025-03-15', status: 'Active' },
  { id: 'EA-017', employee: 'Katherine Brooks', department: 'Legal', serviceLine: 'Side Letter Review', clientEntity: 'Sullivan Alpha Fund', role: 'External', coverage: 30, startDate: '2025-02-01', status: 'Active' },
  { id: 'EA-018', employee: 'Rebecca Sanders', department: 'Operations', serviceLine: 'Wire Processing', clientEntity: 'Walker Enterprise Fund III', role: 'Primary', coverage: 100, startDate: '2024-06-01', status: 'Active' },
  { id: 'EA-019', employee: 'Michael Collins', department: 'Technology', serviceLine: 'Data Integration', clientEntity: 'Sullivan Investments', role: 'Lead', coverage: 50, startDate: '2025-04-01', status: 'Active' },
  { id: 'EA-020', employee: 'Megan Moore', department: 'Fund Accounting', serviceLine: 'Waterfall Calculation', clientEntity: 'Campbell Growth Fund IV', role: 'Secondary', coverage: 40, startDate: '2025-01-01', status: 'Active' },
];

const uniqueEmployees = new Set(assignments.map((a) => a.employee)).size;
const uniqueDepts = new Set(assignments.map((a) => a.department)).size;
const uniqueServices = new Set(assignments.map((a) => a.serviceLine)).size;

const columns: Column[] = [
  { key: 'employee', label: 'Employee', sortable: true, render: (v) => <span className="font-medium text-gray-900">{v}</span> },
  { key: 'department', label: 'Department', sortable: true },
  { key: 'serviceLine', label: 'Service Line', sortable: true },
  { key: 'clientEntity', label: 'Client / Entity', sortable: true, render: (v) => <span className="text-gray-700">{v}</span> },
  { key: 'role', label: 'Role', render: (v) => {
    const colors: Record<string, string> = { Primary: 'bg-emerald-50 text-emerald-700', Lead: 'bg-blue-50 text-blue-700', Secondary: 'bg-gray-100 text-gray-600', External: 'bg-purple-50 text-purple-700' };
    return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${colors[v] || 'bg-gray-100 text-gray-600'}`}>{v}</span>;
  }},
  { key: 'coverage', label: 'Coverage %', align: 'right', sortable: true, render: (v) => <span className="font-mono text-[11px]">{v}%</span> },
  { key: 'startDate', label: 'Start Date', sortable: true, render: (v) => <span className="font-mono text-[10px] text-gray-400">{v}</span> },
  { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
];

export default function EmployeeAssignmentsPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Employee Assignments" subtitle="Coverage assignments for departments and services" breadcrumbs={[{ label: 'Relationships' }, { label: 'Employee Assignments' }]} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="Total Assignments" value={assignments.length} icon={<UserCog className="w-4 h-4" />} color="teal" />
        <MetricCard title="Employees" value={uniqueEmployees} icon={<Users className="w-4 h-4" />} color="signal" />
        <MetricCard title="Departments" value={uniqueDepts} icon={<Building2 className="w-4 h-4" />} color="teal" />
        <MetricCard title="Service Lines" value={uniqueServices} icon={<Briefcase className="w-4 h-4" />} color="green" />
      </div>
      <DataTable columns={columns} data={assignments} searchPlaceholder="Search assignments..." />
    </div>
  );
}
