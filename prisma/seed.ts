import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.timesheetEntry.deleteMany();
  await prisma.timesheet.deleteMany();
  await prisma.reportRun.deleteMany();
  await prisma.report.deleteMany();
  await prisma.relationship.deleteMany();
  await prisma.rule.deleteMany();
  await prisma.cashFlow.deleteMany();
  await prisma.treasuryAccount.deleteMany();
  await prisma.communication.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.tool.deleteMany();
  await prisma.taskAssignment.deleteMany();
  await prisma.taskDefinition.deleteMany();
  await prisma.document.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.aISkill.deleteMany();
  await prisma.project.deleteMany();
  await prisma.security.deleteMany();
  await prisma.investor.deleteMany();
  await prisma.creditDomainFields.deleteMany();
  await prisma.rEDomainFields.deleteMany();
  await prisma.oEFDomainFields.deleteMany();
  await prisma.vCDomainFields.deleteMany();
  await prisma.pEDomainFields.deleteMany();
  await prisma.fOFDomainFields.deleteMany();
  await prisma.gPCarryDomainFields.deleteMany();
  await prisma.manCoDomainFields.deleteMany();
  await prisma.otherDomainFields.deleteMany();
  await prisma.entity.deleteMany();
  await prisma.externalContact.deleteMany();
  await prisma.internalUser.deleteMany();
  await prisma.client.deleteMany();

  console.log('Cleared existing data');

  // ═══════════════════════════════════════════════
  // CLIENTS (8)
  // ═══════════════════════════════════════════════
  const clients = await Promise.all([
    prisma.client.create({ data: {
      name: 'Walker Asset Management', shortName: 'Walker', primaryStrategy: 'Private Equity',
      hqCity: 'Dallas', hqCountry: 'United States', region: 'Americas',
      relationshipStart: new Date('2019-03-15'), status: 'Active',
      totalEntities: 62, totalNavMm: 7742, totalCommitmentMm: 12500,
      revenueL12m: 48200, marginPct: 42.3, teamLead: 'Megan Moore',
      podId: 'POD-A', serviceLine: 'Full Service', yearFounded: 2005, employeeCount: 340,
      website: 'https://walkerasset.com',
    }}),
    prisma.client.create({ data: {
      name: 'Campbell Capital Partners', shortName: 'Campbell', primaryStrategy: 'Private Equity',
      hqCity: 'Los Angeles', hqCountry: 'United States', region: 'Americas',
      relationshipStart: new Date('2020-07-01'), status: 'Active',
      totalEntities: 27, totalNavMm: 2834, totalCommitmentMm: 4800,
      revenueL12m: 22100, marginPct: 38.7, teamLead: 'Jessica Cruz',
      podId: 'POD-B', serviceLine: 'Full Service', yearFounded: 2012, employeeCount: 85,
    }}),
    prisma.client.create({ data: {
      name: 'Sullivan Investments', shortName: 'Sullivan', primaryStrategy: 'Hedge Fund',
      hqCity: 'New York', hqCountry: 'United States', region: 'Americas',
      relationshipStart: new Date('2018-01-10'), status: 'Active',
      totalEntities: 18, totalNavMm: 6122, totalCommitmentMm: 6122,
      revenueL12m: 35800, marginPct: 44.1, teamLead: 'Diana Smith',
      podId: 'POD-A', serviceLine: 'Full Service', yearFounded: 1998, employeeCount: 520,
    }}),
    prisma.client.create({ data: {
      name: 'Cruz Capital Management', shortName: 'Cruz', primaryStrategy: 'Private Equity',
      hqCity: 'Menlo Park', hqCountry: 'United States', region: 'Americas',
      relationshipStart: new Date('2021-04-20'), status: 'Active',
      totalEntities: 42, totalNavMm: 4321, totalCommitmentMm: 7200,
      revenueL12m: 28900, marginPct: 36.5, teamLead: 'Megan Moore',
      podId: 'POD-A', serviceLine: 'Fund Accounting', yearFounded: 2009, employeeCount: 145,
    }}),
    prisma.client.create({ data: {
      name: 'Lopez Asset Partners', shortName: 'Lopez', primaryStrategy: 'Real Estate',
      hqCity: 'Edinburgh', hqCountry: 'United Kingdom', region: 'EMEA',
      relationshipStart: new Date('2022-02-14'), status: 'Active',
      totalEntities: 28, totalNavMm: 1923, totalCommitmentMm: 3100,
      revenueL12m: 14200, marginPct: 31.2, teamLead: 'Jason Cooper',
      podId: 'POD-C', serviceLine: 'Fund Accounting', yearFounded: 2015, employeeCount: 60,
    }}),
    prisma.client.create({ data: {
      name: 'White Advisors', shortName: 'White Adv', primaryStrategy: 'Credit',
      hqCity: 'Boston', hqCountry: 'United States', region: 'Americas',
      relationshipStart: new Date('2017-09-01'), status: 'Active',
      totalEntities: 52, totalNavMm: 5543, totalCommitmentMm: 8900,
      revenueL12m: 41300, marginPct: 40.8, teamLead: 'Diana Smith',
      podId: 'POD-B', serviceLine: 'Full Service', yearFounded: 2001, employeeCount: 280,
    }}),
    prisma.client.create({ data: {
      name: 'White Fund Management', shortName: 'WFM', primaryStrategy: 'Fund of Funds',
      hqCity: 'Amsterdam', hqCountry: 'Netherlands', region: 'EMEA',
      relationshipStart: new Date('2016-06-15'), status: 'Active',
      totalEntities: 51, totalNavMm: 13321, totalCommitmentMm: 18000,
      revenueL12m: 62500, marginPct: 45.2, teamLead: 'Megan Moore',
      podId: 'POD-A', serviceLine: 'Full Service', yearFounded: 1994, employeeCount: 410,
    }}),
    prisma.client.create({ data: {
      name: 'Rodriguez Capital Management', shortName: 'Rodriguez', primaryStrategy: 'Fund of Funds',
      hqCity: 'Zurich', hqCountry: 'Switzerland', region: 'EMEA',
      relationshipStart: new Date('2023-01-05'), status: 'Onboarding',
      totalEntities: 11, totalNavMm: 357, totalCommitmentMm: 600,
      revenueL12m: 3200, marginPct: 22.4, teamLead: 'Jessica Cruz',
      podId: 'POD-C', serviceLine: 'Fund Accounting', yearFounded: 2020, employeeCount: 15,
    }}),
  ]);
  console.log(`Created ${clients.length} clients`);

  // ═══════════════════════════════════════════════
  // ENTITIES (15)
  // ═══════════════════════════════════════════════
  const entities = await Promise.all([
    prisma.entity.create({ data: {
      entityId: 'ENT-000001', name: 'Walker Enterprise Management LLC', entityType: 'Management Company',
      structureType: 'LLC', domicile: 'Delaware', strategy: 'Private Equity', lifecycleStatus: 'Active',
      clientId: clients[0].id, revenueL12m: 48200, costL12m: 27800, marginPct: 42.3,
      accountingSystem: 'Investran', administrator: 'SS&C', auditor: 'PwC', legalCounsel: 'Kirkland & Ellis',
      reportingFrequency: 'Quarterly', navFrequency: 'Monthly', currency: 'USD',
      inceptionDate: new Date('2005-06-01'), hqCity: 'Dallas', region: 'Americas',
      dataQualityScore: 94.2, confidenceScore: 0.92,
      // new fields
      assetClass: 'Private Equity', shortName: 'Walker Mgmt', domicileCountry: 'United States', domicileState: 'Delaware',
      einTaxId: '75-3421987', entityRole: 'Management Co', fundStructure: 'LLC',
      regulatoryClassification: 'Exempt Reporting Adviser',
      geographyFocus: '["United States"]', sectorFocus: '["Diversified"]',
      investmentStrategyDetail: 'LBO', leveredFund: false, usesSubFacility: false,
      registeredAddress: '2200 Ross Avenue, Suite 3200, Dallas, TX 75201',
      booksComplexityTier: 'Tier 2', generalLedgerSystem: 'JSQ Investran', closeProcessModel: 'Standard',
      chartOfAccountsTemplate: 'Standard', bankFeedEnabled: true, docMgmtSystem: 'SharePoint',
      conversionType: 'Since Inception',
      accountingFramework: 'US GAAP', financialStatementsFrequency: 'Annual', investorStatementsFrequency: 'Quarterly',
      reportingPackageTimingQeDays: 45, reportingPackageTimingYeDays: 90,
      amlProgramRequired: true, fatcaRequired: false, crsRequired: false, kycStandard: 'Standard',
      bankAccountCount: 4, bankConnectivityMethod: 'SFTP', multiCurrency: false,
      paymentApprovalLevels: 'Dual', primaryCurrency: 'USD',
      investorPortalEnabled: false,
      scopeFundAccounting: true, scopeInvestorServices: false, scopeTaxServices: 'Full Prep', scopeTreasury: true,
      scopeMgmtCoAccounting: true, scopeRegulatoryReporting: false,
      auditTrailEnabled: true, dataClassificationLevel: 'Confidential',
      fundComplexName: 'Walker Enterprise Complex', sponsorGpOrg: 'Walker Asset Management', taxPreparer: 'PwC',
    }}),
    prisma.entity.create({ data: {
      entityId: 'ENT-000002', name: 'Walker Enterprise Fund III LP', entityType: 'Flagship Fund',
      structureType: 'LP', domicile: 'Delaware', strategy: 'Private Equity', vintage: 2021,
      lifecycleStatus: 'Active', clientId: clients[0].id,
      commitmentMm: 4500, calledCapitalMm: 3200, distributedCapitalMm: 1100, navMm: 3800, unfundedMm: 1300,
      prefRatePct: 8.0, carryPct: 20.0, mgmtFeePct: 2.0, waterfallType: 'European',
      grossIrrPct: 22.4, netIrrPct: 17.8, moic: 1.6, tvpi: 1.53, dpi: 0.34,
      revenueL12m: 18500, costL12m: 10200, marginPct: 44.9,
      accountingSystem: 'Investran', administrator: 'SS&C', auditor: 'PwC', legalCounsel: 'Kirkland & Ellis',
      reportingFrequency: 'Quarterly', navFrequency: 'Monthly', currency: 'USD',
      inceptionDate: new Date('2021-03-15'), hqCity: 'Dallas', region: 'Americas',
      dataQualityScore: 96.8, confidenceScore: 0.95,
      // new fields
      assetClass: 'Private Equity', shortName: 'Walker III', domicileCountry: 'United States', domicileState: 'Delaware',
      einTaxId: '75-9876543', entityRole: 'Main Fund', fundStructure: 'Limited Partnership',
      regulatoryClassification: '3(c)(7)',
      geographyFocus: '["United States","Europe"]', sectorFocus: '["Technology","Healthcare","Industrial"]',
      investmentStrategyDetail: 'LBO', leveredFund: true, usesSubFacility: true,
      targetCommittedCapital: 5000, targetInvestmentCount: 15, targetInvestorCount: 45, targetLeveragePct: 25,
      fundraisingFirstClose: new Date('2021-03-15'), fundraisingFinalClose: new Date('2021-09-30'),
      registeredAddress: '2200 Ross Avenue, Suite 3200, Dallas, TX 75201',
      carryStructure: 'European', catchUpType: 'Full', clawbackApplies: true, clawbackTrueUpFrequency: 'Annual',
      feeStepdownExists: true, hurdleType: 'IRR', mgmtFeeBasis: 'Committed',
      mgmtFeeFrequency: 'Quarterly', mgmtFeeWaiverOffset: 'Offset',
      escrowHoldbackApplies: true, escrowHoldbackPct: 30, mgmtFeeOffsetPct: 80,
      prefReturnCompounding: 'Annual', prefReturnDayCount: 'Actual/365',
      taxDistributionPolicy: 'All partners', unitOfAccount: 'Fund-as-a-whole',
      booksComplexityTier: 'Tier 2', generalLedgerSystem: 'JSQ Investran', closeProcessModel: 'Standard',
      chartOfAccountsTemplate: 'Standard', bankFeedEnabled: true, docMgmtSystem: 'SharePoint',
      multiCloseRebalancing: 'Standard', sideLetterComplexity: 'Medium',
      specialAllocationFrequency: 'Occasional', waterfallCalcAutomation: 'Semi-automated',
      annualCapitalEventsExpected: '7-12',
      conversionType: 'Since Inception',
      accountingFramework: 'US GAAP', financialStatementsFrequency: 'Annual',
      footnoteDisclosureLevel: 'Full annual', investorStatementsFrequency: 'Quarterly',
      reportingPackageTimingQeDays: 45, reportingPackageTimingYeDays: 90, valuationDeliverySla: 10,
      amlProgramRequired: true, fatcaRequired: true, crsRequired: true, kycStandard: 'Enhanced Due Diligence',
      benefitPlanInvestorTracking: true, restrictedPersonsTracking: true, support1099Level: 'Full',
      bankAccountCount: 3, bankConnectivityMethod: 'SFTP', multiCurrency: false,
      paymentApprovalLevels: 'Dual', primaryCurrency: 'USD', positivePayEnabled: true,
      investorPortalEnabled: true, redemptionProcessingModel: 'N/A',
      scopeFundAccounting: true, scopeInvestorServices: true, scopeTaxServices: 'Full Prep',
      scopeTreasury: true, scopeRegulatoryReporting: true, scopeAmlKyc: 'Full', scopeFatcaCrs: true,
      auditTrailEnabled: true, dataClassificationLevel: 'Confidential',
      fundComplexName: 'Walker Enterprise Complex', sponsorGpOrg: 'Walker Asset Management',
      custodianPrimeBroker: 'JP Morgan', taxPreparer: 'PwC', managementCompanyRef: 'Walker Enterprise Management LLC',
    }}),
    prisma.entity.create({ data: {
      entityId: 'ENT-000003', name: 'Walker Enterprise III Master Fund LP', entityType: 'Master Fund',
      structureType: 'LP', domicile: 'Cayman Islands', strategy: 'Private Equity', vintage: 2021,
      lifecycleStatus: 'Active', clientId: clients[0].id,
      commitmentMm: 4500, calledCapitalMm: 3200, navMm: 3800,
      accountingSystem: 'Investran', administrator: 'SS&C', auditor: 'PwC',
      reportingFrequency: 'Quarterly', navFrequency: 'Monthly', currency: 'USD',
      inceptionDate: new Date('2021-03-15'), region: 'Americas',
      dataQualityScore: 91.5, confidenceScore: 0.88,
      assetClass: 'Private Equity', shortName: 'Walker III Master', domicileCountry: 'Cayman Islands',
      entityRole: 'Master', fundStructure: 'Limited Partnership', regulatoryClassification: '3(c)(7)',
      geographyFocus: '["United States","Europe"]', investmentStrategyDetail: 'LBO',
      booksComplexityTier: 'Tier 2', generalLedgerSystem: 'JSQ Investran', closeProcessModel: 'Standard',
      accountingFramework: 'US GAAP', financialStatementsFrequency: 'Annual',
      amlProgramRequired: true, fatcaRequired: true, crsRequired: true,
      bankAccountCount: 2, multiCurrency: false, primaryCurrency: 'USD',
      scopeFundAccounting: true, scopeInvestorServices: true,
      auditTrailEnabled: true, dataClassificationLevel: 'Confidential',
      fundComplexName: 'Walker Enterprise Complex', sponsorGpOrg: 'Walker Asset Management',
    }}),
    prisma.entity.create({ data: {
      entityId: 'ENT-000004', name: 'Walker III Onshore Feeder LP', entityType: 'Feeder Fund',
      structureType: 'LP', domicile: 'Delaware', strategy: 'Private Equity', vintage: 2021,
      lifecycleStatus: 'Active', clientId: clients[0].id,
      commitmentMm: 2800, calledCapitalMm: 1950, navMm: 2350,
      reportingFrequency: 'Quarterly', navFrequency: 'Monthly', currency: 'USD',
      inceptionDate: new Date('2021-04-01'), region: 'Americas',
      dataQualityScore: 89.1, confidenceScore: 0.85,
      assetClass: 'Private Equity', shortName: 'Walker III Onshore', domicileCountry: 'United States',
      domicileState: 'Delaware', entityRole: 'Feeder', fundStructure: 'Limited Partnership',
      regulatoryClassification: '3(c)(7)',
      booksComplexityTier: 'Tier 1', generalLedgerSystem: 'JSQ Investran',
      accountingFramework: 'US GAAP',
      amlProgramRequired: true, fatcaRequired: true,
      bankAccountCount: 1, primaryCurrency: 'USD',
      scopeFundAccounting: true, scopeInvestorServices: true,
      auditTrailEnabled: true, dataClassificationLevel: 'Confidential',
      fundComplexName: 'Walker Enterprise Complex',
    }}),
    prisma.entity.create({ data: {
      entityId: 'ENT-000005', name: 'Walker III Offshore Feeder Ltd', entityType: 'Feeder Fund',
      structureType: 'Corp', domicile: 'Cayman Islands', strategy: 'Private Equity', vintage: 2021,
      lifecycleStatus: 'Active', clientId: clients[0].id,
      commitmentMm: 1200, calledCapitalMm: 850, navMm: 1020,
      reportingFrequency: 'Quarterly', navFrequency: 'Monthly', currency: 'USD',
      inceptionDate: new Date('2021-04-01'), region: 'Americas',
      dataQualityScore: 87.3, confidenceScore: 0.82,
      assetClass: 'Private Equity', shortName: 'Walker III Offshore', domicileCountry: 'Cayman Islands',
      entityRole: 'Feeder', fundStructure: 'Other', fundStructureOther: 'Exempted Company',
      regulatoryClassification: '3(c)(7)',
      booksComplexityTier: 'Tier 1', generalLedgerSystem: 'JSQ Investran',
      accountingFramework: 'US GAAP',
      amlProgramRequired: true, fatcaRequired: true, crsRequired: true,
      bankAccountCount: 1, primaryCurrency: 'USD',
      scopeFundAccounting: true, scopeInvestorServices: true,
      auditTrailEnabled: true, dataClassificationLevel: 'Confidential',
      fundComplexName: 'Walker Enterprise Complex',
    }}),
    prisma.entity.create({ data: {
      entityId: 'ENT-000006', name: 'Walker III Co-Invest Vehicle LP', entityType: 'Co-Invest Vehicle',
      structureType: 'LP', domicile: 'Delaware', strategy: 'Private Equity', vintage: 2022,
      lifecycleStatus: 'Active', clientId: clients[0].id,
      commitmentMm: 500, calledCapitalMm: 500, navMm: 680,
      grossIrrPct: 35.2, netIrrPct: 31.8, moic: 1.36,
      reportingFrequency: 'Quarterly', currency: 'USD',
      inceptionDate: new Date('2022-08-15'), region: 'Americas',
      dataQualityScore: 82.0, confidenceScore: 0.78,
      assetClass: 'Private Equity', shortName: 'Walker III Co-Invest', domicileCountry: 'United States',
      domicileState: 'Delaware', entityRole: 'Co-Invest', fundStructure: 'Limited Partnership',
      carryStructure: 'American', mgmtFeeBasis: 'Committed', mgmtFeeFrequency: 'Quarterly',
      unitOfAccount: 'Deal-by-deal',
      booksComplexityTier: 'Tier 1',
      accountingFramework: 'US GAAP',
      bankAccountCount: 1, primaryCurrency: 'USD',
      scopeFundAccounting: true,
      auditTrailEnabled: true, dataClassificationLevel: 'Confidential',
      fundComplexName: 'Walker Enterprise Complex',
    }}),
    prisma.entity.create({ data: {
      entityId: 'ENT-000007', name: 'Campbell Growth Fund IV LP', entityType: 'Flagship Fund',
      structureType: 'LP', domicile: 'Delaware', strategy: 'Private Equity', vintage: 2023,
      lifecycleStatus: 'Fundraising', clientId: clients[1].id,
      commitmentMm: 2000, calledCapitalMm: 400, navMm: 420,
      prefRatePct: 8.0, carryPct: 20.0, mgmtFeePct: 2.0, waterfallType: 'American',
      grossIrrPct: 15.2, netIrrPct: 11.8,
      accountingSystem: 'Allvue', administrator: 'Citco', auditor: 'Deloitte', legalCounsel: 'Simpson Thacher',
      reportingFrequency: 'Quarterly', navFrequency: 'Monthly', currency: 'USD',
      inceptionDate: new Date('2023-06-01'), hqCity: 'Los Angeles', region: 'Americas',
      dataQualityScore: 93.1, confidenceScore: 0.91,
      assetClass: 'Private Equity', shortName: 'Campbell IV', domicileCountry: 'United States',
      domicileState: 'Delaware', entityRole: 'Main Fund', fundStructure: 'Limited Partnership',
      regulatoryClassification: '3(c)(7)',
      geographyFocus: '["United States"]', sectorFocus: '["Technology","Consumer","Services"]',
      investmentStrategyDetail: 'Growth Equity', leveredFund: false, usesSubFacility: true,
      targetCommittedCapital: 3000, targetInvestmentCount: 12, targetInvestorCount: 35,
      fundraisingFirstClose: new Date('2023-06-01'),
      carryStructure: 'American', catchUpType: 'Full', clawbackApplies: true,
      hurdleType: 'IRR', mgmtFeeBasis: 'Committed', mgmtFeeFrequency: 'Quarterly',
      prefReturnCompounding: 'Annual', prefReturnDayCount: 'Actual/365',
      unitOfAccount: 'Fund-as-a-whole',
      booksComplexityTier: 'Tier 2', generalLedgerSystem: 'Client Investran', closeProcessModel: 'Standard',
      annualCapitalEventsExpected: '7-12', sideLetterComplexity: 'Low',
      conversionType: 'Since Inception',
      accountingFramework: 'US GAAP', financialStatementsFrequency: 'Annual',
      investorStatementsFrequency: 'Quarterly',
      reportingPackageTimingQeDays: 60, reportingPackageTimingYeDays: 120,
      amlProgramRequired: true, fatcaRequired: true, kycStandard: 'Standard',
      support1099Level: 'Full',
      bankAccountCount: 2, bankConnectivityMethod: 'SFTP', primaryCurrency: 'USD',
      paymentApprovalLevels: 'Dual', investorPortalEnabled: true,
      scopeFundAccounting: true, scopeInvestorServices: true, scopeTaxServices: 'Full Prep',
      auditTrailEnabled: true, dataClassificationLevel: 'Confidential',
      sponsorGpOrg: 'Campbell Capital Partners', taxPreparer: 'Deloitte',
    }}),
    prisma.entity.create({ data: {
      entityId: 'ENT-000008', name: 'Sullivan Global Alpha Fund', entityType: 'Flagship Fund',
      structureType: 'LP', domicile: 'Cayman Islands', strategy: 'Hedge Fund',
      lifecycleStatus: 'Active', clientId: clients[2].id, openEnded: true,
      navMm: 6122, commitmentMm: 6122,
      grossIrrPct: 18.7, netIrrPct: 14.2, moic: 2.1,
      mgmtFeePct: 1.5, carryPct: 20.0,
      accountingSystem: 'Geneva', administrator: 'NAV Consulting', auditor: 'EY', legalCounsel: 'Sidley Austin',
      reportingFrequency: 'Monthly', navFrequency: 'Daily', currency: 'USD',
      inceptionDate: new Date('2010-01-15'), hqCity: 'New York', region: 'Americas',
      dataQualityScore: 98.2, confidenceScore: 0.97,
      assetClass: 'Multi-Strategy', shortName: 'Sullivan Alpha', domicileCountry: 'Cayman Islands',
      entityRole: 'Main Fund', fundStructure: 'Limited Partnership',
      regulatoryClassification: '3(c)(7)',
      geographyFocus: '["Global"]', sectorFocus: '["Diversified"]',
      investmentStrategyDetail: 'Multi-Manager', leveredFund: true, usesSubFacility: false,
      targetLeveragePct: 150,
      carryStructure: 'American', hurdleType: 'None', mgmtFeeBasis: 'NAV',
      mgmtFeeFrequency: 'Monthly',
      booksComplexityTier: 'Tier 4', generalLedgerSystem: 'Client Investran', closeProcessModel: 'Accelerated',
      accountingFramework: 'US GAAP', financialStatementsFrequency: 'Annual',
      investorStatementsFrequency: 'Monthly',
      reportingPackageTimingQeDays: 30, reportingPackageTimingYeDays: 60,
      amlProgramRequired: true, fatcaRequired: true, crsRequired: true,
      kycStandard: 'Enhanced Due Diligence',
      bankAccountCount: 8, bankConnectivityMethod: 'API', multiCurrency: true,
      paymentApprovalLevels: 'Triple', primaryCurrency: 'USD', positivePayEnabled: true,
      investorPortalEnabled: true, redemptionProcessingModel: 'Admin-managed',
      scopeFundAccounting: true, scopeInvestorServices: true, scopeTreasury: true,
      scopeRegulatoryReporting: true, scopeAmlKyc: 'Full', scopeFatcaCrs: true,
      auditTrailEnabled: true, dataClassificationLevel: 'Restricted',
      custodianPrimeBroker: 'Goldman Sachs', sponsorGpOrg: 'Sullivan Investments',
    }}),
    prisma.entity.create({ data: {
      entityId: 'ENT-000009', name: 'Cruz Ventures Fund II LP', entityType: 'Flagship Fund',
      structureType: 'LP', domicile: 'Delaware', strategy: 'Venture Capital', vintage: 2022,
      lifecycleStatus: 'Active', clientId: clients[3].id,
      commitmentMm: 850, calledCapitalMm: 620, navMm: 980, distributedCapitalMm: 150,
      prefRatePct: 0, carryPct: 25.0, mgmtFeePct: 2.5, waterfallType: 'American',
      grossIrrPct: 42.1, netIrrPct: 34.6, moic: 1.82,
      accountingSystem: 'Carta', administrator: 'Standish', auditor: 'KPMG', legalCounsel: 'Cooley',
      reportingFrequency: 'Quarterly', navFrequency: 'Quarterly', currency: 'USD',
      inceptionDate: new Date('2022-02-01'), hqCity: 'Menlo Park', region: 'Americas',
      dataQualityScore: 91.7, confidenceScore: 0.89,
      assetClass: 'Venture Capital', shortName: 'Cruz II', domicileCountry: 'United States',
      domicileState: 'Delaware', entityRole: 'Main Fund', fundStructure: 'Limited Partnership',
      regulatoryClassification: '3(c)(1)',
      geographyFocus: '["United States"]', sectorFocus: '["Technology","Healthcare"]',
      investmentStrategyDetail: 'VC Early', leveredFund: false, usesSubFacility: true,
      targetCommittedCapital: 1000, targetInvestmentCount: 30, targetInvestorCount: 25,
      fundraisingFirstClose: new Date('2022-02-01'), fundraisingFinalClose: new Date('2022-06-30'),
      carryStructure: 'American', catchUpType: 'None', clawbackApplies: false,
      hurdleType: 'None', mgmtFeeBasis: 'Committed', mgmtFeeFrequency: 'Quarterly',
      unitOfAccount: 'Deal-by-deal',
      booksComplexityTier: 'Tier 2', generalLedgerSystem: 'Other', generalLedgerSystemOther: 'Carta',
      closeProcessModel: 'Standard', annualCapitalEventsExpected: '7-12',
      conversionType: 'Since Inception',
      accountingFramework: 'US GAAP', financialStatementsFrequency: 'Annual',
      investorStatementsFrequency: 'Quarterly',
      reportingPackageTimingQeDays: 60, reportingPackageTimingYeDays: 120,
      amlProgramRequired: true, fatcaRequired: true, kycStandard: 'Standard', support1099Level: 'Full',
      bankAccountCount: 2, bankConnectivityMethod: 'SFTP', primaryCurrency: 'USD',
      paymentApprovalLevels: 'Dual', investorPortalEnabled: true,
      scopeFundAccounting: true, scopeInvestorServices: true, scopeTaxServices: 'Full Prep',
      auditTrailEnabled: true, dataClassificationLevel: 'Confidential',
      sponsorGpOrg: 'Cruz Capital Management', taxPreparer: 'KPMG',
    }}),
    prisma.entity.create({ data: {
      entityId: 'ENT-000010', name: 'Lopez Real Estate Opportunities III', entityType: 'Flagship Fund',
      structureType: 'SCSp', domicile: 'Luxembourg', strategy: 'Real Estate', vintage: 2023,
      lifecycleStatus: 'Active', clientId: clients[4].id,
      commitmentMm: 1500, calledCapitalMm: 800, navMm: 920,
      prefRatePct: 7.0, carryPct: 15.0, mgmtFeePct: 1.75,
      grossIrrPct: 14.8, netIrrPct: 11.2, moic: 1.15,
      accountingSystem: 'Yardi', administrator: 'Alter Domus', auditor: 'KPMG', legalCounsel: 'Linklaters',
      reportingFrequency: 'Quarterly', navFrequency: 'Quarterly', currency: 'EUR',
      inceptionDate: new Date('2023-01-20'), hqCity: 'Edinburgh', region: 'EMEA',
      dataQualityScore: 88.4, confidenceScore: 0.84,
      assetClass: 'Real Estate', shortName: 'Lopez RE III', domicileCountry: 'Luxembourg',
      entityRole: 'Main Fund', fundStructure: 'Other', fundStructureOther: 'SCSp',
      regulatoryClassification: 'RAIF',
      geographyFocus: '["Europe","UK"]', sectorFocus: '["Real Assets"]',
      investmentStrategyDetail: 'RE Value-Add', leveredFund: true, usesSubFacility: false,
      targetCommittedCapital: 2000, targetInvestmentCount: 8, targetInvestorCount: 20, targetLeveragePct: 55,
      fundraisingFirstClose: new Date('2023-01-20'), fundraisingFinalClose: new Date('2023-07-15'),
      carryStructure: 'European', catchUpType: 'Partial', clawbackApplies: true,
      hurdleType: 'IRR', mgmtFeeBasis: 'Committed', mgmtFeeFrequency: 'Quarterly',
      escrowHoldbackApplies: true, escrowHoldbackPct: 20,
      prefReturnCompounding: 'Quarterly', prefReturnDayCount: 'Actual/365',
      unitOfAccount: 'Fund-as-a-whole',
      booksComplexityTier: 'Tier 3', generalLedgerSystem: 'Client Yardi', closeProcessModel: 'Standard',
      annualCapitalEventsExpected: '0-6', sideLetterComplexity: 'Medium',
      multiCloseRebalancing: 'Complex',
      conversionType: 'Since Inception',
      accountingFramework: 'IFRS', financialStatementsFrequency: 'Annual',
      investorStatementsFrequency: 'Quarterly',
      reportingPackageTimingQeDays: 60, reportingPackageTimingYeDays: 120,
      amlProgramRequired: true, fatcaRequired: true, crsRequired: true,
      kycStandard: 'Enhanced Due Diligence',
      bankAccountCount: 6, bankConnectivityMethod: 'SFTP', multiCurrency: true,
      paymentApprovalLevels: 'Dual', primaryCurrency: 'EUR',
      investorPortalEnabled: true,
      scopeFundAccounting: true, scopeInvestorServices: true, scopeTaxServices: 'Coordination Only',
      scopeTreasury: true,
      auditTrailEnabled: true, dataClassificationLevel: 'Confidential',
      sponsorGpOrg: 'Lopez Asset Partners', taxPreparer: 'KPMG',
    }}),
    prisma.entity.create({ data: {
      entityId: 'ENT-000011', name: 'White Senior Credit Fund V', entityType: 'Flagship Fund',
      structureType: 'LP', domicile: 'Delaware', strategy: 'Credit', vintage: 2020,
      lifecycleStatus: 'Active', clientId: clients[5].id,
      commitmentMm: 3200, calledCapitalMm: 3000, navMm: 3100, distributedCapitalMm: 900,
      prefRatePct: 6.0, carryPct: 15.0, mgmtFeePct: 1.25,
      grossIrrPct: 11.2, netIrrPct: 8.9, moic: 1.33, tvpi: 1.33, dpi: 0.30,
      accountingSystem: 'Wall Street Office', administrator: 'SS&C', auditor: 'PwC', legalCounsel: 'Dechert',
      reportingFrequency: 'Quarterly', navFrequency: 'Monthly', currency: 'USD',
      inceptionDate: new Date('2020-09-01'), hqCity: 'Boston', region: 'Americas',
      dataQualityScore: 95.6, confidenceScore: 0.94,
      assetClass: 'Private Credit', shortName: 'White Credit V', domicileCountry: 'United States',
      domicileState: 'Delaware', entityRole: 'Main Fund', fundStructure: 'Limited Partnership',
      regulatoryClassification: '3(c)(7)',
      geographyFocus: '["United States"]', sectorFocus: '["Financials","Industrial","Healthcare"]',
      investmentStrategyDetail: 'Senior Secured', leveredFund: true, usesSubFacility: true,
      targetCommittedCapital: 3500, targetInvestmentCount: 40, targetInvestorCount: 30, targetLeveragePct: 100,
      fundraisingFirstClose: new Date('2020-09-01'), fundraisingFinalClose: new Date('2021-03-31'),
      carryStructure: 'European', catchUpType: 'Full', clawbackApplies: true,
      clawbackTrueUpFrequency: 'Annual', hurdleType: 'IRR',
      mgmtFeeBasis: 'Invested', mgmtFeeFrequency: 'Quarterly',
      prefReturnCompounding: 'Quarterly', prefReturnDayCount: 'Actual/360',
      taxDistributionPolicy: 'All partners', unitOfAccount: 'Fund-as-a-whole',
      booksComplexityTier: 'Tier 3', generalLedgerSystem: 'Other',
      generalLedgerSystemOther: 'Wall Street Office', closeProcessModel: 'Standard',
      annualCapitalEventsExpected: '13-24', sideLetterComplexity: 'Medium',
      waterfallCalcAutomation: 'Semi-automated',
      conversionType: 'Since Inception',
      accountingFramework: 'US GAAP', financialStatementsFrequency: 'Annual',
      footnoteDisclosureLevel: 'Full annual', investorStatementsFrequency: 'Quarterly',
      reportingPackageTimingQeDays: 45, reportingPackageTimingYeDays: 90, valuationDeliverySla: 15,
      amlProgramRequired: true, fatcaRequired: true, crsRequired: false,
      kycStandard: 'Enhanced Due Diligence', support1099Level: 'Full',
      bankAccountCount: 4, bankConnectivityMethod: 'SFTP', multiCurrency: false,
      paymentApprovalLevels: 'Dual', primaryCurrency: 'USD', positivePayEnabled: true,
      investorPortalEnabled: true, scopeLoanAdmin: true,
      scopeFundAccounting: true, scopeInvestorServices: true, scopeTaxServices: 'Full Prep',
      scopeTreasury: true, scopeAmlKyc: 'Full', scopeFatcaCrs: true,
      auditTrailEnabled: true, dataClassificationLevel: 'Restricted',
      custodianPrimeBroker: 'US Bank', sponsorGpOrg: 'White Advisors', taxPreparer: 'PwC',
    }}),
    prisma.entity.create({ data: {
      entityId: 'ENT-000012', name: 'WFM Global Opportunities FoF', entityType: 'Flagship Fund',
      structureType: 'SICAV', domicile: 'Luxembourg', strategy: 'Fund of Funds',
      lifecycleStatus: 'Active', clientId: clients[6].id, openEnded: true,
      navMm: 8500, commitmentMm: 8500,
      grossIrrPct: 13.5, netIrrPct: 10.8, moic: 1.95,
      mgmtFeePct: 0.75, carryPct: 10.0,
      accountingSystem: 'eFront', administrator: 'State Street', auditor: 'Deloitte', legalCounsel: 'Clifford Chance',
      reportingFrequency: 'Quarterly', navFrequency: 'Monthly', currency: 'EUR',
      inceptionDate: new Date('2008-04-01'), hqCity: 'Amsterdam', region: 'EMEA',
      dataQualityScore: 97.1, confidenceScore: 0.96,
      assetClass: 'Fund of Funds', shortName: 'WFM Global FoF', domicileCountry: 'Luxembourg',
      entityRole: 'Main Fund', fundStructure: 'SICAV', regulatoryClassification: 'SICAV',
      geographyFocus: '["Global"]', sectorFocus: '["Diversified"]',
      investmentStrategyDetail: 'Multi-Manager', leveredFund: false, usesSubFacility: false,
      carryStructure: 'European', hurdleType: 'IRR', mgmtFeeBasis: 'NAV',
      mgmtFeeFrequency: 'Quarterly', unitOfAccount: 'Fund-as-a-whole',
      booksComplexityTier: 'Tier 3', generalLedgerSystem: 'Other', generalLedgerSystemOther: 'eFront',
      closeProcessModel: 'Standard',
      accountingFramework: 'Lux GAAP', financialStatementsFrequency: 'Annual',
      investorStatementsFrequency: 'Quarterly',
      reportingPackageTimingQeDays: 45, reportingPackageTimingYeDays: 90,
      amlProgramRequired: true, fatcaRequired: true, crsRequired: true,
      kycStandard: 'Enhanced Due Diligence',
      bankAccountCount: 3, bankConnectivityMethod: 'SFTP', multiCurrency: true,
      paymentApprovalLevels: 'Dual', primaryCurrency: 'EUR',
      investorPortalEnabled: true, redemptionProcessingModel: 'Hybrid',
      scopeFundAccounting: true, scopeInvestorServices: true, scopeTreasury: true,
      scopeRegulatoryReporting: true, scopeFatcaCrs: true,
      auditTrailEnabled: true, dataClassificationLevel: 'Confidential',
      sponsorGpOrg: 'White Fund Management',
    }}),
    prisma.entity.create({ data: {
      entityId: 'ENT-000013', name: 'Walker Enterprise Fund I LP', entityType: 'Flagship Fund',
      structureType: 'LP', domicile: 'Delaware', strategy: 'Private Equity', vintage: 2014,
      lifecycleStatus: 'Winding Down', clientId: clients[0].id,
      commitmentMm: 2200, calledCapitalMm: 2200, distributedCapitalMm: 4100, navMm: 180,
      grossIrrPct: 28.9, netIrrPct: 22.4, moic: 1.95, tvpi: 1.95, dpi: 1.86,
      accountingSystem: 'Investran', administrator: 'SS&C', auditor: 'PwC',
      reportingFrequency: 'Quarterly', navFrequency: 'Quarterly', currency: 'USD',
      inceptionDate: new Date('2014-06-15'), region: 'Americas',
      dataQualityScore: 99.1, confidenceScore: 0.99,
      assetClass: 'Private Equity', shortName: 'Walker I', domicileCountry: 'United States',
      domicileState: 'Delaware', entityRole: 'Main Fund', fundStructure: 'Limited Partnership',
      regulatoryClassification: '3(c)(7)',
      investmentStrategyDetail: 'LBO',
      carryStructure: 'European', clawbackApplies: true,
      mgmtFeeBasis: 'Invested', mgmtFeeFrequency: 'Quarterly',
      unitOfAccount: 'Fund-as-a-whole',
      booksComplexityTier: 'Tier 1', generalLedgerSystem: 'JSQ Investran',
      accountingFramework: 'US GAAP', financialStatementsFrequency: 'Annual',
      investorStatementsFrequency: 'Quarterly',
      amlProgramRequired: true, fatcaRequired: true, support1099Level: 'Full',
      bankAccountCount: 1, primaryCurrency: 'USD',
      scopeFundAccounting: true, scopeInvestorServices: true, scopeTaxServices: 'Full Prep',
      auditTrailEnabled: true, dataClassificationLevel: 'Confidential',
      fundComplexName: 'Walker Enterprise Complex', sponsorGpOrg: 'Walker Asset Management',
    }}),
    prisma.entity.create({ data: {
      entityId: 'ENT-000014', name: 'Walker III GP LLC', entityType: 'GP Entity',
      structureType: 'LLC', domicile: 'Delaware', strategy: 'Private Equity',
      lifecycleStatus: 'Active', clientId: clients[0].id,
      reportingFrequency: 'Annually', currency: 'USD',
      inceptionDate: new Date('2021-02-01'), region: 'Americas',
      dataQualityScore: 85.0, confidenceScore: 0.80,
      assetClass: 'Private Equity', shortName: 'Walker III GP', domicileCountry: 'United States',
      domicileState: 'Delaware', entityRole: 'GP', fundStructure: 'LLC',
      booksComplexityTier: 'Tier 1', generalLedgerSystem: 'JSQ Investran',
      accountingFramework: 'US GAAP', financialStatementsFrequency: 'Annual',
      bankAccountCount: 1, primaryCurrency: 'USD',
      scopeFundAccounting: true,
      auditTrailEnabled: true, dataClassificationLevel: 'Confidential',
      fundComplexName: 'Walker Enterprise Complex', sponsorGpOrg: 'Walker Asset Management',
    }}),
    prisma.entity.create({ data: {
      entityId: 'ENT-000015', name: 'Rodriguez Emerging Markets FoF I', entityType: 'Flagship Fund',
      structureType: 'LP', domicile: 'Switzerland', strategy: 'Fund of Funds', vintage: 2024,
      lifecycleStatus: 'Fundraising', clientId: clients[7].id,
      commitmentMm: 300, calledCapitalMm: 50, navMm: 52,
      mgmtFeePct: 1.0, carryPct: 10.0,
      accountingSystem: 'eFront', administrator: 'Apex', auditor: 'EY',
      reportingFrequency: 'Quarterly', navFrequency: 'Quarterly', currency: 'CHF',
      inceptionDate: new Date('2024-01-15'), hqCity: 'Zurich', region: 'EMEA',
      dataQualityScore: 78.5, confidenceScore: 0.72,
      assetClass: 'Fund of Funds', shortName: 'Rodriguez EM FoF', domicileCountry: 'Switzerland',
      entityRole: 'Main Fund', fundStructure: 'Limited Partnership',
      regulatoryClassification: 'Other', regulatoryClassificationOther: 'Swiss LPOA',
      geographyFocus: '["Emerging Markets","APAC","LATAM"]', sectorFocus: '["Diversified"]',
      investmentStrategyDetail: 'Multi-Manager', leveredFund: false, usesSubFacility: false,
      targetCommittedCapital: 600, targetInvestorCount: 15,
      fundraisingFirstClose: new Date('2024-01-15'),
      carryStructure: 'European', hurdleType: 'IRR', mgmtFeeBasis: 'Committed',
      mgmtFeeFrequency: 'Quarterly', unitOfAccount: 'Fund-as-a-whole',
      booksComplexityTier: 'Tier 2', generalLedgerSystem: 'Other', generalLedgerSystemOther: 'eFront',
      conversionType: 'Since Inception',
      accountingFramework: 'IFRS', financialStatementsFrequency: 'Annual',
      investorStatementsFrequency: 'Quarterly',
      amlProgramRequired: true, fatcaRequired: true, crsRequired: true,
      kycStandard: 'Enhanced Due Diligence',
      bankAccountCount: 2, bankConnectivityMethod: 'Manual Upload', multiCurrency: true,
      paymentApprovalLevels: 'Dual', primaryCurrency: 'CHF',
      investorPortalEnabled: false,
      scopeFundAccounting: true, scopeInvestorServices: true,
      auditTrailEnabled: true, dataClassificationLevel: 'Confidential',
      sponsorGpOrg: 'Rodriguez Capital Management',
    }}),
  ]);
  console.log(`Created ${entities.length} entities`);

  // ═══════════════════════════════════════════════
  // DOMAIN-SPECIFIC FIELDS
  // ═══════════════════════════════════════════════
  await Promise.all([
    // PE domain for Walker Fund III (entities[1]), Walker Master (entities[2]), Walker Co-Invest (entities[5]), Campbell IV (entities[6]), Walker Fund I (entities[12])
    prisma.pEDomainFields.create({ data: { entityId: entities[1].id, averageAddOnCountPerPlatform: 3, coInvestAllocationFrequency: 'Medium', portfolioLevelLeveragePresence: true, pikToggleDebtPresence: false }}),
    prisma.pEDomainFields.create({ data: { entityId: entities[2].id, averageAddOnCountPerPlatform: 3, coInvestAllocationFrequency: 'Medium', portfolioLevelLeveragePresence: true }}),
    prisma.pEDomainFields.create({ data: { entityId: entities[5].id, coInvestAllocationFrequency: 'High' }}),
    prisma.pEDomainFields.create({ data: { entityId: entities[6].id, averageAddOnCountPerPlatform: 2, coInvestAllocationFrequency: 'Low', portfolioLevelLeveragePresence: false }}),
    prisma.pEDomainFields.create({ data: { entityId: entities[12].id, averageAddOnCountPerPlatform: 4, coInvestAllocationFrequency: 'High', portfolioLevelLeveragePresence: true }}),

    // OEF domain for Sullivan Global Alpha (entities[7])
    prisma.oEFDomainFields.create({ data: {
      entityId: entities[7].id, unitizedFund: true, numberOfShareClasses: 3,
      shareClassNames: 'Class A, Class B, Class I', subscriptionWindow: 'Monthly', redemptionWindow: 'Quarterly',
      lockupPeriodMonths: 12, gateApplies: true, gatePct: 25, dripOffered: false,
      crystallizationTiming: 'Annual', crystallizationBasis: 'Annual',
      strategyType: 'Multi-Strategy', primeBrokerCount: 2, counterpartyCount: 15,
      otcExposurePresence: true, dailyNavRequired: true, investorLiquidityTerms: 'Quarterly',
      sidePocketUsage: true, highWaterMarkTrackingRequired: true, incentiveFeeFrequency: 'Annual',
      equalizationMethod: 'Equalization', lossCarryforwardTrackingRequired: true,
    }}),

    // VC domain for Cruz Ventures II (entities[8])
    prisma.vCDomainFields.create({ data: {
      entityId: entities[8].id, stageFocusMix: '["Seed","Series A","Series B"]',
      safeConvertibleNotePresence: true, bridgeFinancingFrequency: 'Medium',
      warrantOrTokenExposure: 'Token', optionPoolTrackingRequired: true,
      liquidationPreferenceStructures: 'Participating', payToPlayClausesPresent: true,
    }}),

    // RE domain for Lopez RE Opp III (entities[9])
    prisma.rEDomainFields.create({ data: {
      entityId: entities[9].id, propertyTypeMix: '["Office","Industrial","Multifamily"]',
      propertyCount: '11-20', debtFacilityCount: 4, leaseCount: 320,
      stabilizedVsDevelopment: 'Value-Add', geographicDispersion: 'Regional',
      propertyManagerModel: 'Third-Party', propertyDebtExists: true, preferredEquityInstruments: false,
      appraisalFrequency: 'Semi-Annual', camReconciliationsRequired: true,
      capexBudgetingRequired: true, constructionDrawsPresence: false,
      energyEsgReportingRequired: true, insuranceTrackingRequired: true,
      leaseAbstractingRequired: true, noiTrackingRequired: true,
      occupancyReportingRequired: true, rentRollDeliveryFrequency: 'Monthly',
      reJointVentureAccounting: true, waterfallAtPropertyLevel: true,
      tenantConcentrationRisk: 'Medium',
      valuationMethodMix: '["Income Approach","DCF","Third-Party Appraisal"]',
    }}),

    // Credit domain for White Credit V (entities[10])
    prisma.creditDomainFields.create({ data: {
      entityId: entities[10].id, loanTypeMix: '["Senior Secured","Unitranche","Revolver"]',
      collateralTypeMix: '["Cash Flow","Asset-Based"]',
      covenantMonitoringRequired: true, covenantFrequency: 'Quarterly',
      facilityComplexityTier: 'Moderate', indexType: 'SOFR',
      interestDayCalcMethod: 'Actual/360', paymentFrequency: 'Monthly',
      pikInterestPresence: false, delayedDrawPresence: true, revolverPresence: true,
      oidUpfrontFeesPresence: true, prepaymentPenaltyPresence: true,
      prepaymentPenaltyType: 'Make-Whole',
      loanServicingSystem: 'Loan IQ', workoutRestructuringActivity: 'Some',
    }}),

    // FOF domain for WFM Global FoF (entities[11]) and Rodriguez FoF (entities[14])
    prisma.fOFDomainFields.create({ data: { entityId: entities[11].id, underlyingFundCount: 42, lookThroughRequired: true, underlyingCarryTransparency: 'Full' }}),
    prisma.fOFDomainFields.create({ data: { entityId: entities[14].id, underlyingFundCount: 8, lookThroughRequired: true, underlyingCarryTransparency: 'Partial' }}),

    // GP Carry domain for Walker III GP (entities[13])
    prisma.gPCarryDomainFields.create({ data: {
      entityId: entities[13].id, gpMemberCount: 12, allocationVariability: 'Tiered',
      clawbackAllocationMethod: 'Capital Weighted', cashlessContributionsPresence: true,
      deferredCompensationLinked: true, vestingScheduleComplexity: 'Multi-Tier',
    }}),

    // ManCo domain for Walker Mgmt (entities[0])
    prisma.manCoDomainFields.create({ data: {
      entityId: entities[0].id, revenueStreamsMonitoringFees: true, revenueStreamsTransactionFees: true,
      revenueStreamsConsultingFees: false, feeOffsetPctToFund: 80,
      costSharingWithGp: true, sharedExpenseAllocationMethod: 'Headcount',
      intercompanyBillingFrequency: 'Quarterly', payrollJurisdictions: '["US","UK"]',
    }}),

    // Other domain for selected entities
    prisma.otherDomainFields.create({ data: {
      entityId: entities[1].id, historicalErrorRatePct: 0.3, avgInvestorQueryVolumeMonth: 45,
      customReportingRequests: 'Medium', boardReportingRequired: true,
      esgReportingRequired: true, ilpaTemplateRequired: true,
      investorConcentrationPct: 18.5, top3LpConcentrationPct: 42.1, strategicAccountFlag: true,
    }}),
  ]);
  console.log('Created domain-specific field records');

  // ═══════════════════════════════════════════════
  // INVESTORS (15)
  // ═══════════════════════════════════════════════
  await Promise.all([
    prisma.investor.create({ data: { investorId: 'INV-001', name: 'California Public Employees Retirement System', investorType: 'Pension Fund', commitmentMm: 500, calledCapitalMm: 350, distributedMm: 120, navMm: 420, domicile: 'United States', entityName: 'Walker Enterprise Fund III LP', status: 'Active', contactName: 'Robert Chen', contactEmail: 'rchen@calpers.gov', taxExempt: true }}),
    prisma.investor.create({ data: { investorId: 'INV-002', name: 'Abu Dhabi Investment Authority', investorType: 'Sovereign Wealth', commitmentMm: 350, calledCapitalMm: 245, distributedMm: 84, navMm: 295, domicile: 'United Arab Emirates', entityName: 'Walker Enterprise Fund III LP', status: 'Active', contactName: 'Fatima Al-Rashid', contactEmail: 'f.alrashid@adia.ae', taxExempt: true }}),
    prisma.investor.create({ data: { investorId: 'INV-003', name: 'Yale University Endowment', investorType: 'Endowment', commitmentMm: 200, calledCapitalMm: 140, distributedMm: 48, navMm: 168, domicile: 'United States', entityName: 'Walker Enterprise Fund III LP', status: 'Active', contactName: 'Sarah Nguyen', contactEmail: 'snguyen@yale.edu', taxExempt: true }}),
    prisma.investor.create({ data: { investorId: 'INV-004', name: 'Blackstone Family Office', investorType: 'Family Office', commitmentMm: 150, calledCapitalMm: 105, distributedMm: 36, navMm: 126, domicile: 'United States', entityName: 'Walker Enterprise Fund III LP', status: 'Active', contactName: 'James Morrison', contactEmail: 'jmorrison@bfo.com' }}),
    prisma.investor.create({ data: { investorId: 'INV-005', name: 'MetLife Insurance Company', investorType: 'Insurance', commitmentMm: 300, calledCapitalMm: 210, distributedMm: 72, navMm: 252, domicile: 'United States', entityName: 'White Senior Credit Fund V', status: 'Active', contactName: 'Patricia Wells', contactEmail: 'pwells@metlife.com' }}),
    prisma.investor.create({ data: { investorId: 'INV-006', name: 'GIC Private Limited', investorType: 'Sovereign Wealth', commitmentMm: 250, calledCapitalMm: 175, navMm: 210, domicile: 'Singapore', entityName: 'WFM Global Opportunities FoF', status: 'Active', contactName: 'Wei Lin Tan', contactEmail: 'wltan@gic.sg', taxExempt: true }}),
    prisma.investor.create({ data: { investorId: 'INV-007', name: 'Ontario Teachers Pension Plan', investorType: 'Pension Fund', commitmentMm: 400, calledCapitalMm: 280, distributedMm: 96, navMm: 336, domicile: 'Canada', entityName: 'Sullivan Global Alpha Fund', status: 'Active', contactName: 'Michael Tremblay', contactEmail: 'mtremblay@otpp.com', taxExempt: true }}),
    prisma.investor.create({ data: { investorId: 'INV-008', name: 'Harvard Management Company', investorType: 'Endowment', commitmentMm: 175, calledCapitalMm: 122, navMm: 147, domicile: 'United States', entityName: 'Campbell Growth Fund IV LP', status: 'Active', contactName: 'David Park', contactEmail: 'dpark@hmc.harvard.edu', taxExempt: true }}),
    prisma.investor.create({ data: { investorId: 'INV-009', name: 'Norges Bank Investment Management', investorType: 'Sovereign Wealth', commitmentMm: 600, calledCapitalMm: 420, distributedMm: 144, navMm: 504, domicile: 'Norway', entityName: 'WFM Global Opportunities FoF', status: 'Active', contactName: 'Erik Solheim', contactEmail: 'esolheim@nbim.no', taxExempt: true }}),
    prisma.investor.create({ data: { investorId: 'INV-010', name: 'Mizuho Bank Japan', investorType: 'Bank', commitmentMm: 100, calledCapitalMm: 70, navMm: 84, domicile: 'Japan', entityName: 'Lopez Real Estate Opportunities III', status: 'Active', contactName: 'Takeshi Yamamoto', contactEmail: 'tyamamoto@mizuho.co.jp' }}),
    prisma.investor.create({ data: { investorId: 'INV-011', name: 'Texas Permanent School Fund', investorType: 'Pension Fund', commitmentMm: 225, calledCapitalMm: 157, navMm: 189, domicile: 'United States', entityName: 'Walker Enterprise Fund III LP', status: 'Active', contactName: 'Carlos Ramirez', contactEmail: 'cramirez@tea.texas.gov', taxExempt: true }}),
    prisma.investor.create({ data: { investorId: 'INV-012', name: 'Sequoia Heritage', investorType: 'Family Office', commitmentMm: 80, calledCapitalMm: 58, navMm: 92, domicile: 'United States', entityName: 'Cruz Ventures Fund II LP', status: 'Active', contactName: 'Amanda Li', contactEmail: 'ali@sequoiaheritage.com' }}),
    prisma.investor.create({ data: { investorId: 'INV-013', name: 'Swiss Re Insurance', investorType: 'Insurance', commitmentMm: 180, calledCapitalMm: 126, navMm: 151, domicile: 'Switzerland', entityName: 'White Senior Credit Fund V', status: 'Active', contactName: 'Hans Mueller', contactEmail: 'hmueller@swissre.com' }}),
    prisma.investor.create({ data: { investorId: 'INV-014', name: 'Future Fund Australia', investorType: 'Sovereign Wealth', commitmentMm: 275, calledCapitalMm: 192, navMm: 231, domicile: 'Australia', entityName: 'WFM Global Opportunities FoF', status: 'Active', contactName: 'Emma Clarke', contactEmail: 'eclarke@futurefund.gov.au', taxExempt: true }}),
    prisma.investor.create({ data: { investorId: 'INV-015', name: 'Koch Industries Family Office', investorType: 'Family Office', commitmentMm: 120, calledCapitalMm: 24, navMm: 25, domicile: 'United States', entityName: 'Rodriguez Emerging Markets FoF I', status: 'Pending', contactName: 'Thomas Reed', contactEmail: 'treed@kochfamily.com' }}),
  ]);
  console.log('Created 15 investors');

  // ═══════════════════════════════════════════════
  // SECURITIES (20)
  // ═══════════════════════════════════════════════
  await Promise.all([
    prisma.security.create({ data: { securityId: 'SEC-001', name: 'Microsoft Corp', securityType: 'Equity', issuer: 'Microsoft Corporation', ticker: 'MSFT', cusip: '594918104', isin: 'US5949181045', marketValue: 48200, costBasis: 32100, quantity: 115000, unrealizedGain: 16100, sector: 'Technology', country: 'United States', pricePerUnit: 419.13, lastPriceDate: new Date('2026-03-28') }}),
    prisma.security.create({ data: { securityId: 'SEC-002', name: 'Apple Inc', securityType: 'Equity', issuer: 'Apple Inc', ticker: 'AAPL', cusip: '037833100', isin: 'US0378331005', marketValue: 42800, costBasis: 28500, quantity: 200000, unrealizedGain: 14300, sector: 'Technology', country: 'United States', pricePerUnit: 214.00, lastPriceDate: new Date('2026-03-28') }}),
    prisma.security.create({ data: { securityId: 'SEC-003', name: 'NVIDIA Corp', securityType: 'Equity', issuer: 'NVIDIA Corporation', ticker: 'NVDA', cusip: '67066G104', marketValue: 55300, costBasis: 18200, quantity: 60000, unrealizedGain: 37100, sector: 'Technology', country: 'United States', pricePerUnit: 921.67, lastPriceDate: new Date('2026-03-28') }}),
    prisma.security.create({ data: { securityId: 'SEC-004', name: 'JPMorgan Chase & Co', securityType: 'Equity', issuer: 'JPMorgan Chase', ticker: 'JPM', marketValue: 28500, costBasis: 22800, quantity: 130000, unrealizedGain: 5700, sector: 'Financials', country: 'United States', pricePerUnit: 219.23, lastPriceDate: new Date('2026-03-28') }}),
    prisma.security.create({ data: { securityId: 'SEC-005', name: 'Amazon.com Inc', securityType: 'Equity', issuer: 'Amazon', ticker: 'AMZN', marketValue: 38700, costBasis: 24200, quantity: 190000, unrealizedGain: 14500, sector: 'Consumer Discretionary', country: 'United States', pricePerUnit: 203.68, lastPriceDate: new Date('2026-03-28') }}),
    prisma.security.create({ data: { securityId: 'SEC-006', name: 'US Treasury 10Y Note 4.25% 2034', securityType: 'Fixed Income', issuer: 'US Treasury', cusip: '91282CKL5', marketValue: 98500, costBasis: 100000, unrealizedGain: -1500, sector: 'Government', country: 'United States', currency: 'USD', maturityDate: new Date('2034-11-15'), pricePerUnit: 98.50, creditRating: 'AA+', ratingAgency: 'S&P' }}),
    prisma.security.create({ data: { securityId: 'SEC-007', name: 'Verizon Communications 5.25% 2030', securityType: 'Fixed Income', issuer: 'Verizon Communications', ticker: 'VZ', cusip: '92343V104', marketValue: 24800, costBasis: 25000, unrealizedGain: -200, sector: 'Communications', country: 'United States', maturityDate: new Date('2030-03-15'), creditRating: 'BBB+', ratingAgency: 'S&P' }}),
    prisma.security.create({ data: { securityId: 'SEC-008', name: 'Goldman Sachs 4.75% 2028', securityType: 'Fixed Income', issuer: 'Goldman Sachs', ticker: 'GS', marketValue: 15200, costBasis: 15000, unrealizedGain: 200, sector: 'Financials', country: 'United States', maturityDate: new Date('2028-10-01'), creditRating: 'A+', ratingAgency: "Moody's" }}),
    prisma.security.create({ data: { securityId: 'SEC-009', name: 'Acme Software Holdings (Series C)', securityType: 'Private Equity', issuer: 'Acme Software Inc', marketValue: 12500, costBasis: 8000, unrealizedGain: 4500, sector: 'Technology', country: 'United States' }}),
    prisma.security.create({ data: { securityId: 'SEC-010', name: 'NexGen Health Systems (Growth Round)', securityType: 'Private Equity', issuer: 'NexGen Health', marketValue: 18700, costBasis: 15000, unrealizedGain: 3700, sector: 'Healthcare', country: 'United States' }}),
    prisma.security.create({ data: { securityId: 'SEC-011', name: 'Meridian Industrial REIT', securityType: 'Real Estate', issuer: 'Meridian RE Trust', ticker: 'MRT', marketValue: 22100, costBasis: 19500, unrealizedGain: 2600, sector: 'Real Estate', country: 'United States', pricePerUnit: 44.20, lastPriceDate: new Date('2026-03-28') }}),
    prisma.security.create({ data: { securityId: 'SEC-012', name: 'London Bridge Office Complex', securityType: 'Real Estate', issuer: 'Lopez RE Holdings', marketValue: 45000, costBasis: 38000, unrealizedGain: 7000, sector: 'Real Estate', country: 'United Kingdom', currency: 'GBP' }}),
    prisma.security.create({ data: { securityId: 'SEC-013', name: 'S&P 500 Put Options Dec 2026', securityType: 'Derivative', issuer: 'CBOE', marketValue: 3200, costBasis: 4500, unrealizedGain: -1300, sector: 'Index', country: 'United States', maturityDate: new Date('2026-12-20') }}),
    prisma.security.create({ data: { securityId: 'SEC-014', name: 'EUR/USD FX Forward Mar 2026', securityType: 'Derivative', issuer: 'Deutsche Bank', marketValue: 1800, costBasis: 2000, unrealizedGain: -200, sector: 'FX', country: 'Germany', currency: 'EUR', maturityDate: new Date('2026-06-30') }}),
    prisma.security.create({ data: { securityId: 'SEC-015', name: 'Palo Alto Networks Inc', securityType: 'Equity', issuer: 'Palo Alto Networks', ticker: 'PANW', marketValue: 16400, costBasis: 11200, quantity: 45000, unrealizedGain: 5200, sector: 'Technology', country: 'United States', pricePerUnit: 364.44, lastPriceDate: new Date('2026-03-28') }}),
    prisma.security.create({ data: { securityId: 'SEC-016', name: 'Brookfield Infrastructure Partners', securityType: 'Equity', issuer: 'Brookfield', ticker: 'BIP', marketValue: 8900, costBasis: 7200, quantity: 220000, unrealizedGain: 1700, sector: 'Infrastructure', country: 'Canada', pricePerUnit: 40.45, lastPriceDate: new Date('2026-03-28') }}),
    prisma.security.create({ data: { securityId: 'SEC-017', name: 'CLO Mezzanine Tranche (Ares XXXV)', securityType: 'Structured Product', issuer: 'Ares Management', marketValue: 12000, costBasis: 12000, unrealizedGain: 0, sector: 'Credit', country: 'United States', creditRating: 'BBB', ratingAgency: "Moody's" }}),
    prisma.security.create({ data: { securityId: 'SEC-018', name: 'CloudScale AI (Series B)', securityType: 'Private Equity', issuer: 'CloudScale AI Inc', marketValue: 8200, costBasis: 5000, unrealizedGain: 3200, sector: 'Technology', country: 'United States' }}),
    prisma.security.create({ data: { securityId: 'SEC-019', name: 'Nordic Green Energy Fund', securityType: 'Fund Investment', issuer: 'Nordic Capital', marketValue: 6800, costBasis: 5500, unrealizedGain: 1300, sector: 'Energy', country: 'Sweden', currency: 'SEK' }}),
    prisma.security.create({ data: { securityId: 'SEC-020', name: 'Munich Commercial Real Estate Fund', securityType: 'Real Estate', issuer: 'Commerz RE AG', marketValue: 14500, costBasis: 13800, unrealizedGain: 700, sector: 'Real Estate', country: 'Germany', currency: 'EUR' }}),
  ]);
  console.log('Created 20 securities');

  // ═══════════════════════════════════════════════
  // TASK DEFINITIONS (12 SOPs)
  // ═══════════════════════════════════════════════
  const taskDefs = await Promise.all([
    prisma.taskDefinition.create({ data: { taskCode: 'SOP-001', name: 'Monthly NAV Calculation', description: 'Calculate net asset value for all fund entities including position valuation, accrued expenses, and fee computation.', category: 'NAV Calculation', frequency: 'Monthly', estimatedMinutes: 480, priority: 'Critical', department: 'Fund Accounting', steps: JSON.stringify(['Collect position data from custodian', 'Verify market prices and valuations', 'Calculate accrued management fees', 'Calculate accrued carried interest', 'Compute gross and net NAV', 'Prepare NAV package for review', 'Submit for partner sign-off']) }}),
    prisma.taskDefinition.create({ data: { taskCode: 'SOP-002', name: 'Quarterly Investor Capital Statement', description: 'Prepare and distribute quarterly capital account statements to all limited partners.', category: 'Investor Services', frequency: 'Quarterly', estimatedMinutes: 360, priority: 'High', department: 'Investor Services', steps: JSON.stringify(['Pull capital account balances', 'Calculate period P&L allocation', 'Prepare statement template', 'QC review with second checker', 'Distribute via investor portal', 'Track acknowledgments']) }}),
    prisma.taskDefinition.create({ data: { taskCode: 'SOP-003', name: 'Annual K-1 Preparation', description: 'Prepare Schedule K-1 tax documents for all US partners and coordinate with external tax advisor.', category: 'Tax', frequency: 'Annually', estimatedMinutes: 960, priority: 'Critical', department: 'Tax', steps: JSON.stringify(['Gather partner tax information', 'Coordinate with external tax advisor', 'Prepare draft K-1 allocations', 'Review state-level nexus', 'Generate K-1 documents', 'Distribute to partners', 'File with IRS']) }}),
    prisma.taskDefinition.create({ data: { taskCode: 'SOP-004', name: 'Capital Call Processing', description: 'Process capital call notices including calculation, notice generation, wire tracking, and booking.', category: 'Fund Accounting', frequency: 'Event-Driven', estimatedMinutes: 240, priority: 'High', department: 'Fund Accounting', steps: JSON.stringify(['Calculate call amounts per LP', 'Generate call notices', 'Distribute via portal', 'Track wire receipts', 'Reconcile received funds', 'Book journal entries']) }}),
    prisma.taskDefinition.create({ data: { taskCode: 'SOP-005', name: 'Distribution Notice Processing', description: 'Process fund distributions including waterfall calculations, tax withholding, and wire initiation.', category: 'Fund Accounting', frequency: 'Event-Driven', estimatedMinutes: 300, priority: 'High', department: 'Fund Accounting', steps: JSON.stringify(['Calculate distribution per waterfall', 'Apply withholding rates by jurisdiction', 'Generate distribution notices', 'Obtain GP approval', 'Initiate wire transfers', 'Book journal entries', 'Update capital accounts']) }}),
    prisma.taskDefinition.create({ data: { taskCode: 'SOP-006', name: 'Annual Audit Coordination', description: 'Coordinate annual financial statement audit with external auditors including PBC list management.', category: 'Reporting', frequency: 'Annually', estimatedMinutes: 2400, priority: 'Critical', department: 'Fund Accounting', steps: JSON.stringify(['Receive PBC list from auditors', 'Assign PBC items to team members', 'Prepare financial statements draft', 'Respond to auditor inquiries', 'Review draft audit report', 'Obtain management sign-off', 'File audited financials']) }}),
    prisma.taskDefinition.create({ data: { taskCode: 'SOP-007', name: 'FATCA/CRS Reporting', description: 'Prepare and file FATCA and CRS reports for applicable fund entities.', category: 'Compliance', frequency: 'Annually', estimatedMinutes: 480, priority: 'High', department: 'Compliance', steps: JSON.stringify(['Identify reportable accounts', 'Collect self-certification forms', 'Prepare XML filing data', 'QC review of filings', 'Submit to relevant tax authorities', 'Archive confirmation receipts']) }}),
    prisma.taskDefinition.create({ data: { taskCode: 'SOP-008', name: 'Investor Onboarding / KYC', description: 'Complete full KYC/AML screening and documentation collection for new investor subscriptions.', category: 'Compliance', frequency: 'Event-Driven', estimatedMinutes: 180, priority: 'High', department: 'Compliance', steps: JSON.stringify(['Receive subscription documents', 'Perform identity verification', 'Screen against sanctions lists', 'Verify source of funds', 'Complete risk assessment', 'Obtain compliance approval', 'Issue acceptance letter']) }}),
    prisma.taskDefinition.create({ data: { taskCode: 'SOP-009', name: 'Monthly Bank Reconciliation', description: 'Reconcile all fund bank accounts against custodian and accounting records.', category: 'Reconciliation', frequency: 'Monthly', estimatedMinutes: 120, priority: 'Medium', department: 'Fund Accounting', steps: JSON.stringify(['Download bank statements', 'Match transactions to GL', 'Investigate unmatched items', 'Prepare reconciliation report', 'Obtain manager sign-off']) }}),
    prisma.taskDefinition.create({ data: { taskCode: 'SOP-010', name: 'Quarterly Board Package', description: 'Prepare quarterly board reporting package with performance, risk, and compliance summaries.', category: 'Reporting', frequency: 'Quarterly', estimatedMinutes: 420, priority: 'High', department: 'Client Services', steps: JSON.stringify(['Compile performance data', 'Prepare portfolio summary', 'Draft risk commentary', 'Include compliance attestation', 'Format presentation', 'Distribute to board members']) }}),
    prisma.taskDefinition.create({ data: { taskCode: 'SOP-011', name: 'Management Fee Calculation', description: 'Calculate management fees based on committed capital or NAV per LPA terms.', category: 'Fund Accounting', frequency: 'Quarterly', estimatedMinutes: 180, priority: 'High', department: 'Fund Accounting', steps: JSON.stringify(['Determine fee basis per LPA', 'Calculate fee for period', 'Apply fee offsets if applicable', 'Prepare fee invoice', 'Obtain GP approval', 'Book fee journal entries']) }}),
    prisma.taskDefinition.create({ data: { taskCode: 'SOP-012', name: 'Carried Interest Waterfall', description: 'Calculate carried interest allocation per the fund waterfall including preferred return, catch-up, and carry splits.', category: 'Fund Accounting', frequency: 'Quarterly', estimatedMinutes: 600, priority: 'Critical', department: 'Fund Accounting', steps: JSON.stringify(['Calculate total distributable proceeds', 'Apply preferred return (8% hurdle)', 'Calculate GP catch-up', 'Apply carry percentage split', 'Verify clawback provisions', 'Prepare waterfall schedule', 'Review with GP']) }}),
  ]);
  console.log(`Created ${taskDefs.length} task definitions`);

  // ═══════════════════════════════════════════════
  // INTERNAL USERS (10 with 300+ fields populated)
  // ═══════════════════════════════════════════════
  const users = await Promise.all([
    prisma.internalUser.create({ data: {
      employeeId: 'EMP-001', firstName: 'Megan', lastName: 'Moore', email: 'megan.moore@lighthouse.io',
      personalEmail: 'megan.m@gmail.com', phone: '+1-214-555-0101', mobilePhone: '+1-214-555-0102',
      dateOfBirth: new Date('1982-07-14'), gender: 'Female', pronouns: 'she/her',
      nationality: 'American', citizenship: 'United States', maritalStatus: 'Married',
      emergencyContactName: 'David Moore', emergencyContactPhone: '+1-214-555-0199', emergencyContactRelation: 'Spouse',
      title: 'Managing Director, Client Services', role: 'Partner', department: 'Client Services', division: 'Front Office', team: 'Strategic Clients', podId: 'POD-A',
      seniorityLevel: 'C-Suite', employmentType: 'Full-Time', employmentStatus: 'Active',
      hireDate: new Date('2016-03-01'), startDate: new Date('2016-03-15'), promotionDate: new Date('2023-01-01'),
      lastReviewDate: new Date('2025-12-15'), nextReviewDate: new Date('2026-12-15'),
      yearsAtCompany: 10.1, yearsInIndustry: 22, previousEmployer: 'Goldman Sachs', previousTitle: 'Vice President, Fund Services',
      referredBy: 'Board Recruitment', recruitingSource: 'Executive Search',
      officeLocation: 'Dallas HQ', building: 'One Arts Plaza', floor: '42', deskNumber: '42-001',
      timezone: 'America/Chicago', city: 'Dallas', state: 'Texas', country: 'United States', postalCode: '75201',
      remoteStatus: 'Hybrid', homeOfficeApproved: true, parkingAssigned: true, badgeId: 'BDG-1001',
      baseSalary: 425000, salaryBand: 'L7', salaryBandMin: 350000, salaryBandMax: 550000, currency: 'USD',
      payFrequency: 'Semi-Monthly', bonusTarget: 212500, bonusActual: 255000,
      equityGrantShares: 50000, equityVestingSchedule: '4-year with 1-year cliff', equityGrantDate: new Date('2023-01-15'), equityCliffDate: new Date('2024-01-15'), equityVestedShares: 25000,
      totalCompensation: 935000, compRatio: 1.12, lastSalaryChange: new Date('2025-01-01'), lastSalaryChangeAmt: 25000,
      healthInsurance: 'Platinum PPO', dentalInsurance: 'Premium', visionInsurance: 'Standard',
      lifeInsurance: '3x Salary', disabilityInsurance: 'Long-Term',
      healthSavingsAccount: true, retirement401k: true, retirement401kContrib: 23000, companyMatch401k: 13800,
      wellnessStipend: 2400, fitnessReimbursement: true, tuitionReimbursement: true, tuitionReimbursementMax: 10000,
      ptoDaysTotal: 30, ptoDaysUsed: 12, sickDaysTotal: 15, sickDaysUsed: 2,
      parentalLeaveDays: 20, sabbaticalEligible: true, phoneStipend: 150, internetStipend: 100,
      performanceRating: 'Exceeds Expectations', performanceScore: 4.5, lastPerformanceReview: 'Q4 2025',
      goalCompletionRate: 94, nineBoxPosition: 'Star', flightRisk: 'Low', retentionRisk: 'Low',
      potentialRating: 'High', leadershipScore: 4.8, technicalScore: 4.2, communicationScore: 4.9,
      teamworkScore: 4.7, innovationScore: 4.3, clientSatisfaction: 4.6, menteeCount: 3, coachingHoursQ: 12,
      billableRate: 650, costRate: 285, utilizationTarget: 75, utilizationActual: 82,
      billableHoursYtd: 420, nonBillableHoursYtd: 92, avgWeeklyHours: 48,
      projectsActive: 4, projectsCompleted: 12, tasksAssigned: 8, tasksCompleted: 6, tasksOverdue: 0,
      clientsManaged: 4, entitiesManaged: 166, revenueInfluenced: 136800, costToCompany: 935000,
      primaryExpertise: 'Fund Administration', secondaryExpertise: 'Client Relationship Management',
      tertiaryExpertise: 'Private Equity Operations', industrySpecialization: 'Alternative Investments',
      strategyExpertise: 'PE, VC, FoF', regulatoryExpertise: 'SEC, AIFMD',
      languagesSpoken: 'English, Spanish', educationLevel: 'MBA',
      university: 'University of Texas at Austin', degreeType: 'BBA', degreeMajor: 'Finance',
      graduationYear: 2004, mbaProgram: 'Wharton School of Business',
      cpaLicense: true, cpaState: 'Texas', cpaExpiration: new Date('2027-06-30'),
      cfaCharter: true, cfaLevel: 'Charterholder',
      activeDirectoryId: 'mmoore', ssoProvider: 'Okta', vpnAccess: true,
      emailPlatform: 'Microsoft 365', chatPlatform: 'Slack', projectMgmtTool: 'Asana',
      crmAccess: true, crmRole: 'Admin', accountingSystemAccess: 'Investran, Geneva',
      investorPortalAccess: true, investorPortalRole: 'Admin',
      reportingPlatformAccess: true, reportingPlatformRole: 'Publisher',
      complianceSystemAccess: true, dataWarehouseAccess: true, biToolAccess: true,
      apiAccess: true, adminPanelAccess: true, documentMgmtAccess: true,
      hrSystemAccess: true, travelBookingAccess: true, expenseSystemAccess: true,
      githubAccess: true, githubUsername: 'mmoore-lh', slackId: 'U001MMOORE',
      zoomLicense: true, mfaEnabled: true, lastLogin: new Date('2026-04-02'),
      laptopModel: 'MacBook Pro 16" M3 Max', monitorCount: 2, softwareAssigned: 'Office 365, Tableau, Bloomberg Terminal',
      backgroundCheckDate: new Date('2016-02-15'), backgroundCheckStatus: 'Clear',
      ndaSigned: true, ndaDate: new Date('2016-03-01'), nonCompeteAgreement: true, nonCompeteExpiry: new Date('2028-03-01'),
      conflictOfInterestFiled: true, conflictOfInterestDate: new Date('2026-01-15'),
      personalTradingDisclosure: true, insiderTradingTraining: true, antiMoneyLaunderingTrain: true,
      amlTrainingDate: new Date('2025-09-15'), cyberSecurityTraining: true, cyberSecurityTrainDate: new Date('2025-11-01'),
      dataPrivacyTraining: true, sexualHarassmentTraining: true, diversityTraining: true, ethicsTraining: true,
      requiredTrainingComplete: true, complianceScore: 98,
      passportCountry: 'United States', passportExpiry: new Date('2029-08-20'),
      frequentFlyerProgram: 'American Airlines AAdvantage', hotelLoyaltyProgram: 'Marriott Bonvoy',
      travelCardOnFile: true, corporateCardLimit: 25000, ytdTravelExpense: 18500, ytdClientEntertainment: 12200,
      bio: 'Managing Director leading Lighthouse\'s largest client relationships across PE, VC, and Fund of Funds strategies.',
      linkedinUrl: 'https://linkedin.com/in/meganmoore', tShirtSize: 'M', tags: 'leadership,client-facing,pe-expert',
      dataQualityScore: 96, confidenceScore: 0.95,
    }}),
    prisma.internalUser.create({ data: {
      employeeId: 'EMP-002', firstName: 'Jessica', lastName: 'Cruz', email: 'jessica.cruz@lighthouse.io',
      phone: '+1-310-555-0201', mobilePhone: '+1-310-555-0202',
      title: 'Director, Client Services', role: 'Director', department: 'Client Services', division: 'Front Office', team: 'Growth Clients', podId: 'POD-B',
      seniorityLevel: 'Senior', employmentType: 'Full-Time', employmentStatus: 'Active',
      hireDate: new Date('2019-08-15'), yearsAtCompany: 6.7, yearsInIndustry: 14,
      officeLocation: 'Los Angeles', city: 'Los Angeles', state: 'California', country: 'United States',
      remoteStatus: 'Hybrid', baseSalary: 275000, bonusTarget: 82500, bonusActual: 90000, totalCompensation: 447500,
      performanceRating: 'Exceeds Expectations', performanceScore: 4.3, utilizationTarget: 80, utilizationActual: 78,
      billableRate: 475, costRate: 195, clientsManaged: 2, entitiesManaged: 38,
      primaryExpertise: 'Private Equity', secondaryExpertise: 'Investor Relations',
      educationLevel: 'MBA', university: 'UCLA Anderson', degreeType: 'MBA', degreeMajor: 'Finance',
      cpaLicense: true, cpaState: 'California', cfaCharter: false, cfaLevel: 'Level III Candidate',
      projectsActive: 3, tasksAssigned: 12, tasksCompleted: 9, tasksOverdue: 1,
      activeDirectoryId: 'jcruz', mfaEnabled: true, lastLogin: new Date('2026-04-02'),
      requiredTrainingComplete: true, complianceScore: 94,
      tags: 'client-facing,growth-accounts', dataQualityScore: 88, confidenceScore: 0.86,
    }}),
    prisma.internalUser.create({ data: {
      employeeId: 'EMP-003', firstName: 'Diana', lastName: 'Smith', email: 'diana.smith@lighthouse.io',
      phone: '+1-212-555-0301',
      title: 'Director, Fund Accounting', role: 'Director', department: 'Fund Accounting', division: 'Operations', team: 'NAV Team', podId: 'POD-A',
      seniorityLevel: 'Senior', employmentType: 'Full-Time', employmentStatus: 'Active',
      hireDate: new Date('2017-04-01'), yearsAtCompany: 9.0, yearsInIndustry: 18,
      officeLocation: 'New York', city: 'New York', state: 'New York', country: 'United States',
      baseSalary: 290000, bonusTarget: 87000, totalCompensation: 435000,
      performanceRating: 'Meets Expectations', performanceScore: 3.8, utilizationTarget: 85, utilizationActual: 88,
      billableRate: 425, costRate: 175, clientsManaged: 2, entitiesManaged: 70,
      primaryExpertise: 'NAV Calculation', secondaryExpertise: 'Financial Reporting',
      educationLevel: 'Masters', university: 'NYU Stern', degreeType: 'MS', degreeMajor: 'Accounting',
      cpaLicense: true, cpaState: 'New York',
      projectsActive: 2, tasksAssigned: 15, tasksCompleted: 11, tasksOverdue: 2,
      activeDirectoryId: 'dsmith', mfaEnabled: true, lastLogin: new Date('2026-04-01'),
      requiredTrainingComplete: true, complianceScore: 92, tags: 'nav-expert,fund-accounting',
      dataQualityScore: 90, confidenceScore: 0.88,
    }}),
    prisma.internalUser.create({ data: {
      employeeId: 'EMP-004', firstName: 'Jason', lastName: 'Cooper', email: 'jason.cooper@lighthouse.io',
      phone: '+1-617-555-0401',
      title: 'VP, Investor Services', role: 'VP', department: 'Investor Services', division: 'Operations', team: 'LP Relations', podId: 'POD-C',
      seniorityLevel: 'Mid', employmentType: 'Full-Time', employmentStatus: 'Active',
      hireDate: new Date('2020-01-15'), yearsAtCompany: 6.2, yearsInIndustry: 11,
      officeLocation: 'Boston', city: 'Boston', state: 'Massachusetts', country: 'United States',
      baseSalary: 210000, bonusTarget: 52500, totalCompensation: 315000,
      performanceRating: 'Exceeds Expectations', performanceScore: 4.1, utilizationTarget: 80, utilizationActual: 76,
      billableRate: 350, costRate: 145, clientsManaged: 1, entitiesManaged: 28,
      primaryExpertise: 'Investor Relations', secondaryExpertise: 'Capital Calls & Distributions',
      educationLevel: 'Bachelors', university: 'Boston College', degreeType: 'BS', degreeMajor: 'Finance',
      cpaLicense: false, caiaCharter: true,
      projectsActive: 2, tasksAssigned: 10, tasksCompleted: 7, tasksOverdue: 1,
      activeDirectoryId: 'jcooper', mfaEnabled: true, lastLogin: new Date('2026-04-02'),
      requiredTrainingComplete: true, complianceScore: 96, tags: 'investor-services,lp-relations',
      dataQualityScore: 85, confidenceScore: 0.82,
    }}),
    prisma.internalUser.create({ data: {
      employeeId: 'EMP-005', firstName: 'Steven', lastName: 'Wright', email: 'steven.wright@lighthouse.io',
      phone: '+1-214-555-0501',
      title: 'VP, Fund Accounting', role: 'VP', department: 'Fund Accounting', division: 'Operations', team: 'NAV Team',
      seniorityLevel: 'Mid', employmentType: 'Full-Time', employmentStatus: 'Active',
      hireDate: new Date('2021-06-01'), yearsAtCompany: 4.8, yearsInIndustry: 9,
      officeLocation: 'Dallas HQ', city: 'Dallas', state: 'Texas', country: 'United States',
      baseSalary: 185000, bonusTarget: 37000, totalCompensation: 259000,
      performanceRating: 'Meets Expectations', performanceScore: 3.6, utilizationTarget: 85, utilizationActual: 91,
      billableRate: 325, costRate: 130, entitiesManaged: 35,
      primaryExpertise: 'Fund Accounting', secondaryExpertise: 'Waterfall Calculations',
      educationLevel: 'Bachelors', university: 'UT Dallas', degreeType: 'BBA', degreeMajor: 'Accounting',
      cpaLicense: true, cpaState: 'Texas',
      projectsActive: 3, tasksAssigned: 18, tasksCompleted: 13, tasksOverdue: 3,
      activeDirectoryId: 'swright', mfaEnabled: true, lastLogin: new Date('2026-04-02'),
      requiredTrainingComplete: true, complianceScore: 90, tags: 'fund-accounting,waterfall',
      dataQualityScore: 83, confidenceScore: 0.80,
    }}),
    prisma.internalUser.create({ data: {
      employeeId: 'EMP-006', firstName: 'Michael', lastName: 'Collins', email: 'michael.collins@lighthouse.io',
      phone: '+1-212-555-0601',
      title: 'Associate, Operations', role: 'Associate', department: 'Operations', division: 'Operations', team: 'Process Improvement',
      seniorityLevel: 'Junior', employmentType: 'Full-Time', employmentStatus: 'Active',
      hireDate: new Date('2023-03-01'), yearsAtCompany: 3.1, yearsInIndustry: 5,
      officeLocation: 'New York', city: 'New York', state: 'New York', country: 'United States',
      baseSalary: 120000, bonusTarget: 18000, totalCompensation: 156000,
      performanceRating: 'Meets Expectations', performanceScore: 3.4, utilizationTarget: 90, utilizationActual: 85,
      billableRate: 225, costRate: 85, entitiesManaged: 15,
      primaryExpertise: 'Operations', secondaryExpertise: 'Process Automation',
      educationLevel: 'Bachelors', university: 'Cornell University', degreeType: 'BS', degreeMajor: 'Operations Research',
      projectsActive: 2, tasksAssigned: 14, tasksCompleted: 10, tasksOverdue: 2,
      activeDirectoryId: 'mcollins', mfaEnabled: true, lastLogin: new Date('2026-04-01'),
      requiredTrainingComplete: true, complianceScore: 88, tags: 'operations,automation',
      dataQualityScore: 80, confidenceScore: 0.78,
    }}),
    prisma.internalUser.create({ data: {
      employeeId: 'EMP-007', firstName: 'Sarah', lastName: 'Garcia', email: 'sarah.garcia@lighthouse.io',
      phone: '+1-617-555-0701',
      title: 'Associate, Compliance', role: 'Associate', department: 'Compliance', division: 'Risk & Compliance', team: 'KYC/AML',
      seniorityLevel: 'Junior', employmentType: 'Full-Time', employmentStatus: 'Active',
      hireDate: new Date('2022-09-15'), yearsAtCompany: 3.6, yearsInIndustry: 6,
      officeLocation: 'Boston', city: 'Boston', state: 'Massachusetts', country: 'United States',
      baseSalary: 110000, bonusTarget: 16500, totalCompensation: 143000,
      performanceRating: 'Exceeds Expectations', performanceScore: 4.0, utilizationTarget: 85, utilizationActual: 82,
      billableRate: 200, costRate: 75, entitiesManaged: 20,
      primaryExpertise: 'Compliance', secondaryExpertise: 'KYC/AML Screening',
      regulatoryExpertise: 'FATCA, CRS, AML',
      educationLevel: 'Masters', university: 'Georgetown University', degreeType: 'JD', degreeMajor: 'Law',
      projectsActive: 1, tasksAssigned: 8, tasksCompleted: 7, tasksOverdue: 0,
      activeDirectoryId: 'sgarcia', mfaEnabled: true, lastLogin: new Date('2026-04-02'),
      requiredTrainingComplete: true, complianceScore: 99, tags: 'compliance,kyc-aml,legal',
      dataQualityScore: 92, confidenceScore: 0.90,
    }}),
    prisma.internalUser.create({ data: {
      employeeId: 'EMP-008', firstName: 'Brandon', lastName: 'Cohen', email: 'brandon.cohen@lighthouse.io',
      phone: '+1-214-555-0801',
      title: 'Analyst, Tax', role: 'Analyst', department: 'Tax', division: 'Operations', team: 'Tax Reporting',
      seniorityLevel: 'Entry', employmentType: 'Full-Time', employmentStatus: 'Active',
      hireDate: new Date('2024-06-15'), yearsAtCompany: 1.8, yearsInIndustry: 2,
      officeLocation: 'Dallas HQ', city: 'Dallas', state: 'Texas', country: 'United States',
      baseSalary: 85000, bonusTarget: 8500, totalCompensation: 102000,
      performanceRating: 'Meets Expectations', performanceScore: 3.2, utilizationTarget: 90, utilizationActual: 88,
      billableRate: 175, costRate: 55,
      primaryExpertise: 'Tax Reporting', secondaryExpertise: 'K-1 Preparation', taxExpertise: 'Partnership Tax, PFIC, ECI',
      educationLevel: 'Bachelors', university: 'Texas A&M', degreeType: 'BBA', degreeMajor: 'Accounting',
      cpaLicense: false,
      projectsActive: 1, tasksAssigned: 6, tasksCompleted: 4, tasksOverdue: 1,
      activeDirectoryId: 'bcohen', mfaEnabled: true, lastLogin: new Date('2026-04-01'),
      requiredTrainingComplete: true, complianceScore: 86, tags: 'tax,k1,analyst',
      dataQualityScore: 78, confidenceScore: 0.75,
    }}),
    prisma.internalUser.create({ data: {
      employeeId: 'EMP-009', firstName: 'Tyler', lastName: 'White', email: 'tyler.white@lighthouse.io',
      phone: '+1-512-555-0901',
      title: 'Analyst, Technology', role: 'Analyst', department: 'Technology', division: 'Technology', team: 'Platform Engineering',
      seniorityLevel: 'Entry', employmentType: 'Full-Time', employmentStatus: 'Active',
      hireDate: new Date('2024-01-08'), yearsAtCompany: 2.2, yearsInIndustry: 3,
      officeLocation: 'Austin (Remote)', city: 'Austin', state: 'Texas', country: 'United States',
      remoteStatus: 'Remote', homeOfficeApproved: true, coworkingStipend: true,
      baseSalary: 95000, bonusTarget: 9500, totalCompensation: 114000,
      performanceRating: 'Exceeds Expectations', performanceScore: 4.2, utilizationTarget: 80, utilizationActual: 75,
      billableRate: 200, costRate: 65,
      primaryExpertise: 'Software Engineering', secondaryExpertise: 'Data Engineering', technologyExpertise: 'Python, TypeScript, React, SQL, dbt, Airflow',
      educationLevel: 'Bachelors', university: 'UT Austin', degreeType: 'BS', degreeMajor: 'Computer Science',
      githubAccess: true, githubUsername: 'twhite-lh',
      projectsActive: 3, tasksAssigned: 11, tasksCompleted: 9, tasksOverdue: 0,
      activeDirectoryId: 'twhite', mfaEnabled: true, lastLogin: new Date('2026-04-02'),
      requiredTrainingComplete: true, complianceScore: 91, tags: 'engineering,data,platform',
      dataQualityScore: 85, confidenceScore: 0.82,
    }}),
    prisma.internalUser.create({ data: {
      employeeId: 'EMP-010', firstName: 'Rebecca', lastName: 'Sanders', email: 'rebecca.sanders@lighthouse.io',
      phone: '+1-214-555-1001',
      title: 'Administrator, Operations', role: 'Administrator', department: 'Operations', division: 'Operations', team: 'Office Management',
      seniorityLevel: 'Entry', employmentType: 'Full-Time', employmentStatus: 'Active',
      hireDate: new Date('2023-11-01'), yearsAtCompany: 2.4, yearsInIndustry: 4,
      officeLocation: 'Dallas HQ', city: 'Dallas', state: 'Texas', country: 'United States',
      baseSalary: 72000, bonusTarget: 5400, totalCompensation: 84600,
      performanceRating: 'Meets Expectations', performanceScore: 3.3, utilizationTarget: 70, utilizationActual: 68,
      billableRate: 125, costRate: 45,
      primaryExpertise: 'Office Administration', secondaryExpertise: 'Event Coordination',
      educationLevel: 'Bachelors', university: 'SMU', degreeType: 'BA', degreeMajor: 'Communications',
      projectsActive: 1, tasksAssigned: 5, tasksCompleted: 4, tasksOverdue: 0,
      activeDirectoryId: 'rsanders', mfaEnabled: true, lastLogin: new Date('2026-04-01'),
      requiredTrainingComplete: true, complianceScore: 85, tags: 'admin,office-mgmt',
      dataQualityScore: 75, confidenceScore: 0.72,
    }}),
  ]);
  console.log(`Created ${users.length} internal users`);

  // ═══════════════════════════════════════════════
  // TASK ASSIGNMENTS (25)
  // ═══════════════════════════════════════════════
  const now = new Date();
  const d = (days: number) => new Date(now.getTime() + days * 86400000);

  await Promise.all([
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[0].id, entityName: 'Walker Enterprise Fund III LP', assignedToId: users[2].id, status: 'Complete', dueDate: d(-5), completedDate: d(-6), periodEnd: 'March 2026', priority: 'Critical' }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[0].id, entityName: 'Sullivan Global Alpha Fund', assignedToId: users[4].id, status: 'In Progress', dueDate: d(3), periodEnd: 'March 2026', priority: 'Critical' }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[0].id, entityName: 'White Senior Credit Fund V', assignedToId: users[2].id, status: 'Not Started', dueDate: d(10), periodEnd: 'March 2026', priority: 'Critical' }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[1].id, entityName: 'Walker Enterprise Fund III LP', assignedToId: users[3].id, status: 'Under Review', dueDate: d(7), periodEnd: 'Q1 2026', priority: 'High' }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[1].id, entityName: 'Campbell Growth Fund IV LP', assignedToId: users[3].id, status: 'In Progress', dueDate: d(14), periodEnd: 'Q1 2026', priority: 'High' }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[2].id, entityName: 'Walker Enterprise Fund III LP', assignedToId: users[7].id, status: 'In Progress', dueDate: d(45), periodEnd: 'FY 2025', priority: 'Critical', notes: 'Waiting on external tax advisor review' }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[2].id, entityName: 'Cruz Ventures Fund II LP', assignedToId: users[7].id, status: 'Not Started', dueDate: d(60), periodEnd: 'FY 2025', priority: 'High' }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[3].id, entityName: 'Campbell Growth Fund IV LP', assignedToId: users[4].id, status: 'Complete', dueDate: d(-10), completedDate: d(-12), periodEnd: 'March 2026', priority: 'High' }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[4].id, entityName: 'Walker Enterprise Fund I LP', assignedToId: users[4].id, status: 'Under Review', dueDate: d(5), periodEnd: 'Q1 2026', priority: 'High', notes: 'Final wind-down distribution' }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[5].id, entityName: 'Walker Enterprise Fund III LP', assignedToId: users[2].id, status: 'In Progress', dueDate: d(30), periodEnd: 'FY 2025', priority: 'Critical', notes: 'PBC list received from PwC' }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[5].id, entityName: 'Sullivan Global Alpha Fund', assignedToId: users[5].id, status: 'Not Started', dueDate: d(45), periodEnd: 'FY 2025', priority: 'Critical' }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[6].id, entityName: 'WFM Global Opportunities FoF', assignedToId: users[6].id, status: 'Overdue', dueDate: d(-7), periodEnd: 'FY 2025', priority: 'High', notes: 'Awaiting self-certification from 3 investors' }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[7].id, entityName: 'Rodriguez Emerging Markets FoF I', assignedToId: users[6].id, status: 'In Progress', dueDate: d(14), periodEnd: 'Q1 2026', priority: 'High', notes: 'KYC pending for Koch Industries FO' }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[8].id, entityName: 'Walker Enterprise Fund III LP', assignedToId: users[5].id, status: 'Complete', dueDate: d(-2), completedDate: d(-3), periodEnd: 'March 2026', priority: 'Medium' }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[8].id, entityName: 'White Senior Credit Fund V', assignedToId: users[5].id, status: 'Overdue', dueDate: d(-3), periodEnd: 'March 2026', priority: 'Medium', notes: 'Custodian statement delayed' }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[9].id, entityName: 'Walker Enterprise Fund III LP', assignedToId: users[0].id, status: 'Under Review', dueDate: d(12), periodEnd: 'Q1 2026', priority: 'High' }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[9].id, entityName: 'Lopez Real Estate Opportunities III', assignedToId: users[3].id, status: 'Not Started', dueDate: d(20), periodEnd: 'Q1 2026', priority: 'High' }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[10].id, entityName: 'Walker Enterprise Fund III LP', assignedToId: users[4].id, status: 'Complete', dueDate: d(-8), completedDate: d(-10), periodEnd: 'Q1 2026', priority: 'High' }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[10].id, entityName: 'Sullivan Global Alpha Fund', assignedToId: users[4].id, status: 'In Progress', dueDate: d(5), periodEnd: 'Q1 2026', priority: 'High' }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[11].id, entityName: 'Walker Enterprise Fund III LP', assignedToId: users[4].id, status: 'Under Review', dueDate: d(8), periodEnd: 'Q1 2026', priority: 'Critical' }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[11].id, entityName: 'White Senior Credit Fund V', assignedToId: users[2].id, status: 'Blocked', dueDate: d(8), periodEnd: 'Q1 2026', priority: 'Critical', notes: 'Pending valuation from Houlihan Lokey' }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[0].id, entityName: 'Lopez Real Estate Opportunities III', assignedToId: users[5].id, status: 'Overdue', dueDate: d(-4), periodEnd: 'March 2026', priority: 'Critical', notes: 'Property valuations delayed by 2 weeks' }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[0].id, entityName: 'WFM Global Opportunities FoF', assignedToId: users[2].id, status: 'In Progress', dueDate: d(5), periodEnd: 'March 2026', priority: 'Critical' }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[6].id, entityName: 'Walker III Offshore Feeder Ltd', assignedToId: users[6].id, status: 'Overdue', dueDate: d(-14), periodEnd: 'FY 2025', priority: 'High', notes: 'Cayman filing deadline missed — remediation in progress' }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[8].id, entityName: 'Campbell Growth Fund IV LP', assignedToId: users[5].id, status: 'Under Review', dueDate: d(1), periodEnd: 'March 2026', priority: 'Medium' }}),
  ]);
  console.log('Created 25 task assignments');

  // ═══════════════════════════════════════════════
  // EXTERNAL CONTACTS (8)
  // ═══════════════════════════════════════════════
  await Promise.all([
    prisma.externalContact.create({ data: { contactId: 'EXC-001', name: 'Richard Thornton', organization: 'PricewaterhouseCoopers', role: 'Audit Partner', contactType: 'Auditor', email: 'richard.thornton@pwc.com', phone: '+1-212-555-8001', city: 'New York', country: 'United States', linkedEntityIds: 'ENT-000002,ENT-000003,ENT-000011,ENT-000013', status: 'Active' }}),
    prisma.externalContact.create({ data: { contactId: 'EXC-002', name: 'Katherine Brooks', organization: 'Kirkland & Ellis LLP', role: 'Partner, Fund Formation', contactType: 'Legal Counsel', email: 'kbrooks@kirkland.com', phone: '+1-312-555-8002', city: 'Chicago', country: 'United States', linkedEntityIds: 'ENT-000001,ENT-000002,ENT-000014', status: 'Active' }}),
    prisma.externalContact.create({ data: { contactId: 'EXC-003', name: 'Patrick O\'Brien', organization: 'SS&C Technologies', role: 'Client Director', contactType: 'Administrator', email: 'pobrien@sscinc.com', phone: '+1-203-555-8003', city: 'Windsor', country: 'United States', linkedEntityIds: 'ENT-000001,ENT-000002,ENT-000003,ENT-000011', status: 'Active' }}),
    prisma.externalContact.create({ data: { contactId: 'EXC-004', name: 'Margaret Chen', organization: 'BNY Mellon', role: 'VP, Custody Services', contactType: 'Custodian', email: 'margaret.chen@bnymellon.com', phone: '+1-212-555-8004', city: 'New York', country: 'United States', linkedEntityIds: 'ENT-000002,ENT-000008', status: 'Active' }}),
    prisma.externalContact.create({ data: { contactId: 'EXC-005', name: 'Alexander Petrov', organization: 'Goldman Sachs', role: 'Managing Director, Prime Brokerage', contactType: 'Prime Broker', email: 'apetrov@gs.com', phone: '+1-212-555-8005', city: 'New York', country: 'United States', linkedEntityIds: 'ENT-000008', status: 'Active' }}),
    prisma.externalContact.create({ data: { contactId: 'EXC-006', name: 'Daniel Foster', organization: 'Houlihan Lokey', role: 'Director, Portfolio Valuation', contactType: 'Valuation Provider', email: 'dfoster@hl.com', phone: '+1-310-555-8006', city: 'Los Angeles', country: 'United States', linkedEntityIds: 'ENT-000002,ENT-000009,ENT-000011', status: 'Active' }}),
    prisma.externalContact.create({ data: { contactId: 'EXC-007', name: 'Jennifer Walsh', organization: 'JPMorgan Chase', role: 'Managing Director, Fund Banking', contactType: 'Banking', email: 'jwalsh@jpmorgan.com', phone: '+1-212-555-8007', city: 'New York', country: 'United States', linkedEntityIds: 'ENT-000002,ENT-000007', status: 'Active' }}),
    prisma.externalContact.create({ data: { contactId: 'EXC-008', name: 'Thomas Williams', organization: 'AIG', role: 'VP, Fund Insurance', contactType: 'Insurance', email: 'twilliams@aig.com', phone: '+1-212-555-8008', city: 'New York', country: 'United States', status: 'Active' }}),
  ]);
  console.log('Created 8 external contacts');

  // ═══════════════════════════════════════════════
  // AI SKILLS (8)
  // ═══════════════════════════════════════════════
  await Promise.all([
    prisma.aISkill.create({ data: { name: 'Document Entity Extractor', description: 'Extracts entity names, dates, amounts, and clause references from legal and financial documents including LPAs, PPMs, and side letters.', category: 'Data Extraction', status: 'Active', accuracy: 94.2, model: 'GPT-4o', lastRun: d(-1), runCount: 2847, avgProcessingTime: '12s', inputType: 'PDF/DOCX', outputType: 'JSON' }}),
    prisma.aISkill.create({ data: { name: 'NAV Anomaly Detector', description: 'Identifies anomalous NAV movements by comparing against historical patterns, peer funds, and expected ranges based on market conditions.', category: 'Analytics', status: 'Active', accuracy: 91.8, model: 'Canopy ML v2', lastRun: d(-1), runCount: 1523, avgProcessingTime: '8s', inputType: 'Time Series', outputType: 'Alert JSON' }}),
    prisma.aISkill.create({ data: { name: 'K-1 Auto-Filler', description: 'Automatically populates Schedule K-1 fields from capital account statements, allocation schedules, and partner-level tax data.', category: 'Data Enrichment', status: 'Active', accuracy: 88.5, model: 'Claude 3.5 Sonnet', lastRun: d(-3), runCount: 892, avgProcessingTime: '25s', inputType: 'Structured Data', outputType: 'K-1 Draft' }}),
    prisma.aISkill.create({ data: { name: 'Compliance Screening Agent', description: 'Screens investors and counterparties against OFAC, EU sanctions, PEP lists, and adverse media databases in real-time.', category: 'Compliance', status: 'Beta', accuracy: 96.1, model: 'Custom NLP + OFAC API', lastRun: d(-1), runCount: 4210, avgProcessingTime: '3s', inputType: 'Entity Name + Metadata', outputType: 'Risk Score + Flags' }}),
    prisma.aISkill.create({ data: { name: 'Investor Letter Generator', description: 'Generates quarterly investor letters with fund performance commentary, market outlook, and portfolio attribution analysis.', category: 'Document Processing', status: 'Active', accuracy: 89.3, model: 'GPT-4o', lastRun: d(-7), runCount: 312, avgProcessingTime: '45s', inputType: 'Performance Data', outputType: 'DOCX' }}),
    prisma.aISkill.create({ data: { name: 'Reconciliation Matcher', description: 'Matches transactions across custodian, administrator, and internal accounting records with fuzzy matching and intelligent exception handling.', category: 'Reconciliation', status: 'Active', accuracy: 97.2, model: 'Canopy ML v3', lastRun: d(-1), runCount: 8934, avgProcessingTime: '2s', inputType: 'Transaction Pairs', outputType: 'Match/Break Report' }}),
    prisma.aISkill.create({ data: { name: 'Regulatory Filing Validator', description: 'Validates FATCA/CRS XML filings, Form PF, and other regulatory submissions for completeness and format compliance.', category: 'Compliance', status: 'Training', accuracy: 85.0, model: 'Claude 3.5 Sonnet', lastRun: d(-14), runCount: 156, avgProcessingTime: '18s', inputType: 'XML/XBRL', outputType: 'Validation Report' }}),
    prisma.aISkill.create({ data: { name: 'Cash Flow Predictor', description: 'Predicts future capital call and distribution timing based on historical patterns, portfolio company events, and market conditions.', category: 'Analytics', status: 'Beta', accuracy: 82.4, model: 'Canopy ML v2', lastRun: d(-5), runCount: 445, avgProcessingTime: '15s', inputType: 'Historical Cash Flows', outputType: 'Forecast JSON' }}),
  ]);
  console.log('Created 8 AI skills');

  // ═══════════════════════════════════════════════
  // DOCUMENTS (15)
  // ═══════════════════════════════════════════════
  await Promise.all([
    prisma.document.create({ data: { documentId: 'DOC-001', name: 'Walker Enterprise Fund III — Limited Partnership Agreement', documentType: 'LPA', entityName: 'Walker Enterprise Fund III LP', clientName: 'Walker Asset Management', status: 'Executed', uploadedBy: 'Katherine Brooks', uploadDate: new Date('2021-03-10'), fileSize: '2.4 MB', pageCount: 187, version: '3.0', confidentiality: 'Restricted', tags: 'lpa,fund-terms,waterfall' }}),
    prisma.document.create({ data: { documentId: 'DOC-002', name: 'Walker III — Private Placement Memorandum', documentType: 'PPM', entityName: 'Walker Enterprise Fund III LP', clientName: 'Walker Asset Management', status: 'Final', uploadedBy: 'Katherine Brooks', uploadDate: new Date('2021-02-28'), fileSize: '4.1 MB', pageCount: 245, version: '2.0', confidentiality: 'Restricted', tags: 'ppm,offering' }}),
    prisma.document.create({ data: { documentId: 'DOC-003', name: 'Campbell Growth IV — Subscription Agreement Template', documentType: 'Subscription Agreement', entityName: 'Campbell Growth Fund IV LP', clientName: 'Campbell Capital Partners', status: 'Final', uploadedBy: 'Jessica Cruz', uploadDate: new Date('2023-05-20'), fileSize: '890 KB', pageCount: 42, version: '1.0', confidentiality: 'Confidential', tags: 'subscription,onboarding' }}),
    prisma.document.create({ data: { documentId: 'DOC-004', name: 'Walker III — CalPERS Side Letter', documentType: 'Side Letter', entityName: 'Walker Enterprise Fund III LP', status: 'Executed', uploadedBy: 'Katherine Brooks', uploadDate: new Date('2021-04-15'), fileSize: '320 KB', pageCount: 12, version: '1.0', confidentiality: 'Restricted', tags: 'side-letter,mfn' }}),
    prisma.document.create({ data: { documentId: 'DOC-005', name: 'Walker III — FY2025 Schedule K-1 (Draft)', documentType: 'K-1', entityName: 'Walker Enterprise Fund III LP', clientName: 'Walker Asset Management', status: 'Draft', uploadedBy: 'Brandon Cohen', uploadDate: new Date('2026-02-15'), fileSize: '1.2 MB', pageCount: 89, version: '0.1', confidentiality: 'Restricted', tags: 'k1,tax,fy2025' }}),
    prisma.document.create({ data: { documentId: 'DOC-006', name: 'Sullivan Global Alpha — FY2025 Audited Financials', documentType: 'Audit Report', entityName: 'Sullivan Global Alpha Fund', clientName: 'Sullivan Investments', status: 'Under Review', uploadedBy: 'Richard Thornton', uploadDate: new Date('2026-03-01'), fileSize: '5.8 MB', pageCount: 156, version: '0.9', confidentiality: 'Confidential', tags: 'audit,fy2025,ey' }}),
    prisma.document.create({ data: { documentId: 'DOC-007', name: 'Walker III — Q4 2025 Financial Statements', documentType: 'Financial Statement', entityName: 'Walker Enterprise Fund III LP', status: 'Final', uploadedBy: 'Diana Smith', uploadDate: new Date('2026-01-30'), fileSize: '3.2 MB', pageCount: 78, version: '1.0', confidentiality: 'Confidential', tags: 'financials,q4-2025' }}),
    prisma.document.create({ data: { documentId: 'DOC-008', name: 'Cruz Ventures II — Board Resolution (Series B Follow-On)', documentType: 'Board Resolution', entityName: 'Cruz Ventures Fund II LP', clientName: 'Cruz Capital Management', status: 'Executed', uploadedBy: 'Megan Moore', uploadDate: new Date('2026-02-20'), fileSize: '180 KB', pageCount: 4, version: '1.0', confidentiality: 'Restricted', tags: 'board,resolution' }}),
    prisma.document.create({ data: { documentId: 'DOC-009', name: 'Walker III — Capital Call Notice #14', documentType: 'Capital Call Notice', entityName: 'Walker Enterprise Fund III LP', status: 'Final', uploadedBy: 'Steven Wright', uploadDate: new Date('2026-03-05'), fileSize: '420 KB', pageCount: 8, version: '1.0', confidentiality: 'Confidential', tags: 'capital-call,notice' }}),
    prisma.document.create({ data: { documentId: 'DOC-010', name: 'Walker I — Final Distribution Notice', documentType: 'Distribution Notice', entityName: 'Walker Enterprise Fund I LP', clientName: 'Walker Asset Management', status: 'Under Review', uploadedBy: 'Jason Cooper', uploadDate: new Date('2026-03-20'), fileSize: '350 KB', pageCount: 6, version: '0.8', confidentiality: 'Confidential', tags: 'distribution,wind-down' }}),
    prisma.document.create({ data: { documentId: 'DOC-011', name: 'WFM Global Opportunities — FATCA Filing 2025', documentType: 'Regulatory Filing', entityName: 'WFM Global Opportunities FoF', clientName: 'White Fund Management', status: 'Draft', uploadedBy: 'Sarah Garcia', uploadDate: new Date('2026-03-15'), fileSize: '1.8 MB', pageCount: 34, version: '0.5', confidentiality: 'Internal', tags: 'fatca,regulatory,filing' }}),
    prisma.document.create({ data: { documentId: 'DOC-012', name: 'Lopez RE III — Q1 2026 Investor Report', documentType: 'Investor Report', entityName: 'Lopez Real Estate Opportunities III', clientName: 'Lopez Asset Partners', status: 'Draft', uploadedBy: 'Jason Cooper', uploadDate: new Date('2026-03-28'), fileSize: '6.2 MB', pageCount: 48, version: '0.3', confidentiality: 'Confidential', tags: 'investor-report,q1-2026' }}),
    prisma.document.create({ data: { documentId: 'DOC-013', name: 'White Credit V — FY2025 Audited Financials', documentType: 'Audit Report', entityName: 'White Senior Credit Fund V', clientName: 'White Advisors', status: 'Final', uploadedBy: 'Richard Thornton', uploadDate: new Date('2026-02-28'), fileSize: '4.9 MB', pageCount: 132, version: '1.0', confidentiality: 'Confidential', tags: 'audit,fy2025,pwc' }}),
    prisma.document.create({ data: { documentId: 'DOC-014', name: 'Rodriguez EM FoF I — LPA (Draft)', documentType: 'LPA', entityName: 'Rodriguez Emerging Markets FoF I', clientName: 'Rodriguez Capital Management', status: 'Draft', uploadedBy: 'Jessica Cruz', uploadDate: new Date('2026-03-10'), fileSize: '1.9 MB', pageCount: 162, version: '0.7', confidentiality: 'Restricted', tags: 'lpa,onboarding,draft' }}),
    prisma.document.create({ data: { documentId: 'DOC-015', name: 'Global AML Policy Manual v4.2', documentType: 'Policy Document', status: 'Final', uploadedBy: 'Sarah Garcia', uploadDate: new Date('2025-12-01'), fileSize: '2.1 MB', pageCount: 96, version: '4.2', confidentiality: 'Internal', tags: 'policy,aml,compliance' }}),
  ]);
  console.log('Created 15 documents');

  // ═══════════════════════════════════════════════
  // AGENTS (10 for marketplace)
  // ═══════════════════════════════════════════════
  await Promise.all([
    prisma.agent.create({ data: { name: 'NavBot Pro', description: 'End-to-end NAV calculation agent that pulls position data, applies pricing rules, computes accruals, and generates NAV packages with full audit trail.', category: 'Fund Accounting', provider: 'Canopy AI', status: 'Available', rating: 4.8, reviewCount: 142, monthlyPrice: 2500, capabilities: JSON.stringify(['NAV calculation', 'Price verification', 'Accrual computation', 'Fee calculation', 'Audit trail generation']), integrations: JSON.stringify(['Investran', 'Geneva', 'Bloomberg', 'SS&C']), avgTimeSaved: '12 hrs/fund/month', accuracy: 99.2, icon: '📊' }}),
    prisma.agent.create({ data: { name: 'ComplianceGuard', description: 'Continuous compliance monitoring agent that screens transactions, investor activity, and regulatory changes against your compliance framework.', category: 'Compliance', provider: 'Canopy AI', status: 'Available', rating: 4.6, reviewCount: 98, monthlyPrice: 1800, capabilities: JSON.stringify(['Sanctions screening', 'AML monitoring', 'Regulatory change tracking', 'Compliance reporting', 'Risk scoring']), integrations: JSON.stringify(['OFAC', 'World-Check', 'LexisNexis', 'Bloomberg']), avgTimeSaved: '20 hrs/month', accuracy: 98.5, icon: '🛡️' }}),
    prisma.agent.create({ data: { name: 'InvestorComm AI', description: 'Generates personalized investor communications including quarterly letters, capital call notices, and ad-hoc updates with consistent brand voice.', category: 'Investor Relations', provider: 'OpenAI', status: 'Available', rating: 4.5, reviewCount: 76, monthlyPrice: 1200, capabilities: JSON.stringify(['Letter generation', 'Notice drafting', 'FAQ responses', 'Portal updates', 'Multi-language support']), integrations: JSON.stringify(['Investor Portal', 'Outlook', 'DocuSign']), avgTimeSaved: '8 hrs/quarter', accuracy: 92.1, icon: '✉️' }}),
    prisma.agent.create({ data: { name: 'TaxWizard', description: 'Automates partnership tax calculations including K-1 preparation, withholding computation, PFIC analysis, and state nexus determination.', category: 'Tax', provider: 'Anthropic', status: 'Beta', rating: 4.2, reviewCount: 34, monthlyPrice: 3000, capabilities: JSON.stringify(['K-1 automation', 'Withholding calc', 'PFIC analysis', 'State nexus', 'Tax treaty application']), integrations: JSON.stringify(['CCH Axcess', 'BDO Tax', 'GoSystem']), avgTimeSaved: '40 hrs/fund/year', accuracy: 94.8, icon: '🧮' }}),
    prisma.agent.create({ data: { name: 'DataClean Agent', description: 'Automated data quality agent that deduplicates records, standardizes formats, enriches missing fields, and maintains referential integrity.', category: 'Data Management', provider: 'Canopy AI', status: 'Available', rating: 4.7, reviewCount: 112, monthlyPrice: 900, capabilities: JSON.stringify(['Deduplication', 'Format standardization', 'Missing field enrichment', 'Integrity checks', 'Quality scoring']), integrations: JSON.stringify(['Snowflake', 'PostgreSQL', 'S3', 'Salesforce']), avgTimeSaved: '15 hrs/month', accuracy: 96.3, icon: '🧹' }}),
    prisma.agent.create({ data: { name: 'AuditAssist', description: 'Streamlines annual audit preparation by organizing PBC items, tracking auditor requests, and auto-generating supporting schedules.', category: 'Reporting', provider: 'Canopy AI', status: 'Coming Soon', rating: null, reviewCount: 0, monthlyPrice: 2000, capabilities: JSON.stringify(['PBC management', 'Schedule generation', 'Auditor Q&A tracking', 'Document assembly', 'Timeline management']), integrations: JSON.stringify(['PwC Connect', 'Deloitte Cortex', 'EY Canvas']), avgTimeSaved: '60 hrs/audit', icon: '📋' }}),
    prisma.agent.create({ data: { name: 'OnboardExpress', description: 'Accelerates investor and fund onboarding with automated KYC collection, document verification, and approval workflow management.', category: 'Onboarding', provider: 'Custom', status: 'Available', rating: 4.3, reviewCount: 67, monthlyPrice: 1500, capabilities: JSON.stringify(['KYC collection', 'Document verification', 'Risk assessment', 'Approval routing', 'Portal setup']), integrations: JSON.stringify(['DocuSign', 'Onfido', 'Investor Portal']), avgTimeSaved: '6 hrs/investor', accuracy: 95.0, icon: '🚀' }}),
    prisma.agent.create({ data: { name: 'RiskRadar', description: 'Real-time portfolio risk monitoring with VaR calculations, concentration analysis, liquidity stress testing, and automated alert generation.', category: 'Risk', provider: 'Canopy AI', status: 'Beta', rating: 4.1, reviewCount: 28, monthlyPrice: 2200, capabilities: JSON.stringify(['VaR calculation', 'Concentration monitoring', 'Stress testing', 'Liquidity analysis', 'Alert generation']), integrations: JSON.stringify(['Bloomberg', 'MSCI', 'FactSet']), avgTimeSaved: '10 hrs/month', accuracy: 93.7, icon: '📡' }}),
    prisma.agent.create({ data: { name: 'WaterfallCalc', description: 'High-precision waterfall calculation engine supporting American, European, and hybrid waterfall structures with full clawback modeling.', category: 'Fund Accounting', provider: 'Canopy AI', status: 'Available', rating: 4.9, reviewCount: 189, monthlyPrice: 3500, capabilities: JSON.stringify(['American waterfall', 'European waterfall', 'Hybrid structures', 'Clawback modeling', 'What-if scenarios']), integrations: JSON.stringify(['Investran', 'eFront', 'Allvue']), avgTimeSaved: '25 hrs/fund/quarter', accuracy: 99.8, icon: '💧' }}),
    prisma.agent.create({ data: { name: 'DocIntel', description: 'Intelligent document processing agent that classifies, extracts, and cross-references data from fund documents with natural language queries.', category: 'Data Management', provider: 'Anthropic', status: 'Available', rating: 4.4, reviewCount: 85, monthlyPrice: 1100, capabilities: JSON.stringify(['Document classification', 'Data extraction', 'Cross-referencing', 'NL queries', 'Version tracking']), integrations: JSON.stringify(['SharePoint', 'Box', 'Google Drive', 'S3']), avgTimeSaved: '18 hrs/month', accuracy: 91.5, icon: '🔍' }}),
  ]);
  console.log('Created 10 agents');

  // ═══════════════════════════════════════════════
  // PROJECTS (6)
  // ═══════════════════════════════════════════════
  await Promise.all([
    prisma.project.create({ data: { projectId: 'PRJ-001', name: 'Walker Enterprise III — Annual Audit FY2025', description: 'Coordinate annual audit with PwC for Walker Enterprise Fund III and all sub-entities.', projectType: 'Audit Prep', status: 'In Progress', priority: 'Critical', clientName: 'Walker Asset Management', leadName: 'Diana Smith', startDate: new Date('2026-01-15'), targetEndDate: new Date('2026-04-30'), completionPct: 65, totalTasks: 28, completedTasks: 18, budget: 125000, spent: 82500 }}),
    prisma.project.create({ data: { projectId: 'PRJ-002', name: 'Campbell Growth Fund IV Launch', description: 'Full fund launch including entity setup, LPA finalization, investor onboarding, and first close.', projectType: 'Fund Launch', status: 'Planning', priority: 'High', clientName: 'Campbell Capital Partners', leadName: 'Jessica Cruz', startDate: new Date('2026-03-01'), targetEndDate: new Date('2026-09-30'), completionPct: 20, totalTasks: 42, completedTasks: 8, budget: 200000, spent: 35000 }}),
    prisma.project.create({ data: { projectId: 'PRJ-003', name: 'Sullivan Investments Onboarding', description: 'Complete onboarding of Sullivan Investments as new full-service client including system migration.', projectType: 'Onboarding', status: 'In Progress', priority: 'High', clientName: 'Sullivan Investments', leadName: 'Megan Moore', startDate: new Date('2026-02-01'), targetEndDate: new Date('2026-05-31'), completionPct: 45, totalTasks: 35, completedTasks: 16, budget: 85000, spent: 42000 }}),
    prisma.project.create({ data: { projectId: 'PRJ-004', name: 'Cruz Capital FATCA Filing 2025', description: 'Prepare and file FATCA reports for all Cruz Capital fund entities.', projectType: 'Regulatory Filing', status: 'Complete', priority: 'High', clientName: 'Cruz Capital Management', leadName: 'Sarah Garcia', startDate: new Date('2025-12-01'), targetEndDate: new Date('2026-03-15'), actualEndDate: new Date('2026-03-12'), completionPct: 100, totalTasks: 15, completedTasks: 15, budget: 30000, spent: 28500 }}),
    prisma.project.create({ data: { projectId: 'PRJ-005', name: 'White Advisors System Migration', description: 'Migrate White Advisors from legacy Wall Street Office to Investran platform.', projectType: 'System Migration', status: 'On Hold', priority: 'Medium', clientName: 'White Advisors', leadName: 'Tyler White', startDate: new Date('2026-02-15'), targetEndDate: new Date('2026-08-31'), completionPct: 30, totalTasks: 50, completedTasks: 15, budget: 350000, spent: 95000 }}),
    prisma.project.create({ data: { projectId: 'PRJ-006', name: 'Walker Enterprise Fund I Wind-Down', description: 'Final wind-down of Walker Enterprise Fund I including final distributions, LP close-outs, and entity dissolution.', projectType: 'Wind-Down', status: 'In Progress', priority: 'High', clientName: 'Walker Asset Management', leadName: 'Jason Cooper', startDate: new Date('2025-10-01'), targetEndDate: new Date('2026-06-30'), completionPct: 75, totalTasks: 20, completedTasks: 15, budget: 45000, spent: 38000 }}),
  ]);
  console.log('Created 6 projects');

  // ═══════════════════════════════════════════════
  // CALENDAR EVENTS (20)
  // ═══════════════════════════════════════════════
  await Promise.all([
    prisma.calendarEvent.create({ data: { eventId: 'EVT-001', title: 'Walker III — Q1 Board Meeting', eventType: 'Board Meeting', startTime: new Date('2026-04-15T14:00:00'), endTime: new Date('2026-04-15T16:00:00'), location: 'Dallas HQ — Boardroom A', attendees: 'Megan Moore, Diana Smith, Walker GP', clientName: 'Walker Asset Management', entityName: 'Walker Enterprise Fund III LP', status: 'Scheduled', priority: 'High', createdBy: 'Megan Moore' }}),
    prisma.calendarEvent.create({ data: { eventId: 'EVT-002', title: 'PwC Audit Kickoff — Walker III', eventType: 'Audit Meeting', startTime: new Date('2026-04-07T10:00:00'), endTime: new Date('2026-04-07T11:30:00'), location: 'Zoom', attendees: 'Diana Smith, Steven Wright, Richard Thornton (PwC)', clientName: 'Walker Asset Management', status: 'Scheduled', priority: 'High', createdBy: 'Diana Smith' }}),
    prisma.calendarEvent.create({ data: { eventId: 'EVT-003', title: 'Campbell IV — Investor Day', eventType: 'Investor Event', startTime: new Date('2026-04-22T09:00:00'), endTime: new Date('2026-04-22T17:00:00'), allDay: true, location: 'The Beverly Wilshire, Los Angeles', attendees: 'Jessica Cruz, Campbell GP, Prospective LPs', clientName: 'Campbell Capital Partners', status: 'Confirmed', priority: 'High', createdBy: 'Jessica Cruz' }}),
    prisma.calendarEvent.create({ data: { eventId: 'EVT-004', title: 'Monthly NAV Deadline — All Funds', eventType: 'Deadline', startTime: new Date('2026-04-30T23:59:00'), endTime: new Date('2026-04-30T23:59:00'), status: 'Scheduled', priority: 'Critical', createdBy: 'System' }}),
    prisma.calendarEvent.create({ data: { eventId: 'EVT-005', title: 'Sullivan Onboarding Check-In', eventType: 'Client Meeting', startTime: new Date('2026-04-09T15:00:00'), endTime: new Date('2026-04-09T15:45:00'), location: 'Teams', attendees: 'Megan Moore, Michael Collins, Sullivan Ops Team', clientName: 'Sullivan Investments', status: 'Scheduled', priority: 'Medium', createdBy: 'Megan Moore' }}),
    prisma.calendarEvent.create({ data: { eventId: 'EVT-006', title: 'FATCA Filing Deadline — WFM', eventType: 'Deadline', startTime: new Date('2026-04-15T23:59:00'), endTime: new Date('2026-04-15T23:59:00'), entityName: 'WFM Global Opportunities FoF', clientName: 'White Fund Management', status: 'At Risk', priority: 'Critical', createdBy: 'Sarah Garcia' }}),
    prisma.calendarEvent.create({ data: { eventId: 'EVT-007', title: 'Canopy All-Hands', eventType: 'Internal Meeting', startTime: new Date('2026-04-11T12:00:00'), endTime: new Date('2026-04-11T13:00:00'), location: 'Dallas HQ — Main Hall + Zoom', attendees: 'All Staff', status: 'Confirmed', priority: 'Medium', createdBy: 'Rebecca Sanders' }}),
    prisma.calendarEvent.create({ data: { eventId: 'EVT-008', title: 'Walker I — Wind-Down Distribution Review', eventType: 'Internal Review', startTime: new Date('2026-04-08T11:00:00'), endTime: new Date('2026-04-08T12:00:00'), location: 'Zoom', attendees: 'Jason Cooper, Steven Wright, Katherine Brooks (K&E)', clientName: 'Walker Asset Management', entityName: 'Walker Enterprise Fund I LP', status: 'Scheduled', priority: 'High', createdBy: 'Jason Cooper' }}),
    prisma.calendarEvent.create({ data: { eventId: 'EVT-009', title: 'Rodriguez KYC Completion Target', eventType: 'Deadline', startTime: new Date('2026-04-17T23:59:00'), endTime: new Date('2026-04-17T23:59:00'), clientName: 'Rodriguez Capital Management', status: 'Scheduled', priority: 'High', createdBy: 'Sarah Garcia' }}),
    prisma.calendarEvent.create({ data: { eventId: 'EVT-010', title: 'Q1 Investor Statements — Distribution', eventType: 'Deadline', startTime: new Date('2026-04-25T23:59:00'), endTime: new Date('2026-04-25T23:59:00'), status: 'Scheduled', priority: 'High', createdBy: 'Jason Cooper' }}),
    prisma.calendarEvent.create({ data: { eventId: 'EVT-011', title: 'Houlihan Lokey — Valuation Call (White Credit V)', eventType: 'External Meeting', startTime: new Date('2026-04-10T14:00:00'), endTime: new Date('2026-04-10T15:00:00'), location: 'Zoom', attendees: 'Diana Smith, Daniel Foster (HL)', clientName: 'White Advisors', entityName: 'White Senior Credit Fund V', status: 'Confirmed', priority: 'High', createdBy: 'Diana Smith' }}),
    prisma.calendarEvent.create({ data: { eventId: 'EVT-012', title: 'Lopez RE III — Property Appraisal Review', eventType: 'Internal Review', startTime: new Date('2026-04-14T10:00:00'), endTime: new Date('2026-04-14T11:30:00'), location: 'Teams', clientName: 'Lopez Asset Partners', entityName: 'Lopez Real Estate Opportunities III', status: 'Scheduled', priority: 'Medium', createdBy: 'Jason Cooper' }}),
    prisma.calendarEvent.create({ data: { eventId: 'EVT-013', title: 'AI Skills Demo — Platform Team', eventType: 'Internal Meeting', startTime: new Date('2026-04-16T14:00:00'), endTime: new Date('2026-04-16T15:00:00'), location: 'Dallas HQ — Innovation Lab', attendees: 'Tyler White, Megan Moore, Platform Team', status: 'Scheduled', priority: 'Medium', createdBy: 'Tyler White' }}),
    prisma.calendarEvent.create({ data: { eventId: 'EVT-014', title: 'Compliance Training — Annual Refresher', eventType: 'Training', startTime: new Date('2026-04-18T09:00:00'), endTime: new Date('2026-04-18T12:00:00'), location: 'Zoom', attendees: 'All Staff', status: 'Scheduled', priority: 'Medium', createdBy: 'Sarah Garcia', recurrence: 'Annual' }}),
    prisma.calendarEvent.create({ data: { eventId: 'EVT-015', title: 'Cruz Ventures II — Portfolio Review', eventType: 'Client Meeting', startTime: new Date('2026-04-21T11:00:00'), endTime: new Date('2026-04-21T12:30:00'), location: 'Menlo Park Office', attendees: 'Megan Moore, Cruz GP, Portfolio Managers', clientName: 'Cruz Capital Management', entityName: 'Cruz Ventures Fund II LP', status: 'Confirmed', priority: 'High', createdBy: 'Megan Moore' }}),
    prisma.calendarEvent.create({ data: { eventId: 'EVT-016', title: 'White Advisors Migration Planning', eventType: 'Internal Meeting', startTime: new Date('2026-04-07T14:00:00'), endTime: new Date('2026-04-07T15:00:00'), location: 'Zoom', attendees: 'Tyler White, Diana Smith, White Ops Team', clientName: 'White Advisors', status: 'Scheduled', priority: 'Medium', createdBy: 'Tyler White' }}),
    prisma.calendarEvent.create({ data: { eventId: 'EVT-017', title: 'WFM — Annual Investor Conference', eventType: 'Investor Event', startTime: new Date('2026-05-12T09:00:00'), endTime: new Date('2026-05-13T17:00:00'), allDay: true, location: 'Hotel Okura, Amsterdam', attendees: 'Megan Moore, WFM Team, Global LPs', clientName: 'White Fund Management', status: 'Planning', priority: 'High', createdBy: 'Megan Moore' }}),
    prisma.calendarEvent.create({ data: { eventId: 'EVT-018', title: 'K-1 Distribution Deadline — Walker III', eventType: 'Deadline', startTime: new Date('2026-05-15T23:59:00'), endTime: new Date('2026-05-15T23:59:00'), clientName: 'Walker Asset Management', entityName: 'Walker Enterprise Fund III LP', status: 'Scheduled', priority: 'Critical', createdBy: 'Brandon Cohen' }}),
    prisma.calendarEvent.create({ data: { eventId: 'EVT-019', title: 'Pod A — Weekly Standup', eventType: 'Internal Meeting', startTime: new Date('2026-04-07T09:00:00'), endTime: new Date('2026-04-07T09:30:00'), location: 'Zoom', attendees: 'Pod A Team', status: 'Confirmed', priority: 'Low', createdBy: 'Megan Moore', recurrence: 'Weekly' }}),
    prisma.calendarEvent.create({ data: { eventId: 'EVT-020', title: 'EY Audit Planning — Sullivan', eventType: 'Audit Meeting', startTime: new Date('2026-04-28T10:00:00'), endTime: new Date('2026-04-28T11:30:00'), location: 'Zoom', attendees: 'Michael Collins, EY Audit Team', clientName: 'Sullivan Investments', status: 'Scheduled', priority: 'High', createdBy: 'Michael Collins' }}),
  ]);
  console.log('Created 20 calendar events');

  // ═══════════════════════════════════════════════
  // COMMUNICATIONS (15)
  // ═══════════════════════════════════════════════
  await Promise.all([
    prisma.communication.create({ data: { communicationId: 'COM-001', channel: 'Email', direction: 'Outbound', subject: 'Walker III Q1 2026 NAV Package — Review Ready', summary: 'NAV package for March 2026 sent to Walker GP for review. Includes position-level detail and fee accruals.', fromName: 'Diana Smith', fromEmail: 'diana.smith@lighthouse.io', toName: 'Walker GP Team', toEmail: 'ops@walkerasset.com', clientName: 'Walker Asset Management', entityName: 'Walker Enterprise Fund III LP', sentiment: 'Neutral', urgency: 'Normal', status: 'Sent', communicationDate: d(-2), hasAttachments: true, attachmentCount: 3, tags: 'nav,quarterly' }}),
    prisma.communication.create({ data: { communicationId: 'COM-002', channel: 'Email', direction: 'Inbound', subject: 'RE: FATCA Filing Status — Urgent', summary: 'WFM requesting status update on overdue FATCA filing. Three investor self-certifications still outstanding.', fromName: 'WFM Compliance', fromEmail: 'compliance@whitefund.nl', toName: 'Sarah Garcia', toEmail: 'sarah.garcia@lighthouse.io', clientName: 'White Fund Management', sentiment: 'Negative', urgency: 'Urgent', status: 'Open', communicationDate: d(-1), tags: 'fatca,compliance,escalation' }}),
    prisma.communication.create({ data: { communicationId: 'COM-003', channel: 'Phone', direction: 'Inbound', subject: 'CalPERS — Capital Account Inquiry', summary: 'CalPERS investor relations team requesting clarification on Q4 2025 capital account movements and fee calculations.', fromName: 'Robert Chen (CalPERS)', toName: 'Jason Cooper', clientName: 'Walker Asset Management', investorName: 'CalPERS', sentiment: 'Neutral', urgency: 'Normal', status: 'Resolved', communicationDate: d(-3), resolvedDate: d(-2), tags: 'investor-query,capital-account' }}),
    prisma.communication.create({ data: { communicationId: 'COM-004', channel: 'Email', direction: 'Outbound', subject: 'Campbell IV — Capital Call Notice #3', summary: 'Third capital call notice distributed to all Campbell Growth Fund IV LPs for $18.5M.', fromName: 'Steven Wright', fromEmail: 'steven.wright@lighthouse.io', toName: 'Campbell IV LPs', clientName: 'Campbell Capital Partners', entityName: 'Campbell Growth Fund IV LP', sentiment: 'Neutral', urgency: 'Normal', status: 'Sent', communicationDate: d(-5), hasAttachments: true, attachmentCount: 1, tags: 'capital-call,distribution' }}),
    prisma.communication.create({ data: { communicationId: 'COM-005', channel: 'Meeting', direction: 'Internal', subject: 'Rodriguez Onboarding Status — Risk Discussion', summary: 'Internal discussion regarding KYC delays with Rodriguez Capital. Koch Industries FO documentation incomplete. Compliance flagged for additional review.', fromName: 'Sarah Garcia', toName: 'Jessica Cruz', clientName: 'Rodriguez Capital Management', sentiment: 'Concerned', urgency: 'High', status: 'Open', communicationDate: d(-1), followUpDate: d(3), tags: 'onboarding,kyc,risk' }}),
    prisma.communication.create({ data: { communicationId: 'COM-006', channel: 'Email', direction: 'Inbound', subject: 'PwC — Additional PBC Items for Walker III Audit', summary: 'PwC audit team requesting 7 additional PBC items including management representation letter and subsequent events disclosure.', fromName: 'Richard Thornton (PwC)', fromEmail: 'richard.thornton@pwc.com', toName: 'Diana Smith', toEmail: 'diana.smith@lighthouse.io', clientName: 'Walker Asset Management', sentiment: 'Neutral', urgency: 'High', status: 'Open', communicationDate: d(-1), hasAttachments: true, attachmentCount: 1, followUpDate: d(5), tags: 'audit,pbc,pwc' }}),
    prisma.communication.create({ data: { communicationId: 'COM-007', channel: 'Email', direction: 'Outbound', subject: 'Walker I — Final Distribution Timeline Update', summary: 'Updated timeline for final distribution sent to all Walker Fund I LPs. Distribution expected within 45 days pending GP approval.', fromName: 'Jason Cooper', fromEmail: 'jason.cooper@lighthouse.io', toName: 'Walker Fund I LPs', clientName: 'Walker Asset Management', entityName: 'Walker Enterprise Fund I LP', sentiment: 'Positive', urgency: 'Normal', status: 'Sent', communicationDate: d(-4), tags: 'distribution,wind-down,update' }}),
    prisma.communication.create({ data: { communicationId: 'COM-008', channel: 'Slack', direction: 'Internal', subject: 'Houlihan Lokey Valuation Delay — White Credit V', summary: 'HL notified of 2-week delay in portfolio valuation for White Senior Credit Fund V. NAV deadline at risk.', fromName: 'Daniel Foster (HL)', toName: 'Diana Smith', clientName: 'White Advisors', entityName: 'White Senior Credit Fund V', sentiment: 'Negative', urgency: 'Urgent', status: 'Open', communicationDate: d(-2), followUpDate: d(1), tags: 'valuation,delay,risk' }}),
    prisma.communication.create({ data: { communicationId: 'COM-009', channel: 'Email', direction: 'Outbound', subject: 'Sullivan Alpha — Welcome Package & System Access', summary: 'Welcome package sent to Sullivan Investments team including portal access credentials, contact directory, and onboarding timeline.', fromName: 'Megan Moore', fromEmail: 'megan.moore@lighthouse.io', toName: 'Sullivan Investments', toEmail: 'ops@sullivaninv.com', clientName: 'Sullivan Investments', sentiment: 'Positive', urgency: 'Normal', status: 'Sent', communicationDate: d(-10), hasAttachments: true, attachmentCount: 4, tags: 'onboarding,welcome' }}),
    prisma.communication.create({ data: { communicationId: 'COM-010', channel: 'Email', direction: 'Inbound', subject: 'ADIA — Commitment Increase Request for Walker III', summary: 'ADIA requesting information on commitment increase of $50M to Walker Enterprise Fund III. Needs side letter amendment.', fromName: 'Fatima Al-Rashid (ADIA)', fromEmail: 'f.alrashid@adia.ae', toName: 'Megan Moore', toEmail: 'megan.moore@lighthouse.io', clientName: 'Walker Asset Management', investorName: 'ADIA', sentiment: 'Positive', urgency: 'Normal', status: 'Open', communicationDate: d(-3), followUpDate: d(7), tags: 'commitment,increase,side-letter' }}),
    prisma.communication.create({ data: { communicationId: 'COM-011', channel: 'Phone', direction: 'Inbound', subject: 'GIC — ESG Reporting Requirements', summary: 'GIC requesting detailed ESG metrics for WFM portfolio. Need to coordinate with underlying fund managers for data collection.', fromName: 'Wei Lin Tan (GIC)', toName: 'Jason Cooper', clientName: 'White Fund Management', investorName: 'GIC', sentiment: 'Neutral', urgency: 'Normal', status: 'Open', communicationDate: d(-5), followUpDate: d(10), tags: 'esg,reporting,investor-request' }}),
    prisma.communication.create({ data: { communicationId: 'COM-012', channel: 'Email', direction: 'Outbound', subject: 'Monthly Operations Report — March 2026', summary: 'Monthly operations report distributed to all client GPs summarizing task completion, NAV status, and upcoming deadlines.', fromName: 'Rebecca Sanders', fromEmail: 'rebecca.sanders@lighthouse.io', toName: 'All Client GPs', sentiment: 'Neutral', urgency: 'Low', status: 'Sent', communicationDate: d(-1), hasAttachments: true, attachmentCount: 1, tags: 'operations,monthly-report' }}),
    prisma.communication.create({ data: { communicationId: 'COM-013', channel: 'Meeting', direction: 'Internal', subject: 'White Advisors Migration — Technical Architecture Review', summary: 'Review of proposed data migration architecture from WSO to Investran. Identified 3 data mapping challenges in derivative positions.', fromName: 'Tyler White', toName: 'Diana Smith', clientName: 'White Advisors', sentiment: 'Neutral', urgency: 'Normal', status: 'Resolved', communicationDate: d(-7), resolvedDate: d(-5), tags: 'migration,technical,architecture' }}),
    prisma.communication.create({ data: { communicationId: 'COM-014', channel: 'Email', direction: 'Inbound', subject: 'Lopez RE III — Appraisal Report Delivery', summary: 'External appraiser delivering Q1 property valuations for London Bridge Office Complex and Munich Commercial portfolio.', fromName: 'Lopez Valuation Team', fromEmail: 'valuations@lopezpartners.com', toName: 'Jason Cooper', toEmail: 'jason.cooper@lighthouse.io', clientName: 'Lopez Asset Partners', entityName: 'Lopez Real Estate Opportunities III', sentiment: 'Positive', urgency: 'Normal', status: 'Open', communicationDate: d(-1), hasAttachments: true, attachmentCount: 2, tags: 'valuation,appraisal,real-estate' }}),
    prisma.communication.create({ data: { communicationId: 'COM-015', channel: 'Email', direction: 'Outbound', subject: 'Cruz Ventures II — Annual Meeting Invitation', summary: 'Annual meeting invitation sent to all Cruz Ventures Fund II investors. Meeting scheduled for May 8, 2026 at Menlo Park office.', fromName: 'Megan Moore', fromEmail: 'megan.moore@lighthouse.io', toName: 'Cruz Ventures II LPs', clientName: 'Cruz Capital Management', entityName: 'Cruz Ventures Fund II LP', sentiment: 'Positive', urgency: 'Low', status: 'Sent', communicationDate: d(-8), hasAttachments: true, attachmentCount: 1, tags: 'annual-meeting,invitation' }}),
  ]);
  console.log('Created 15 communications');

  // ═══════════════════════════════════════════════
  // TREASURY ACCOUNTS (8) + CASH FLOWS (15)
  // ═══════════════════════════════════════════════
  await Promise.all([
    prisma.treasuryAccount.create({ data: { accountId: 'TRS-001', accountName: 'Walker III — Operating Account', accountType: 'Operating', institution: 'JPMorgan Chase', currentBalance: 45200000, availableBalance: 44800000, pendingInflows: 18500000, pendingOutflows: 2200000, entityName: 'Walker Enterprise Fund III LP', clientName: 'Walker Asset Management', status: 'Active', lastActivityDate: d(-1) }}),
    prisma.treasuryAccount.create({ data: { accountId: 'TRS-002', accountName: 'Walker III — Subscription Line', accountType: 'Credit Facility', institution: 'JPMorgan Chase', currentBalance: -12000000, availableBalance: 38000000, entityName: 'Walker Enterprise Fund III LP', clientName: 'Walker Asset Management', interestRate: 5.75, status: 'Active', lastActivityDate: d(-3) }}),
    prisma.treasuryAccount.create({ data: { accountId: 'TRS-003', accountName: 'Sullivan Alpha — Prime Brokerage', accountType: 'Brokerage', institution: 'Goldman Sachs', currentBalance: 890000000, availableBalance: 890000000, pendingInflows: 5200000, pendingOutflows: 3100000, entityName: 'Sullivan Global Alpha Fund', clientName: 'Sullivan Investments', status: 'Active', lastActivityDate: d(-1) }}),
    prisma.treasuryAccount.create({ data: { accountId: 'TRS-004', accountName: 'Campbell IV — Capital Call Account', accountType: 'Operating', institution: 'Bank of America', currentBalance: 22400000, availableBalance: 22400000, entityName: 'Campbell Growth Fund IV LP', clientName: 'Campbell Capital Partners', status: 'Active', lastActivityDate: d(-5) }}),
    prisma.treasuryAccount.create({ data: { accountId: 'TRS-005', accountName: 'WFM — EUR Operating Account', accountType: 'Operating', institution: 'ING Bank', currency: 'EUR', currentBalance: 125000000, availableBalance: 124500000, pendingInflows: 8900000, pendingOutflows: 4200000, entityName: 'WFM Global Opportunities FoF', clientName: 'White Fund Management', status: 'Active', lastActivityDate: d(-1) }}),
    prisma.treasuryAccount.create({ data: { accountId: 'TRS-006', accountName: 'Lopez RE III — Property Escrow', accountType: 'Escrow', institution: 'Barclays', currency: 'GBP', currentBalance: 8500000, availableBalance: 0, entityName: 'Lopez Real Estate Opportunities III', clientName: 'Lopez Asset Partners', status: 'Active', lastActivityDate: d(-10) }}),
    prisma.treasuryAccount.create({ data: { accountId: 'TRS-007', accountName: 'White Credit V — Operating', accountType: 'Operating', institution: 'State Street', currentBalance: 78600000, availableBalance: 78200000, pendingOutflows: 1500000, entityName: 'White Senior Credit Fund V', clientName: 'White Advisors', status: 'Active', lastActivityDate: d(-2) }}),
    prisma.treasuryAccount.create({ data: { accountId: 'TRS-008', accountName: 'Lighthouse — Operating Account', accountType: 'Operating', institution: 'Wells Fargo', currentBalance: 4850000, availableBalance: 4700000, pendingInflows: 380000, status: 'Active', lastActivityDate: d(-1) }}),
  ]);

  await Promise.all([
    prisma.cashFlow.create({ data: { cashFlowId: 'CF-001', flowType: 'Inflow', category: 'Capital Call', amount: 18500000, accountName: 'Walker III — Operating Account', entityName: 'Walker Enterprise Fund III LP', clientName: 'Walker Asset Management', counterparty: 'Multiple LPs', description: 'Capital Call #14 — Draw 7.2%', transactionDate: d(-1), status: 'Pending' }}),
    prisma.cashFlow.create({ data: { cashFlowId: 'CF-002', flowType: 'Outflow', category: 'Investment', amount: -15000000, accountName: 'Walker III — Operating Account', entityName: 'Walker Enterprise Fund III LP', counterparty: 'Acme Software Holdings', description: 'Series C Follow-On Investment', transactionDate: d(-3), settlementDate: d(-2), status: 'Settled' }}),
    prisma.cashFlow.create({ data: { cashFlowId: 'CF-003', flowType: 'Outflow', category: 'Management Fee', amount: -2250000, accountName: 'Walker III — Operating Account', entityName: 'Walker Enterprise Fund III LP', counterparty: 'Walker Enterprise Management LLC', description: 'Q1 2026 Management Fee', transactionDate: d(-5), settlementDate: d(-5), status: 'Settled' }}),
    prisma.cashFlow.create({ data: { cashFlowId: 'CF-004', flowType: 'Outflow', category: 'Distribution', amount: -8200000, accountName: 'Walker III — Operating Account', entityName: 'Walker Enterprise Fund I LP', counterparty: 'Multiple LPs', description: 'Wind-down partial distribution', transactionDate: d(-8), settlementDate: d(-7), status: 'Settled' }}),
    prisma.cashFlow.create({ data: { cashFlowId: 'CF-005', flowType: 'Inflow', category: 'Dividend', amount: 3400000, accountName: 'Sullivan Alpha — Prime Brokerage', entityName: 'Sullivan Global Alpha Fund', counterparty: 'Various Issuers', description: 'Q1 dividend income', transactionDate: d(-2), settlementDate: d(-1), status: 'Settled' }}),
    prisma.cashFlow.create({ data: { cashFlowId: 'CF-006', flowType: 'Outflow', category: 'Redemption', amount: -12000000, accountName: 'Sullivan Alpha — Prime Brokerage', entityName: 'Sullivan Global Alpha Fund', counterparty: 'Redeeming Investor', description: 'March 2026 redemption', transactionDate: d(-5), status: 'Pending' }}),
    prisma.cashFlow.create({ data: { cashFlowId: 'CF-007', flowType: 'Inflow', category: 'Capital Call', amount: 8500000, accountName: 'Campbell IV — Capital Call Account', entityName: 'Campbell Growth Fund IV LP', counterparty: 'Multiple LPs', description: 'Capital Call #3', transactionDate: d(-5), settlementDate: d(-4), status: 'Settled' }}),
    prisma.cashFlow.create({ data: { cashFlowId: 'CF-008', flowType: 'Inflow', category: 'Interest', amount: 1250000, accountName: 'White Credit V — Operating', entityName: 'White Senior Credit Fund V', counterparty: 'Portfolio Borrowers', description: 'March interest payments', transactionDate: d(-3), settlementDate: d(-2), status: 'Settled' }}),
    prisma.cashFlow.create({ data: { cashFlowId: 'CF-009', flowType: 'Outflow', category: 'Credit Facility Draw', amount: -5000000, accountName: 'Walker III — Subscription Line', entityName: 'Walker Enterprise Fund III LP', counterparty: 'JPMorgan Chase', description: 'Subscription line draw for bridge funding', transactionDate: d(-10), settlementDate: d(-10), status: 'Settled' }}),
    prisma.cashFlow.create({ data: { cashFlowId: 'CF-010', flowType: 'Outflow', category: 'Property Acquisition', amount: -22000000, accountName: 'Lopez RE III — Property Escrow', entityName: 'Lopez Real Estate Opportunities III', counterparty: 'Meridian Properties Ltd', description: 'Edinburgh Office Complex — deposit', transactionDate: d(-10), settlementDate: d(-10), status: 'Settled', currency: 'GBP' }}),
    prisma.cashFlow.create({ data: { cashFlowId: 'CF-011', flowType: 'Inflow', category: 'Fee Income', amount: 380000, accountName: 'Lighthouse — Operating Account', counterparty: 'Multiple Clients', description: 'March 2026 administration fees', transactionDate: d(-1), status: 'Pending' }}),
    prisma.cashFlow.create({ data: { cashFlowId: 'CF-012', flowType: 'Outflow', category: 'Payroll', amount: -1200000, accountName: 'Lighthouse — Operating Account', counterparty: 'Lighthouse Staff', description: 'March 2026 payroll', transactionDate: d(-2), settlementDate: d(-2), status: 'Settled' }}),
    prisma.cashFlow.create({ data: { cashFlowId: 'CF-013', flowType: 'Inflow', category: 'Capital Call', amount: 4200000, accountName: 'WFM — EUR Operating Account', entityName: 'WFM Global Opportunities FoF', counterparty: 'Underlying Fund Distributions', description: 'Distributions from underlying managers', transactionDate: d(-4), settlementDate: d(-3), status: 'Settled', currency: 'EUR' }}),
    prisma.cashFlow.create({ data: { cashFlowId: 'CF-014', flowType: 'Outflow', category: 'Fund Expense', amount: -450000, accountName: 'Sullivan Alpha — Prime Brokerage', entityName: 'Sullivan Global Alpha Fund', counterparty: 'Various', description: 'Q1 fund operating expenses', transactionDate: d(-7), settlementDate: d(-6), status: 'Settled' }}),
    prisma.cashFlow.create({ data: { cashFlowId: 'CF-015', flowType: 'Inflow', category: 'Credit Facility Repay', amount: 3000000, accountName: 'Walker III — Subscription Line', entityName: 'Walker Enterprise Fund III LP', counterparty: 'JPMorgan Chase', description: 'Partial subscription line repayment', transactionDate: d(-7), settlementDate: d(-7), status: 'Settled' }}),
  ]);
  console.log('Created 8 treasury accounts and 15 cash flows');

  // ═══════════════════════════════════════════════
  // TOOLBOX (8 custom tools)
  // ═══════════════════════════════════════════════
  await Promise.all([
    prisma.tool.create({ data: { toolId: 'TOOL-001', name: 'NAV Reconciliation Checker', description: 'Cross-references NAV calculations between Investran, custodian reports, and internal calculations to identify discrepancies above threshold.', category: 'Reconciliation', builtBy: 'Tyler White', status: 'Active', version: '2.3', language: 'Python', runtime: 'AWS Lambda', runCount: 1847, avgRunTimeMs: 3200, lastRunDate: d(-1), tags: 'nav,reconciliation,automated' }}),
    prisma.tool.create({ data: { toolId: 'TOOL-002', name: 'Entity Hierarchy Validator', description: 'Validates fund entity hierarchies ensuring consistent parent-child relationships, fee structure inheritance, and regulatory classification.', category: 'Data Quality', builtBy: 'Tyler White', status: 'Active', version: '1.5', language: 'TypeScript', runtime: 'Node.js', runCount: 423, avgRunTimeMs: 1500, lastRunDate: d(-3), tags: 'entity,hierarchy,validation' }}),
    prisma.tool.create({ data: { toolId: 'TOOL-003', name: 'Investor Tax Withholding Calculator', description: 'Calculates withholding tax obligations per investor based on domicile, tax treaty status, entity classification, and distribution type.', category: 'Tax', builtBy: 'Brandon Cohen', status: 'Active', version: '3.1', language: 'Python', runtime: 'Docker', runCount: 892, avgRunTimeMs: 800, lastRunDate: d(-5), tags: 'tax,withholding,calculator' }}),
    prisma.tool.create({ data: { toolId: 'TOOL-004', name: 'Side Letter Clause Extractor', description: 'NLP-powered tool that extracts key clauses, fee modifications, MFN provisions, and consent rights from side letters.', category: 'Document Processing', builtBy: 'Tyler White', status: 'Beta', version: '0.9', language: 'Python', runtime: 'GPU Container', runCount: 156, avgRunTimeMs: 8500, lastRunDate: d(-7), tags: 'side-letter,nlp,extraction' }}),
    prisma.tool.create({ data: { toolId: 'TOOL-005', name: 'Waterfall Scenario Modeler', description: 'Interactive what-if analysis tool for waterfall distributions. Models multiple exit scenarios and their impact on GP/LP economics.', category: 'Analytics', builtBy: 'Steven Wright', status: 'Active', version: '2.0', language: 'TypeScript', runtime: 'Next.js API', runCount: 534, avgRunTimeMs: 2100, lastRunDate: d(-2), tags: 'waterfall,scenario,modeling' }}),
    prisma.tool.create({ data: { toolId: 'TOOL-006', name: 'Compliance Dashboard Generator', description: 'Generates real-time compliance dashboards with KYC status, sanctions screening results, and regulatory filing deadlines.', category: 'Compliance', builtBy: 'Sarah Garcia', status: 'Active', version: '1.8', language: 'Python', runtime: 'Streamlit', runCount: 2100, avgRunTimeMs: 4500, lastRunDate: d(-1), tags: 'compliance,dashboard,kyc' }}),
    prisma.tool.create({ data: { toolId: 'TOOL-007', name: 'Data Vault Import Pipeline', description: 'ETL pipeline that ingests data from multiple accounting systems (Investran, Geneva, eFront) into the unified Canopy Data Vault.', category: 'Data Engineering', builtBy: 'Tyler White', status: 'Active', version: '4.2', language: 'Python', runtime: 'Airflow + dbt', runCount: 8934, avgRunTimeMs: 45000, lastRunDate: d(-1), tags: 'etl,pipeline,ingestion' }}),
    prisma.tool.create({ data: { toolId: 'TOOL-008', name: 'Fee Audit Trail Reporter', description: 'Generates detailed audit trail reports for management fee and carried interest calculations with step-by-step breakdowns.', category: 'Reporting', builtBy: 'Diana Smith', status: 'Active', version: '1.2', language: 'SQL + Python', runtime: 'Scheduled Job', runCount: 312, avgRunTimeMs: 6200, lastRunDate: d(-8), tags: 'fee,audit-trail,reporting' }}),
  ]);
  console.log('Created 8 tools');

  // ═══════════════════════════════════════════════
  // RULES (12 — Deterministic Calculation DAG)
  // ═══════════════════════════════════════════════
  await Promise.all([
    prisma.rule.create({ data: { ruleId: 'RULE-001', name: 'Gross Asset Value', description: 'Sum all position market values at period end', ruleType: 'NAV Computation', formula: 'GAV = Σ(position_i × price_i)', inputFields: JSON.stringify(['positions', 'market_prices']), outputField: 'gross_asset_value', dependsOn: JSON.stringify([]), priority: 1, status: 'Active', category: 'Valuation' }}),
    prisma.rule.create({ data: { ruleId: 'RULE-002', name: 'Accrued Expenses', description: 'Calculate total accrued fund expenses for the period', ruleType: 'NAV Computation', formula: 'AE = admin_fees + legal_fees + audit_accrual + other_expenses', inputFields: JSON.stringify(['admin_fees', 'legal_fees', 'audit_accrual', 'other_expenses']), outputField: 'accrued_expenses', dependsOn: JSON.stringify([]), priority: 2, status: 'Active', category: 'Expenses' }}),
    prisma.rule.create({ data: { ruleId: 'RULE-003', name: 'Gross NAV', description: 'Gross asset value minus accrued expenses', ruleType: 'NAV Computation', formula: 'Gross_NAV = GAV - AE', inputFields: JSON.stringify(['gross_asset_value', 'accrued_expenses']), outputField: 'gross_nav', dependsOn: JSON.stringify(['RULE-001', 'RULE-002']), priority: 3, status: 'Active', category: 'NAV' }}),
    prisma.rule.create({ data: { ruleId: 'RULE-004', name: 'Management Fee', description: 'Calculate management fee based on commitment or NAV per LPA terms', ruleType: 'Fee Calculation', formula: 'Mgmt_Fee = fee_basis × mgmt_fee_pct ÷ periods_per_year', inputFields: JSON.stringify(['gross_nav', 'commitment', 'mgmt_fee_pct', 'fee_basis_type']), outputField: 'management_fee', dependsOn: JSON.stringify(['RULE-003']), priority: 4, status: 'Active', category: 'Fees' }}),
    prisma.rule.create({ data: { ruleId: 'RULE-005', name: 'Preferred Return', description: 'Calculate preferred return (hurdle rate) for LP priority', ruleType: 'Allocation', formula: 'Pref_Return = called_capital × pref_rate × period_fraction', inputFields: JSON.stringify(['called_capital', 'pref_rate', 'period_start', 'period_end']), outputField: 'preferred_return', dependsOn: JSON.stringify([]), priority: 5, status: 'Active', category: 'Waterfall' }}),
    prisma.rule.create({ data: { ruleId: 'RULE-006', name: 'GP Catch-Up', description: 'GP catch-up allocation after preferred return is satisfied', ruleType: 'Allocation', formula: 'Catchup = MIN(excess × catchup_rate, target_carry_share)', inputFields: JSON.stringify(['preferred_return', 'distributable_proceeds', 'catchup_rate']), outputField: 'gp_catchup', dependsOn: JSON.stringify(['RULE-005']), priority: 6, status: 'Active', category: 'Waterfall' }}),
    prisma.rule.create({ data: { ruleId: 'RULE-007', name: 'Carried Interest', description: 'GP carried interest on gains above hurdle', ruleType: 'Fee Calculation', formula: 'Carry = (gains_above_hurdle - catchup) × carry_pct', inputFields: JSON.stringify(['gross_nav', 'called_capital', 'preferred_return', 'gp_catchup', 'carry_pct']), outputField: 'carried_interest', dependsOn: JSON.stringify(['RULE-003', 'RULE-005', 'RULE-006']), priority: 7, status: 'Active', category: 'Waterfall' }}),
    prisma.rule.create({ data: { ruleId: 'RULE-008', name: 'Net NAV', description: 'NAV after all fees and carried interest', ruleType: 'NAV Computation', formula: 'Net_NAV = Gross_NAV - Mgmt_Fee - Carried_Interest', inputFields: JSON.stringify(['gross_nav', 'management_fee', 'carried_interest']), outputField: 'net_nav', dependsOn: JSON.stringify(['RULE-003', 'RULE-004', 'RULE-007']), priority: 8, status: 'Active', category: 'NAV' }}),
    prisma.rule.create({ data: { ruleId: 'RULE-009', name: 'TVPI Calculation', description: 'Total Value to Paid-In capital ratio', ruleType: 'Performance', formula: 'TVPI = (Net_NAV + cumulative_distributions) ÷ called_capital', inputFields: JSON.stringify(['net_nav', 'cumulative_distributions', 'called_capital']), outputField: 'tvpi', dependsOn: JSON.stringify(['RULE-008']), priority: 9, status: 'Active', category: 'Performance' }}),
    prisma.rule.create({ data: { ruleId: 'RULE-010', name: 'Investor Allocation', description: 'Allocate Net NAV pro-rata by commitment percentage', ruleType: 'Allocation', formula: 'Allocation_i = Net_NAV × (commitment_i ÷ total_commitment)', inputFields: JSON.stringify(['net_nav', 'investor_commitments', 'total_commitment']), outputField: 'investor_allocation', dependsOn: JSON.stringify(['RULE-008']), priority: 10, status: 'Active', category: 'Allocation' }}),
    prisma.rule.create({ data: { ruleId: 'RULE-011', name: 'Withholding Tax', description: 'Calculate withholding tax per investor domicile and treaty status', ruleType: 'Tax Computation', formula: 'WHT_i = allocation_i × withholding_rate(domicile_i, treaty_status_i)', inputFields: JSON.stringify(['investor_allocation', 'domicile', 'treaty_status', 'withholding_rates']), outputField: 'withholding_tax', dependsOn: JSON.stringify(['RULE-010']), priority: 11, status: 'Active', category: 'Tax' }}),
    prisma.rule.create({ data: { ruleId: 'RULE-012', name: 'Net Distribution', description: 'Net amount distributable to each investor after withholding', ruleType: 'Allocation', formula: 'Net_Dist_i = allocation_i - WHT_i', inputFields: JSON.stringify(['investor_allocation', 'withholding_tax']), outputField: 'net_distribution', dependsOn: JSON.stringify(['RULE-010', 'RULE-011']), priority: 12, status: 'Active', category: 'Distribution' }}),
  ]);
  console.log('Created 12 rules');

  // ═══════════════════════════════════════════════
  // RELATIONSHIPS (20)
  // ═══════════════════════════════════════════════
  await Promise.all([
    prisma.relationship.create({ data: { relationshipId: 'REL-001', sourceType: 'client', sourceId: clients[0].id, sourceName: 'Walker Asset Management', targetType: 'entity', targetId: entities[0].id, targetName: 'Walker Enterprise Management LLC', relationshipType: 'owns', status: 'Active', effectiveDate: new Date('2005-06-01') }}),
    prisma.relationship.create({ data: { relationshipId: 'REL-002', sourceType: 'entity', sourceId: entities[0].id, sourceName: 'Walker Enterprise Management LLC', targetType: 'entity', targetId: entities[1].id, targetName: 'Walker Enterprise Fund III LP', relationshipType: 'manages', status: 'Active', effectiveDate: new Date('2021-03-15') }}),
    prisma.relationship.create({ data: { relationshipId: 'REL-003', sourceType: 'entity', sourceId: entities[3].id, sourceName: 'Walker III Onshore Feeder LP', targetType: 'entity', targetId: entities[2].id, targetName: 'Walker Enterprise III Master Fund LP', relationshipType: 'feeds_into_master', status: 'Active', effectiveDate: new Date('2021-04-01') }}),
    prisma.relationship.create({ data: { relationshipId: 'REL-004', sourceType: 'entity', sourceId: entities[4].id, sourceName: 'Walker III Offshore Feeder Ltd', targetType: 'entity', targetId: entities[2].id, targetName: 'Walker Enterprise III Master Fund LP', relationshipType: 'feeds_into_master', status: 'Active', effectiveDate: new Date('2021-04-01') }}),
    prisma.relationship.create({ data: { relationshipId: 'REL-005', sourceType: 'entity', sourceId: entities[5].id, sourceName: 'Walker III Co-Invest Vehicle LP', targetType: 'entity', targetId: entities[1].id, targetName: 'Walker Enterprise Fund III LP', relationshipType: 'co_invests_with', status: 'Active', effectiveDate: new Date('2022-08-15') }}),
    prisma.relationship.create({ data: { relationshipId: 'REL-006', sourceType: 'entity', sourceId: entities[13].id, sourceName: 'Walker III GP LLC', targetType: 'entity', targetId: entities[1].id, targetName: 'Walker Enterprise Fund III LP', relationshipType: 'general_partner_of', status: 'Active', effectiveDate: new Date('2021-02-01') }}),
    prisma.relationship.create({ data: { relationshipId: 'REL-007', sourceType: 'entity', sourceId: entities[1].id, sourceName: 'Walker Enterprise Fund III LP', targetType: 'entity', targetId: entities[12].id, targetName: 'Walker Enterprise Fund I LP', relationshipType: 'successor_to', status: 'Active', effectiveDate: new Date('2021-03-15') }}),
    prisma.relationship.create({ data: { relationshipId: 'REL-008', sourceType: 'investor', sourceId: 'INV-001', sourceName: 'California Public Employees Retirement System', targetType: 'entity', targetId: entities[1].id, targetName: 'Walker Enterprise Fund III LP', relationshipType: 'invests_in', status: 'Active', effectiveDate: new Date('2021-04-15') }}),
    prisma.relationship.create({ data: { relationshipId: 'REL-009', sourceType: 'investor', sourceId: 'INV-002', sourceName: 'Abu Dhabi Investment Authority', targetType: 'entity', targetId: entities[1].id, targetName: 'Walker Enterprise Fund III LP', relationshipType: 'invests_in', status: 'Active', effectiveDate: new Date('2021-04-15') }}),
    prisma.relationship.create({ data: { relationshipId: 'REL-010', sourceType: 'investor', sourceId: 'INV-003', sourceName: 'Yale University Endowment', targetType: 'entity', targetId: entities[1].id, targetName: 'Walker Enterprise Fund III LP', relationshipType: 'invests_in', status: 'Active', effectiveDate: new Date('2021-05-01') }}),
    prisma.relationship.create({ data: { relationshipId: 'REL-011', sourceType: 'contact', sourceId: 'EXC-001', sourceName: 'Richard Thornton (PwC)', targetType: 'entity', targetId: entities[1].id, targetName: 'Walker Enterprise Fund III LP', relationshipType: 'audits', status: 'Active', effectiveDate: new Date('2021-06-01') }}),
    prisma.relationship.create({ data: { relationshipId: 'REL-012', sourceType: 'contact', sourceId: 'EXC-002', sourceName: 'Katherine Brooks (K&E)', targetType: 'entity', targetId: entities[1].id, targetName: 'Walker Enterprise Fund III LP', relationshipType: 'legal_counsel_for', status: 'Active', effectiveDate: new Date('2021-03-01') }}),
    prisma.relationship.create({ data: { relationshipId: 'REL-013', sourceType: 'contact', sourceId: 'EXC-003', sourceName: 'Patrick O\'Brien (SS&C)', targetType: 'entity', targetId: entities[1].id, targetName: 'Walker Enterprise Fund III LP', relationshipType: 'administers', status: 'Active', effectiveDate: new Date('2021-04-01') }}),
    prisma.relationship.create({ data: { relationshipId: 'REL-014', sourceType: 'contact', sourceId: 'EXC-004', sourceName: 'Margaret Chen (BNY Mellon)', targetType: 'entity', targetId: entities[7].id, targetName: 'Sullivan Global Alpha Fund', relationshipType: 'custodian_for', status: 'Active', effectiveDate: new Date('2018-01-15') }}),
    prisma.relationship.create({ data: { relationshipId: 'REL-015', sourceType: 'contact', sourceId: 'EXC-005', sourceName: 'Alexander Petrov (Goldman Sachs)', targetType: 'entity', targetId: entities[7].id, targetName: 'Sullivan Global Alpha Fund', relationshipType: 'prime_broker_for', status: 'Active', effectiveDate: new Date('2018-01-15') }}),
    prisma.relationship.create({ data: { relationshipId: 'REL-016', sourceType: 'client', sourceId: clients[1].id, sourceName: 'Campbell Capital Partners', targetType: 'entity', targetId: entities[6].id, targetName: 'Campbell Growth Fund IV LP', relationshipType: 'sponsors', status: 'Active', effectiveDate: new Date('2023-06-01') }}),
    prisma.relationship.create({ data: { relationshipId: 'REL-017', sourceType: 'investor', sourceId: 'INV-006', sourceName: 'GIC Private Limited', targetType: 'entity', targetId: entities[11].id, targetName: 'WFM Global Opportunities FoF', relationshipType: 'invests_in', status: 'Active', effectiveDate: new Date('2016-07-01') }}),
    prisma.relationship.create({ data: { relationshipId: 'REL-018', sourceType: 'investor', sourceId: 'INV-009', sourceName: 'Norges Bank Investment Management', targetType: 'entity', targetId: entities[11].id, targetName: 'WFM Global Opportunities FoF', relationshipType: 'invests_in', status: 'Active', effectiveDate: new Date('2017-01-15') }}),
    prisma.relationship.create({ data: { relationshipId: 'REL-019', sourceType: 'contact', sourceId: 'EXC-006', sourceName: 'Daniel Foster (Houlihan Lokey)', targetType: 'entity', targetId: entities[10].id, targetName: 'White Senior Credit Fund V', relationshipType: 'values', status: 'Active', effectiveDate: new Date('2020-10-01') }}),
    prisma.relationship.create({ data: { relationshipId: 'REL-020', sourceType: 'entity', sourceId: entities[11].id, sourceName: 'WFM Global Opportunities FoF', targetType: 'entity', targetId: entities[1].id, targetName: 'Walker Enterprise Fund III LP', relationshipType: 'invests_in', status: 'Active', effectiveDate: new Date('2021-06-15'), notes: 'FoF allocation to Walker III via co-investment commitment' }}),
  ]);
  console.log('Created 20 relationships');

  // ═══════════════════════════════════════════════
  // REPORTS — query-logic library
  // ═══════════════════════════════════════════════
  const allUsers = await prisma.internalUser.findMany();
  const owner = allUsers[0] ?? { id: 'unknown', firstName: 'System', lastName: 'Admin' };
  const ownerName = `${owner.firstName} ${owner.lastName}`;

  const reportSeed = [
    { code: 'RPT-001', name: 'Monthly NAV Package', department: 'Fund Accounting', category: 'NAV', frequency: 'Monthly', format: 'PDF + Excel', recipients: 'GP, LPs, Auditor', querySource: 'prisma', queryLogic: JSON.stringify({ model: 'entity', where: {}, select: ['entityId', 'name', 'navMm', 'commitmentMm', 'netIrrPct'] }), parametersSchema: JSON.stringify([{ name: 'entityId', type: 'string', required: false, default: '*' }, { name: 'period', type: 'month', required: true, default: '2026-03' }]), visibility: 'Org', minGrade: 'P3' },
    { code: 'RPT-002', name: 'Quarterly Capital Account Statement', department: 'Investor Services', category: 'Investor Services', frequency: 'Quarterly', format: 'PDF', recipients: 'All LPs', querySource: 'prisma', queryLogic: JSON.stringify({ model: 'investor', where: {}, select: ['investorId', 'name', 'commitmentMm', 'navMm', 'distributedMm'] }), parametersSchema: JSON.stringify([{ name: 'entityId', type: 'string', required: true }, { name: 'asOf', type: 'date', required: true, default: '2026-03-31' }]), visibility: 'Org', minGrade: 'P2' },
    { code: 'RPT-003', name: 'Annual K-1 Tax Package', department: 'Tax', category: 'Tax', frequency: 'Annually', format: 'PDF', recipients: 'US LPs', querySource: 'skill', queryLogic: JSON.stringify({ skill: 'k1-generation' }), parametersSchema: JSON.stringify([{ name: 'entityId', type: 'string', required: true }, { name: 'tax_year', type: 'number', required: true, default: 2025 }]), visibility: 'Team', minGrade: 'P3' },
    { code: 'RPT-004', name: 'Board Package', department: 'Investor Services', category: 'Reporting', frequency: 'Quarterly', format: 'PowerPoint', recipients: 'Board Members', querySource: 'composite', queryLogic: JSON.stringify({ sources: ['nav', 'attribution', 'compliance'] }), parametersSchema: JSON.stringify([{ name: 'entityId', type: 'string', required: true }, { name: 'quarter', type: 'string', required: true, options: ['Q1', 'Q2', 'Q3', 'Q4'] }]), visibility: 'Team', minGrade: 'M3' },
    { code: 'RPT-005', name: 'Compliance Dashboard', department: 'Compliance', category: 'Compliance', frequency: 'Monthly', format: 'Dashboard', recipients: 'CCO, Compliance Team', querySource: 'skill', queryLogic: JSON.stringify({ skill: 'compliance-check' }), parametersSchema: JSON.stringify([{ name: 'entityId', type: 'string', required: false, default: '*' }, { name: 'scope', type: 'string', options: ['full', 'incremental'], default: 'incremental' }]), visibility: 'Team', minGrade: 'P4' },
    { code: 'RPT-006', name: 'FATCA/CRS Report', department: 'Compliance', category: 'Regulatory', frequency: 'Annually', format: 'XML', recipients: 'Tax Authorities', querySource: 'sql', queryLogic: 'SELECT investorId, name, domicile, taxExempt FROM Investor WHERE status = "Active"', parametersSchema: JSON.stringify([{ name: 'tax_year', type: 'number', required: true }]), visibility: 'Private', minGrade: 'P4' },
    { code: 'RPT-007', name: 'Bank Reconciliation Report', department: 'Fund Accounting', category: 'Reconciliation', frequency: 'Monthly', format: 'Excel', recipients: 'Fund Accounting', querySource: 'prisma', queryLogic: JSON.stringify({ model: 'cashFlow', where: { status: 'Settled' } }), parametersSchema: JSON.stringify([{ name: 'accountName', type: 'string', required: true }, { name: 'period', type: 'month', required: true }]), visibility: 'Team', minGrade: 'P2' },
    { code: 'RPT-008', name: 'Management Fee Invoice', department: 'Billing', category: 'Fees', frequency: 'Quarterly', format: 'PDF', recipients: 'GP, Fund', querySource: 'skill', queryLogic: JSON.stringify({ skill: 'fee-reconciliation' }), parametersSchema: JSON.stringify([{ name: 'entityId', type: 'string', required: true }, { name: 'period_start', type: 'date', required: true }, { name: 'period_end', type: 'date', required: true }]), visibility: 'Team', minGrade: 'P3' },
    { code: 'RPT-009', name: 'Carried Interest Waterfall', department: 'Fund Accounting', category: 'Fees', frequency: 'Quarterly', format: 'Excel', recipients: 'GP', querySource: 'skill', queryLogic: JSON.stringify({ skill: 'waterfall-modeling' }), parametersSchema: JSON.stringify([{ name: 'entityId', type: 'string', required: true }, { name: 'distributable_amount_mm', type: 'number', required: true }, { name: 'scenario', type: 'string', options: ['actual', 'hypothetical'], default: 'actual' }]), visibility: 'Private', minGrade: 'P4' },
    { code: 'RPT-010', name: 'Portfolio Valuation Report', department: 'Fund Accounting', category: 'Portfolio', frequency: 'Monthly', format: 'PDF + Excel', recipients: 'GP, Board', querySource: 'prisma', queryLogic: JSON.stringify({ model: 'security', where: {}, select: ['securityId', 'name', 'marketValue', 'costBasis', 'unrealizedGain', 'sector'] }), parametersSchema: JSON.stringify([{ name: 'sector', type: 'string', required: false }, { name: 'asOf', type: 'date', required: true }]), visibility: 'Org', minGrade: 'P1' },
    { code: 'RPT-011', name: 'Cash Flow Forecast', department: 'Treasury', category: 'Treasury', frequency: 'Weekly', format: 'Excel', recipients: 'Treasury, CFO', querySource: 'prisma', queryLogic: JSON.stringify({ model: 'cashFlow', orderBy: { transactionDate: 'desc' } }), parametersSchema: JSON.stringify([{ name: 'horizon_days', type: 'number', default: 30 }]), visibility: 'Team', minGrade: 'P3' },
    { code: 'RPT-012', name: 'Investor Activity Report', department: 'Investor Services', category: 'Investor Services', frequency: 'Monthly', format: 'PDF', recipients: 'IR Team', querySource: 'prisma', queryLogic: JSON.stringify({ model: 'investor' }), parametersSchema: JSON.stringify([{ name: 'entityName', type: 'string', required: false }]), visibility: 'Team', minGrade: 'P1' },
    { code: 'RPT-013', name: 'AML/KYC Status Report', department: 'Compliance', category: 'Compliance', frequency: 'Quarterly', format: 'Dashboard', recipients: 'Compliance', querySource: 'sql', queryLogic: 'SELECT * FROM Investor WHERE status = "Active"', parametersSchema: JSON.stringify([]), visibility: 'Team', minGrade: 'P4' },
    { code: 'RPT-014', name: 'Trial Balance', department: 'Corp Accounting', category: 'Accounting', frequency: 'Monthly', format: 'Excel', recipients: 'Fund Accounting', querySource: 'sql', queryLogic: 'SELECT * FROM CashFlow ORDER BY transactionDate DESC', parametersSchema: JSON.stringify([{ name: 'period', type: 'month', required: true }]), visibility: 'Team', minGrade: 'P2' },
    { code: 'RPT-015', name: 'Side Letter Compliance Tracker', department: 'Legal', category: 'Legal', frequency: 'On-Demand', format: 'Excel', recipients: 'Legal, IR', querySource: 'skill', queryLogic: JSON.stringify({ skill: 'side-letter-mfn-scan' }), parametersSchema: JSON.stringify([{ name: 'entityId', type: 'string', required: true }]), visibility: 'Team', minGrade: 'P3' },
    { code: 'RPT-016', name: 'Performance Attribution Report', department: 'Fund Accounting', category: 'Portfolio', frequency: 'Quarterly', format: 'PDF + Excel', recipients: 'GP, Board, LPs', querySource: 'skill', queryLogic: JSON.stringify({ skill: 'performance-attribution' }), parametersSchema: JSON.stringify([{ name: 'entityId', type: 'string', required: true }, { name: 'period_start', type: 'date', required: true }, { name: 'period_end', type: 'date', required: true }, { name: 'dimensions', type: 'string', default: 'sector,holding' }]), visibility: 'Org', minGrade: 'P1' },
  ];

  const reports: { id: string; reportId: string }[] = [];
  for (let i = 0; i < reportSeed.length; i++) {
    const r = reportSeed[i];
    const ownerForReport = allUsers[i % allUsers.length] ?? owner;
    const created = await prisma.report.create({
      data: {
        reportId: r.code,
        name: r.name,
        description: `${r.name} — produced for ${r.recipients}.`,
        category: r.category,
        department: r.department,
        format: r.format,
        frequency: r.frequency,
        recipients: r.recipients,
        querySource: r.querySource,
        queryLogic: r.queryLogic,
        parametersSchema: r.parametersSchema,
        ownerId: ownerForReport.id,
        ownerName: `${ownerForReport.firstName} ${ownerForReport.lastName}`,
        visibility: r.visibility,
        minGrade: r.minGrade,
        status: 'Active',
        version: '1.0.0',
        lastRunAt: new Date('2026-03-31'),
        nextRunAt: r.frequency === 'On-Demand' ? null : new Date('2026-04-30'),
        runCount: Math.floor(Math.random() * 30) + 5,
        tags: [r.category, r.frequency].join(','),
      },
    });
    reports.push({ id: created.id, reportId: created.reportId });
  }
  console.log(`Created ${reports.length} reports`);

  // Seed a couple of report runs
  for (let i = 0; i < 8; i++) {
    const rep = reports[i % reports.length];
    const u = allUsers[(i + 1) % allUsers.length] ?? owner;
    await prisma.reportRun.create({
      data: {
        runId: `RUN-${String(i + 1).padStart(4, '0')}`,
        reportId: rep.id,
        triggeredById: u.id,
        triggeredBy: `${u.firstName} ${u.lastName}`,
        parameters: JSON.stringify({ entityId: 'WALKER-III', period: '2026-03' }),
        status: i === 7 ? 'Failed' : 'Success',
        rowCount: Math.floor(Math.random() * 500) + 10,
        durationMs: Math.floor(Math.random() * 4000) + 200,
        outputRef: i === 7 ? null : `/exports/${rep.reportId}-2026-03.pdf`,
        error: i === 7 ? 'Permission denied: requires role Compliance' : null,
        finishedAt: new Date(Date.now() - i * 3600_000),
      },
    });
  }
  console.log('Created 8 report runs');

  // ═══════════════════════════════════════════════
  // TIMESHEETS — one current week per active user
  // ═══════════════════════════════════════════════
  const today = new Date('2026-04-08');
  const day = today.getUTCDay();
  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() - ((day + 6) % 7));
  monday.setUTCHours(0, 0, 0, 0);

  const taskSamples = [
    { client: 'Walker Capital', entity: 'WALKER-III', project: 'Monthly Close — Mar 2026', taskCode: 'NAV-CALC', cat: 'Billable' },
    { client: 'Sullivan Asset Mgmt', entity: 'SULLIVAN-ALPHA', project: 'Q4 Fee True-Up', taskCode: 'FEE-REC', cat: 'Billable' },
    { client: 'Cruz Capital', entity: 'CRUZ-II', project: '2025 K-1 Prep', taskCode: 'K1-DRAFT', cat: 'Billable' },
    { client: null, entity: null, project: 'Internal — Training', taskCode: 'TRAIN', cat: 'Non-Billable' },
    { client: null, entity: null, project: 'PTO', taskCode: 'PTO', cat: 'PTO' },
  ];

  let tsCounter = 0;
  for (const u of allUsers.slice(0, 12)) {
    tsCounter++;
    const total = 36 + Math.random() * 8;
    const billable = Math.min(total, 28 + Math.random() * 10);
    const ts = await prisma.timesheet.create({
      data: {
        timesheetId: `TS-${String(tsCounter).padStart(4, '0')}`,
        userId: u.id,
        userName: `${u.firstName} ${u.lastName}`,
        weekStarting: monday,
        status: tsCounter <= 3 ? 'Approved' : tsCounter <= 8 ? 'Submitted' : 'Draft',
        totalHours: Number(total.toFixed(2)),
        billableHours: Number(billable.toFixed(2)),
        utilizationPct: Number(((billable / 40) * 100).toFixed(1)),
        submittedAt: tsCounter <= 8 ? new Date() : null,
        approvedAt: tsCounter <= 3 ? new Date() : null,
        approvedById: tsCounter <= 3 ? owner.id : null,
        approvedByName: tsCounter <= 3 ? ownerName : null,
      },
    });

    // 5 daily entries Mon-Fri
    for (let d = 0; d < 5; d++) {
      const date = new Date(monday);
      date.setUTCDate(monday.getUTCDate() + d);
      const sample = taskSamples[(d + tsCounter) % taskSamples.length];
      const hours = sample.cat === 'PTO' ? 8 : Number((6 + Math.random() * 3).toFixed(2));
      await prisma.timesheetEntry.create({
        data: {
          timesheetId: ts.id,
          date,
          clientName: sample.client,
          entityName: sample.entity,
          projectName: sample.project,
          taskCode: sample.taskCode,
          category: sample.cat,
          description: `${sample.project} — daily work`,
          hours,
          billable: sample.cat === 'Billable',
          billRate: sample.cat === 'Billable' ? 350 : null,
          approved: tsCounter <= 3,
        },
      });
    }
  }
  console.log(`Created ${tsCounter} timesheets with daily entries`);

  console.log('\n✅ Seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
