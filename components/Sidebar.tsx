'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Database, FileText, Bot, FolderKanban, GitBranch,
  Network, ChevronDown, ChevronRight, Calendar, MessageSquare, Landmark,
  Wrench, Users, Building2, UserCheck, Shield, ClipboardList, ClipboardCheck,
  Brain, Contact, BookOpen, FileBarChart, Settings2, ArrowLeftRight,
  PieChart, Banknote, ListChecks, BookOpenCheck, Wallet, BarChart3,
  Activity, ShieldCheck, Target, Clock, TrendingUp, Eye, Briefcase,
  Receipt, Scale, UserCog, LineChart, Gauge, AlertCircle, BadgeDollarSign,
  Layers, CircleDollarSign
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: any;
}

const dataVaultItems: NavItem[] = [
  { label: 'GPs', href: '/data-vault/clients', icon: Building2 },
  { label: 'Entities', href: '/data-vault/entities', icon: Database },
  { label: 'Investors', href: '/data-vault/investors', icon: Users },
  { label: 'Security Master', href: '/data-vault/security-master', icon: Shield },
  { label: 'Task Definitions', href: '/data-vault/task-definitions', icon: ClipboardList },
  { label: 'Trans Parameters', href: '/trans-parameters', icon: Settings2 },
  { label: 'AI Skills', href: '/data-vault/ai-skills', icon: Brain },
  { label: 'Internal Users', href: '/data-vault/internal-users', icon: UserCheck },
  { label: 'External Contacts', href: '/data-vault/external-contacts', icon: Contact },
];

const docsVaultItems: NavItem[] = [
  { label: 'All Documents', href: '/docs-vault', icon: FileText },
  { label: 'Fund Documents', href: '/docs-vault/fund-documents', icon: Briefcase },
  { label: 'Legal', href: '/docs-vault/legal', icon: Scale },
  { label: 'Compliance', href: '/docs-vault/compliance', icon: ShieldCheck },
  { label: 'Investor Reports', href: '/docs-vault/investor-reports', icon: Eye },
  { label: 'Templates', href: '/docs-vault/templates', icon: FileBarChart },
];

const ruleGraphItems: NavItem[] = [
  { label: 'Deterministic Rules', href: '/rule-graph', icon: GitBranch },
  { label: 'Waterfall Tree', href: '/rule-graph/waterfall', icon: Layers },
  { label: 'Fee Calculation', href: '/rule-graph/fee-calc', icon: Receipt },
  { label: 'NAV Calculation', href: '/rule-graph/nav-calc', icon: CircleDollarSign },
  { label: 'Partner Allocation', href: '/rule-graph/allocation', icon: Users },
];

const relationshipItems: NavItem[] = [
  { label: 'Entity Map', href: '/relationships', icon: Network },
  { label: 'Task Assignments', href: '/data-vault/task-assignments', icon: ClipboardCheck },
  { label: 'Employee Assignments', href: '/relationships/employee-assignments', icon: UserCog },
];

const dashboardItems: NavItem[] = [
  { label: 'Cash', href: '/dashboards/cash', icon: Banknote },
  { label: 'Portfolio Summary', href: '/dashboards/portfolio-summary', icon: PieChart },
  { label: 'NAV', href: '/dashboards/nav', icon: CircleDollarSign },
  { label: 'Analytics', href: '/dashboards/analytics', icon: BarChart3 },
  { label: 'Control Checks', href: '/dashboards/control-checks', icon: ShieldCheck },
  { label: 'Workflow', href: '/dashboards/workflow', icon: Activity },
  { label: 'AI Summary', href: '/dashboards/ai-summary', icon: Brain },
  { label: 'Timesheet Analytics', href: '/dashboards/timesheet-analytics', icon: Clock },
  { label: 'GP Direct Margin', href: '/dashboards/gp-direct-margin', icon: TrendingUp },
  { label: 'Team Lead Margins', href: '/dashboards/team-lead-margins', icon: Target },
  { label: 'GP OS Invoices', href: '/dashboards/gp-os-invoices', icon: Receipt },
  { label: 'CFO Persona', href: '/dashboards/cfo-persona', icon: Briefcase },
  { label: 'IR Persona', href: '/dashboards/ir-persona', icon: Eye },
  { label: 'Auditor Persona', href: '/dashboards/auditor-persona', icon: BookOpenCheck },
  { label: 'Compliance', href: '/dashboards/compliance', icon: Scale },
  { label: 'Risk', href: '/dashboards/risk', icon: AlertCircle },
  { label: 'Treasury Center', href: '/treasury', icon: Landmark },
  { label: 'AUM Tracker', href: '/dashboards/aum-tracker', icon: LineChart },
  { label: 'Fee Reconciliation', href: '/dashboards/fee-reconciliation', icon: BadgeDollarSign },
  { label: 'Investor Relations', href: '/dashboards/investor-relations', icon: Users },
  { label: 'Fund Performance', href: '/dashboards/fund-performance', icon: Gauge },
];

const activityItems: NavItem[] = [
  { label: 'Communications', href: '/communications', icon: MessageSquare },
  { label: 'Calendar', href: '/calendar', icon: Calendar },
  { label: 'Tasks', href: '/activity/task-list', icon: ListChecks },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'GL', href: '/activity/gl', icon: BookOpen },
  { label: 'Cash', href: '/activity/cash', icon: Wallet },
  { label: 'Portfolio', href: '/activity/portfolio-transactions', icon: Layers },
  { label: 'Capital', href: '/activity/capital', icon: BadgeDollarSign },
  { label: 'All Transactions', href: '/trans', icon: ArrowLeftRight },
];

function CollapsibleSection({
  label,
  icon: Icon,
  items,
  isOpen,
  onToggle,
  isActive,
}: {
  label: string;
  icon: any;
  items: NavItem[];
  isOpen: boolean;
  onToggle: () => void;
  isActive: (href: string) => boolean;
}) {
  const sectionActive = items.some((item) => isActive(item.href));

  return (
    <div>
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] rounded-md transition-all duration-200 ${
          sectionActive
            ? 'bg-[#00C97B]/10 text-[#00C97B] font-semibold'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="flex-1 text-left">{label}</span>
        {isOpen ? (
          <ChevronDown className="w-3 h-3 opacity-50" />
        ) : (
          <ChevronRight className="w-3 h-3 opacity-50" />
        )}
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="ml-3 pl-3 border-l border-white/[0.06] mt-0.5 space-y-px">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-2.5 py-[5px] text-[11px] rounded-md transition-all duration-150 ${
                isActive(item.href)
                  ? 'bg-[#00C97B]/10 text-[#00C97B] font-medium'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
              }`}
            >
              <item.icon className="w-3 h-3 flex-shrink-0 opacity-60" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    dataVault: pathname.startsWith('/data-vault') || pathname === '/trans-parameters',
    docsVault: pathname.startsWith('/docs-vault'),
    ruleGraph: pathname.startsWith('/rule-graph'),
    relationships: pathname.startsWith('/relationships') || pathname.startsWith('/data-vault/task-assignments'),
    dashboards: pathname.startsWith('/dashboards') || pathname === '/treasury',
    activity: ['/trans', '/projects', '/calendar', '/communications', '/activity'].some((p) => pathname.startsWith(p)),
  });

  const toggle = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const linkClass = (href: string) =>
    `flex items-center gap-2.5 px-3 py-1.5 text-[12px] rounded-md transition-all duration-200 ${
      isActive(href)
        ? 'bg-[#00C97B]/10 text-[#00C97B] font-semibold'
        : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`;

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-56 bg-[#1B3A4B] flex flex-col z-50">
      {/* Logo */}
      <div className="px-4 py-3 border-b border-white/[0.08]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#00C97B] flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-white font-black text-[15px] tracking-wide leading-none">CANOPY 2.0</div>
            <div className="text-[#00C97B]/70 text-[9px] font-medium tracking-[0.12em] uppercase">Internal Fund Admin Platform</div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-2 px-2 space-y-px">
        {/* Control Tower */}
        <Link href="/" className={linkClass('/')}>
          <LayoutDashboard className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Control Tower</span>
        </Link>

        {/* Data Vault */}
        <CollapsibleSection
          label="Data Vault"
          icon={Database}
          items={dataVaultItems}
          isOpen={openSections.dataVault}
          onToggle={() => toggle('dataVault')}
          isActive={isActive}
        />

        {/* Docs Vault */}
        <CollapsibleSection
          label="Docs Vault"
          icon={FileText}
          items={docsVaultItems}
          isOpen={openSections.docsVault}
          onToggle={() => toggle('docsVault')}
          isActive={isActive}
        />

        {/* Rule Graph */}
        <CollapsibleSection
          label="Deterministic Rules"
          icon={GitBranch}
          items={ruleGraphItems}
          isOpen={openSections.ruleGraph}
          onToggle={() => toggle('ruleGraph')}
          isActive={isActive}
        />

        {/* Relationships */}
        <CollapsibleSection
          label="System Relationships"
          icon={Network}
          items={relationshipItems}
          isOpen={openSections.relationships}
          onToggle={() => toggle('relationships')}
          isActive={isActive}
        />

        {/* Separator */}
        <div className="pt-2 pb-1 px-3">
          <div className="h-px bg-white/[0.06]" />
        </div>

        {/* Dashboards */}
        <CollapsibleSection
          label="Dashboards"
          icon={BarChart3}
          items={dashboardItems}
          isOpen={openSections.dashboards}
          onToggle={() => toggle('dashboards')}
          isActive={isActive}
        />

        {/* Activity */}
        <CollapsibleSection
          label="Activity"
          icon={Activity}
          items={activityItems}
          isOpen={openSections.activity}
          onToggle={() => toggle('activity')}
          isActive={isActive}
        />

        {/* Separator */}
        <div className="pt-2 pb-1 px-3">
          <div className="h-px bg-white/[0.06]" />
        </div>

        {/* Reports */}
        <Link href="/reports" className={linkClass('/reports')}>
          <FileBarChart className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Reports</span>
        </Link>

        {/* Time Tracking */}
        <Link href="/time-tracking" className={linkClass('/time-tracking')}>
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Time Tracking</span>
        </Link>

        {/* Agent Marketplace */}
        <Link href="/marketplace" className={linkClass('/marketplace')}>
          <Bot className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Agent Marketplace</span>
        </Link>

        {/* Agent Prompting Layer */}
        <Link href="/agent-console" className={linkClass('/agent-console')}>
          <Bot className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Agent Prompting Layer</span>
        </Link>

        {/* Toolbox — bottom */}
        <Link href="/toolbox" className={linkClass('/toolbox')}>
          <Wrench className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Toolbox</span>
        </Link>
      </nav>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-white/[0.06]">
        <div className="text-[9px] text-gray-600 tracking-wide">Canopy v2.0 &middot; Juniper Square</div>
      </div>
    </aside>
  );
}
