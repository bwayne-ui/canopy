/**
 * Dev-only seed route for Waterfall Engine demo data.
 * POST /api/toolbox/waterfall/seed
 */
import { NextResponse } from 'next/server';
import { prisma as db } from '@/lib/db';

export const runtime = 'nodejs';

const FUNDS = [
  {
    name: 'Walker Capital Fund III',
    shortName: 'WCF-III',
    strategy: 'Buyout',
    waterfallType: 'european',
    status: 'active',
    vintage: 2021,
    totalCommitment: 850_000_000,
    totalNav: 920_000_000,
    totalDistributed: 110_000_000,
    totalUnrealized: 810_000_000,
    exceptionCount: 2,
    validationStatus: 'warning',
    complexityScore: 72,
    terms: { hurdleRate: 0.08, carryPct: 0.20, catchupType: 'full', mgmtFeeRate: 0.02, mgmtFeeBasis: 'committed', fundLife: 10, investmentPeriod: 5, preferredReturn: 0.08 },
    steps: [
      { stepOrder: 1, stepName: 'Return of Capital', lpSplit: 1.0, gpSplit: 0.0, description: 'Return LP capital contributions' },
      { stepOrder: 2, stepName: 'Preferred Return (8%)', lpSplit: 1.0, gpSplit: 0.0, description: 'Compound 8% preferred return on contributed capital' },
      { stepOrder: 3, stepName: 'GP Catch-Up', lpSplit: 0.0, gpSplit: 1.0, description: 'GP catches up to 20% of preferred return' },
      { stepOrder: 4, stepName: 'Carried Interest Split', lpSplit: 0.80, gpSplit: 0.20, description: '80/20 split of remaining distributions' },
    ],
    investors: [
      { investorName: 'Stanford Endowment', investorType: 'endowment', investorClass: 'A', commitment: 150_000_000, contributed: 120_000_000, distributed: 20_000_000, nav: 140_000_000 },
      { investorName: 'CalPERS', investorType: 'pension', investorClass: 'A', commitment: 200_000_000, contributed: 160_000_000, distributed: 25_000_000, nav: 185_000_000 },
      { investorName: 'Blackstone Credit', investorType: 'institutional', investorClass: 'B', commitment: 100_000_000, contributed: 80_000_000, distributed: 15_000_000, nav: 90_000_000 },
      { investorName: 'CPPIB', investorType: 'pension', investorClass: 'A', commitment: 250_000_000, contributed: 200_000_000, distributed: 30_000_000, nav: 240_000_000 },
      { investorName: 'Rockefeller Family Office', investorType: 'family_office', investorClass: 'B', commitment: 50_000_000, contributed: 40_000_000, distributed: 8_000_000, nav: 45_000_000 },
      { investorName: 'Harvard Management', investorType: 'endowment', investorClass: 'A', commitment: 100_000_000, contributed: 80_000_000, distributed: 12_000_000, nav: 220_000_000 },
    ],
    exceptions: [
      { exceptionType: 'side_letter_not_applied', severity: 'critical', title: 'CPPIB Side Letter Carry Override Not Applied', description: 'CPPIB negotiated a 15% carry rate in side letter executed 2022-03-15. The current waterfall calculation uses the default 20% carry rate, resulting in an overcharge of approximately $4.2M. This affects the Q4 2025 distribution calculation.', impactAmount: 4_200_000, recommendedFix: 'Update FundInvestor.overrideCarryPct to 0.15 for CPPIB and regenerate the distribution calculation for Q4 2025.', confidence: 0.96, status: 'open' },
      { exceptionType: 'missing_equalization', severity: 'high', title: 'Rockefeller Family Office Equalization Shortfall', description: 'Rockefeller Family Office joined in the Q2 2022 closing. Equalization interest of $2.1M should have been applied but was not recorded in the system. This causes an allocation discrepancy versus Class A investors.', impactAmount: 2_100_000, recommendedFix: 'Book equalization entry of $2.1M for Rockefeller Family Office. Update hasEqualization flag and equalizationAmt field.', confidence: 0.89, status: 'open' },
    ],
  },
  {
    name: 'Campbell Capital Growth Fund II',
    shortName: 'CCG-II',
    strategy: 'Growth Equity',
    waterfallType: 'american',
    status: 'active',
    vintage: 2020,
    totalCommitment: 500_000_000,
    totalNav: 610_000_000,
    totalDistributed: 85_000_000,
    totalUnrealized: 525_000_000,
    exceptionCount: 1,
    validationStatus: 'ok',
    complexityScore: 48,
    terms: { hurdleRate: 0.07, carryPct: 0.20, catchupType: 'partial', mgmtFeeRate: 0.0175, mgmtFeeBasis: 'invested', fundLife: 10, investmentPeriod: 5, preferredReturn: 0.07 },
    steps: [
      { stepOrder: 1, stepName: 'Return of Capital', lpSplit: 1.0, gpSplit: 0.0, description: 'Return LP capital contributions' },
      { stepOrder: 2, stepName: 'Preferred Return (7%)', lpSplit: 1.0, gpSplit: 0.0, description: '7% preferred return on contributed capital' },
      { stepOrder: 3, stepName: 'Carried Interest', lpSplit: 0.80, gpSplit: 0.20, description: '80/20 split — no full catch-up' },
    ],
    investors: [
      { investorName: 'Ontario Teachers', investorType: 'pension', investorClass: 'A', commitment: 100_000_000, contributed: 90_000_000, distributed: 20_000_000, nav: 115_000_000 },
      { investorName: 'Andreessen Horowitz', investorType: 'institutional', investorClass: 'A', commitment: 75_000_000, contributed: 68_000_000, distributed: 12_000_000, nav: 88_000_000 },
      { investorName: 'Yale Endowment', investorType: 'endowment', investorClass: 'A', commitment: 150_000_000, contributed: 135_000_000, distributed: 30_000_000, nav: 190_000_000 },
      { investorName: 'Pacific Investment Group', investorType: 'institutional', investorClass: 'B', commitment: 80_000_000, contributed: 72_000_000, distributed: 14_000_000, nav: 94_000_000 },
      { investorName: 'Morgan Creek Capital', investorType: 'fund_of_funds', investorClass: 'A', commitment: 95_000_000, contributed: 85_000_000, distributed: 9_000_000, nav: 123_000_000 },
    ],
    exceptions: [
      { exceptionType: 'fee_calculation_discrepancy', severity: 'medium', title: 'Management Fee Basis Discrepancy — Q3 2025', description: 'Management fees for Q3 2025 were calculated on committed capital ($500M) rather than invested capital. LPA specifies fees should be calculated on invested capital after the investment period end date (2025-01-01). Overcharge of approximately $875K.', impactAmount: 875_000, recommendedFix: 'Reverse Q3 2025 management fee entries and rebook on invested capital basis ($395M invested as of Q3 2025 start).', confidence: 0.94, status: 'open' },
    ],
  },
  {
    name: 'Sullivan Infrastructure Fund I',
    shortName: 'SIF-I',
    strategy: 'Infrastructure',
    waterfallType: 'european',
    status: 'harvesting',
    vintage: 2017,
    totalCommitment: 350_000_000,
    totalNav: 180_000_000,
    totalDistributed: 420_000_000,
    totalUnrealized: 180_000_000,
    exceptionCount: 0,
    validationStatus: 'ok',
    complexityScore: 35,
    terms: { hurdleRate: 0.09, carryPct: 0.15, catchupType: 'none', mgmtFeeRate: 0.015, mgmtFeeBasis: 'committed', fundLife: 12, investmentPeriod: 5, preferredReturn: 0.09 },
    steps: [
      { stepOrder: 1, stepName: 'Return of Capital', lpSplit: 1.0, gpSplit: 0.0, description: 'Return LP capital contributions' },
      { stepOrder: 2, stepName: 'Preferred Return (9%)', lpSplit: 1.0, gpSplit: 0.0, description: '9% compound preferred return' },
      { stepOrder: 3, stepName: 'Carried Interest (15%)', lpSplit: 0.85, gpSplit: 0.15, description: '85/15 split — no catch-up' },
    ],
    investors: [
      { investorName: 'GIC Singapore', investorType: 'sovereign_wealth', investorClass: 'A', commitment: 80_000_000, contributed: 80_000_000, distributed: 100_000_000, nav: 42_000_000 },
      { investorName: 'Dutch Pension APG', investorType: 'pension', investorClass: 'A', commitment: 120_000_000, contributed: 120_000_000, distributed: 150_000_000, nav: 63_000_000 },
      { investorName: 'Vanguard Infrastructure', investorType: 'institutional', investorClass: 'B', commitment: 70_000_000, contributed: 70_000_000, distributed: 85_000_000, nav: 37_000_000 },
      { investorName: 'Brookfield Secondaries', investorType: 'institutional', investorClass: 'B', commitment: 80_000_000, contributed: 80_000_000, distributed: 85_000_000, nav: 38_000_000 },
    ],
    exceptions: [],
  },
];

export async function POST() {
  // Clear existing waterfall data
  await db.wfDiuBatchLine.deleteMany();
  await db.wfDiuBatch.deleteMany();
  await db.wfRecommendedAction.deleteMany();
  await db.wfException.deleteMany();
  await db.wfFundInvestor.deleteMany();
  await db.wfNavSnapshot.deleteMany();
  await db.wfWaterfallStep.deleteMany();
  await db.wfFundTerm.deleteMany();
  await db.wfFund.deleteMany();
  await db.wfAuditLog.deleteMany();

  const createdFunds: string[] = [];
  const createdExceptions: string[] = [];

  for (const f of FUNDS) {
    const { terms, steps, investors, exceptions, ...fundData } = f;
    const fund = await db.wfFund.create({
      data: {
        ...fundData,
        terms: { create: terms },
        waterfallSteps: { create: steps },
        investors: {
          create: investors.map((inv) => ({
            ...inv,
            closingDate: new Date(`${fundData.vintage}-03-15`),
          })),
        },
        navSnapshots: {
          create: [
            { snapshotDate: new Date('2025-09-30'), totalNav: fundData.totalNav * 0.92, unrealized: fundData.totalUnrealized * 0.9 },
            { snapshotDate: new Date('2025-12-31'), totalNav: fundData.totalNav, unrealized: fundData.totalUnrealized },
          ],
        },
      },
    });
    createdFunds.push(fund.id);

    for (const exc of exceptions) {
      const created = await db.wfException.create({ data: { ...exc, fundId: fund.id } });
      createdExceptions.push(created.id);
    }
  }

  await db.wfAuditLog.createMany({
    data: [
      { entityType: 'fund', entityId: createdFunds[0], action: 'validated', note: 'WCF-III waterfall validation completed — 2 exceptions detected', createdAt: new Date(Date.now() - 1000 * 60 * 30) },
      { entityType: 'fund', entityId: createdFunds[1], action: 'validated', note: 'CCG-II fee calculation discrepancy flagged', createdAt: new Date(Date.now() - 1000 * 60 * 120) },
      { entityType: 'fund', entityId: createdFunds[2], action: 'refreshed', note: 'SIF-I distribution model refreshed — no exceptions', createdAt: new Date(Date.now() - 1000 * 60 * 240) },
    ],
  });

  return NextResponse.json({ seeded: true, funds: createdFunds.length, exceptions: createdExceptions.length });
}
