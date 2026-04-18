import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { toNum } from '@/lib/utils';

export async function GET(_req: Request, { params }: { params: { entityId: string } }) {
  const entity = await prisma.entity.findUnique({
    where: { entityId: params.entityId },
    include: {
      client: true,
      creditDomain: true,
      reDomain: true,
      oefDomain: true,
      vcDomain: true,
      peDomain: true,
      fofDomain: true,
      gpCarryDomain: true,
      manCoDomain: true,
      otherDomain: true,
    },
  });

  if (!entity) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // task assignments linked by entity name
  const tasks = await prisma.taskAssignment.findMany({
    where: { entityName: entity.name },
    include: {
      assignedTo: { select: { firstName: true, lastName: true, title: true, department: true, employeeId: true, email: true } },
      taskDefinition: { select: { name: true, category: true, department: true, frequency: true, estimatedMinutes: true } },
    },
    orderBy: { dueDate: 'asc' },
  });

  // investors linked by entity name
  const investors = await prisma.investor.findMany({
    where: { entityName: entity.name },
    select: { investorId: true, name: true, investorType: true, commitmentMm: true, navMm: true, status: true },
    orderBy: { name: 'asc' },
  });

  // build employee roster from task assignments
  const employeeMap = new Map<string, {
    employeeId: string;
    name: string;
    title: string;
    department: string;
    email: string;
    tasks: Array<{ taskName: string; taskDepartment: string; status: string; dueDate: string; priority: string }>;
  }>();

  for (const t of tasks) {
    if (!t.assignedTo) continue;
    const eid = t.assignedTo.employeeId;
    if (!employeeMap.has(eid)) {
      employeeMap.set(eid, {
        employeeId: eid,
        name: `${t.assignedTo.firstName} ${t.assignedTo.lastName}`,
        title: t.assignedTo.title,
        department: t.assignedTo.department,
        email: t.assignedTo.email,
        tasks: [],
      });
    }
    employeeMap.get(eid)!.tasks.push({
      taskName: t.taskDefinition.name,
      taskDepartment: t.taskDefinition.department,
      status: t.status,
      dueDate: t.dueDate.toISOString().slice(0, 10),
      priority: t.priority,
    });
  }

  const d = (v: any) => v ? toNum(v) : null;
  const dt = (v: Date | null | undefined) => v?.toISOString().slice(0, 10) ?? null;
  const b = (v: boolean | null | undefined) => v ?? null;

  const firstInvestor = investors[0];
  const overdueTask = tasks.find((t) => t.status !== 'Completed' && t.dueDate < new Date());
  const completedTask = tasks.find((t) => t.status === 'Completed');
  const recentActivity = [
    { id: `a-${entity.entityId}-1`, action: 'Uploaded', subject: `NAV pack for ${entity.name}`, timestamp: '3h ago', user: 'Fund Accounting', icon: 'uploaded', href: '#' },
    ...(completedTask ? [{ id: `a-${entity.entityId}-2`, action: 'Completed', subject: completedTask.taskDefinition.name, timestamp: '6h ago', user: completedTask.assignedTo ? `${completedTask.assignedTo.firstName} ${completedTask.assignedTo.lastName}` : 'Team', icon: 'completed', href: `/data-vault/task-assignments` }] : []),
    ...(overdueTask ? [{ id: `a-${entity.entityId}-3`, action: 'Overdue', subject: overdueTask.taskDefinition.name, timestamp: 'Yesterday', user: overdueTask.assignedTo ? `${overdueTask.assignedTo.firstName} ${overdueTask.assignedTo.lastName}` : 'Team', icon: 'overdue', href: `/data-vault/task-assignments` }] : []),
    { id: `a-${entity.entityId}-4`, action: 'Issued', subject: `capital call notice #${(entity.annualCapitalEventsExpected ?? 4)}`, timestamp: '2d ago', user: 'Investor Services', icon: 'transaction', href: '#' },
    ...(firstInvestor ? [{ id: `a-${entity.entityId}-5`, action: 'Funded', subject: `${firstInvestor.name} subscription`, timestamp: '4d ago', user: 'Treasury', icon: 'transaction', href: `/data-vault/investors/${firstInvestor.investorId}` }] : []),
    { id: `a-${entity.entityId}-6`, action: 'Reconciled', subject: `bank feed through ${new Date().toLocaleString('en-US', { month: 'short', year: '2-digit' })}`, timestamp: '1w ago', user: 'Fund Accounting', icon: 'completed', href: '#' },
    { id: `a-${entity.entityId}-7`, action: 'Scheduled', subject: 'quarterly audit kickoff', timestamp: '2w ago', user: entity.entityDataSteward ?? 'Ops', icon: 'scheduled', href: '#' },
  ];

  return NextResponse.json({
    entity: {
      // identifiers
      entityId: entity.entityId,
      name: entity.name,
      entityType: entity.entityType,
      structureType: entity.structureType,
      lifecycleStatus: entity.lifecycleStatus,
      clientName: entity.client.name,
      // general
      domicile: entity.domicile,
      strategy: entity.strategy,
      vintage: entity.vintage,
      currency: entity.currency,
      openEnded: entity.openEnded,
      inceptionDate: dt(entity.inceptionDate),
      hqCity: entity.hqCity,
      region: entity.region,
      dataQualityScore: d(entity.dataQualityScore),
      confidenceScore: d(entity.confidenceScore),
      // entity profile
      assetClass: entity.assetClass,
      shortName: entity.shortName,
      domicileCountry: entity.domicileCountry,
      domicileCountryOther: entity.domicileCountryOther,
      domicileState: entity.domicileState,
      einTaxId: entity.einTaxId,
      entityRole: entity.entityRole,
      entityRoleOther: entity.entityRoleOther,
      entityTypeOther: entity.entityTypeOther,
      fundStructure: entity.fundStructure,
      fundStructureOther: entity.fundStructureOther,
      regulatoryClassification: entity.regulatoryClassification,
      regulatoryClassificationOther: entity.regulatoryClassificationOther,
      geographyFocus: entity.geographyFocus,
      geographyFocusOther: entity.geographyFocusOther,
      sectorFocus: entity.sectorFocus,
      sectorFocusOther: entity.sectorFocusOther,
      investmentStrategyDetail: entity.investmentStrategyDetail,
      investmentStrategyDetailOther: entity.investmentStrategyDetailOther,
      leveredFund: b(entity.leveredFund),
      usesSubFacility: b(entity.usesSubFacility),
      targetCommittedCapital: d(entity.targetCommittedCapital),
      targetInvestmentCount: entity.targetInvestmentCount,
      targetInvestorCount: entity.targetInvestorCount,
      targetLeveragePct: d(entity.targetLeveragePct),
      fundraisingFirstClose: dt(entity.fundraisingFirstClose),
      fundraisingFinalClose: dt(entity.fundraisingFinalClose),
      registeredAddress: entity.registeredAddress,
      // fund accounting
      navMm: d(entity.navMm),
      commitmentMm: d(entity.commitmentMm),
      calledCapitalMm: d(entity.calledCapitalMm),
      distributedCapitalMm: d(entity.distributedCapitalMm),
      unfundedMm: d(entity.unfundedMm),
      navFrequency: entity.navFrequency,
      accountingSystem: entity.accountingSystem,
      // investor services
      investorCount: investors.length,
      // finance
      revenueL12m: d(entity.revenueL12m),
      costL12m: d(entity.costL12m),
      marginPct: d(entity.marginPct),
      grossIrrPct: d(entity.grossIrrPct),
      netIrrPct: d(entity.netIrrPct),
      moic: d(entity.moic),
      tvpi: d(entity.tvpi),
      dpi: d(entity.dpi),
      // economics / fees
      mgmtFeePct: d(entity.mgmtFeePct),
      prefRatePct: d(entity.prefRatePct),
      carryPct: d(entity.carryPct),
      waterfallType: entity.waterfallType,
      carryStructure: entity.carryStructure,
      catchUpType: entity.catchUpType,
      clawbackApplies: b(entity.clawbackApplies),
      clawbackTrueUpFrequency: entity.clawbackTrueUpFrequency,
      feeStepdownExists: b(entity.feeStepdownExists),
      hurdleType: entity.hurdleType,
      mgmtFeeBasis: entity.mgmtFeeBasis,
      mgmtFeeBasisOther: entity.mgmtFeeBasisOther,
      mgmtFeeFrequency: entity.mgmtFeeFrequency,
      mgmtFeeWaiverOffset: entity.mgmtFeeWaiverOffset,
      mgmtFeeWaiverOffsetOther: entity.mgmtFeeWaiverOffsetOther,
      escrowHoldbackApplies: b(entity.escrowHoldbackApplies),
      escrowHoldbackPct: d(entity.escrowHoldbackPct),
      mgmtFeeOffsetPct: d(entity.mgmtFeeOffsetPct),
      prefReturnCompounding: entity.prefReturnCompounding,
      prefReturnDayCount: entity.prefReturnDayCount,
      taxDistributionPolicy: entity.taxDistributionPolicy,
      taxDistributionPolicyOther: entity.taxDistributionPolicyOther,
      unitOfAccount: entity.unitOfAccount,
      // fund accounting — operations
      booksComplexityTier: entity.booksComplexityTier,
      chartOfAccountsTemplate: entity.chartOfAccountsTemplate,
      chartOfAccountsOther: entity.chartOfAccountsOther,
      generalLedgerSystem: entity.generalLedgerSystem,
      generalLedgerSystemOther: entity.generalLedgerSystemOther,
      closeProcessModel: entity.closeProcessModel,
      bankFeedEnabled: b(entity.bankFeedEnabled),
      portfolioDataFeedEnabled: b(entity.portfolioDataFeedEnabled),
      docMgmtSystem: entity.docMgmtSystem,
      docMgmtSystemOther: entity.docMgmtSystemOther,
      multiCloseRebalancing: entity.multiCloseRebalancing,
      reconciliationTool: entity.reconciliationTool,
      reconciliationToolOther: entity.reconciliationToolOther,
      sideLetterComplexity: entity.sideLetterComplexity,
      specialAllocationFrequency: entity.specialAllocationFrequency,
      waterfallCalcAutomation: entity.waterfallCalcAutomation,
      annualCapitalEventsExpected: entity.annualCapitalEventsExpected,
      // fund accounting — onboarding
      conversionType: entity.conversionType,
      conversionStartDate: dt(entity.conversionStartDate),
      documentConversionScope: entity.documentConversionScope,
      onboardingOwner: entity.onboardingOwner,
      sourceSystemsPriorAdmin: entity.sourceSystemsPriorAdmin,
      sourceSystemsPriorAdminOther: entity.sourceSystemsPriorAdminOther,
      // fund accounting — reporting
      accountingFramework: entity.accountingFramework,
      accountingFrameworkOther: entity.accountingFrameworkOther,
      financialStatementsFrequency: entity.financialStatementsFrequency,
      footnoteDisclosureLevel: entity.footnoteDisclosureLevel,
      investorStatementsFrequency: entity.investorStatementsFrequency,
      reportingPackageTimingQeDays: entity.reportingPackageTimingQeDays,
      reportingPackageTimingYeDays: entity.reportingPackageTimingYeDays,
      valuationDeliverySla: entity.valuationDeliverySla,
      // investor services — compliance
      amlProgramRequired: b(entity.amlProgramRequired),
      fatcaRequired: b(entity.fatcaRequired),
      crsRequired: b(entity.crsRequired),
      kycStandard: entity.kycStandard,
      kycStandardOther: entity.kycStandardOther,
      benefitPlanInvestorTracking: b(entity.benefitPlanInvestorTracking),
      restrictedPersonsTracking: b(entity.restrictedPersonsTracking),
      support1099Level: entity.support1099Level,
      // investor services — treasury ops
      bankAccountCount: entity.bankAccountCount,
      bankConnectivityMethod: entity.bankConnectivityMethod,
      bankConnectivityOther: entity.bankConnectivityOther,
      multiCurrency: b(entity.multiCurrency),
      paymentApprovalLevels: entity.paymentApprovalLevels,
      positivePayEnabled: b(entity.positivePayEnabled),
      primaryCurrency: entity.primaryCurrency,
      primaryCurrencyOther: entity.primaryCurrencyOther,
      // investor services — operations
      investorPortalEnabled: b(entity.investorPortalEnabled),
      redemptionProcessingModel: entity.redemptionProcessingModel,
      sideLetterWorkflowAutomation: entity.sideLetterWorkflowAutomation,
      // scope / modules
      scopeFundAccounting: b(entity.scopeFundAccounting),
      scopeInvestorServices: b(entity.scopeInvestorServices),
      scopeTaxServices: entity.scopeTaxServices,
      scopeTaxServicesOther: entity.scopeTaxServicesOther,
      scopeTreasury: b(entity.scopeTreasury),
      scopeLoanAdmin: b(entity.scopeLoanAdmin),
      scopeMgmtCoAccounting: b(entity.scopeMgmtCoAccounting),
      scopeRegulatoryReporting: b(entity.scopeRegulatoryReporting),
      scopeAmlKyc: entity.scopeAmlKyc,
      scopeFatcaCrs: b(entity.scopeFatcaCrs),
      // governance
      auditTrailEnabled: b(entity.auditTrailEnabled),
      dataClassificationLevel: entity.dataClassificationLevel,
      entityDataSteward: entity.entityDataSteward,
      // configurations
      administrator: entity.administrator,
      auditor: entity.auditor,
      legalCounsel: entity.legalCounsel,
      reportingFrequency: entity.reportingFrequency,
      // relationships
      custodianPrimeBroker: entity.custodianPrimeBroker,
      fundComplexName: entity.fundComplexName,
      managementCompanyRef: entity.managementCompanyRef,
      sponsorGpOrg: entity.sponsorGpOrg,
      taxPreparer: entity.taxPreparer,
    },
    // domain-specific data
    creditDomain: entity.creditDomain,
    reDomain: entity.reDomain,
    oefDomain: entity.oefDomain,
    vcDomain: entity.vcDomain,
    peDomain: entity.peDomain,
    fofDomain: entity.fofDomain,
    gpCarryDomain: entity.gpCarryDomain,
    manCoDomain: entity.manCoDomain,
    otherDomain: entity.otherDomain,
    employees: Array.from(employeeMap.values()),
    investors: investors.map((inv) => ({
      investorId: inv.investorId,
      name: inv.name,
      type: inv.investorType,
      commitmentMm: inv.commitmentMm ? toNum(inv.commitmentMm) : null,
      navMm: inv.navMm ? toNum(inv.navMm) : null,
      status: inv.status,
    })),
    taskSummary: {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === 'Completed').length,
      overdue: tasks.filter((t) => t.status !== 'Completed' && t.dueDate < new Date()).length,
    },
    recentActivity,
  });
}
