import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { toNum } from '@/lib/utils';

export async function GET(_req: Request, { params }: { params: { employeeId: string } }) {
  try {
  const user = await prisma.internalUser.findUnique({
    where: { employeeId: params.employeeId },
    include: {
      survey: true,
      taskAssignments: {
        include: {
          taskDefinition: { select: { name: true, taskCode: true, category: true, department: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: 50,
      },
    },
  });

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const d = (v: any) => v ? toNum(v) : null;
  const dt = (v: Date | null | undefined) => v?.toISOString().slice(0, 10) ?? null;

  return NextResponse.json({
    user: {
      id: user.id,
      employeeId: user.employeeId,
      firstName: user.firstName,
      lastName: user.lastName,
      preferredName: user.preferredName,
      email: user.email,
      phone: user.phone,
      title: user.title,
      role: user.role,
      department: user.department,
      division: user.division,
      team: user.team,
      podId: user.podId,
      managerName: user.managerName,
      seniorityLevel: user.seniorityLevel,
      employmentType: user.employmentType,
      employmentStatus: user.employmentStatus,
      hireDate: dt(user.hireDate),
      officeLocation: user.officeLocation,
      city: user.city,
      state: user.state,
      country: user.country,
      remoteStatus: user.remoteStatus,
      // performance / productivity
      utilizationTarget: d(user.utilizationTarget),
      utilizationActual: d(user.utilizationActual),
      tasksAssigned: user.tasksAssigned,
      tasksCompleted: user.tasksCompleted,
      tasksOverdue: user.tasksOverdue,
      clientsManaged: user.clientsManaged,
      entitiesManaged: user.entitiesManaged,
      dataQualityScore: d(user.dataQualityScore),
      // salesforce / segmentation
      sfUserId: user.sfUserId,
      sfUsername: user.sfUsername,
      jsqEmployeeId: user.jsqEmployeeId,
      segment: user.segment,
      serviceGroup: user.serviceGroup,
      licenseType: user.licenseType,
      userTypeSf: user.userTypeSf,
      dealDeskGroup: user.dealDeskGroup,
      csm: user.csm,
      teamLead1: user.teamLead1,
      teamLead2: user.teamLead2,
      teamLead3: user.teamLead3,
      managerSf: user.managerSf,
      managerOfManager: user.managerOfManager,
      // skills
      primaryExpertise: user.primaryExpertise,
      secondaryExpertise: user.secondaryExpertise,
      industrySpecialization: user.industrySpecialization,
      strategyExpertise: user.strategyExpertise,
      technologyExpertise: user.technologyExpertise,
      languagesSpoken: user.languagesSpoken,
      educationLevel: user.educationLevel,
      university: user.university,
      degreeType: user.degreeType,
      degreeMajor: user.degreeMajor,
      cpa: user.cpaLicense,
      cfa: user.cfaCharter,
      caia: user.caiaCharter,
      seriesLicenses: user.seriesLicenses,
    },
    survey: user.survey ? {
      college: user.survey.college,
      graduateDegree: user.survey.graduateDegree,
      hasMba: user.survey.hasMba,
      hasCpa: user.survey.hasCpa,
      otherCerts: user.survey.otherCerts,
      priorFaFirms: user.survey.priorFaFirms,
      priorGpFirms: user.survey.priorGpFirms,
      priorAuditFirms: user.survey.priorAuditFirms,
      priorConsultingFirms: user.survey.priorConsultingFirms,
      csYears: user.survey.csYears,
      csLevel: user.survey.csLevel,
      complianceSkills: user.survey.complianceSkills,
      pmYears: user.survey.pmYears,
      pmAssetSkills: user.survey.pmAssetSkills,
      allocationSkills: user.survey.allocationSkills,
      otherOpSkills: user.survey.otherOpSkills,
      preferredPmSoftware: user.survey.preferredPmSoftware,
      technologySkills: user.survey.technologySkills,
      submittedAt: user.survey.submittedAt?.toISOString() ?? null,
    } : null,
    taskAssignments: user.taskAssignments.map((t) => ({
      id: t.id,
      taskName: t.taskDefinition.name,
      taskCode: t.taskDefinition.taskCode,
      category: t.taskDefinition.category,
      department: t.taskDefinition.department,
      entityName: t.entityName,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate.toISOString().slice(0, 10),
      periodEnd: t.periodEnd,
      completedDate: dt(t.completedDate),
    })),
  });
  } catch (err: any) {
    console.error('[internal-users GET]', err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
