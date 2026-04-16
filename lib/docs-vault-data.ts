// Shared hardcoded data for all Docs Vault pages

export const fundDocuments = [
  { id: 'FD-001', name: 'Walker III — Limited Partnership Agreement', fund: 'Walker Enterprise Fund III', type: 'LPA', version: 'v3.2', lastUpdated: '2026-03-15', status: 'Executed', confidentiality: 'Restricted' },
  { id: 'FD-002', name: 'Campbell IV — PPM', fund: 'Campbell Growth Fund IV', type: 'PPM', version: 'v2.1', lastUpdated: '2025-11-20', status: 'Executed', confidentiality: 'Restricted' },
  { id: 'FD-003', name: 'Sullivan Alpha — Subscription Agreement', fund: 'Sullivan Alpha Fund', type: 'Subscription', version: 'v1.4', lastUpdated: '2026-02-28', status: 'Executed', confidentiality: 'Confidential' },
  { id: 'FD-004', name: 'Rodriguez EM FoF I — LPA Draft', fund: 'Rodriguez EM FoF I', type: 'LPA', version: 'v0.7', lastUpdated: '2026-04-03', status: 'Draft', confidentiality: 'Restricted' },
  { id: 'FD-005', name: 'White Credit V — Side Letter Compendium', fund: 'White Senior Credit Fund V', type: 'Side Letter', version: 'v2.0', lastUpdated: '2026-01-12', status: 'Executed', confidentiality: 'Restricted' },
  { id: 'FD-006', name: 'Lopez RE III — Investment Advisory Agreement', fund: 'Lopez RE Opportunities III', type: 'Advisory', version: 'v1.1', lastUpdated: '2025-09-30', status: 'Executed', confidentiality: 'Confidential' },
  { id: 'FD-007', name: 'Cruz II — Capital Call Notice Template', fund: 'Cruz Ventures Fund II', type: 'Notice', version: 'v3.0', lastUpdated: '2026-03-22', status: 'Active', confidentiality: 'Internal' },
  { id: 'FD-008', name: 'Walker I — Wind-Down Distribution Plan', fund: 'Walker Enterprise Fund I', type: 'Distribution', version: 'v1.0', lastUpdated: '2026-04-01', status: 'Under Review', confidentiality: 'Restricted' },
];

export const investorReports = [
  { id: 'IR-001', name: 'Q1 2026 Quarterly Letter — Walker III', fund: 'Walker Enterprise Fund III', type: 'Quarterly Letter', period: 'Q1 2026', dueDate: '2026-04-25', status: 'In Progress' },
  { id: 'IR-002', name: 'Q1 2026 Quarterly Letter — Campbell IV', fund: 'Campbell Growth Fund IV', type: 'Quarterly Letter', period: 'Q1 2026', dueDate: '2026-04-25', status: 'Draft' },
  { id: 'IR-003', name: 'Annual Report FY2025 — Sullivan Alpha', fund: 'Sullivan Alpha Fund', type: 'Annual Report', period: 'FY2025', dueDate: '2026-03-31', status: 'Distributed' },
  { id: 'IR-004', name: 'Capital Account Statement Q4 — All Funds', fund: 'All Funds', type: 'Capital Account', period: 'Q4 2025', dueDate: '2026-02-28', status: 'Distributed' },
  { id: 'IR-005', name: 'K-1 Package FY2025 — Walker III', fund: 'Walker Enterprise Fund III', type: 'Tax (K-1)', period: 'FY2025', dueDate: '2026-04-15', status: 'In Progress' },
  { id: 'IR-006', name: 'Performance Summary — Campbell IV', fund: 'Campbell Growth Fund IV', type: 'Performance', period: 'Q1 2026', dueDate: '2026-05-01', status: 'Not Started' },
  { id: 'IR-007', name: 'ESG Report — CalPERS Portfolio', fund: 'Walker Enterprise Fund III', type: 'ESG', period: 'Annual', dueDate: '2026-06-30', status: 'Scheduled' },
  { id: 'IR-008', name: 'Board Deck — Walker III Q1 Meeting', fund: 'Walker Enterprise Fund III', type: 'Board Materials', period: 'Q1 2026', dueDate: '2026-04-13', status: 'Under Review' },
  { id: 'IR-009', name: 'Investor Day Materials — Campbell IV', fund: 'Campbell Growth Fund IV', type: 'Event Materials', period: 'Apr 2026', dueDate: '2026-04-20', status: 'In Progress' },
  { id: 'IR-010', name: 'Capital Call Notice — Rodriguez EM FoF', fund: 'Rodriguez EM FoF I', type: 'Notice', period: 'Apr 2026', dueDate: '2026-04-10', status: 'Draft' },
];

export const complianceDocs = [
  { id: 'CD-001', name: 'FATCA/CRS Classification — All Funds', category: 'Tax Compliance', regulation: 'FATCA/CRS', lastFiled: '2025-03-15', nextDue: '2026-04-15', status: 'Due Soon' },
  { id: 'CD-002', name: 'Form PF — Annual Update', category: 'SEC Reporting', regulation: 'Dodd-Frank', lastFiled: '2025-04-30', nextDue: '2026-04-30', status: 'Due Soon' },
  { id: 'CD-003', name: 'ADV Annual Amendment', category: 'SEC Reporting', regulation: 'Advisers Act', lastFiled: '2025-05-15', nextDue: '2026-05-15', status: 'Scheduled' },
  { id: 'CD-004', name: 'AML/KYC Policy — Annual Review', category: 'AML', regulation: 'BSA/AML', lastFiled: '2025-09-01', nextDue: '2026-09-01', status: 'Current' },
  { id: 'CD-005', name: 'ERISA Compliance Certificate — White Credit V', category: 'ERISA', regulation: 'ERISA', lastFiled: '2025-12-31', nextDue: '2026-12-31', status: 'Current' },
  { id: 'CD-006', name: 'Insider Trading Policy Acknowledgments', category: 'Internal', regulation: 'Securities Act', lastFiled: '2026-01-15', nextDue: '2027-01-15', status: 'Current' },
  { id: 'CD-007', name: 'CalPERS Annual Compliance Questionnaire', category: 'Investor', regulation: 'CalPERS Policy', lastFiled: '2025-04-22', nextDue: '2026-04-22', status: 'Due Soon' },
  { id: 'CD-008', name: 'Beneficial Ownership Filings', category: 'FinCEN', regulation: 'CTA', lastFiled: '2025-06-30', nextDue: '2026-06-30', status: 'Current' },
  { id: 'CD-009', name: 'Code of Ethics Annual Certification', category: 'Internal', regulation: 'Advisers Act', lastFiled: '2026-01-31', nextDue: '2027-01-31', status: 'Current' },
];

export const legalDocs = [
  { id: 'LG-001', name: 'K&E Engagement Letter — Walker III', category: 'Engagement', counsel: 'Kirkland & Ellis', date: '2026-01-15', expiry: '2027-01-15', status: 'Active' },
  { id: 'LG-002', name: 'Board Resolution — Credit Facility Draw', category: 'Resolution', counsel: 'Internal', date: '2026-03-28', expiry: '—', status: 'Executed' },
  { id: 'LG-003', name: 'NDA — Potential Co-Investor (Blackstone)', category: 'NDA', counsel: 'Simpson Thacher', date: '2026-02-10', expiry: '2027-02-10', status: 'Active' },
  { id: 'LG-004', name: 'Regulatory Opinion — FATCA Classification', category: 'Opinion', counsel: 'Kirkland & Ellis', date: '2025-11-20', expiry: '—', status: 'Final' },
  { id: 'LG-005', name: 'Side Letter — MFN Amendment (CalPERS)', category: 'Amendment', counsel: 'Kirkland & Ellis', date: '2026-03-10', expiry: '—', status: 'Under Review' },
  { id: 'LG-006', name: 'Power of Attorney — Fund Dissolution (Walker I)', category: 'POA', counsel: 'Ropes & Gray', date: '2026-04-01', expiry: '2026-12-31', status: 'Active' },
  { id: 'LG-007', name: 'Indemnification Agreement — GP', category: 'Indemnity', counsel: 'Internal', date: '2024-06-01', expiry: '—', status: 'Active' },
  { id: 'LG-008', name: 'Investment Advisory Amendment — Lopez RE III', category: 'Amendment', counsel: 'Simpson Thacher', date: '2026-03-22', expiry: '—', status: 'Draft' },
];

export const templates = [
  { id: 'TM-001', name: 'Capital Call Notice', category: 'Notices', version: 'v3.0', lastUpdated: '2026-03-22', usageCount: 48, owner: 'Jason Cooper' },
  { id: 'TM-002', name: 'Distribution Notice', category: 'Notices', version: 'v2.4', lastUpdated: '2026-02-15', usageCount: 32, owner: 'Jason Cooper' },
  { id: 'TM-003', name: 'Quarterly Letter Template', category: 'Investor Relations', version: 'v4.1', lastUpdated: '2026-01-10', usageCount: 60, owner: 'Megan Moore' },
  { id: 'TM-004', name: 'Board Deck Template', category: 'Governance', version: 'v2.0', lastUpdated: '2025-12-01', usageCount: 24, owner: 'Megan Moore' },
  { id: 'TM-005', name: 'LPA Amendment Template', category: 'Legal', version: 'v1.3', lastUpdated: '2025-10-15', usageCount: 8, owner: 'Katherine Brooks' },
  { id: 'TM-006', name: 'Side Letter Template', category: 'Legal', version: 'v2.1', lastUpdated: '2026-01-20', usageCount: 15, owner: 'Katherine Brooks' },
  { id: 'TM-007', name: 'K-1 Cover Letter', category: 'Tax', version: 'v1.8', lastUpdated: '2026-03-01', usageCount: 45, owner: 'Diana Smith' },
  { id: 'TM-008', name: 'Subscription Agreement', category: 'Onboarding', version: 'v3.5', lastUpdated: '2025-11-10', usageCount: 28, owner: 'Jessica Cruz' },
  { id: 'TM-009', name: 'KYC Checklist', category: 'Compliance', version: 'v2.2', lastUpdated: '2026-02-28', usageCount: 52, owner: 'Sarah Garcia' },
  { id: 'TM-010', name: 'Expense Allocation Memo', category: 'Fund Accounting', version: 'v1.5', lastUpdated: '2026-01-05', usageCount: 18, owner: 'Steven Wright' },
  { id: 'TM-011', name: 'Valuation Summary Template', category: 'Valuations', version: 'v1.2', lastUpdated: '2025-09-15', usageCount: 12, owner: 'Daniel Foster' },
  { id: 'TM-012', name: 'Wire Instructions Form', category: 'Operations', version: 'v4.0', lastUpdated: '2026-03-10', usageCount: 96, owner: 'Rebecca Sanders' },
];
