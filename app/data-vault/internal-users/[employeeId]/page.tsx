'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, User, BarChart3, ClipboardCheck, BookOpen, Award } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import DataTable, { Column } from '@/components/DataTable';

/* ─── helpers ────────────────────────────────────────────────────── */

function FieldRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-start py-1.5 border-b border-gray-50 last:border-0">
      <span className="w-44 flex-shrink-0 text-xs text-gray-500 font-medium">{label}</span>
      <span className="text-xs text-gray-800 font-medium">{value ?? '—'}</span>
    </div>
  );
}

function FieldSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{title}</div>
      {children}
    </div>
  );
}

function ScoreBar({ score, color = 'default' }: { score: number | null; color?: 'default' | 'blue' }) {
  if (score == null) return <span className="text-gray-300 text-xs">—</span>;
  const pct = Math.round(score);
  const barColor = color === 'blue' ? 'bg-blue-500' : pct >= 90 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-700 font-semibold">{pct}%</span>
    </div>
  );
}

/* ─── LevelBadge for survey skill levels ─────────────────────────── */

const LEVEL_MAP: Record<string, { label: string; color: string }> = {
  'None': { label: 'None', color: 'bg-gray-100 text-gray-400' },
  'Entry-Level: 0-2 years': { label: 'Entry', color: 'bg-gray-200 text-gray-600' },
  'Junior-Level: 2-5 years': { label: 'Junior', color: 'bg-blue-50 text-blue-700' },
  'Mid-Level: 5-7 years': { label: 'Mid', color: 'bg-amber-50 text-amber-700' },
  'Senior-Level: 7-10 years': { label: 'Senior', color: 'bg-emerald-50 text-emerald-700' },
  'Specialist/Expert: 10+ years': { label: 'Expert', color: 'bg-purple-50 text-purple-700' },
};

function LevelBadge({ value }: { value: string | null }) {
  if (!value || value === 'None') return <span className="text-[10px] text-gray-300">—</span>;
  const mapped = LEVEL_MAP[value];
  const label = mapped?.label ?? value;
  const color = mapped?.color ?? 'bg-gray-100 text-gray-500';
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${color}`}>{label}</span>;
}

function SkillGrid({ skills }: { skills: Record<string, string> | null }) {
  if (!skills) return <div className="text-xs text-gray-400 py-4 text-center">No data</div>;
  const entries = Object.entries(skills);
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
      {entries.map(([skill, level]) => (
        <div key={skill} className="flex items-center justify-between py-1 border-b border-gray-50">
          <span className="text-xs text-gray-600 truncate pr-2">{skill}</span>
          <LevelBadge value={level} />
        </div>
      ))}
    </div>
  );
}

function parseSkills(raw: string | null): Record<string, string> | null {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function parseFirms(raw: string | null): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

const TABS = ['Profile', 'Identity', 'Performance', 'Tasks', 'Skills & Background', 'Survey Skills'] as const;
type Tab = typeof TABS[number];

const priorityColors: Record<string, string> = {
  Critical: 'bg-red-50 text-red-700', High: 'bg-orange-50 text-orange-700',
  Medium: 'bg-amber-50 text-amber-700', Low: 'bg-gray-50 text-gray-600',
};

/* ─── page ───────────────────────────────────────────────────────── */

export default function InternalUserDetailPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('Profile');

  useEffect(() => {
    fetch(`/api/internal-users/${employeeId}`)
      .then((r) => r.json())
      .then((d) => { if (d?.error) setData({ _error: d.error }); else setData(d); })
      .catch((e) => setData({ _error: e.message }))
      .finally(() => setLoading(false));
  }, [employeeId]);

  if (loading) return <div className="text-center py-16 text-gray-400">Loading employee…</div>;
  if (data?._error) return <div className="text-center py-16 text-red-400 text-xs whitespace-pre-wrap px-8">{data._error}</div>;
  if (!data?.user) return <div className="text-center py-16 text-red-400">Employee not found.</div>;

  const u = data.user;
  const survey = data.survey;
  const tasks: any[] = data.taskAssignments ?? [];

  const taskColumns: Column[] = [
    { key: 'taskName', label: 'Task', sortable: true,
      render: (v: string, row: any) => (
        <Link href={`/data-vault/task-assignments/${row.id}`} className="block group">
          <div className="font-semibold text-gray-900 group-hover:text-[#00C97B] text-xs">{v}</div>
          <div className="text-[10px] text-gray-400">{row.taskCode}</div>
        </Link>
      ),
    },
    { key: 'entityName', label: 'Entity', sortable: true },
    { key: 'status', label: 'Status', sortable: true, render: (v: string) => <StatusBadge status={v} /> },
    { key: 'priority', label: 'Priority', sortable: true, render: (v: string) => <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${priorityColors[v] ?? priorityColors.Medium}`}>{v}</span> },
    { key: 'dueDate', label: 'Due', sortable: true, render: (v: string) => <span className="text-xs">{v}</span> },
    { key: 'periodEnd', label: 'Period', sortable: true },
  ];

  const firmPills = (firms: string[]) => (
    <div className="flex flex-wrap gap-1 mt-1">
      {firms.length === 0
        ? <span className="text-xs text-gray-300">None listed</span>
        : firms.map((f) => <span key={f} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-medium">{f}</span>)
      }
    </div>
  );

  return (
    <div>
      <PageHeader
        title={`${u.firstName} ${u.lastName}`}
        subtitle={`${u.title} · ${u.department}`}
        breadcrumbs={[
          { label: 'Data Vault', href: '/data-vault' },
          { label: 'Internal Users', href: '/data-vault/internal-users' },
          { label: u.employeeId },
        ]}
        actions={
          <Link href="/data-vault/internal-users" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-md">
            <ArrowLeft className="w-3 h-3" /> Back
          </Link>
        }
      />

      {/* status bar */}
      <div className="flex items-center gap-3 bg-white rounded-lg shadow-sm px-4 py-2.5 mb-3 flex-wrap">
        <StatusBadge status={u.employmentStatus} />
        <span className="text-xs text-gray-500">{u.employmentType}</span>
        <div className="h-3 w-px bg-gray-200" />
        <span className="text-xs text-gray-500">{u.employeeId}</span>
        {u.remoteStatus && <><div className="h-3 w-px bg-gray-200" /><span className="text-xs text-gray-500">{u.remoteStatus}</span></>}
        {u.segment && <><div className="h-3 w-px bg-gray-200" /><span className="text-xs px-2 py-0.5 rounded-full bg-[#F0FBF6] text-[#005868] font-medium">{u.segment}</span></>}
      </div>

      {/* tabs */}
      <div className="flex gap-1 mb-3 bg-white rounded-lg shadow-sm p-1 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${tab === t ? 'bg-[#00C97B]/10 text-[#00C97B]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ─── PROFILE ──────────────────────────────────── */}
      {tab === 'Profile' && (
        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-3 bg-white rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-2 gap-6">
              <FieldSection title="Identity">
                <FieldRow label="Employee ID" value={u.employeeId} />
                <FieldRow label="First Name" value={u.firstName} />
                <FieldRow label="Last Name" value={u.lastName} />
                <FieldRow label="Preferred Name" value={u.preferredName} />
                <FieldRow label="Email" value={u.email} />
                <FieldRow label="Phone" value={u.phone} />
              </FieldSection>
              <FieldSection title="Role & Team">
                <FieldRow label="Title" value={u.title} />
                <FieldRow label="Role" value={u.role} />
                <FieldRow label="Department" value={u.department} />
                <FieldRow label="Division" value={u.division} />
                <FieldRow label="Team" value={u.team} />
                <FieldRow label="Pod" value={u.podId} />
                <FieldRow label="Manager" value={u.managerName} />
              </FieldSection>
            </div>
          </div>
          <div className="space-y-3">
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Employment</div>
              <FieldRow label="Status" value={u.employmentStatus} />
              <FieldRow label="Type" value={u.employmentType} />
              <FieldRow label="Seniority" value={u.seniorityLevel} />
              <FieldRow label="Hire Date" value={u.hireDate} />
            </div>
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Location</div>
              <FieldRow label="Office" value={u.officeLocation} />
              <FieldRow label="City" value={u.city} />
              <FieldRow label="State" value={u.state} />
              <FieldRow label="Country" value={u.country} />
              <FieldRow label="Remote" value={u.remoteStatus} />
            </div>
          </div>
        </div>
      )}

      {/* ─── IDENTITY ─────────────────────────────────── */}
      {tab === 'Identity' && (
        <div className="grid grid-cols-3 gap-3">

          {/* Identity */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <FieldSection title="Identity">
              <FieldRow label="Id" value={u.id} />
              <FieldRow label="Username" value={u.username} />
              <FieldRow label="LastName" value={u.lastName} />
              <FieldRow label="FirstName" value={u.firstName} />
              <FieldRow label="MiddleName" value={u.middleName} />
              <FieldRow label="Suffix" value={u.suffix} />
              <FieldRow label="Name" value={u.name} />
              <FieldRow label="Full_Name__c" value={u.Full_Name__c} />
              <FieldRow label="Alias" value={u.alias} />
              <FieldRow label="CommunityNickname" value={u.communityNickname} />
              <FieldRow label="BadgeText" value={u.badgeText} />
              <FieldRow label="FederationIdentifier" value={u.federationIdentifier} />
              <FieldRow label="EmployeeNumber" value={u.employeeNumber} />
              <FieldRow label="JSQ_Employee_ID__c" value={u.JSQ_Employee_ID__c} />
              <FieldRow label="User_Id__c" value={u.User_Id__c} />
              <FieldRow label="Outreach_User_ID__c" value={u.Outreach_User_ID__c} />
            </FieldSection>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <FieldSection title="Contact Info">
              <FieldRow label="Email" value={u.email} />
              <FieldRow label="Phone" value={u.phone} />
              <FieldRow label="Fax" value={u.fax} />
              <FieldRow label="MobilePhone" value={u.mobilePhone} />
              <FieldRow label="Extension" value={u.extension} />
              <FieldRow label="AboutMe" value={u.aboutMe} />
            </FieldSection>
          </div>

          {/* Address */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <FieldSection title="Address">
              <FieldRow label="Street" value={u.street} />
              <FieldRow label="City" value={u.city} />
              <FieldRow label="State" value={u.state} />
              <FieldRow label="PostalCode" value={u.postalCode} />
              <FieldRow label="Country" value={u.country} />
              <FieldRow label="StateCode" value={u.stateCode} />
              <FieldRow label="CountryCode" value={u.countryCode} />
              <FieldRow label="Latitude" value={u.latitude} />
              <FieldRow label="Longitude" value={u.longitude} />
              <FieldRow label="GeocodeAccuracy" value={u.geocodeAccuracy} />
            </FieldSection>
          </div>

          {/* Org / Role — wide */}
          <div className="col-span-2 bg-white rounded-lg shadow-sm p-4">
            <FieldSection title="Org / Role">
              <div className="grid grid-cols-2 gap-x-6">
                <div>
                  <FieldRow label="CompanyName" value={u.companyName} />
                  <FieldRow label="Division" value={u.division} />
                  <FieldRow label="Department" value={u.department} />
                  <FieldRow label="Title" value={u.title} />
                  <FieldRow label="UserRoleId" value={u.userRoleId} />
                  <FieldRow label="UserType" value={u.userType} />
                  <FieldRow label="ManagerId" value={u.managerId} />
                  <FieldRow label="Manager__c" value={u.Manager__c} />
                  <FieldRow label="Manager_of_Manager__c" value={u.Manager_of_Manager__c} />
                  <FieldRow label="TeamLead1__c" value={u.TeamLead1__c} />
                </div>
                <div>
                  <FieldRow label="TeamLead2__c" value={u.TeamLead2__c} />
                  <FieldRow label="TeamLead3__c" value={u.TeamLead3__c} />
                  <FieldRow label="TeamLead1Text__c" value={u.TeamLead1Text__c} />
                  <FieldRow label="TeamLead2Text__c" value={u.TeamLead2Text__c} />
                  <FieldRow label="TeamLead3Text__c" value={u.TeamLead3Text__c} />
                  <FieldRow label="DelegatedApproverId" value={u.delegatedApproverId} />
                  <FieldRow label="ContactId" value={u.contactId} />
                  <FieldRow label="AccountId" value={u.accountId} />
                  <FieldRow label="CallCenterId" value={u.callCenterId} />
                  <FieldRow label="IndividualId" value={u.individualId} />
                </div>
              </div>
            </FieldSection>
          </div>

          {/* Segmentation / Custom */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <FieldSection title="Segmentation / Custom">
              <FieldRow label="Segment" value={u.segment} />
              <FieldRow label="Service Group" value={u.serviceGroup} />
              <FieldRow label="License Type" value={u.licenseType} />
              <FieldRow label="Type" value={u.userTypeSf} />
              <FieldRow label="Deal Desk Group" value={u.dealDeskGroup} />
              <FieldRow label="CSM" value={u.csm} />
              <FieldRow label="Pod" value={u.podId} />
              <FieldRow label="Team Lead 1" value={u.teamLead1} />
              <FieldRow label="Team Lead 2" value={u.teamLead2} />
              <FieldRow label="Team Lead 3" value={u.teamLead3} />
            </FieldSection>
          </div>

          {/* CPQ (SBQQ) */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <FieldSection title="CPQ (SBQQ)">
              <FieldRow label="SBQQ__DefaultProductLookupTab__c" value={u.SBQQ__DefaultProductLookupTab__c} />
              <FieldRow label="SBQQ__DiagnosticToolEnabled__c" value={u.SBQQ__DiagnosticToolEnabled__c} />
              <FieldRow label="SBQQ__OutputFormatChangeAllowed__c" value={u.SBQQ__OutputFormatChangeAllowed__c} />
              <FieldRow label="SBQQ__ProductSortPreference__c" value={u.SBQQ__ProductSortPreference__c} />
              <FieldRow label="SBQQ__ResetProductLookup__c" value={u.SBQQ__ResetProductLookup__c} />
              <FieldRow label="SBQQ__Theme__c" value={u.SBQQ__Theme__c} />
            </FieldSection>
          </div>

          {/* Email Preferences — wide */}
          <div className="col-span-2 bg-white rounded-lg shadow-sm p-4">
            <FieldSection title="Email Preferences">
              <div className="grid grid-cols-2 gap-x-6">
                <div>
                  <FieldRow label="SenderEmail" value={u.senderEmail} />
                  <FieldRow label="SenderName" value={u.senderName} />
                  <FieldRow label="Signature" value={u.signature} />
                  <FieldRow label="StayInTouchSubject" value={u.stayInTouchSubject} />
                  <FieldRow label="StayInTouchSignature" value={u.stayInTouchSignature} />
                  <FieldRow label="StayInTouchNote" value={u.stayInTouchNote} />
                  <FieldRow label="EmailPreferencesAutoBcc" value={u.emailPreferencesAutoBcc} />
                </div>
                <div>
                  <FieldRow label="EmailPreferencesAutoBccStayInTouch" value={u.emailPreferencesAutoBccStayInTouch} />
                  <FieldRow label="EmailPreferencesStayInTouchReminder" value={u.emailPreferencesStayInTouchReminder} />
                  <FieldRow label="ReceivesInfoEmails" value={u.receivesInfoEmails} />
                  <FieldRow label="ReceivesAdminInfoEmails" value={u.receivesAdminInfoEmails} />
                  <FieldRow label="EmailEncodingKey" value={u.emailEncodingKey} />
                  <FieldRow label="DigestFrequency" value={u.digestFrequency} />
                  <FieldRow label="DefaultGroupNotificationFrequency" value={u.defaultGroupNotificationFrequency} />
                </div>
              </div>
            </FieldSection>
          </div>

          {/* Locale / Settings */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <FieldSection title="Locale / Settings">
              <FieldRow label="TimeZoneSidKey" value={u.timeZoneSidKey} />
              <FieldRow label="LocaleSidKey" value={u.localeSidKey} />
              <FieldRow label="LanguageLocaleKey" value={u.languageLocaleKey} />
              <FieldRow label="StartDay" value={u.startDay} />
              <FieldRow label="EndDay" value={u.endDay} />
              <FieldRow label="ForecastEnabled" value={u.forecastEnabled} />
            </FieldSection>
          </div>

          {/* Permissions */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <FieldSection title="Permissions">
              <FieldRow label="UserPermissionsMarketingUser" value={u.userPermissionsMarketingUser} />
              <FieldRow label="UserPermissionsOfflineUser" value={u.userPermissionsOfflineUser} />
              <FieldRow label="UserPermissionsAvantgoUser" value={u.userPermissionsAvantgoUser} />
              <FieldRow label="UserPermissionsCallCenterAutoLogin" value={u.userPermissionsCallCenterAutoLogin} />
              <FieldRow label="UserPermissionsSFContentUser" value={u.userPermissionsSFContentUser} />
              <FieldRow label="UserPermissionsKnowledgeUser" value={u.userPermissionsKnowledgeUser} />
              <FieldRow label="UserPermissionsInteractionUser" value={u.userPermissionsInteractionUser} />
              <FieldRow label="UserPermissionsSupportUser" value={u.userPermissionsSupportUser} />
            </FieldSection>
          </div>

          {/* Photos / Profile */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <FieldSection title="Photos / Profile">
              <FieldRow label="FullPhotoUrl" value={u.fullPhotoUrl} />
              <FieldRow label="SmallPhotoUrl" value={u.smallPhotoUrl} />
              <FieldRow label="MediumPhotoUrl" value={u.mediumPhotoUrl} />
              <FieldRow label="BannerPhotoUrl" value={u.bannerPhotoUrl} />
              <FieldRow label="SmallBannerPhotoUrl" value={u.smallBannerPhotoUrl} />
              <FieldRow label="MediumBannerPhotoUrl" value={u.mediumBannerPhotoUrl} />
              <FieldRow label="IsProfilePhotoActive" value={u.isProfilePhotoActive} />
              <FieldRow label="IsExtIndicatorVisible" value={u.isExtIndicatorVisible} />
              <FieldRow label="OutOfOfficeMessage" value={u.outOfOfficeMessage} />
            </FieldSection>
          </div>

          {/* Status / Dates — wide */}
          <div className="col-span-2 bg-white rounded-lg shadow-sm p-4">
            <FieldSection title="Status / Dates">
              <div className="grid grid-cols-2 gap-x-6">
                <div>
                  <FieldRow label="IsActive" value={u.isActive} />
                  <FieldRow label="LastLoginDate" value={u.lastLoginDate} />
                  <FieldRow label="CreatedDate" value={u.createdDate} />
                  <FieldRow label="CreatedById" value={u.createdById} />
                  <FieldRow label="LastModifiedDate" value={u.lastModifiedDate} />
                  <FieldRow label="LastModifiedById" value={u.lastModifiedById} />
                  <FieldRow label="SystemModstamp" value={u.systemModstamp} />
                </div>
                <div>
                  <FieldRow label="PasswordExpirationDate" value={u.passwordExpirationDate} />
                  <FieldRow label="SuAccessExpirationDate" value={u.suAccessExpirationDate} />
                  <FieldRow label="OfflineTrialExpirationDate" value={u.offlineTrialExpirationDate} />
                  <FieldRow label="OfflinePdaTrialExpirationDate" value={u.offlinePdaTrialExpirationDate} />
                  <FieldRow label="LastViewedDate" value={u.lastViewedDate} />
                  <FieldRow label="LastReferencedDate" value={u.lastReferencedDate} />
                </div>
              </div>
            </FieldSection>
          </div>

          {/* Verification */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <FieldSection title="Verification">
              <FieldRow label="HasUserVerifiedPhone" value={u.hasUserVerifiedPhone} />
              <FieldRow label="HasUserVerifiedEmail" value={u.hasUserVerifiedEmail} />
            </FieldSection>
          </div>

        </div>
      )}

      {/* ─── PERFORMANCE ──────────────────────────────── */}
      {tab === 'Performance' && (
        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-3 space-y-3">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="grid grid-cols-2 gap-6">
                <FieldSection title="Utilization">
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Actual</span>
                        <span className="font-semibold">{u.utilizationActual ?? '—'}%</span>
                      </div>
                      <ScoreBar score={u.utilizationActual} color="blue" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Target</span>
                        <span className="font-semibold">{u.utilizationTarget ?? '—'}%</span>
                      </div>
                      <ScoreBar score={u.utilizationTarget} color="blue" />
                    </div>
                  </div>
                </FieldSection>
                <FieldSection title="Productivity">
                  <div className="flex items-start py-1.5 border-b border-gray-50">
                    <span className="w-44 flex-shrink-0 text-xs text-gray-500 font-medium">Data Quality</span>
                    <ScoreBar score={u.dataQualityScore} />
                  </div>
                </FieldSection>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Tasks Assigned', value: u.tasksAssigned },
              { label: 'Tasks Completed', value: u.tasksCompleted },
              { label: 'Tasks Overdue', value: u.tasksOverdue },
              { label: 'Clients Managed', value: u.clientsManaged },
              { label: 'Entities Managed', value: u.entitiesManaged },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-lg shadow-sm p-3 flex justify-between items-center">
                <span className="text-xs text-gray-500">{label}</span>
                <span className="text-xl font-bold text-gray-800">{value ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TASKS ────────────────────────────────────── */}
      {tab === 'Tasks' && (
        <DataTable columns={taskColumns} data={tasks} searchPlaceholder="Search tasks…" />
      )}

      {/* ─── SKILLS & BACKGROUND ────────────────────── */}
      {tab === 'Skills & Background' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <FieldSection title="Expertise">
              <FieldRow label="Primary" value={u.primaryExpertise} />
              <FieldRow label="Secondary" value={u.secondaryExpertise} />
              <FieldRow label="Industry Focus" value={u.industrySpecialization} />
              <FieldRow label="Strategy" value={u.strategyExpertise} />
              <FieldRow label="Technology" value={u.technologyExpertise} />
              <FieldRow label="Languages" value={u.languagesSpoken} />
            </FieldSection>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <FieldSection title="Education">
              <FieldRow label="Level" value={u.educationLevel} />
              <FieldRow label="University" value={u.university} />
              <FieldRow label="Degree" value={u.degreeType} />
              <FieldRow label="Major" value={u.degreeMajor} />
            </FieldSection>
            <FieldSection title="Certifications">
              <FieldRow label="CPA" value={u.cpa ? 'Yes' : 'No'} />
              <FieldRow label="CFA" value={u.cfa ? 'Yes' : 'No'} />
              <FieldRow label="CAIA" value={u.caia ? 'Yes' : 'No'} />
              <FieldRow label="Series Licenses" value={u.seriesLicenses} />
            </FieldSection>
          </div>
        </div>
      )}

      {/* ─── SURVEY SKILLS ────────────────────────────── */}
      {tab === 'Survey Skills' && (
        <div className="space-y-3">
          {!survey ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-400 text-xs">No survey data on file for this employee.</div>
          ) : (
            <>
              {/* Education & Prior Employers */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3" /> Education
                  </div>
                  <FieldRow label="College" value={survey.college} />
                  <FieldRow label="Graduate Degree" value={survey.graduateDegree} />
                  <FieldRow label="MBA" value={survey.hasMba ? 'Yes' : 'No'} />
                  <FieldRow label="CPA" value={survey.hasCpa ? 'Yes' : 'No'} />
                  <FieldRow label="Other Certs" value={survey.otherCerts} />
                  {survey.submittedAt && (
                    <div className="mt-2 text-[10px] text-gray-400">Survey submitted: {survey.submittedAt.slice(0, 10)}</div>
                  )}
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Award className="w-3 h-3" /> Prior Employers
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-[10px] text-gray-500 font-semibold mb-1">Fund Administrators</div>
                      {firmPills(parseFirms(survey.priorFaFirms))}
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 font-semibold mb-1">GP / Asset Managers</div>
                      {firmPills(parseFirms(survey.priorGpFirms))}
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 font-semibold mb-1">Audit Firms</div>
                      {firmPills(parseFirms(survey.priorAuditFirms))}
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 font-semibold mb-1">Consulting Firms</div>
                      {firmPills(parseFirms(survey.priorConsultingFirms))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Client Service */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Client Service Experience</div>
                <div className="flex items-center gap-8">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{survey.csYears ?? '—'}</div>
                    <div className="text-[10px] text-gray-500">Years</div>
                  </div>
                  <div>
                    <LevelBadge value={survey.csLevel} />
                    <div className="text-[10px] text-gray-500 mt-0.5">{survey.csLevel ?? '—'}</div>
                  </div>
                </div>
              </div>

              {/* Compliance Skills */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Compliance Skills</div>
                <SkillGrid skills={parseSkills(survey.complianceSkills)} />
              </div>

              {/* Private Markets Assets */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Private Markets Assets</div>
                  <div className="text-[10px] text-gray-400">{survey.pmYears ?? '—'} yrs experience</div>
                </div>
                <SkillGrid skills={parseSkills(survey.pmAssetSkills)} />
              </div>

              {/* Allocations */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Allocations & Waterfall</div>
                <SkillGrid skills={parseSkills(survey.allocationSkills)} />
              </div>

              {/* Other Operational */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Other Operational Skills</div>
                <SkillGrid skills={parseSkills(survey.otherOpSkills)} />
              </div>

              {/* Technology */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Technology Systems</div>
                {survey.preferredPmSoftware && (
                  <div className="mb-3 text-xs text-gray-600">Preferred PM Software: <span className="font-semibold text-gray-800">{survey.preferredPmSoftware}</span></div>
                )}
                <SkillGrid skills={parseSkills(survey.technologySkills)} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
