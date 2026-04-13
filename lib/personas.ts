export type Seniority = 'exec' | 'director' | 'manager' | 'ic-senior' | 'lead';

export interface Capabilities {
  // domains the persona can VIEW (render widgets for) — hides everything else
  view: string[];
  // domains with READ detail access (drill-in, export)
  read: string[];
  // domains with WRITE (edit, approve, trigger agent actions)
  write: string[];
}

export interface CompanyKpi {
  title: string;
  value: string;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  color?: 'green' | 'teal' | 'signal' | 'amber' | 'red';
}

export interface Persona {
  id: string;
  name: string;
  title: string;
  department: string;
  seniority: Seniority;
  avatarInitials: string;
  capabilities: Capabilities;
  // Entity-level access: 'all' = full book, or array of client names this persona is permissioned to
  entityAccess: 'all' | string[];
  placeholder: string;
  suggestedPrompts: string[];
  companyKpis: CompanyKpi[];
  widgets: string[];
}

// Company-wide KPI bank — we slice this per persona by seniority
const ALL_COMPANY_KPIS: CompanyKpi[] = [
  { title: 'AUM', value: '$47.2B', change: '+3.1% QoQ', changeType: 'up', color: 'green' },
  { title: 'Net Revenue YTD', value: '$148.6M', change: '+12% YoY', changeType: 'up', color: 'signal' },
  { title: 'Operating Margin', value: '31.4%', change: '+120 bps', changeType: 'up', color: 'teal' },
  { title: 'Client NPS', value: '68', change: '+4', changeType: 'up', color: 'green' },
  { title: 'Headcount', value: '412', change: '+18 QTD', changeType: 'up', color: 'teal' },
  { title: 'Close On-Time %', value: '94.2%', change: '+1.8%', changeType: 'up', color: 'signal' },
];

export const PERSONAS: Persona[] = [
  {
    id: 'christine-egbert',
    name: 'Christine Egbert',
    title: 'GM, Fund Administration',
    department: 'Fund Admin',
    seniority: 'exec',
    avatarInitials: 'CE',
    capabilities: {
      view: ['fund-admin', 'clients', 'close', 'people', 'finance', 'recruiting', 'bizops', 'engineering'],
      read: ['fund-admin', 'clients', 'close', 'people', 'finance', 'recruiting', 'bizops', 'engineering'],
      write: ['fund-admin', 'clients', 'close', 'people'],
    },
    entityAccess: 'all',
    placeholder: 'Ask about org health, escalations, close status, client risk…',
    suggestedPrompts: [
      'Which clients are at risk this quarter?',
      'Show me pods trending below SLA',
      'Where are close escalations concentrated?',
    ],
    companyKpis: ALL_COMPANY_KPIS,
    widgets: ['fund-admin-org-health', 'close-calendar-heatmap', 'escalations', 'flight-risk-roster'],
  },
  {
    id: 'dana-reyes',
    name: 'Dana Reyes',
    title: 'Senior Director, Fund Admin',
    department: 'Fund Admin',
    seniority: 'director',
    avatarInitials: 'DR',
    capabilities: {
      view: ['fund-admin', 'clients', 'close', 'people'],
      read: ['fund-admin', 'clients', 'close', 'people'],
      write: ['fund-admin', 'clients', 'close'],
    },
    entityAccess: ['Walker Asset Management', 'Campbell Capital Partners', 'Sullivan Investments', 'Cruz Capital Management', 'Rodriguez Capital Management'],
    placeholder: 'Ask about pod utilization, client health, SLA trend…',
    suggestedPrompts: [
      'Which pods are over 90% utilization?',
      'Overdue tasks by pod this week',
      'SLA trend for Walker III',
    ],
    companyKpis: ALL_COMPANY_KPIS.slice(0, 4),
    widgets: ['pod-utilization', 'client-health', 'overdue-by-pod', 'sla-trend'],
  },
  {
    id: 'marcus-lin',
    name: 'Marcus Lin',
    title: 'Fund Accounting Manager',
    department: 'Fund Admin',
    seniority: 'manager',
    avatarInitials: 'ML',
    capabilities: {
      view: ['fund-admin', 'close', 'people'],
      read: ['fund-admin', 'close', 'people'],
      write: ['fund-admin', 'close'],
    },
    entityAccess: ['Walker Asset Management', 'Campbell Capital Partners', 'Sullivan Investments'],
    placeholder: 'Ask about your team tasks, NAV close, utilization…',
    suggestedPrompts: [
      'Team task board for this week',
      'NAV close status by entity',
      "Who's overloaded on my team?",
    ],
    companyKpis: ALL_COMPANY_KPIS.slice(0, 2),
    widgets: ['team-task-board', 'nav-close-status', 'team-utilization'],
  },
  {
    id: 'priya-shah',
    name: 'Priya Shah',
    title: 'Senior Associate, Fund Accounting',
    department: 'Fund Admin',
    seniority: 'ic-senior',
    avatarInitials: 'PS',
    capabilities: {
      view: ['fund-admin', 'close'],
      read: ['fund-admin'],
      write: [],
    },
    entityAccess: ['Walker Asset Management', 'Campbell Capital Partners'],
    placeholder: 'Ask about your tasks, entities, timesheet…',
    suggestedPrompts: [
      'What do I owe today?',
      'NAV status for my entities',
      'My timesheet gaps this week',
    ],
    companyKpis: ALL_COMPANY_KPIS.slice(0, 1),
    widgets: ['my-tasks', 'my-entities-nav', 'my-timesheet'],
  },
  {
    id: 'jordan-bellamy',
    name: 'Jordan Bellamy',
    title: 'BizOps Lead',
    department: 'BizOps',
    seniority: 'lead',
    avatarInitials: 'JB',
    capabilities: {
      view: ['bizops', 'engineering', 'people'],
      read: ['bizops', 'engineering', 'people', 'finance'],
      write: ['bizops'],
    },
    entityAccess: 'all',
    placeholder: 'Ask about Jira projects, internal app adoption, tool spend…',
    suggestedPrompts: [
      'Open Jira by project',
      'Internal app adoption this month',
      'Top 5 SaaS spend items',
    ],
    companyKpis: [ALL_COMPANY_KPIS[4], ALL_COMPANY_KPIS[2]],
    widgets: ['jira-board', 'app-adoption', 'tool-spend'],
  },
  {
    id: 'alex-rivera',
    name: 'Alex Rivera',
    title: 'Recruiting Partner',
    department: 'Recruiting',
    seniority: 'lead',
    avatarInitials: 'AR',
    capabilities: {
      view: ['recruiting', 'people'],
      read: ['recruiting', 'people'],
      write: ['recruiting'],
    },
    entityAccess: 'all',
    placeholder: 'Ask about open reqs, pipeline, upcoming starts…',
    suggestedPrompts: [
      'Open reqs this week',
      'Upcoming starts next 30 days',
      'Time-to-fill by department',
    ],
    companyKpis: [ALL_COMPANY_KPIS[4], ALL_COMPANY_KPIS[1]],
    widgets: ['open-reqs', 'pipeline-funnel', 'upcoming-starts'],
  },
  {
    id: 'sam-okafor',
    name: 'Sam Okafor',
    title: 'Finance Controller',
    department: 'Finance',
    seniority: 'director',
    avatarInitials: 'SO',
    capabilities: {
      view: ['finance', 'fund-admin', 'close'],
      read: ['finance', 'fund-admin', 'close', 'bizops'],
      write: ['finance', 'close'],
    },
    entityAccess: 'all',
    placeholder: 'Ask about month-end close, AP/AR, cash position…',
    suggestedPrompts: [
      'Month-end close checklist',
      "Is fund accounting done yet?",
      'Cash position across accounts',
    ],
    companyKpis: [ALL_COMPANY_KPIS[1], ALL_COMPANY_KPIS[2], ALL_COMPANY_KPIS[5]],
    widgets: ['workflow-status', 'close-checklist', 'cash-position'],
  },
  {
    id: 'taylor-kim',
    name: 'Taylor Kim',
    title: 'Engineering Manager',
    department: 'Engineering',
    seniority: 'manager',
    avatarInitials: 'TK',
    capabilities: {
      view: ['engineering', 'bizops', 'people'],
      read: ['engineering', 'bizops', 'people'],
      write: ['engineering'],
    },
    entityAccess: 'all',
    placeholder: 'Ask about Jira velocity, bugs, deploys, on-call…',
    suggestedPrompts: [
      'Sprint velocity last 4 weeks',
      'Open P0/P1 bugs',
      'Deploy frequency this month',
    ],
    companyKpis: [ALL_COMPANY_KPIS[4], ALL_COMPANY_KPIS[2]],
    widgets: ['eng-velocity', 'open-bugs', 'deploy-frequency'],
  },
];

export const DEFAULT_PERSONA_ID = 'christine-egbert';

export function getPersona(id: string): Persona {
  return PERSONAS.find((p) => p.id === id) ?? PERSONAS[0];
}
