/**
 * lib/permissions.ts
 *
 * Canopy RBAC — role derivation + permission checks.
 *
 * Roles are derived at runtime from InternalUser fields already in the DB
 * (adminPanelAccess, department, seniorityLevel).  No schema migration required.
 *
 * Auth wiring: when NextAuth + Microsoft Entra is live, the session token will
 * carry `email` and `adminPanelAccess`.  Until then, `CANOPY_DEV_ADMIN=true`
 * in `.env.local` bypasses auth and grants SYSTEM_ADMIN to every request.
 */

// ---------------------------------------------------------------------------
// Role enum
// ---------------------------------------------------------------------------

export type CanopyRole =
  | 'SYSTEM_ADMIN'
  | 'SLT'
  | 'FA_POD_LEAD'
  | 'FA_STAFF'
  | 'TAX'
  | 'COMPLIANCE'
  | 'FINANCE'
  | 'REVOPS'
  | 'ENGINEERING'
  | 'READ_ONLY';

// ---------------------------------------------------------------------------
// Role metadata (display labels, colors, descriptions)
// ---------------------------------------------------------------------------

export const ROLE_META: Record<CanopyRole, {
  label: string;
  color: string;        // Tailwind bg+text classes
  badgeColor: string;   // used in chips
  description: string;
}> = {
  SYSTEM_ADMIN: {
    label: 'System Admin',
    color: 'bg-red-50 text-red-700',
    badgeColor: 'bg-red-100 text-red-700 border border-red-200',
    description: 'Unrestricted access to all data, settings, and security controls.',
  },
  SLT: {
    label: 'SLT',
    color: 'bg-purple-50 text-purple-700',
    badgeColor: 'bg-purple-100 text-purple-700',
    description: 'Read access to all KPIs, pipeline, financials, and executive dashboards.',
  },
  FA_POD_LEAD: {
    label: 'FA Pod Lead',
    color: 'bg-teal-50 text-teal-700',
    badgeColor: 'bg-teal-100 text-teal-700',
    description: "Full access to own pod's clients, entities, investors, and team.",
  },
  FA_STAFF: {
    label: 'FA Staff',
    color: 'bg-emerald-50 text-emerald-700',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    description: 'Access limited to assigned clients and entities.',
  },
  TAX: {
    label: 'Tax',
    color: 'bg-amber-50 text-amber-700',
    badgeColor: 'bg-amber-100 text-amber-700',
    description: 'Access to tax fields, K-1 delivery, and tax allocations across all entities.',
  },
  COMPLIANCE: {
    label: 'Compliance',
    color: 'bg-orange-50 text-orange-700',
    badgeColor: 'bg-orange-100 text-orange-700',
    description: 'Audit-mode access to all data, governance logs, and KYC/AML fields.',
  },
  FINANCE: {
    label: 'Finance',
    color: 'bg-blue-50 text-blue-700',
    badgeColor: 'bg-blue-100 text-blue-700',
    description: 'Access to P&L, ARR waterfall, treasury, and billing data.',
  },
  REVOPS: {
    label: 'RevOps / CS',
    color: 'bg-indigo-50 text-indigo-700',
    badgeColor: 'bg-indigo-100 text-indigo-700',
    description: 'Access to pipeline CRM, client health, proposals, and ARR metrics.',
  },
  ENGINEERING: {
    label: 'Engineering',
    color: 'bg-gray-100 text-gray-700',
    badgeColor: 'bg-gray-200 text-gray-700',
    description: 'Access to product/eng module, incident dashboard, and deployment pipeline.',
  },
  READ_ONLY: {
    label: 'Read Only',
    color: 'bg-gray-50 text-gray-500',
    badgeColor: 'bg-gray-100 text-gray-500',
    description: 'View-only access to non-sensitive dashboards and reports.',
  },
};

// ---------------------------------------------------------------------------
// Permission scope definition
// ---------------------------------------------------------------------------

export type PermissionScope =
  | 'clients.all'
  | 'clients.pod'
  | 'clients.assigned'
  | 'entities.all'
  | 'entities.pod'
  | 'entities.assigned'
  | 'waterfall.all'
  | 'waterfall.pod'
  | 'waterfall.summary'
  | 'investors.all'
  | 'investors.pod'
  | 'investors.kyc'
  | 'users.all'
  | 'users.pod'
  | 'users.self'
  | 'security.edit'
  | 'security.view'
  | 'security.audit'
  | 'financials.all'
  | 'financials.arr'
  | 'pipeline.all'
  | 'pipeline.arr'
  | 'tax.all'
  | 'engineering.all';

const ROLE_SCOPES: Record<CanopyRole, PermissionScope[]> = {
  SYSTEM_ADMIN: [
    'clients.all', 'entities.all', 'waterfall.all', 'investors.all',
    'users.all', 'security.edit', 'security.view', 'security.audit',
    'financials.all', 'pipeline.all', 'tax.all', 'engineering.all',
  ],
  SLT: [
    'clients.all', 'entities.all', 'waterfall.summary', 'investors.all',
    'users.all', 'security.view', 'financials.all', 'pipeline.all',
  ],
  FA_POD_LEAD: [
    'clients.pod', 'entities.pod', 'waterfall.pod', 'investors.pod',
    'users.pod',
  ],
  FA_STAFF: [
    'clients.assigned', 'entities.assigned', 'waterfall.pod', 'investors.pod',
    'users.self',
  ],
  TAX: [
    'clients.all', 'entities.all', 'waterfall.summary', 'tax.all', 'users.self',
  ],
  COMPLIANCE: [
    'clients.all', 'entities.all', 'waterfall.all', 'investors.kyc',
    'users.all', 'security.audit',
  ],
  FINANCE: [
    'waterfall.summary', 'financials.all', 'pipeline.arr', 'users.self',
  ],
  REVOPS: [
    'pipeline.all', 'financials.arr', 'users.self',
  ],
  ENGINEERING: [
    'engineering.all', 'users.self',
  ],
  READ_ONLY: [
    'users.self',
  ],
};

// ---------------------------------------------------------------------------
// Role derivation from InternalUser fields
// ---------------------------------------------------------------------------

export interface UserRoleInput {
  adminPanelAccess: boolean;
  department: string;
  seniorityLevel?: string | null;
}

/**
 * Derive a CanopyRole from existing InternalUser fields.
 * Order matters — SYSTEM_ADMIN and SLT checks come first.
 */
export function deriveRole(u: UserRoleInput): CanopyRole {
  if (u.adminPanelAccess) return 'SYSTEM_ADMIN';

  const dept = u.department ?? '';
  const level = u.seniorityLevel ?? '';

  // SLT: director-level seniority (M5/M6) or explicit SLT/Executive department
  if (['SLT', 'Executive', 'C-Suite'].includes(dept)) return 'SLT';
  if (['M5', 'M6'].includes(level)) return 'SLT';

  // FA pods (CSV departments: FA - Fund Accounting, FA - Core IS, FA - Capital Events, etc.)
  if (dept.startsWith('FA -') || dept === 'FA - General') {
    if (['M3', 'M4', 'M5'].includes(level)) return 'FA_POD_LEAD';
    return 'FA_STAFF';
  }

  // Tax
  if (dept === 'Tax' || dept === 'Tax Services') return 'TAX';

  // Compliance / Legal
  if (dept === 'Compliance' || dept === 'Legal') return 'COMPLIANCE';

  // Finance / Accounting
  if (['Finance', 'Corp Accounting', 'Corporate Accounting', 'Corporate Operations', 'Billing', 'FP&A'].includes(dept)) {
    return 'FINANCE';
  }

  // RevOps / CS / Sales / GPX
  if (dept.startsWith('Sales -') || dept === 'Sales - General') return 'REVOPS';
  if (dept.startsWith('GPX -') || dept === 'GPX - General') return 'REVOPS';

  // Engineering / Product / Data / IT
  if (['Engineering', 'Product Management', 'Product', 'Data', 'Technology', 'IT'].includes(dept)) return 'ENGINEERING';

  return 'READ_ONLY';
}

// ---------------------------------------------------------------------------
// Permission check helpers
// ---------------------------------------------------------------------------

export function hasScope(role: CanopyRole, scope: PermissionScope): boolean {
  return ROLE_SCOPES[role].includes(scope);
}

export function can(u: UserRoleInput, scope: PermissionScope): boolean {
  return hasScope(deriveRole(u), scope);
}

// ---------------------------------------------------------------------------
// Scope matrix for the Security Center Role Definitions tab
// ---------------------------------------------------------------------------

export interface ScopeMatrixRow {
  area: string;
  scopes: Array<{ label: string; scope: PermissionScope }>;
}

export const SCOPE_MATRIX: ScopeMatrixRow[] = [
  {
    area: 'Clients & Entities',
    scopes: [
      { label: 'All clients', scope: 'clients.all' },
      { label: 'Own pod', scope: 'clients.pod' },
      { label: 'Assigned only', scope: 'clients.assigned' },
    ],
  },
  {
    area: 'Waterfall & NAV',
    scopes: [
      { label: 'Full waterfall', scope: 'waterfall.all' },
      { label: 'Pod waterfall', scope: 'waterfall.pod' },
      { label: 'Summary only', scope: 'waterfall.summary' },
    ],
  },
  {
    area: 'Investors',
    scopes: [
      { label: 'All investors', scope: 'investors.all' },
      { label: 'Fund LPs (pod)', scope: 'investors.pod' },
      { label: 'KYC/AML fields', scope: 'investors.kyc' },
    ],
  },
  {
    area: 'Internal Users',
    scopes: [
      { label: 'All users', scope: 'users.all' },
      { label: 'Own pod', scope: 'users.pod' },
      { label: 'Self only', scope: 'users.self' },
    ],
  },
  {
    area: 'Security Center',
    scopes: [
      { label: 'Edit permissions', scope: 'security.edit' },
      { label: 'View matrix', scope: 'security.view' },
      { label: 'Audit log', scope: 'security.audit' },
    ],
  },
  {
    area: 'Financials',
    scopes: [
      { label: 'All financials', scope: 'financials.all' },
      { label: 'ARR only', scope: 'financials.arr' },
    ],
  },
  {
    area: 'Pipeline',
    scopes: [
      { label: 'Full pipeline', scope: 'pipeline.all' },
      { label: 'ARR view', scope: 'pipeline.arr' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Title → seniorityLevel derivation (used in seed + API)
// ---------------------------------------------------------------------------

export function deriveSeniorityFromTitle(title: string): string {
  const t = title.toLowerCase();
  if (/\b(ceo|coo|cfo|cto|cdo|cpo)\b/.test(t)) return 'M6';
  if (/\b(svp|general manager|managing director)\b/.test(t)) return 'M5';
  if (/\bvp[, ]|vice president\b/.test(t)) return 'M5';
  if (/\bsenior director\b/.test(t)) return 'M4';
  if (/\bdirector[, ]\b/.test(t) && !/\bassistant\b/.test(t)) return 'M3';
  if (/\b(senior manager|group manager)\b/.test(t)) return 'M3';
  if (/\bmanager[, ]\b/.test(t) && !/\b(assistant|asst)\b/.test(t)) return 'M2';
  if (/\b(assistant manager|asst manager)\b/.test(t)) return 'P3';
  if (/\b(lead|staff|principal)\b/.test(t)) return 'P4';
  if (/\bsenior\b/.test(t)) return 'P3';
  if (/\bassociate ii\b/.test(t)) return 'P2';
  if (/\bassociate\b/.test(t)) return 'P1';
  return 'P2';
}

// ---------------------------------------------------------------------------
// Department → module access mapping (used in seed + API)
// ---------------------------------------------------------------------------

export interface ModuleAccessFlags {
  crmAccess: boolean;
  investorPortalAccess: boolean;
  reportingPlatformAccess: boolean;
  complianceSystemAccess: boolean;
  dataWarehouseAccess: boolean;
  biToolAccess: boolean;
  apiAccess: boolean;
  adminPanelAccess: boolean;
  documentMgmtAccess: boolean;
  hrSystemAccess: boolean;
  githubAccess: boolean;
  vpnAccess: boolean;
}

export function deriveModuleAccess(
  department: string,
  seniorityLevel: string,
  email?: string,
): ModuleAccessFlags {
  const dept = department ?? '';
  const level = seniorityLevel ?? '';
  const levelWeight = gradeWeightFromLevel(level);

  const flags: ModuleAccessFlags = {
    crmAccess: false,
    investorPortalAccess: false,
    reportingPlatformAccess: false,
    complianceSystemAccess: false,
    dataWarehouseAccess: false,
    biToolAccess: false,
    apiAccess: false,
    adminPanelAccess: false,
    documentMgmtAccess: false,
    hrSystemAccess: false,
    githubAccess: false,
    vpnAccess: false,
  };

  // FA departments
  if (dept.startsWith('FA -') || dept === 'FA - General') {
    flags.investorPortalAccess = true;
    flags.documentMgmtAccess = true;
    flags.reportingPlatformAccess = true;
  }
  if (dept === 'FA - Fund Accounting') {
    flags.complianceSystemAccess = true;
  }
  if (dept === 'FA - Core IS') {
    flags.dataWarehouseAccess = true;
    flags.apiAccess = true;
  }

  // Engineering
  if (dept === 'Engineering') {
    flags.githubAccess = true;
    flags.apiAccess = true;
    flags.dataWarehouseAccess = true;
  }

  // Product
  if (dept === 'Product Management') {
    flags.biToolAccess = true;
    flags.reportingPlatformAccess = true;
  }

  // Sales
  if (dept.startsWith('Sales -') || dept === 'Sales - General') {
    flags.crmAccess = true;
  }
  if (dept === 'Sales - Rev Ops') {
    flags.biToolAccess = true;
    flags.dataWarehouseAccess = true;
    flags.reportingPlatformAccess = true;
  }

  // GPX
  if (dept.startsWith('GPX -') || dept === 'GPX - General') {
    flags.crmAccess = true;
    flags.investorPortalAccess = true;
    flags.documentMgmtAccess = true;
  }

  // Marketing
  if (dept === 'Marketing') {
    flags.crmAccess = true;
    flags.biToolAccess = true;
  }

  // Corporate Operations
  if (dept === 'Corporate Operations') {
    flags.reportingPlatformAccess = true;
    flags.biToolAccess = true;
  }

  // People
  if (dept === 'People') {
    flags.hrSystemAccess = true;
  }

  // IT
  if (dept === 'IT') {
    flags.githubAccess = true;
    flags.apiAccess = true;
    flags.dataWarehouseAccess = true;
    flags.vpnAccess = true;
  }

  // Office of CEO/COO
  if (dept.startsWith('Office of the')) {
    flags.reportingPlatformAccess = true;
    flags.biToolAccess = true;
  }

  // Business Operations
  if (dept === 'Business Operations') {
    flags.dataWarehouseAccess = true;
    flags.biToolAccess = true;
    flags.reportingPlatformAccess = true;
  }

  // Facilities
  if (dept === 'Facilities') {
    // minimal access
  }

  // --- Seniority overrides ---
  if (levelWeight >= 6) { // M5+ (SVP/VP/C-suite)
    flags.biToolAccess = true;
    flags.reportingPlatformAccess = true;
  }
  if (levelWeight >= 5) { // M4+ (Senior Director+)
    flags.documentMgmtAccess = true;
  }
  if (levelWeight >= 4 || dept === 'IT') { // M3+ or IT
    flags.vpnAccess = true;
  }

  // --- Special overrides (System Admins) ---
  const adminEmails = ['bwayne@junipersquare.com', 'ahyder@junipersquare.com', 'chammond@junipersquare.com'];
  if (email && adminEmails.includes(email.toLowerCase())) {
    Object.keys(flags).forEach((k) => { (flags as any)[k] = true; });
  }

  return flags;
}

function gradeWeightFromLevel(level: string): number {
  const m = level.match(/^([PM])([1-9])$/);
  if (!m) return 0;
  const track = m[1];
  const num = Number(m[2]);
  return track === 'P' ? num : num + 1; // M2≈P3, M3≈P4, M4≈P5, M5≈P6, M6≈P7
}

// ---------------------------------------------------------------------------
// TL-level derivation (graph-based from reporting chain)
// ---------------------------------------------------------------------------

export interface TlInput {
  name: string;        // "First Last" display name
  managerName: string | null;
}

/**
 * Derive TL levels for all users from the reporting chain.
 * TL0 = no manager (dept heads / CEO)
 * TL1 = reports to TL0
 * TL2 = reports to TL1
 * ...
 * TL9 = maximum depth (capped)
 */
export function deriveTlLevels(users: TlInput[]): Map<string, number> {
  const nameToManager = new Map<string, string | null>();
  for (const u of users) {
    nameToManager.set(u.name, u.managerName);
  }

  const cache = new Map<string, number>();

  function getTl(name: string): number {
    if (cache.has(name)) return cache.get(name)!;

    const mgr = nameToManager.get(name);
    if (!mgr) {
      cache.set(name, 0);
      return 0;
    }

    // Guard against cycles
    if (!nameToManager.has(mgr)) {
      cache.set(name, 1); // manager not in dataset → treat as TL1
      return 1;
    }

    const mgrTl = getTl(mgr);
    const tl = Math.min(mgrTl + 1, 9); // cap at TL9
    cache.set(name, tl);
    return tl;
  }

  for (const u of users) {
    getTl(u.name);
  }

  return cache;
}

// ---------------------------------------------------------------------------
// Mock current user (dev mode — replaced by NextAuth session in production)
// ---------------------------------------------------------------------------

/**
 * In production: replace this with `getServerSession(authOptions)` from `lib/auth.ts`
 * and read the role from the JWT token claims synced from Entra.
 *
 * Dev fallback: returns Billy Wayne as SYSTEM_ADMIN if no real session exists.
 */
export const DEV_CURRENT_USER = {
  id: 'dev-billy-wayne',
  email: 'bwayne@junipersquare.com',
  firstName: 'Billy',
  lastName: 'Wayne',
  role: 'SYSTEM_ADMIN' as CanopyRole,
  adminPanelAccess: true,
  department: 'FA - Fund Accounting',
  seniorityLevel: 'M4',
};
