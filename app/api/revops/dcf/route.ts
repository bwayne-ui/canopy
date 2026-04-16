import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { toNum } from '@/lib/utils'

/**
 * GET  /api/revops/dcf
 * Returns a list of DCF submissions, newest first.
 * Supports ?opportunityId= and ?status= filters.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const opportunityId = searchParams.get('opportunityId')
  const status = searchParams.get('status')
  const accountId = searchParams.get('accountId')

  const where: Record<string, string> = {}
  if (opportunityId) where.opportunityId = opportunityId
  if (status) where.status = status
  if (accountId) where.accountId = accountId

  const records = await prisma.dcfSubmission.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    include: {
      entities: { orderBy: { sortOrder: 'asc' } },
      advisors: true,
      bankAccounts: true,
      integrations: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const items = records.map(formatSubmission)
  return NextResponse.json({ items })
}

/**
 * POST  /api/revops/dcf
 * Creates a new DCF submission shell (header + optional entities/advisors).
 *
 * Body shape (all optional except nothing required — creates a Draft):
 * {
 *   opportunityId?, opportunityName?, accountId?, accountName?,
 *   contactFirstName?, contactLastName?, contactEmail?, contactTitle?,
 *   advisors?: [{ advisorType, firstName?, lastName?, firmName?, email?, details? }],
 *   entities?: [{ entityName, jurisdiction?, vintageYear?, ... }],
 *   bankAccounts?: [{ bankName, details? }],
 *   integrations?: [{ applicationName, details? }],
 * }
 */
export async function POST(request: Request) {
  const body = await request.json()

  const {
    opportunityId,
    opportunityName,
    accountId,
    accountName,
    contactFirstName,
    contactLastName,
    contactEmail,
    contactTitle,
    financeOutsourced,
    financeOutsourcedNotes,
    prevAdminExperience,
    prevAdminExperienceNotes,
    adminTechCompany,
    adminTechProduct,
    adminTechDetails,
    preferredLanguage,
    preferredDateFormat,
    autoTimezone,
    internalNotes,
    advisors = [],
    entities = [],
    bankAccounts = [],
    integrations = [],
  } = body

  const dcfId = `DCF-${Date.now()}`

  const submission = await prisma.dcfSubmission.create({
    data: {
      dcfId,
      opportunityId,
      opportunityName,
      accountId,
      accountName,
      contactFirstName,
      contactLastName,
      contactEmail,
      contactTitle,
      financeOutsourced: financeOutsourced ?? false,
      financeOutsourcedNotes,
      prevAdminExperience: prevAdminExperience ?? false,
      prevAdminExperienceNotes,
      adminTechCompany,
      adminTechProduct,
      adminTechDetails,
      preferredLanguage: preferredLanguage ?? 'English',
      preferredDateFormat: preferredDateFormat ?? 'MM-DD-YYYY',
      autoTimezone: autoTimezone ?? true,
      internalNotes,
      advisors: {
        create: advisors.map((a: Record<string, unknown>) => ({
          advisorType: a.advisorType as string,
          firstName: a.firstName as string | undefined,
          lastName: a.lastName as string | undefined,
          firmName: a.firmName as string | undefined,
          email: a.email as string | undefined,
          details: a.details as string | undefined,
        })),
      },
      entities: {
        create: (entities as Record<string, unknown>[]).map((e, i) => ({
          entityName: e.entityName as string,
          entityId: e.entityId as string | undefined,
          sortOrder: i,
          // Fund Info
          jurisdiction: e.jurisdiction as string | undefined,
          vintageYear: e.vintageYear as number | undefined,
          entityType: e.entityType as string | undefined,
          firstCapitalCallDate: e.firstCapitalCallDate ? new Date(e.firstCapitalCallDate as string) : undefined,
          expectedLaunchDate: e.expectedLaunchDate ? new Date(e.expectedLaunchDate as string) : undefined,
          gpLegalName: e.gpLegalName as string | undefined,
          gpSupportNeeded: (e.gpSupportNeeded as boolean) ?? false,
          lineOfCredit: (e.lineOfCredit as boolean) ?? false,
          fundLevelLeverage: (e.fundLevelLeverage as boolean) ?? false,
          futureRaising: e.futureRaising as string | undefined,
          // Fund Size
          currentCommittedCapitalMm: e.currentCommittedCapitalMm as number | undefined,
          targetCommittedCapitalMm: e.targetCommittedCapitalMm as number | undefined,
          twelveMonthTargetMm: e.twelveMonthTargetMm as number | undefined,
          currentCalledCapitalMm: e.currentCalledCapitalMm as number | undefined,
          expectedFirstCallDate: e.expectedFirstCallDate ? new Date(e.expectedFirstCallDate as string) : undefined,
          // Investor Info
          currentInvestorCount: e.currentInvestorCount as number | undefined,
          targetInvestorCount: e.targetInvestorCount as number | undefined,
          nonUsInvestorCount: e.nonUsInvestorCount as number | undefined,
          subscriptionDocsReceived: e.subscriptionDocsReceived as number | undefined,
          redemptionFrequency: e.redemptionFrequency as string | undefined,
          sideLetterFeeClasses: e.sideLetterFeeClasses as number | undefined,
          digitalSubscriptionConcerns: (e.digitalSubscriptionConcerns as boolean) ?? false,
          // Investment Info
          currentInvestmentCount: e.currentInvestmentCount as number | undefined,
          expectedTotalInvestments: e.expectedTotalInvestments as number | undefined,
          expectedDebtInvestments: e.expectedDebtInvestments as number | undefined,
          ventureStage: e.ventureStage as string | undefined,
          fofMethodology: e.fofMethodology as string | undefined,
          realEstateAcctMethod: e.realEstateAcctMethod as string | undefined,
          debtLoanOrigination: e.debtLoanOrigination as string | undefined,
          debtAmortizationMethod: e.debtAmortizationMethod as string | undefined,
          avgLoanSizeMm: e.avgLoanSizeMm as number | undefined,
          drawdownPct: e.drawdownPct as number | undefined,
          investmentAdditionalContext: e.investmentAdditionalContext as string | undefined,
          // Allocation
          proRataStructure: (e.proRataStructure as boolean) ?? true,
          managementFeeCalc: e.managementFeeCalc as string | undefined,
          managementFeeWaiver: (e.managementFeeWaiver as boolean) ?? false,
          waterfallType: e.waterfallType as string | undefined,
          // Capital Activity
          annualCallsDistributions: e.annualCallsDistributions as number | undefined,
          monthlyWires: e.monthlyWires as number | undefined,
          monthlyAch: e.monthlyAch as number | undefined,
          processFundInvoices: (e.processFundInvoices as boolean) ?? false,
          initiateAcquisitionFunding: (e.initiateAcquisitionFunding as boolean) ?? false,
          // Reporting
          firstReportingQuarter: e.firstReportingQuarter as string | undefined,
          reportingCurrency: (e.reportingCurrency as string) ?? 'USD',
          accountingStandard: e.accountingStandard as string | undefined,
          reportingFrequency: e.reportingFrequency as string | undefined,
          valuationDeliveryFrequency: e.valuationDeliveryFrequency as string | undefined,
          reportingDeadlineDays: e.reportingDeadlineDays as number | undefined,
          quarterlyFootnotes: (e.quarterlyFootnotes as boolean) ?? false,
          auditLiaisonSupport: (e.auditLiaisonSupport as boolean) ?? false,
          regulatoryReportingSupport: e.regulatoryReportingSupport as string | undefined,
          // Other Services
          support1099: (e.support1099 as boolean) ?? false,
          investorWatchlistScreenings: (e.investorWatchlistScreenings as boolean) ?? false,
          // GP Entities
          customizedReportingRequired: (e.customizedReportingRequired as boolean) ?? false,
          // Data Migration
          migrationApproach: e.migrationApproach as string | undefined,
          currentDataStorage: e.currentDataStorage as string | undefined,
          migrateHistoricalDocs: (e.migrateHistoricalDocs as boolean) ?? false,
          investorDataAvailable: (e.investorDataAvailable as boolean) ?? false,
        })),
      },
      bankAccounts: {
        create: (bankAccounts as Record<string, unknown>[]).map((b) => ({
          bankName: b.bankName as string,
          details: b.details as string | undefined,
        })),
      },
      integrations: {
        create: (integrations as Record<string, unknown>[]).map((i) => ({
          applicationName: i.applicationName as string,
          details: i.details as string | undefined,
        })),
      },
    },
    include: {
      entities: { orderBy: { sortOrder: 'asc' } },
      advisors: true,
      bankAccounts: true,
      integrations: true,
    },
  })

  return NextResponse.json(formatSubmission(submission), { status: 201 })
}

type FullSubmission = Awaited<ReturnType<typeof prisma.dcfSubmission.findFirstOrThrow>> & {
  entities: Awaited<ReturnType<typeof prisma.dcfEntity.findMany>>;
  advisors: Awaited<ReturnType<typeof prisma.dcfAdvisor.findMany>>;
  bankAccounts: Awaited<ReturnType<typeof prisma.dcfBankAccount.findMany>>;
  integrations: Awaited<ReturnType<typeof prisma.dcfIntegration.findMany>>;
}

function formatSubmission(s: FullSubmission) {
  return {
    ...s,
    entities: s.entities.map((e) => ({
      ...e,
      currentCommittedCapitalMm: toNum(e.currentCommittedCapitalMm),
      targetCommittedCapitalMm: toNum(e.targetCommittedCapitalMm),
      twelveMonthTargetMm: toNum(e.twelveMonthTargetMm),
      currentCalledCapitalMm: toNum(e.currentCalledCapitalMm),
      avgLoanSizeMm: toNum(e.avgLoanSizeMm),
      drawdownPct: toNum(e.drawdownPct),
    })),
  }
}
