export interface DashboardData {
  totalAum: number;
  totalClients: number;
  totalEntities: number;
  activeTaskAssignments: number;
  overdueTaskCount: number;
  completedTaskCount: number;
  aumTrend: { month: string; aum: number }[];
  strategyBreakdown: { strategy: string; aum: number; count: number }[];
  tasksByStatus: { status: string; count: number }[];
  recentActivity: ActivityItem[];
  topClients: { name: string; navMm: number; entities: number; marginPct: number }[];
  entityTypeDistribution: { type: string; count: number }[];
  totalCommunications: number;
  totalProjects: number;
  totalTreasuryBalance: number;
}

export interface ActivityItem {
  id: string;
  action: string;
  subject: string;
  timestamp: string;
  user?: string;
  icon?: string;
}

export interface ClientRow {
  id: string;
  name: string;
  shortName: string | null;
  primaryStrategy: string;
  hqCity: string;
  region: string;
  status: string;
  totalEntities: number;
  totalNavMm: number;
  totalCommitmentMm: number;
  revenueL12m: number;
  marginPct: number;
  teamLead: string;
}

export interface EntityRow {
  id: string;
  entityId: string;
  name: string;
  entityType: string;
  strategy: string;
  clientName: string;
  domicile: string;
  navMm: number;
  grossIrrPct: number | null;
  netIrrPct: number | null;
  lifecycleStatus: string;
  dataQualityScore: number | null;
}

export interface InvestorRow {
  id: string;
  investorId: string;
  name: string;
  investorType: string;
  commitmentMm: number;
  navMm: number | null;
  domicile: string;
  entityName: string | null;
  status: string;
}

export interface SecurityRow {
  id: string;
  securityId: string;
  name: string;
  securityType: string;
  ticker: string | null;
  marketValue: number | null;
  costBasis: number | null;
  unrealizedGain: number | null;
  sector: string | null;
  currency: string;
}

export interface TaskDefinitionRow {
  id: string;
  taskCode: string;
  name: string;
  category: string;
  frequency: string;
  estimatedMinutes: number;
  priority: string;
  department: string;
  assignmentCount: number;
}

export interface TaskAssignmentRow {
  id: string;
  taskName: string;
  taskCode: string;
  entityName: string;
  assignedTo: string | null;
  status: string;
  dueDate: string;
  periodEnd: string;
  priority: string;
}

export interface AISkillRow {
  id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  accuracy: number | null;
  model: string;
  runCount: number;
  lastRun: string | null;
}

export interface InternalUserRow {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  title: string;
  role: string;
  department: string;
  email: string;
  officeLocation: string | null;
  employmentStatus: string;
  utilizationActual: number | null;
  utilizationTarget: number | null;
  clientsManaged: number;
  tasksAssigned: number;
  tasksOverdue: number;
  performanceRating: string | null;
}

export interface ExternalContactRow {
  id: string;
  contactId: string;
  name: string;
  organization: string;
  role: string;
  contactType: string;
  email: string | null;
  city: string | null;
  status: string;
}

export interface DocumentRow {
  id: string;
  documentId: string;
  name: string;
  documentType: string;
  entityName: string | null;
  clientName: string | null;
  status: string;
  uploadedBy: string | null;
  uploadDate: string;
  version: string;
  confidentiality: string;
}

export interface AgentRow {
  id: string;
  name: string;
  description: string;
  category: string;
  provider: string;
  status: string;
  rating: number | null;
  reviewCount: number;
  monthlyPrice: number | null;
  capabilities: string[];
  icon: string | null;
}

export interface ProjectRow {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  projectType: string;
  status: string;
  priority: string;
  clientName: string | null;
  leadName: string | null;
  startDate: string;
  targetEndDate: string;
  completionPct: number;
  totalTasks: number;
  completedTasks: number;
}

export interface CalendarEventRow {
  id: string;
  eventId: string;
  title: string;
  description: string | null;
  eventType: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  location: string | null;
  clientName: string | null;
  status: string;
  priority: string;
}

export interface CommunicationRow {
  id: string;
  communicationId: string;
  channel: string;
  direction: string;
  subject: string;
  summary: string | null;
  fromName: string;
  toName: string;
  clientName: string | null;
  sentiment: string | null;
  urgency: string;
  status: string;
  communicationDate: string;
  hasAttachments: boolean;
}

export interface TreasuryAccountRow {
  id: string;
  accountId: string;
  accountName: string;
  accountType: string;
  institution: string;
  currentBalance: number;
  availableBalance: number;
  pendingInflows: number;
  pendingOutflows: number;
  entityName: string | null;
  status: string;
}

export interface CashFlowRow {
  id: string;
  cashFlowId: string;
  flowType: string;
  category: string;
  amount: number;
  accountName: string;
  entityName: string | null;
  counterparty: string | null;
  description: string | null;
  transactionDate: string;
  status: string;
}

export interface RuleNode {
  id: string;
  ruleId: string;
  name: string;
  description: string;
  ruleType: string;
  formula: string;
  inputFields: string[];
  outputField: string;
  dependsOn: string[];
  priority: number;
  status: string;
  category: string;
}

export interface RelationshipEdge {
  id: string;
  relationshipId: string;
  sourceType: string;
  sourceName: string;
  targetType: string;
  targetName: string;
  relationshipType: string;
  status: string;
}

export interface ToolRow {
  id: string;
  toolId: string;
  name: string;
  description: string;
  category: string;
  builtBy: string;
  status: string;
  version: string;
  language: string | null;
  runCount: number;
  lastRunDate: string | null;
  tags: string[];
}
