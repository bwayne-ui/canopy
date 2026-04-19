import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { deriveSeniorityFromTitle, deriveModuleAccess } from '../lib/permissions';
import { seedRevOps } from './seed-revops';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// CSV parsing helpers
// ---------------------------------------------------------------------------

function parseCSV(filePath: string): Record<string, string>[] {
  let raw = readFileSync(resolve(filePath), 'utf-8');
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCSVRow(lines[0]);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVRow(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h.trim()] = (vals[idx] ?? '').trim(); });
    rows.push(row);
  }
  return rows;
}

function parseCSVRow(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { fields.push(current); current = ''; }
      else { current += ch; }
    }
  }
  fields.push(current);
  return fields;
}

function parseName(nameStr: string): { first: string; last: string } {
  const parts = nameStr.split(',').map((s) => s.trim());
  if (parts.length >= 2) return { first: parts[1], last: parts[0] };
  const words = nameStr.trim().split(/\s+/);
  return { first: words[0] ?? '', last: (words.slice(1).join(' ') || words[0]) ?? '' };
}

function makeEmail(first: string, last: string, seen: Map<string, number>): string {
  const f = first.toLowerCase().replace(/[^a-z]/g, '');
  const l = last.toLowerCase().replace(/[^a-z]/g, '');
  // JSQ convention: first initial + last name (e.g. bwayne@junipersquare.com)
  const base = `${f.charAt(0)}${l}`;
  const count = seen.get(base) ?? 0;
  seen.set(base, count + 1);
  return count > 0 ? `${base}${count}@junipersquare.com` : `${base}@junipersquare.com`;
}

function seedDeriveRole(title: string): string {
  const t = title.toLowerCase();
  if (/\b(ceo|cto|cfo|coo|cdo|cpo)\b/.test(t)) return t.match(/\b(ceo|cto|cfo|coo|cdo|cpo)\b/)![0].toUpperCase();
  if (/\bsvp\b/.test(t)) return 'SVP';
  if (/\bgeneral manager\b/.test(t) || /\bmanaging director\b/.test(t)) return 'GM';
  if (/\bvp[, ]|vice president\b/.test(t)) return 'VP';
  if (/\bsenior director\b/.test(t)) return 'Senior Director';
  if (/\bdirector\b/.test(t)) return 'Director';
  if (/\bsenior manager\b/.test(t)) return 'Senior Manager';
  if (/\bmanager\b/.test(t)) return 'Manager';
  if (/\blead\b/.test(t) || /\bstaff\b/.test(t) || /\bprincipal\b/.test(t)) return 'Lead';
  if (/\bsenior\b/.test(t)) return 'Senior';
  if (/\bassociate\b/.test(t)) return 'Associate';
  if (/\banalyst\b/.test(t)) return 'Analyst';
  if (/\bspecialist\b/.test(t)) return 'Specialist';
  if (/\bcoordinator\b/.test(t)) return 'Coordinator';
  if (/\bintern\b/.test(t)) return 'Intern';
  return 'Individual Contributor';
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickWeighted<T>(items: { value: T; weight: number }[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item.value;
  }
  return items[items.length - 1].value;
}

function romanNumeral(n: number): string {
  const map: [number, string][] = [[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
  let out = '';
  for (const [v, sym] of map) {
    while (n >= v) { out += sym; n -= v; }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Per-client website + notes lookups (ensures every GP has full profile data)
// ---------------------------------------------------------------------------

const CLIENT_WEBSITES: Record<string, string> = {
  'Walker Asset Management': 'https://walkerasset.com',
  'Campbell Capital Partners': 'https://campbellcp.com',
  'Sullivan Investments': 'https://sullivaninvestments.com',
  'Cruz Capital Management': 'https://cruzcap.com',
  'Lopez Asset Partners': 'https://lopezassetpartners.co.uk',
  'White Advisors': 'https://whiteadvisors.com',
  'White Fund Management': 'https://wfm.nl',
  'Rodriguez Capital Management': 'https://rodriguezcap.ch',
  'Mitchell Capital': 'https://mitchellcap.com',
  'Cohen Private Equity': 'https://cohenpe.com',
  'Bennett Ventures': 'https://bennettvc.com',
  'Harper Growth Partners': 'https://harpergrowth.com',
  'Patel Infrastructure Partners': 'https://patelinfra.co.uk',
  'Nguyen Credit Partners': 'https://nguyencredit.sg',
  'Okafor Venture Capital': 'https://okaforvc.ng',
  'Andersen Real Estate Group': 'https://andersenre.dk',
  'Romano Capital': 'https://romanocap.it',
  'Schultz Fund Partners': 'https://schultzfp.de',
  'Kim Strategic Partners': 'https://kimstrategic.kr',
  'Delgado Private Credit': 'https://delgadocredit.mx',
  'Thompson Growth Equity': 'https://thompsongrowth.ca',
  'Reeves Infrastructure Partners': 'https://reevesinfra.com.au',
  'Barrett Capital Management': 'https://barrettcm.com',
  'Castellanos Real Assets': 'https://castellanosra.es',
  'Park Venture Partners': 'https://parkvc.com',
  'Yamamoto Asset Management': 'https://yamamotoam.jp',
  'Abramson Credit Partners': 'https://abramsoncredit.com',
  'Ferreira Capital': 'https://ferreiracap.com.br',
  'Ito Private Equity': 'https://itope.hk',
  'Chen Growth Fund': 'https://chengrowth.cn',
  'Weiss Hedge Fund': 'https://weisshf.co.il',
  'Osei Private Equity': 'https://oseipe.com.gh',
  'Hartman Real Estate': 'https://hartmanre.com',
  'McBride Asset Management': 'https://mcbrideam.com',
  'Bauer Capital Partners': 'https://bauercap.at',
  'Ishikawa Private Equity': 'https://ishikawape.jp',
  'Navarro Venture Capital': 'https://navarrovc.com.ar',
  'Desai Credit': 'https://desaicredit.in',
};

const CLIENT_NOTES: Record<string, string> = {
  'Walker Asset Management': 'Top-quartile PE shop; 2015 flagship returned 22% net IRR. Complex waterfall — multi-tier European with deal-by-deal crystallization on two funds.',
  'Campbell Capital Partners': 'Emerging-manager pedigree (spun from Apollo 2012). Fund IV hit target in 6 months. Heavy co-invest activity.',
  'Sullivan Investments': 'Long-tenured hedge fund; multi-PM platform. Daily NAV required across all mandates. Side pockets on two feeders.',
  'Cruz Capital Management': 'West Coast tech-focused growth equity. 25% carry is structure is aggressive but LP base accepted on track record.',
  'Lopez Asset Partners': 'UK/EU core-plus RE. Leveraged vehicles with quarterly appraisals. AIFMD-regulated across all funds.',
  'White Advisors': 'Private credit specialist; direct lending + distressed. Form PF required on all funds >$150M.',
  'White Fund Management': 'Multi-strategy FoF based in Amsterdam; secondary market activity accounts for 30% of AUM.',
  'Rodriguez Capital Management': 'Emerging-manager FoF launched 2020. Still in migration; 3 mandates contracted to date, rest in discovery.',
  'Mitchell Capital': 'Lower-middle-market buyout sponsor; partner group spun from Sun Capital. Seeking new admin due to legacy Excel-based process.',
  'Cohen Private Equity': 'Healthcare specialist; Fund III raising $2B. ILPA template mandate.',
  'Bennett Ventures': 'Early-stage VC; heavy SAFE note activity. Looking for portfolio tracking + cap table support.',
  'Harper Growth Partners': 'Late-stage growth; vintage 2014 had 3 unicorn exits. Sophisticated side-letter workflow required.',
  'Patel Infrastructure Partners': 'Renewables-focused infra. Fund IV $6B target. Complex sub-facility structure on Luxembourg parallel fund.',
  'Nguyen Credit Partners': 'APAC direct lending; covenant-lite heavy portfolio. Multi-currency (SGD/USD/HKD) reporting.',
  'Okafor Venture Capital': 'Pan-African fintech VC. Needs USD ledger reporting for DFI LPs while local books in NGN.',
  'Andersen Real Estate Group': 'Nordic logistics & residential; ESG-forward. SFDR Article 8 disclosures on all funds.',
  'Romano Capital': 'Italian middle-market buyout; family-office heavy LP base. Multi-jurisdictional tax planning required.',
  'Schultz Fund Partners': 'German FoF; institutional pension focus. LP advisory board very active — quarterly deep-dive reports.',
  'Kim Strategic Partners': 'Korean buyout; carve-out strategy. Won best deal of 2023 award for LG Chem battery carve-out.',
  'Delgado Private Credit': 'LatAm direct lending; peso-denominated with USD hedge. FX reporting overlay adds complexity.',
  'Thompson Growth Equity': 'Canadian growth; Toronto + Vancouver offices. Crown corp mandate influences governance.',
  'Reeves Infrastructure Partners': 'Australian infrastructure with Asia-Pacific reach. Long-duration assets; 12-year fund life.',
  'Barrett Capital Management': 'Multi-strat + macro hedge fund. High-water-mark tracking across 4 share classes.',
  'Castellanos Real Assets': 'Iberian logistics RE. Portfolio-level debt at holdco; complex waterfall at property level.',
  'Park Venture Partners': 'AI-focused seed/Series A. Fast-moving; portfolio company additions every 2-3 weeks.',
  'Yamamoto Asset Management': 'Flagship Japanese PE; corporate carve-out specialist. Mix of yen and USD funds.',
  'Abramson Credit Partners': 'Distressed + special situations. Workout activity heavy; debt restructuring expertise a must.',
  'Ferreira Capital': 'Brazilian consumer-focused PE. Real-denominated with USD reporting. Historical FX volatility a factor.',
  'Ito Private Equity': 'Asia growth; HK base with Singapore arm. Pan-regional SPV structures.',
  'Chen Growth Fund': 'China growth equity; consumer + internet. Renminbi and offshore USD dual structure.',
  'Weiss Hedge Fund': 'Quantitative Israeli fund; Tel Aviv base. Daily reporting; systematic strategies.',
  'Osei Private Equity': 'West Africa focused; GP spun from SEAF in 2019. Emerging-manager network active.',
  'Hartman Real Estate': 'US residential + core-plus; distributed property management across 9 states.',
  'McBride Asset Management': 'Churned in 2025 — acquired by SS&C; all mandates transferred over 6 months.',
  'Bauer Capital Partners': 'Brought fund admin in-house after 8-year relationship; legacy data handed off cleanly.',
  'Ishikawa Private Equity': 'Moved to a regional admin offering 40% price discount; transition was rocky.',
  'Navarro Venture Capital': 'Fund wind-down — LatAm LP base exited region after peso volatility.',
  'Desai Credit': 'Left for India-specialized admin citing service quality concerns; renewal discussions ongoing.',
};

// ---------------------------------------------------------------------------
// GP enrichment — produces v2 expansion fields derived from status + AUM
// ---------------------------------------------------------------------------

function gpEnrichment(c: { name: string; status: string; aumMm?: number | null; strategyMix?: string | null; primaryStrategy?: string; website?: string | null; notes?: string | null }): Record<string, any> {
  const isActive = c.status === 'Active';
  const isProspect = c.status === 'Prospect';
  const isChurned = c.status === 'Churned';
  const isOnboarding = c.status === 'Onboarding';
  const aum = c.aumMm ?? 0;
  const isLarge = aum >= 5000;
  const isMid = aum >= 1000 && aum < 5000;

  // Skew values per status
  return {
    // ── IR & FUNDRAISING ──
    activeFundraise: isChurned ? false : Math.random() < 0.55,
    currentFundTargetMm: isChurned ? null : Math.round(aum * 0.15 + randomInt(100, 500)),
    currentFundRaisedMm: isChurned ? null : Math.round(aum * 0.15 * (isProspect ? 0.2 : 0.75)),
    currentFundCloseDate: isChurned ? null : randomDate(new Date('2026-06-01'), new Date('2027-09-30')),
    fundraisingCycle: pick(['Continuous', 'Cyclical 3yr', 'Cyclical 5yr']),
    placementAgent: pick(['Park Hill', 'Lazard', 'Monument Group', 'Credit Suisse PFG', 'Evercore PCA', null, null]),
    subscriptionDocsVersion: isProspect ? 'v3.1-draft' : 'v4.2-current',
    avgLpCommitmentMm: isProspect ? null : Math.round(aum / Math.max(randomInt(20, 80), 1)),
    lpCount: isProspect ? randomInt(10, 30) : isChurned ? randomInt(20, 60) : randomInt(40, 180),
    institutionalLpPct: randomInt(55, 92),

    // ── PORTFOLIO ANALYTICS ──
    grossIrrAggregatePct: isProspect ? randomInt(14, 24) : randomInt(11, 22),
    netIrrAggregatePct: isProspect ? randomInt(10, 19) : randomInt(8, 17),
    tvpiAggregate: Number((1.3 + Math.random() * 1.2).toFixed(2)),
    dpiAggregate: Number((0.3 + Math.random() * 1.1).toFixed(2)),
    moicAggregate: Number((1.4 + Math.random() * 1.3).toFixed(2)),
    realizedPctOfCapital: isProspect ? randomInt(5, 25) : randomInt(20, 70),
    writeoffCount: isProspect ? 0 : randomInt(0, 6),
    impairmentCount: isProspect ? 0 : randomInt(0, 4),
    topQuartilePerformer: Math.random() < (isLarge ? 0.6 : 0.35),
    benchmarkPercentile: randomInt(25, 95),

    // ── LP BASE ──
    lpBaseDiversity: isLarge ? 'Highly Diversified' : isMid ? 'Diversified' : 'Concentrated',
    top3LpConcentrationPct: isLarge ? randomInt(8, 22) : randomInt(20, 55),
    pensionLpPct: randomInt(15, 45),
    endowmentLpPct: randomInt(8, 25),
    sovereignWealthLpPct: randomInt(0, 20),
    insuranceLpPct: randomInt(5, 18),
    familyOfficeLpPct: randomInt(5, 22),
    fofLpPct: randomInt(3, 15),
    individualHnwLpPct: randomInt(0, 12),
    reupRatePct: isChurned ? 0 : randomInt(45, 92),

    // ── RISK SCORING ──
    creditRiskTier: isChurned ? 'High' : pick(['Low', 'Low', 'Medium']),
    concentrationRiskTier: isLarge ? 'Low' : pick(['Low', 'Medium', 'Medium']),
    operationalRiskTier: pick(['Low', 'Medium']),
    cyberRiskTier: pick(['Low', 'Medium']),
    regulatoryRiskTier: pick(['Low', 'Low', 'Medium']),
    litigationPending: Math.random() < 0.1,
    litigationCount: Math.random() < 0.1 ? randomInt(1, 3) : 0,
    sanctionsExposure: false,
    keyPersonRiskFlag: Math.random() < 0.2,
    reputationRiskTier: isChurned ? 'Medium' : 'Low',

    // ── TECH STACK ──
    accountingSystemPref: pick(['Investran', 'eFront', 'Allvue', 'Yardi', 'QuickBooks Enterprise']),
    crmSystem: pick(['Salesforce', 'HubSpot', 'DealCloud', 'Affinity']),
    portalProvider: pick(['Canopy', 'Juniper Square', 'iLevel', 'Backstop']),
    reportingPlatform: pick(['Tableau', 'Power BI', 'Chronograph', 'Dynamo', 'Internal']),
    dataWarehouse: pick(['Snowflake', 'BigQuery', 'Redshift', 'Databricks', null]),
    workflowTools: JSON.stringify(['Asana', 'Jira'].slice(0, randomInt(1, 2))),
    docMgmtPlatform: pick(['Box', 'SharePoint', 'NetDocuments', 'iManage']),
    emailPlatform: pick(['Google Workspace', 'Microsoft 365']),
    apiIntegrations: JSON.stringify(['Intralinks', 'DocuSign', 'Plaid'].slice(0, randomInt(1, 3))),
    techModernizationScore: isLarge ? randomInt(6, 10) : randomInt(3, 8),

    // ── FUND ECONOMICS DETAIL ──
    crystallizationFrequency: pick(['Annually', 'Semi-Annually', 'Quarterly']),
    europeanHurdleType: pick(['Hard', 'Soft', null]),
    catchUpType: pick(['None', 'Full', 'Full', 'Partial']),
    catchUpPct: pick([0, 50, 80, 100]),
    clawbackProvision: Math.random() < 0.7,
    keyPersonProvision: Math.random() < 0.85,
    noFaultDivorce: Math.random() < 0.4,
    mgmtFeeDiscountPct: randomInt(0, 15),
    preferredReturnCompounding: pick(['Simple', 'Compound']),
    gpCommitSource: pick(['Cash', 'Cash', 'Mgmt Fee Waiver', 'Mix']),

    // ── SERVICE SLA ──
    quarterlyReportingSlaDays: isProspect ? null : randomInt(30, 60),
    annualAuditSlaDays: isProspect ? null : randomInt(90, 150),
    capitalCallTurnaroundHours: isProspect ? null : randomInt(24, 72),
    distributionProcessingDays: isProspect ? null : randomInt(2, 10),
    navDeliveryDays: isProspect ? null : randomInt(10, 25),
    k1DeliveryTarget: isProspect ? null : pick(['March 15', 'April 1', 'Late Filer (Sept)']),
    investorInquiryResponseHours: isProspect ? null : randomInt(12, 48),
    onboardingTimelineWeeks: isProspect ? randomInt(8, 16) : null,
    slaBreachCountYtd: isChurned ? randomInt(3, 12) : isProspect ? null : randomInt(0, 3),
    slaOnTimePct: isChurned ? randomInt(70, 90) : isProspect ? null : randomInt(92, 100),

    // ── JSQ FINANCIALS (internal-only) ──
    arrContractedMm: isChurned ? 0 : isProspect ? 0 : Math.round(aum * 0.004 + randomInt(10, 60)),
    pipelineValueMm: isProspect ? Math.round(aum * 0.003 + randomInt(5, 40)) : isChurned ? 0 : null,
    lifetimeRevenueMm: isProspect ? 0 : Math.round(aum * 0.015 + randomInt(20, 200)),
    lifetimeValueMm: isChurned ? Math.round(aum * 0.015) : Math.round(aum * 0.04 + randomInt(50, 500)),
    costToServiceMm: isChurned ? 0 : Math.round((aum * 0.002 + randomInt(5, 40)) * (isProspect ? 0 : 1)),
    grossMarginPct: isProspect ? null : isChurned ? 0 : randomInt(25, 48),
    profitabilityTier: isChurned ? 'Loss-Making' : isProspect ? null : isLarge ? 'High' : pick(['High', 'Medium']),
    upsellOpportunityMm: isChurned ? 0 : isProspect ? null : Math.round(randomInt(5, 50)),
    discountPct: isProspect ? null : randomInt(0, 15),
    contractValueMm: isChurned ? 0 : isProspect ? null : Math.round(aum * 0.004 * (isLarge ? 3 : 2) + randomInt(20, 100)),

    // ── RELATIONSHIP HISTORY ──
    firstMeetingDate: isProspect ? randomDate(new Date('2025-09-01'), new Date('2026-02-01')) : null,
    contractSignedDate: isProspect ? null : isChurned ? randomDate(new Date('2016-01-01'), new Date('2022-01-01')) : randomDate(new Date('2016-01-01'), new Date('2024-01-01')),
    lastContractRenewalDate: isProspect || isChurned ? null : randomDate(new Date('2024-01-01'), new Date('2025-12-31')),
    nextContractRenewalDate: isProspect || isChurned ? null : randomDate(new Date('2026-06-01'), new Date('2027-12-31')),
    contractAutoRenew: isProspect ? null : Math.random() < 0.55,
    prevAdminBeforeJsq: pick(['SS&C', 'Citco', 'Alter Domus', 'State Street', 'In-house', 'Gen II', null, null]),
    referralSource: pick(['LP introduction', 'Placement agent', 'Inbound', 'Referral partner', 'Conference', 'Outbound']),
    advocacyScore: isChurned ? randomInt(1, 4) : randomInt(5, 10),
    relationshipOwnerTenureMonths: randomInt(6, 60),
    renewalRiskScore: isChurned ? 100 : isProspect ? null : randomInt(5, 45),

    // ── DEI / CULTURE ──
    womenOwnedPct: randomInt(0, 55),
    minorityOwnedPct: randomInt(0, 40),
    diverseLeadershipPct: randomInt(15, 55),
    diversityHiringPledge: Math.random() < 0.4,
    ilpaDiversityMetrics: Math.random() < 0.5,
    boardIndependencePct: randomInt(25, 70),
    governanceCertification: pick(['ISO 27001', 'SOC 2 Type II', 'Both', null, null]),
    paritySignatory: Math.random() < 0.3,
    rockefellerPrinciples: Math.random() < 0.15,
    pcpSignatory: Math.random() < 0.45,

    // ── REGULATORY DETAIL ──
    formAdvPart1Date: isProspect ? null : randomDate(new Date('2024-06-01'), new Date('2025-06-30')),
    formAdvPart2Date: isProspect ? null : randomDate(new Date('2024-06-01'), new Date('2025-06-30')),
    mifidApplicable: Math.random() < 0.25,
    aifmdApplicable: Math.random() < 0.4,
    uboRegistryFiled: Math.random() < 0.8,
    beneficialOwnershipDisclosed: Math.random() < 0.95,
    ccoOnStaff: isLarge ? true : Math.random() < 0.55,
    ccoName: pick(['Linda Park', 'Marcus Chen', 'Sarah Williams', 'David Kim', 'Elena Rodriguez', null]),
    mostRecentSecExamDate: isProspect ? null : randomDate(new Date('2022-01-01'), new Date('2025-06-30')),
    secExamDeficiencies: isProspect ? null : randomInt(0, 3),

    // ── COMMUNICATION PREFS ──
    preferredReportingFormat: pick(['PDF', 'Excel', 'Portal', 'API']),
    preferredCommunicationChannel: pick(['Email', 'Slack', 'Phone', 'Teams']),
    mainContactFrequency: pick(['Weekly', 'Monthly', 'Quarterly']),
    escalationPath: pick(['AE → VP → Head of Svc', 'Direct to Partner', 'Standard support tiers']),
    boardMeetingCadence: pick(['Quarterly', 'Semi-Annually', 'Annually']),
    lpAdvisoryCommitteeCount: randomInt(5, 15),
    monthlyInvestorUpdateEnabled: Math.random() < 0.5,
    privateIrPortalEnabled: isProspect ? false : Math.random() < 0.8,
    investorDayCadence: pick(['Annually', 'Semi-Annually', 'Biannually']),
    roadshowFrequency: pick(['Annually', 'Semi-Annually', 'As Needed']),

    // ── Website + Notes lookup (backfill any missing from client creates) ──
    website: c.website ?? CLIENT_WEBSITES[c.name] ?? null,
    notes: c.notes ?? CLIENT_NOTES[c.name] ?? null,
  };
}

// ---------------------------------------------------------------------------
// Entity generator — produces a full complex for a Client
// ---------------------------------------------------------------------------

type EntitySeedInput = { clientId: string; entityId: string; name: string; entityType: string; structureType: string; domicile: string; strategy: string; lifecycleStatus: string; scopeStatus: string; vintage?: number | null; navMm?: number | null; commitmentMm?: number | null; calledCapitalMm?: number | null; prefRatePct?: number | null; carryPct?: number | null; mgmtFeePct?: number | null; waterfallType?: string | null; currency?: string; inceptionDate?: Date | null; assetClass?: string | null; fundComplexName?: string | null; sponsorGpOrg?: string | null; dataQualityScore?: number | null; confidenceScore?: number | null; shortName?: string | null; entityRole?: string | null; fundStructure?: string | null; domicileCountry?: string | null; region?: string | null; hqCity?: string | null; };

function generateEntitiesForClient(
  client: { id: string; name: string; shortName: string | null; primaryStrategy: string; status: string; aumMm?: number | null; hqCity: string; hqCountry: string; region: string; yearFounded: number | null; firstFundVintage?: number | null; latestFundVintage?: number | null; waterfallType?: string | null; hurdleRatePct?: number | null; mgmtFeePct?: number | null; carriedInterestPct?: number | null; gpCommitPct?: number | null; },
  startIdx: number,
): EntitySeedInput[] {
  const shortName = client.shortName ?? client.name.split(' ')[0];
  const complex = `${shortName} Complex`;
  const status = client.status;
  const aum = client.aumMm ?? 1000;

  // scope status mix by client status
  const scopeMix = (overrides?: string[]): string => {
    if (status === 'Churned') return 'Terminated';
    if (status === 'Prospect') return pickWeighted([{ value: 'Identified', weight: 7 }, { value: 'Scoped', weight: 3 }]);
    if (status === 'Onboarding') return pickWeighted([{ value: 'Contracted', weight: 6 }, { value: 'Scoped', weight: 4 }]);
    // Active
    return overrides ? pick(overrides) : pickWeighted([{ value: 'Contracted', weight: 75 }, { value: 'Scoped', weight: 15 }, { value: 'De-scoped', weight: 10 }]);
  };

  // fund lifecycle (for Prospects, no funds are "Active" yet — they're identified on paper only)
  const fundLifecycle = status === 'Churned' ? 'Winding Down' : status === 'Prospect' ? pick(['Active', 'Fundraising']) : pick(['Active', 'Active', 'Active', 'Fundraising']);

  const baseVintage = client.firstFundVintage ?? client.yearFounded ?? 2010;
  const latestVintage = client.latestFundVintage ?? 2024;

  const wf = client.waterfallType ?? 'American';
  const hurdle = client.hurdleRatePct ?? 8.0;
  const mgmt = client.mgmtFeePct ?? 2.0;
  const carry = client.carriedInterestPct ?? 20.0;

  const entities: EntitySeedInput[] = [];
  let i = 0;
  const nextId = () => `ENT-${String(startIdx + ++i).padStart(6, '0')}`;

  // Helper to build an entity with sensible defaults
  const make = (spec: Partial<EntitySeedInput> & { name: string; entityType: string; structureType: string; strategy: string }): EntitySeedInput => ({
    clientId: client.id,
    entityId: nextId(),
    name: spec.name,
    entityType: spec.entityType,
    structureType: spec.structureType,
    domicile: spec.domicile ?? (client.hqCountry === 'United States' ? 'Delaware' : 'Cayman Islands'),
    strategy: spec.strategy,
    lifecycleStatus: spec.lifecycleStatus ?? fundLifecycle,
    scopeStatus: spec.scopeStatus ?? scopeMix(),
    vintage: spec.vintage,
    navMm: spec.navMm,
    commitmentMm: spec.commitmentMm,
    calledCapitalMm: spec.calledCapitalMm,
    prefRatePct: spec.prefRatePct ?? hurdle,
    carryPct: spec.carryPct ?? carry,
    mgmtFeePct: spec.mgmtFeePct ?? mgmt,
    waterfallType: spec.waterfallType ?? wf,
    currency: spec.currency ?? 'USD',
    inceptionDate: spec.inceptionDate,
    assetClass: spec.assetClass ?? client.primaryStrategy,
    fundComplexName: complex,
    sponsorGpOrg: client.name,
    dataQualityScore: spec.dataQualityScore ?? randomInt(65, 95),
    confidenceScore: spec.confidenceScore ?? Number((0.6 + Math.random() * 0.35).toFixed(2)),
    shortName: spec.shortName,
    entityRole: spec.entityRole,
    fundStructure: spec.fundStructure,
    domicileCountry: spec.domicileCountry ?? client.hqCountry,
    region: spec.region ?? client.region,
    hqCity: spec.hqCity ?? client.hqCity,
  });

  // ── 1. ManCo ──
  entities.push(make({
    name: `${shortName} Management LLC`,
    entityType: 'Management Company',
    structureType: 'LLC',
    strategy: client.primaryStrategy,
    lifecycleStatus: status === 'Churned' ? 'Winding Down' : 'Active',
    domicile: client.hqCountry === 'United States' ? 'Delaware' : 'Luxembourg',
    inceptionDate: new Date(`${client.yearFounded ?? 2010}-01-01`),
    entityRole: 'Management Co',
    fundStructure: 'LLC',
    shortName: `${shortName} Mgmt`,
  }));

  // ── 2. GP Carry Vehicle ──
  if (status !== 'Prospect') {
    entities.push(make({
      name: `${shortName} GP Carry LP`,
      entityType: 'GP Entity',
      structureType: 'LP',
      strategy: 'Carried Interest',
      lifecycleStatus: status === 'Churned' ? 'Winding Down' : 'Active',
      domicile: client.hqCountry === 'United States' ? 'Delaware' : 'Cayman Islands',
      inceptionDate: new Date(`${(client.yearFounded ?? 2010) + 3}-01-01`),
      navMm: Math.round(aum * 0.02),
      entityRole: 'GP Entity',
      fundStructure: 'Limited Partnership',
      shortName: `${shortName} GP Carry`,
    }));
  }

  // ── 3. Funds (2-4 per GP) — sized so commitments sum to ~aumMm and each fund is ≥$100M ──
  // Allocate budget by flagship-weighted distribution so larger GPs have $1B+ flagships.
  const MIN_FUND_MM = 100;
  // Choose fund count based on AUM so every fund can clear the $100M floor
  let fundCount: number;
  if (status === 'Prospect') {
    fundCount = aum >= 2000 ? randomInt(2, 3) : aum >= 800 ? 2 : aum >= MIN_FUND_MM ? 1 : 0;
  } else if (status === 'Onboarding') {
    fundCount = aum >= 1500 ? 3 : aum >= 800 ? 2 : 1;
  } else {
    // Active / Churned — scale count with AUM but ensure the per-fund average ≥ $400M ideally
    fundCount = aum >= 8000 ? randomInt(3, 4) : aum >= 3000 ? randomInt(3, 4) : aum >= 1500 ? 3 : aum >= 800 ? 2 : 2;
  }
  // Weights: flagship gets 40-55% of AUM, subsequent funds split the remainder
  const flagshipWeight = 0.40 + Math.random() * 0.15; // 0.40–0.55
  const weights: number[] = [];
  if (fundCount >= 1) weights.push(flagshipWeight);
  for (let f = 2; f <= fundCount; f++) {
    // Older funds (higher f) are smaller because flagship is newest and biggest
    weights.push((1 - flagshipWeight) / (fundCount - 1) * (0.8 + Math.random() * 0.4));
  }
  // Normalize weights so they sum to 1
  const weightTotal = weights.reduce((s, w) => s + w, 0);
  const normalizedWeights = weights.map((w) => w / weightTotal);

  const vintageSpan = Math.max(1, latestVintage - baseVintage);
  for (let f = 1; f <= fundCount; f++) {
    const fundVintage = baseVintage + Math.floor((vintageSpan * (f - 1)) / Math.max(fundCount - 1, 1));
    const isFlagship = f === 1;
    const isLatest = f === fundCount;
    let fundCommitment = Math.round(aum * normalizedWeights[f - 1]);
    // Enforce minimum floor: no main fund under $100M
    if (fundCommitment < MIN_FUND_MM) fundCommitment = MIN_FUND_MM + randomInt(0, 40);
    const fundCalledPct = isLatest && status !== 'Churned' ? 0.3 + Math.random() * 0.4 : 0.75 + Math.random() * 0.2;
    const fundNav = Math.round(fundCommitment * fundCalledPct * (0.9 + Math.random() * 0.4));
    const lifecycle = status === 'Churned' ? 'Winding Down' : (isLatest && Math.random() < 0.5 ? 'Fundraising' : 'Active');
    entities.push(make({
      name: `${shortName} Fund ${romanNumeral(f)} LP`,
      entityType: isFlagship ? 'Flagship Fund' : 'Fund',
      structureType: 'LP',
      strategy: client.primaryStrategy,
      lifecycleStatus: lifecycle,
      scopeStatus: scopeMix(),
      vintage: fundVintage,
      inceptionDate: new Date(`${fundVintage}-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`),
      navMm: fundNav,
      commitmentMm: fundCommitment,
      calledCapitalMm: Math.round(fundCommitment * fundCalledPct),
      entityRole: isFlagship ? 'Flagship Fund' : 'Fund',
      fundStructure: 'Limited Partnership',
      shortName: `${shortName} ${romanNumeral(f)}`,
    }));
  }

  // ── 4. Offshore Feeder (sub-vehicle, can be below floor) — only for Active / Churned / Onboarding ──
  // Feeders are typically sized as a slice of the flagship — ~12-20% of AUM
  if (status !== 'Prospect' && Math.random() < 0.85) {
    const feederCommit = Math.max(75, Math.round(aum * (0.12 + Math.random() * 0.08)));
    entities.push(make({
      name: `${shortName} Offshore Feeder Fund Ltd`,
      entityType: 'Feeder Fund',
      structureType: 'Limited Company',
      strategy: client.primaryStrategy,
      lifecycleStatus: status === 'Churned' ? 'Winding Down' : 'Active',
      domicile: 'Cayman Islands',
      domicileCountry: 'Cayman Islands',
      region: 'APAC',
      inceptionDate: new Date(`${latestVintage - 1}-06-15`),
      navMm: Math.round(feederCommit * 0.75),
      commitmentMm: feederCommit,
      calledCapitalMm: Math.round(feederCommit * 0.6),
      entityRole: 'Feeder Fund',
      fundStructure: 'Limited Company',
      shortName: `${shortName} Offshore`,
    }));
  }

  // ── 5. US Blocker Corp (tax vehicle; small NAV for offshore LPs investing through blocker) ──
  if ((status === 'Active' || status === 'Churned') && Math.random() < 0.7) {
    entities.push(make({
      name: `${shortName} Blocker Corp`,
      entityType: 'Blocker Corp',
      structureType: 'C-Corp',
      strategy: client.primaryStrategy,
      lifecycleStatus: status === 'Churned' ? 'Winding Down' : 'Active',
      domicile: 'Delaware',
      domicileCountry: 'United States',
      inceptionDate: new Date(`${latestVintage - 2}-03-01`),
      navMm: Math.max(25, Math.round(aum * 0.03)),
      entityRole: 'Blocker',
      fundStructure: 'C-Corp',
      shortName: `${shortName} Blocker`,
    }));
  }

  // ── 6. Co-Invest SPV (0-1 per Active GP) — deal-specific vehicle ──
  if (status === 'Active' && Math.random() < 0.6) {
    const spvCommit = Math.max(50, Math.round(aum * (0.03 + Math.random() * 0.04)));
    entities.push(make({
      name: `${shortName} Co-Invest ${latestVintage} SPV LP`,
      entityType: 'Co-Invest Vehicle',
      structureType: 'LP',
      strategy: client.primaryStrategy,
      lifecycleStatus: 'Active',
      domicile: 'Delaware',
      vintage: latestVintage,
      inceptionDate: new Date(`${latestVintage}-02-01`),
      navMm: Math.round(spvCommit * 0.75),
      commitmentMm: spvCommit,
      calledCapitalMm: Math.round(spvCommit * 0.6),
      entityRole: 'Co-Invest',
      fundStructure: 'Limited Partnership',
      shortName: `${shortName} CoInv ${latestVintage}`,
    }));
  }

  return entities;
}

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
  await prisma.employeeEntityAssignment.deleteMany();
  await prisma.securityEntityLink.deleteMany();
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
  await prisma.internalUserSurvey.deleteMany();
  await prisma.internalUser.deleteMany();
  await prisma.client.deleteMany();

  console.log('Cleared existing data');

  // ═══════════════════════════════════════════════
  // CLIENTS (38: 8 existing + 30 new — 22 Active, 10 Prospect, 5 Churned, 1 Onboarding)
  // ═══════════════════════════════════════════════
  const clients = await Promise.all([
    // ─── existing 8 (enriched with new fields) ──────────────────────────
    prisma.client.create({ data: {
      name: 'Walker Asset Management', shortName: 'Walker', primaryStrategy: 'Private Equity',
      hqCity: 'Dallas', hqCountry: 'United States', region: 'Americas',
      relationshipStart: new Date('2019-03-15'), status: 'Active',
      totalEntities: 62, totalNavMm: 7742, totalCommitmentMm: 12500,
      revenueL12m: 48200, marginPct: 42.3, teamLead: 'Megan Moore',
      podId: 'POD-A', serviceLine: 'Full Service', yearFounded: 2005, employeeCount: 340,
      website: 'https://walkerasset.com',
      aumMm: 12500, strategyMix: 'Buyout,Growth,Infrastructure', portfolioCompanyCount: 45, typicalDealSizeMm: 250, firstFundVintage: 2005, latestFundVintage: 2023,
      waterfallType: 'American', hurdleRatePct: 8.0, mgmtFeePct: 2.0, carriedInterestPct: 20.0, gpCommitPct: 2.0,
      auditFirm: 'PwC', legalCounsel: 'Kirkland & Ellis', primaryCustodian: 'State Street', taxAdvisor: 'EY', bankingRelationship: 'JP Morgan', dataRoomPlatform: 'Intralinks',
      secRegistered: true, advFilingDate: new Date('2025-03-28'), formPfRequired: true, amlRiskTier: 'Low',
      lastContactAt: new Date('2026-04-10'), nextMeetingAt: new Date('2026-04-22'), accountExecutive: 'Patricia Reese', nps: 72,
      usesFundAdmin: true, usesInvestorPortal: true, usesTaxServices: true, usesComplianceSupport: true, usesTreasuryServices: true,
      billingFrequency: 'Quarterly', arAgingDays: 18, lastInvoiceAt: new Date('2026-03-31'), paymentMethod: 'Wire',
      esgPolicy: true, diversityReporting: true, sasbAligned: true,
    }}),
    prisma.client.create({ data: {
      name: 'Campbell Capital Partners', shortName: 'Campbell', primaryStrategy: 'Private Equity',
      hqCity: 'Los Angeles', hqCountry: 'United States', region: 'Americas',
      relationshipStart: new Date('2020-07-01'), status: 'Active',
      totalEntities: 27, totalNavMm: 2834, totalCommitmentMm: 4800,
      revenueL12m: 22100, marginPct: 38.7, teamLead: 'Jessica Cruz',
      podId: 'POD-B', serviceLine: 'Full Service', yearFounded: 2012, employeeCount: 85,
      aumMm: 4800, strategyMix: 'Growth,Buyout', portfolioCompanyCount: 22, typicalDealSizeMm: 120, firstFundVintage: 2013, latestFundVintage: 2024,
      waterfallType: 'American', hurdleRatePct: 8.0, mgmtFeePct: 2.0, carriedInterestPct: 20.0, gpCommitPct: 2.5,
      auditFirm: 'KPMG', legalCounsel: 'Simpson Thacher', primaryCustodian: 'BNY Mellon', taxAdvisor: 'Deloitte', bankingRelationship: 'Goldman Sachs', dataRoomPlatform: 'Datasite',
      secRegistered: true, advFilingDate: new Date('2025-03-20'), formPfRequired: true, amlRiskTier: 'Low',
      lastContactAt: new Date('2026-04-12'), nextMeetingAt: new Date('2026-05-06'), accountExecutive: 'Nathan Bradley', nps: 68,
      usesFundAdmin: true, usesInvestorPortal: true, usesTaxServices: true, usesComplianceSupport: true, usesTreasuryServices: false,
      billingFrequency: 'Quarterly', arAgingDays: 24, lastInvoiceAt: new Date('2026-03-31'), paymentMethod: 'Wire',
      esgPolicy: true, diversityReporting: false, sasbAligned: false,
    }}),
    prisma.client.create({ data: {
      name: 'Sullivan Investments', shortName: 'Sullivan', primaryStrategy: 'Hedge Fund',
      hqCity: 'New York', hqCountry: 'United States', region: 'Americas',
      relationshipStart: new Date('2018-01-10'), status: 'Active',
      totalEntities: 18, totalNavMm: 6122, totalCommitmentMm: 6122,
      revenueL12m: 35800, marginPct: 44.1, teamLead: 'Diana Smith',
      podId: 'POD-A', serviceLine: 'Full Service', yearFounded: 1998, employeeCount: 520,
      aumMm: 6122, strategyMix: 'Long/Short Equity,Event-Driven', portfolioCompanyCount: null, typicalDealSizeMm: 45, firstFundVintage: 1998, latestFundVintage: 2022,
      waterfallType: 'European', hurdleRatePct: 5.0, mgmtFeePct: 1.5, carriedInterestPct: 20.0, gpCommitPct: 3.0,
      auditFirm: 'EY', legalCounsel: 'Schulte Roth & Zabel', primaryCustodian: 'Goldman Sachs', taxAdvisor: 'PwC', bankingRelationship: 'Morgan Stanley', dataRoomPlatform: 'Intralinks',
      secRegistered: true, advFilingDate: new Date('2025-03-31'), formPfRequired: true, amlRiskTier: 'Medium',
      lastContactAt: new Date('2026-04-08'), nextMeetingAt: new Date('2026-04-24'), accountExecutive: 'Patricia Reese', nps: 81,
      usesFundAdmin: true, usesInvestorPortal: true, usesTaxServices: false, usesComplianceSupport: true, usesTreasuryServices: true,
      billingFrequency: 'Monthly', arAgingDays: 12, lastInvoiceAt: new Date('2026-03-31'), paymentMethod: 'Wire',
      esgPolicy: true, diversityReporting: true, sasbAligned: true,
    }}),
    prisma.client.create({ data: {
      name: 'Cruz Capital Management', shortName: 'Cruz', primaryStrategy: 'Private Equity',
      hqCity: 'Menlo Park', hqCountry: 'United States', region: 'Americas',
      relationshipStart: new Date('2021-04-20'), status: 'Active',
      totalEntities: 42, totalNavMm: 4321, totalCommitmentMm: 7200,
      revenueL12m: 28900, marginPct: 36.5, teamLead: 'Megan Moore',
      podId: 'POD-A', serviceLine: 'Fund Accounting', yearFounded: 2009, employeeCount: 145,
      aumMm: 7200, strategyMix: 'Venture,Growth', portfolioCompanyCount: 68, typicalDealSizeMm: 25, firstFundVintage: 2009, latestFundVintage: 2024,
      waterfallType: 'American', hurdleRatePct: 8.0, mgmtFeePct: 2.5, carriedInterestPct: 25.0, gpCommitPct: 1.5,
      auditFirm: 'Grant Thornton', legalCounsel: 'Cooley', primaryCustodian: 'Silicon Valley Bank', taxAdvisor: 'BDO', bankingRelationship: 'First Republic', dataRoomPlatform: 'Firmex',
      secRegistered: true, advFilingDate: new Date('2025-03-18'), formPfRequired: false, amlRiskTier: 'Low',
      lastContactAt: new Date('2026-04-11'), nextMeetingAt: new Date('2026-04-29'), accountExecutive: 'Nathan Bradley', nps: 64,
      usesFundAdmin: true, usesInvestorPortal: true, usesTaxServices: true, usesComplianceSupport: false, usesTreasuryServices: false,
      billingFrequency: 'Quarterly', arAgingDays: 32, lastInvoiceAt: new Date('2026-03-31'), paymentMethod: 'ACH',
      esgPolicy: false, diversityReporting: true, sasbAligned: false,
    }}),
    prisma.client.create({ data: {
      name: 'Lopez Asset Partners', shortName: 'Lopez', primaryStrategy: 'Real Estate',
      hqCity: 'Edinburgh', hqCountry: 'United Kingdom', region: 'EMEA',
      relationshipStart: new Date('2022-02-14'), status: 'Active',
      totalEntities: 28, totalNavMm: 1923, totalCommitmentMm: 3100,
      revenueL12m: 14200, marginPct: 31.2, teamLead: 'Jason Cooper',
      podId: 'POD-C', serviceLine: 'Fund Accounting', yearFounded: 2015, employeeCount: 60,
      aumMm: 3100, strategyMix: 'Core-Plus Real Estate,Value-Add', portfolioCompanyCount: 54, typicalDealSizeMm: 40, firstFundVintage: 2015, latestFundVintage: 2023,
      waterfallType: 'European', hurdleRatePct: 8.0, mgmtFeePct: 1.75, carriedInterestPct: 20.0, gpCommitPct: 2.0,
      auditFirm: 'Deloitte', legalCounsel: 'Clifford Chance', primaryCustodian: 'HSBC', taxAdvisor: 'KPMG', bankingRelationship: 'RBS', dataRoomPlatform: 'Datasite',
      secRegistered: false, advFilingDate: null, formPfRequired: false, amlRiskTier: 'Medium',
      lastContactAt: new Date('2026-04-09'), nextMeetingAt: new Date('2026-05-02'), accountExecutive: 'Elena Vasquez', nps: 58,
      usesFundAdmin: true, usesInvestorPortal: false, usesTaxServices: true, usesComplianceSupport: true, usesTreasuryServices: true,
      billingFrequency: 'Quarterly', arAgingDays: 40, lastInvoiceAt: new Date('2026-03-31'), paymentMethod: 'Wire',
      esgPolicy: true, diversityReporting: false, sasbAligned: true,
    }}),
    prisma.client.create({ data: {
      name: 'White Advisors', shortName: 'White Adv', primaryStrategy: 'Credit',
      hqCity: 'Boston', hqCountry: 'United States', region: 'Americas',
      relationshipStart: new Date('2017-09-01'), status: 'Active',
      totalEntities: 52, totalNavMm: 5543, totalCommitmentMm: 8900,
      revenueL12m: 41300, marginPct: 40.8, teamLead: 'Diana Smith',
      podId: 'POD-B', serviceLine: 'Full Service', yearFounded: 2001, employeeCount: 280,
      aumMm: 8900, strategyMix: 'Direct Lending,Distressed', portfolioCompanyCount: 120, typicalDealSizeMm: 75, firstFundVintage: 2001, latestFundVintage: 2024,
      waterfallType: 'European', hurdleRatePct: 7.0, mgmtFeePct: 1.5, carriedInterestPct: 15.0, gpCommitPct: 2.5,
      auditFirm: 'PwC', legalCounsel: 'Ropes & Gray', primaryCustodian: 'State Street', taxAdvisor: 'EY', bankingRelationship: 'Bank of America', dataRoomPlatform: 'Intralinks',
      secRegistered: true, advFilingDate: new Date('2025-03-25'), formPfRequired: true, amlRiskTier: 'Medium',
      lastContactAt: new Date('2026-04-14'), nextMeetingAt: new Date('2026-04-28'), accountExecutive: 'Patricia Reese', nps: 75,
      usesFundAdmin: true, usesInvestorPortal: true, usesTaxServices: true, usesComplianceSupport: true, usesTreasuryServices: true,
      billingFrequency: 'Quarterly', arAgingDays: 15, lastInvoiceAt: new Date('2026-03-31'), paymentMethod: 'Wire',
      esgPolicy: true, diversityReporting: true, sasbAligned: true,
    }}),
    prisma.client.create({ data: {
      name: 'White Fund Management', shortName: 'WFM', primaryStrategy: 'Fund of Funds',
      hqCity: 'Amsterdam', hqCountry: 'Netherlands', region: 'EMEA',
      relationshipStart: new Date('2016-06-15'), status: 'Active',
      totalEntities: 51, totalNavMm: 13321, totalCommitmentMm: 18000,
      revenueL12m: 62500, marginPct: 45.2, teamLead: 'Megan Moore',
      podId: 'POD-A', serviceLine: 'Full Service', yearFounded: 1994, employeeCount: 410,
      aumMm: 18000, strategyMix: 'Multi-Strategy FoF,Secondaries', portfolioCompanyCount: null, typicalDealSizeMm: 200, firstFundVintage: 1994, latestFundVintage: 2024,
      waterfallType: 'European', hurdleRatePct: 8.0, mgmtFeePct: 1.0, carriedInterestPct: 10.0, gpCommitPct: 1.5,
      auditFirm: 'KPMG', legalCounsel: 'Linklaters', primaryCustodian: 'BNY Mellon', taxAdvisor: 'EY', bankingRelationship: 'ING', dataRoomPlatform: 'Datasite',
      secRegistered: true, advFilingDate: new Date('2025-03-26'), formPfRequired: true, amlRiskTier: 'Low',
      lastContactAt: new Date('2026-04-16'), nextMeetingAt: new Date('2026-05-10'), accountExecutive: 'Elena Vasquez', nps: 84,
      usesFundAdmin: true, usesInvestorPortal: true, usesTaxServices: true, usesComplianceSupport: true, usesTreasuryServices: true,
      billingFrequency: 'Quarterly', arAgingDays: 10, lastInvoiceAt: new Date('2026-03-31'), paymentMethod: 'Wire',
      esgPolicy: true, diversityReporting: true, sasbAligned: true,
    }}),
    prisma.client.create({ data: {
      name: 'Rodriguez Capital Management', shortName: 'Rodriguez', primaryStrategy: 'Fund of Funds',
      hqCity: 'Zurich', hqCountry: 'Switzerland', region: 'EMEA',
      relationshipStart: new Date('2023-01-05'), status: 'Onboarding',
      totalEntities: 11, totalNavMm: 357, totalCommitmentMm: 600,
      revenueL12m: 3200, marginPct: 22.4, teamLead: 'Jessica Cruz',
      podId: 'POD-C', serviceLine: 'Fund Accounting', yearFounded: 2020, employeeCount: 15,
      aumMm: 600, strategyMix: 'Emerging Managers FoF', portfolioCompanyCount: null, typicalDealSizeMm: 15, firstFundVintage: 2021, latestFundVintage: 2024,
      waterfallType: 'European', hurdleRatePct: 8.0, mgmtFeePct: 1.0, carriedInterestPct: 10.0, gpCommitPct: 2.0,
      auditFirm: 'BDO', legalCounsel: 'Baker McKenzie', primaryCustodian: 'UBS', taxAdvisor: 'KPMG', bankingRelationship: 'Credit Suisse', dataRoomPlatform: 'Firmex',
      secRegistered: false, advFilingDate: null, formPfRequired: false, amlRiskTier: 'Medium',
      lastContactAt: new Date('2026-04-15'), nextMeetingAt: new Date('2026-04-25'), accountExecutive: 'Elena Vasquez', nps: null,
      usesFundAdmin: true, usesInvestorPortal: false, usesTaxServices: false, usesComplianceSupport: true, usesTreasuryServices: false,
      billingFrequency: 'Quarterly', arAgingDays: null, lastInvoiceAt: null, paymentMethod: null,
      esgPolicy: false, diversityReporting: false, sasbAligned: false,
    }}),

    // ─── 10 PROSPECTS (no relationshipStart, relationshipStage populated) ──
    prisma.client.create({ data: {
      name: 'Mitchell Capital', shortName: 'Mitchell', primaryStrategy: 'Private Equity',
      hqCity: 'Chicago', hqCountry: 'United States', region: 'Americas', relationshipStart: null,
      status: 'Prospect', totalEntities: 0, totalNavMm: 0, totalCommitmentMm: 0, revenueL12m: 0, marginPct: 0,
      teamLead: 'Jessica Cruz', serviceLine: 'Full Service', yearFounded: 2011, employeeCount: 45,
      aumMm: 850, strategyMix: 'Lower Middle Market Buyout', portfolioCompanyCount: 14, typicalDealSizeMm: 35, firstFundVintage: 2012, latestFundVintage: 2022,
      relationshipStage: 'Qualified', nextMeetingAt: new Date('2026-04-28'), accountExecutive: 'Nathan Bradley',
    }}),
    prisma.client.create({ data: {
      name: 'Cohen Private Equity', shortName: 'Cohen', primaryStrategy: 'Private Equity',
      hqCity: 'Miami', hqCountry: 'United States', region: 'Americas', relationshipStart: null,
      status: 'Prospect', totalEntities: 0, totalNavMm: 0, totalCommitmentMm: 0, revenueL12m: 0, marginPct: 0,
      teamLead: 'Megan Moore', serviceLine: 'Full Service', yearFounded: 2017, employeeCount: 32,
      aumMm: 1200, strategyMix: 'Healthcare Buyout', portfolioCompanyCount: 9, typicalDealSizeMm: 90, firstFundVintage: 2018, latestFundVintage: 2023,
      relationshipStage: 'Proposal', nextMeetingAt: new Date('2026-04-24'), accountExecutive: 'Patricia Reese',
    }}),
    prisma.client.create({ data: {
      name: 'Bennett Ventures', shortName: 'Bennett', primaryStrategy: 'Venture Capital',
      hqCity: 'Austin', hqCountry: 'United States', region: 'Americas', relationshipStart: null,
      status: 'Prospect', totalEntities: 0, totalNavMm: 0, totalCommitmentMm: 0, revenueL12m: 0, marginPct: 0,
      teamLead: 'Megan Moore', serviceLine: 'Fund Accounting', yearFounded: 2019, employeeCount: 18,
      aumMm: 580, strategyMix: 'Early-Stage VC,SaaS', portfolioCompanyCount: 34, typicalDealSizeMm: 8, firstFundVintage: 2020, latestFundVintage: 2024,
      relationshipStage: 'Negotiation', nextMeetingAt: new Date('2026-04-22'), accountExecutive: 'Nathan Bradley',
    }}),
    prisma.client.create({ data: {
      name: 'Harper Growth Partners', shortName: 'Harper', primaryStrategy: 'Growth Equity',
      hqCity: 'San Francisco', hqCountry: 'United States', region: 'Americas', relationshipStart: null,
      status: 'Prospect', totalEntities: 0, totalNavMm: 0, totalCommitmentMm: 0, revenueL12m: 0, marginPct: 0,
      teamLead: 'Diana Smith', serviceLine: 'Full Service', yearFounded: 2014, employeeCount: 52,
      aumMm: 2300, strategyMix: 'Growth Equity,Tech', portfolioCompanyCount: 21, typicalDealSizeMm: 110, firstFundVintage: 2015, latestFundVintage: 2023,
      relationshipStage: 'Verbal', nextMeetingAt: new Date('2026-04-20'), accountExecutive: 'Nathan Bradley',
    }}),
    prisma.client.create({ data: {
      name: 'Patel Infrastructure Partners', shortName: 'Patel', primaryStrategy: 'Infrastructure',
      hqCity: 'London', hqCountry: 'United Kingdom', region: 'EMEA', relationshipStart: null,
      status: 'Prospect', totalEntities: 0, totalNavMm: 0, totalCommitmentMm: 0, revenueL12m: 0, marginPct: 0,
      teamLead: 'Jason Cooper', serviceLine: 'Full Service', yearFounded: 2008, employeeCount: 140,
      aumMm: 6800, strategyMix: 'Infrastructure,Energy Transition', portfolioCompanyCount: 42, typicalDealSizeMm: 320, firstFundVintage: 2009, latestFundVintage: 2024,
      relationshipStage: 'Qualified', nextMeetingAt: new Date('2026-05-08'), accountExecutive: 'Elena Vasquez',
    }}),
    prisma.client.create({ data: {
      name: 'Nguyen Credit Partners', shortName: 'Nguyen', primaryStrategy: 'Credit',
      hqCity: 'Singapore', hqCountry: 'Singapore', region: 'APAC', relationshipStart: null,
      status: 'Prospect', totalEntities: 0, totalNavMm: 0, totalCommitmentMm: 0, revenueL12m: 0, marginPct: 0,
      teamLead: 'Jason Cooper', serviceLine: 'Fund Accounting', yearFounded: 2016, employeeCount: 38,
      aumMm: 1850, strategyMix: 'Direct Lending,Asia Credit', portfolioCompanyCount: 55, typicalDealSizeMm: 40, firstFundVintage: 2017, latestFundVintage: 2023,
      relationshipStage: 'Proposal', nextMeetingAt: new Date('2026-04-26'), accountExecutive: 'Kenji Tanaka',
    }}),
    prisma.client.create({ data: {
      name: 'Okafor Venture Capital', shortName: 'Okafor', primaryStrategy: 'Venture Capital',
      hqCity: 'Lagos', hqCountry: 'Nigeria', region: 'EMEA', relationshipStart: null,
      status: 'Prospect', totalEntities: 0, totalNavMm: 0, totalCommitmentMm: 0, revenueL12m: 0, marginPct: 0,
      teamLead: 'Jason Cooper', serviceLine: 'Fund Accounting', yearFounded: 2020, employeeCount: 12,
      aumMm: 650, strategyMix: 'Africa Tech VC', portfolioCompanyCount: 22, typicalDealSizeMm: 8, firstFundVintage: 2021, latestFundVintage: 2024,
      relationshipStage: 'Qualified', nextMeetingAt: new Date('2026-05-05'), accountExecutive: 'Elena Vasquez',
    }}),
    prisma.client.create({ data: {
      name: 'Andersen Real Estate Group', shortName: 'Andersen', primaryStrategy: 'Real Estate',
      hqCity: 'Copenhagen', hqCountry: 'Denmark', region: 'EMEA', relationshipStart: null,
      status: 'Prospect', totalEntities: 0, totalNavMm: 0, totalCommitmentMm: 0, revenueL12m: 0, marginPct: 0,
      teamLead: 'Jason Cooper', serviceLine: 'Full Service', yearFounded: 2010, employeeCount: 75,
      aumMm: 3400, strategyMix: 'Nordic Real Estate,Logistics', portfolioCompanyCount: 68, typicalDealSizeMm: 55, firstFundVintage: 2011, latestFundVintage: 2024,
      relationshipStage: 'Negotiation', nextMeetingAt: new Date('2026-04-23'), accountExecutive: 'Elena Vasquez',
    }}),
    prisma.client.create({ data: {
      name: 'Romano Capital', shortName: 'Romano', primaryStrategy: 'Private Equity',
      hqCity: 'Milan', hqCountry: 'Italy', region: 'EMEA', relationshipStart: null,
      status: 'Prospect', totalEntities: 0, totalNavMm: 0, totalCommitmentMm: 0, revenueL12m: 0, marginPct: 0,
      teamLead: 'Jason Cooper', serviceLine: 'Full Service', yearFounded: 2007, employeeCount: 95,
      aumMm: 2900, strategyMix: 'European Buyout', portfolioCompanyCount: 31, typicalDealSizeMm: 95, firstFundVintage: 2008, latestFundVintage: 2023,
      relationshipStage: 'Verbal', nextMeetingAt: new Date('2026-04-21'), accountExecutive: 'Elena Vasquez',
    }}),
    prisma.client.create({ data: {
      name: 'Schultz Fund Partners', shortName: 'Schultz', primaryStrategy: 'Fund of Funds',
      hqCity: 'Frankfurt', hqCountry: 'Germany', region: 'EMEA', relationshipStart: null,
      status: 'Prospect', totalEntities: 0, totalNavMm: 0, totalCommitmentMm: 0, revenueL12m: 0, marginPct: 0,
      teamLead: 'Jason Cooper', serviceLine: 'Full Service', yearFounded: 2006, employeeCount: 110,
      aumMm: 4200, strategyMix: 'European FoF,Secondaries', portfolioCompanyCount: null, typicalDealSizeMm: 150, firstFundVintage: 2007, latestFundVintage: 2024,
      relationshipStage: 'Proposal', nextMeetingAt: new Date('2026-04-29'), accountExecutive: 'Elena Vasquez',
    }}),

    // ─── 15 NEW ACTIVE ────────────────────────────────────────────────
    prisma.client.create({ data: {
      name: 'Kim Strategic Partners', shortName: 'Kim', primaryStrategy: 'Private Equity',
      hqCity: 'Seoul', hqCountry: 'South Korea', region: 'APAC',
      relationshipStart: new Date('2021-09-10'), status: 'Active',
      totalEntities: 19, totalNavMm: 3210, totalCommitmentMm: 5400, revenueL12m: 19800, marginPct: 37.1,
      teamLead: 'Jason Cooper', podId: 'POD-C', serviceLine: 'Full Service', yearFounded: 2010, employeeCount: 98,
      aumMm: 5400, strategyMix: 'Korea Buyout,Growth', portfolioCompanyCount: 28, typicalDealSizeMm: 140, firstFundVintage: 2011, latestFundVintage: 2023,
      waterfallType: 'American', hurdleRatePct: 8.0, mgmtFeePct: 2.0, carriedInterestPct: 20.0, gpCommitPct: 2.0,
      auditFirm: 'PwC', legalCounsel: 'Kim & Chang', primaryCustodian: 'Citi', taxAdvisor: 'Deloitte', bankingRelationship: 'Standard Chartered', dataRoomPlatform: 'Datasite',
      secRegistered: false, advFilingDate: null, formPfRequired: false, amlRiskTier: 'Medium',
      lastContactAt: new Date('2026-04-13'), nextMeetingAt: new Date('2026-05-01'), accountExecutive: 'Kenji Tanaka', nps: 70,
      usesFundAdmin: true, usesInvestorPortal: true, usesTaxServices: true, usesComplianceSupport: true, usesTreasuryServices: true,
      billingFrequency: 'Quarterly', arAgingDays: 22, lastInvoiceAt: new Date('2026-03-31'), paymentMethod: 'Wire',
      esgPolicy: true, diversityReporting: false, sasbAligned: false,
    }}),
    prisma.client.create({ data: {
      name: 'Delgado Private Credit', shortName: 'Delgado', primaryStrategy: 'Credit',
      hqCity: 'Mexico City', hqCountry: 'Mexico', region: 'Americas',
      relationshipStart: new Date('2022-06-20'), status: 'Active',
      totalEntities: 12, totalNavMm: 1680, totalCommitmentMm: 2800, revenueL12m: 11400, marginPct: 33.8,
      teamLead: 'Jessica Cruz', podId: 'POD-B', serviceLine: 'Fund Accounting', yearFounded: 2017, employeeCount: 48,
      aumMm: 2800, strategyMix: 'LatAm Direct Lending', portfolioCompanyCount: 42, typicalDealSizeMm: 30, firstFundVintage: 2018, latestFundVintage: 2024,
      waterfallType: 'European', hurdleRatePct: 7.0, mgmtFeePct: 1.5, carriedInterestPct: 15.0, gpCommitPct: 2.0,
      auditFirm: 'EY', legalCounsel: 'Greenberg Traurig', primaryCustodian: 'BNY Mellon', taxAdvisor: 'KPMG', bankingRelationship: 'Santander', dataRoomPlatform: 'Firmex',
      secRegistered: false, advFilingDate: null, formPfRequired: false, amlRiskTier: 'Medium',
      lastContactAt: new Date('2026-04-10'), nextMeetingAt: new Date('2026-04-27'), accountExecutive: 'Nathan Bradley', nps: 62,
      usesFundAdmin: true, usesInvestorPortal: false, usesTaxServices: true, usesComplianceSupport: true, usesTreasuryServices: false,
      billingFrequency: 'Quarterly', arAgingDays: 38, lastInvoiceAt: new Date('2026-03-31'), paymentMethod: 'Wire',
      esgPolicy: true, diversityReporting: true, sasbAligned: false,
    }}),
    prisma.client.create({ data: {
      name: 'Thompson Growth Equity', shortName: 'Thompson', primaryStrategy: 'Growth Equity',
      hqCity: 'Toronto', hqCountry: 'Canada', region: 'Americas',
      relationshipStart: new Date('2020-11-05'), status: 'Active',
      totalEntities: 24, totalNavMm: 3890, totalCommitmentMm: 6200, revenueL12m: 26400, marginPct: 39.5,
      teamLead: 'Megan Moore', podId: 'POD-A', serviceLine: 'Full Service', yearFounded: 2008, employeeCount: 125,
      aumMm: 6200, strategyMix: 'North America Growth,Tech', portfolioCompanyCount: 35, typicalDealSizeMm: 95, firstFundVintage: 2009, latestFundVintage: 2024,
      waterfallType: 'American', hurdleRatePct: 8.0, mgmtFeePct: 2.0, carriedInterestPct: 20.0, gpCommitPct: 2.5,
      auditFirm: 'KPMG', legalCounsel: 'Blakes', primaryCustodian: 'RBC', taxAdvisor: 'PwC', bankingRelationship: 'TD Bank', dataRoomPlatform: 'Intralinks',
      secRegistered: true, advFilingDate: new Date('2025-03-22'), formPfRequired: false, amlRiskTier: 'Low',
      lastContactAt: new Date('2026-04-11'), nextMeetingAt: new Date('2026-04-30'), accountExecutive: 'Patricia Reese', nps: 77,
      usesFundAdmin: true, usesInvestorPortal: true, usesTaxServices: true, usesComplianceSupport: true, usesTreasuryServices: true,
      billingFrequency: 'Quarterly', arAgingDays: 14, lastInvoiceAt: new Date('2026-03-31'), paymentMethod: 'Wire',
      esgPolicy: true, diversityReporting: true, sasbAligned: true,
    }}),
    prisma.client.create({ data: {
      name: 'Reeves Infrastructure Partners', shortName: 'Reeves', primaryStrategy: 'Infrastructure',
      hqCity: 'Sydney', hqCountry: 'Australia', region: 'APAC',
      relationshipStart: new Date('2019-07-15'), status: 'Active',
      totalEntities: 16, totalNavMm: 5800, totalCommitmentMm: 9400, revenueL12m: 38200, marginPct: 41.7,
      teamLead: 'Jason Cooper', podId: 'POD-C', serviceLine: 'Full Service', yearFounded: 2003, employeeCount: 210,
      aumMm: 9400, strategyMix: 'Infrastructure,Renewables', portfolioCompanyCount: 38, typicalDealSizeMm: 380, firstFundVintage: 2004, latestFundVintage: 2023,
      waterfallType: 'European', hurdleRatePct: 8.0, mgmtFeePct: 1.5, carriedInterestPct: 20.0, gpCommitPct: 3.0,
      auditFirm: 'PwC', legalCounsel: 'Allens', primaryCustodian: 'NAB', taxAdvisor: 'EY', bankingRelationship: 'Westpac', dataRoomPlatform: 'Datasite',
      secRegistered: true, advFilingDate: new Date('2025-03-24'), formPfRequired: true, amlRiskTier: 'Low',
      lastContactAt: new Date('2026-04-14'), nextMeetingAt: new Date('2026-05-05'), accountExecutive: 'Kenji Tanaka', nps: 79,
      usesFundAdmin: true, usesInvestorPortal: true, usesTaxServices: true, usesComplianceSupport: true, usesTreasuryServices: true,
      billingFrequency: 'Quarterly', arAgingDays: 16, lastInvoiceAt: new Date('2026-03-31'), paymentMethod: 'Wire',
      esgPolicy: true, diversityReporting: true, sasbAligned: true,
    }}),
    prisma.client.create({ data: {
      name: 'Barrett Capital Management', shortName: 'Barrett', primaryStrategy: 'Hedge Fund',
      hqCity: 'Greenwich', hqCountry: 'United States', region: 'Americas',
      relationshipStart: new Date('2017-04-10'), status: 'Active',
      totalEntities: 9, totalNavMm: 4500, totalCommitmentMm: 4500, revenueL12m: 28900, marginPct: 46.2,
      teamLead: 'Diana Smith', podId: 'POD-A', serviceLine: 'Full Service', yearFounded: 2000, employeeCount: 180,
      aumMm: 4500, strategyMix: 'Multi-Strategy,Macro', portfolioCompanyCount: null, typicalDealSizeMm: null, firstFundVintage: 2000, latestFundVintage: 2020,
      waterfallType: 'European', hurdleRatePct: 5.0, mgmtFeePct: 1.75, carriedInterestPct: 20.0, gpCommitPct: 2.5,
      auditFirm: 'EY', legalCounsel: 'Schulte Roth & Zabel', primaryCustodian: 'Goldman Sachs', taxAdvisor: 'PwC', bankingRelationship: 'Morgan Stanley', dataRoomPlatform: 'Intralinks',
      secRegistered: true, advFilingDate: new Date('2025-03-29'), formPfRequired: true, amlRiskTier: 'Medium',
      lastContactAt: new Date('2026-04-07'), nextMeetingAt: new Date('2026-04-21'), accountExecutive: 'Patricia Reese', nps: 66,
      usesFundAdmin: true, usesInvestorPortal: true, usesTaxServices: false, usesComplianceSupport: true, usesTreasuryServices: true,
      billingFrequency: 'Monthly', arAgingDays: 11, lastInvoiceAt: new Date('2026-03-31'), paymentMethod: 'Wire',
      esgPolicy: false, diversityReporting: false, sasbAligned: false,
    }}),
    prisma.client.create({ data: {
      name: 'Castellanos Real Assets', shortName: 'Castellanos', primaryStrategy: 'Real Estate',
      hqCity: 'Madrid', hqCountry: 'Spain', region: 'EMEA',
      relationshipStart: new Date('2021-02-18'), status: 'Active',
      totalEntities: 22, totalNavMm: 2450, totalCommitmentMm: 4100, revenueL12m: 16800, marginPct: 34.1,
      teamLead: 'Jason Cooper', podId: 'POD-C', serviceLine: 'Fund Accounting', yearFounded: 2013, employeeCount: 72,
      aumMm: 4100, strategyMix: 'Iberian Real Estate,Logistics', portfolioCompanyCount: 78, typicalDealSizeMm: 28, firstFundVintage: 2014, latestFundVintage: 2024,
      waterfallType: 'European', hurdleRatePct: 8.0, mgmtFeePct: 1.75, carriedInterestPct: 20.0, gpCommitPct: 2.0,
      auditFirm: 'Deloitte', legalCounsel: 'Uria Menendez', primaryCustodian: 'Santander', taxAdvisor: 'KPMG', bankingRelationship: 'BBVA', dataRoomPlatform: 'Firmex',
      secRegistered: false, advFilingDate: null, formPfRequired: false, amlRiskTier: 'Medium',
      lastContactAt: new Date('2026-04-08'), nextMeetingAt: new Date('2026-04-25'), accountExecutive: 'Elena Vasquez', nps: 60,
      usesFundAdmin: true, usesInvestorPortal: false, usesTaxServices: true, usesComplianceSupport: true, usesTreasuryServices: false,
      billingFrequency: 'Quarterly', arAgingDays: 34, lastInvoiceAt: new Date('2026-03-31'), paymentMethod: 'Wire',
      esgPolicy: true, diversityReporting: false, sasbAligned: true,
    }}),
    prisma.client.create({ data: {
      name: 'Park Venture Partners', shortName: 'Park VC', primaryStrategy: 'Venture Capital',
      hqCity: 'Palo Alto', hqCountry: 'United States', region: 'Americas',
      relationshipStart: new Date('2022-08-01'), status: 'Active',
      totalEntities: 14, totalNavMm: 980, totalCommitmentMm: 1800, revenueL12m: 8400, marginPct: 32.5,
      teamLead: 'Megan Moore', podId: 'POD-A', serviceLine: 'Fund Accounting', yearFounded: 2018, employeeCount: 22,
      aumMm: 1800, strategyMix: 'Seed,Series A,AI', portfolioCompanyCount: 48, typicalDealSizeMm: 4, firstFundVintage: 2019, latestFundVintage: 2024,
      waterfallType: 'American', hurdleRatePct: 0.0, mgmtFeePct: 2.5, carriedInterestPct: 25.0, gpCommitPct: 1.5,
      auditFirm: 'Grant Thornton', legalCounsel: 'Cooley', primaryCustodian: 'Silicon Valley Bank', taxAdvisor: 'BDO', bankingRelationship: 'First Citizens', dataRoomPlatform: 'Datasite',
      secRegistered: false, advFilingDate: null, formPfRequired: false, amlRiskTier: 'Low',
      lastContactAt: new Date('2026-04-09'), nextMeetingAt: new Date('2026-04-26'), accountExecutive: 'Nathan Bradley', nps: 82,
      usesFundAdmin: true, usesInvestorPortal: true, usesTaxServices: false, usesComplianceSupport: false, usesTreasuryServices: false,
      billingFrequency: 'Quarterly', arAgingDays: 20, lastInvoiceAt: new Date('2026-03-31'), paymentMethod: 'ACH',
      esgPolicy: false, diversityReporting: true, sasbAligned: false,
    }}),
    prisma.client.create({ data: {
      name: 'Yamamoto Asset Management', shortName: 'Yamamoto', primaryStrategy: 'Private Equity',
      hqCity: 'Tokyo', hqCountry: 'Japan', region: 'APAC',
      relationshipStart: new Date('2018-05-15'), status: 'Active',
      totalEntities: 31, totalNavMm: 8900, totalCommitmentMm: 14000, revenueL12m: 52000, marginPct: 43.8,
      teamLead: 'Jason Cooper', podId: 'POD-C', serviceLine: 'Full Service', yearFounded: 1995, employeeCount: 380,
      aumMm: 14000, strategyMix: 'Japan Buyout,Carve-Outs', portfolioCompanyCount: 62, typicalDealSizeMm: 225, firstFundVintage: 1996, latestFundVintage: 2024,
      waterfallType: 'American', hurdleRatePct: 8.0, mgmtFeePct: 2.0, carriedInterestPct: 20.0, gpCommitPct: 2.0,
      auditFirm: 'KPMG', legalCounsel: 'Nishimura & Asahi', primaryCustodian: 'MUFG', taxAdvisor: 'EY', bankingRelationship: 'SMBC', dataRoomPlatform: 'Intralinks',
      secRegistered: true, advFilingDate: new Date('2025-03-27'), formPfRequired: true, amlRiskTier: 'Low',
      lastContactAt: new Date('2026-04-15'), nextMeetingAt: new Date('2026-05-02'), accountExecutive: 'Kenji Tanaka', nps: 78,
      usesFundAdmin: true, usesInvestorPortal: true, usesTaxServices: true, usesComplianceSupport: true, usesTreasuryServices: true,
      billingFrequency: 'Quarterly', arAgingDays: 12, lastInvoiceAt: new Date('2026-03-31'), paymentMethod: 'Wire',
      esgPolicy: true, diversityReporting: true, sasbAligned: true,
    }}),
    prisma.client.create({ data: {
      name: 'Abramson Credit Partners', shortName: 'Abramson', primaryStrategy: 'Credit',
      hqCity: 'Stamford', hqCountry: 'United States', region: 'Americas',
      relationshipStart: new Date('2019-10-01'), status: 'Active',
      totalEntities: 20, totalNavMm: 3600, totalCommitmentMm: 5800, revenueL12m: 24500, marginPct: 38.9,
      teamLead: 'Diana Smith', podId: 'POD-B', serviceLine: 'Full Service', yearFounded: 2008, employeeCount: 115,
      aumMm: 5800, strategyMix: 'Distressed,Special Situations', portfolioCompanyCount: 82, typicalDealSizeMm: 55, firstFundVintage: 2009, latestFundVintage: 2024,
      waterfallType: 'European', hurdleRatePct: 7.0, mgmtFeePct: 1.5, carriedInterestPct: 15.0, gpCommitPct: 2.5,
      auditFirm: 'EY', legalCounsel: 'Debevoise', primaryCustodian: 'State Street', taxAdvisor: 'PwC', bankingRelationship: 'JP Morgan', dataRoomPlatform: 'Intralinks',
      secRegistered: true, advFilingDate: new Date('2025-03-21'), formPfRequired: true, amlRiskTier: 'Medium',
      lastContactAt: new Date('2026-04-06'), nextMeetingAt: new Date('2026-04-20'), accountExecutive: 'Patricia Reese', nps: 69,
      usesFundAdmin: true, usesInvestorPortal: true, usesTaxServices: true, usesComplianceSupport: true, usesTreasuryServices: true,
      billingFrequency: 'Quarterly', arAgingDays: 17, lastInvoiceAt: new Date('2026-03-31'), paymentMethod: 'Wire',
      esgPolicy: true, diversityReporting: false, sasbAligned: true,
    }}),
    prisma.client.create({ data: {
      name: 'Ferreira Capital', shortName: 'Ferreira', primaryStrategy: 'Private Equity',
      hqCity: 'Sao Paulo', hqCountry: 'Brazil', region: 'Americas',
      relationshipStart: new Date('2020-01-20'), status: 'Active',
      totalEntities: 17, totalNavMm: 2100, totalCommitmentMm: 3400, revenueL12m: 12800, marginPct: 29.4,
      teamLead: 'Jessica Cruz', podId: 'POD-B', serviceLine: 'Fund Accounting', yearFounded: 2012, employeeCount: 54,
      aumMm: 3400, strategyMix: 'Brazil Mid-Market,Consumer', portfolioCompanyCount: 26, typicalDealSizeMm: 65, firstFundVintage: 2013, latestFundVintage: 2023,
      waterfallType: 'American', hurdleRatePct: 8.0, mgmtFeePct: 2.0, carriedInterestPct: 20.0, gpCommitPct: 2.0,
      auditFirm: 'PwC', legalCounsel: 'Mattos Filho', primaryCustodian: 'Itau', taxAdvisor: 'KPMG', bankingRelationship: 'Bradesco', dataRoomPlatform: 'Firmex',
      secRegistered: false, advFilingDate: null, formPfRequired: false, amlRiskTier: 'Medium',
      lastContactAt: new Date('2026-04-05'), nextMeetingAt: new Date('2026-05-03'), accountExecutive: 'Nathan Bradley', nps: 54,
      usesFundAdmin: true, usesInvestorPortal: false, usesTaxServices: true, usesComplianceSupport: true, usesTreasuryServices: false,
      billingFrequency: 'Quarterly', arAgingDays: 44, lastInvoiceAt: new Date('2026-03-31'), paymentMethod: 'Wire',
      esgPolicy: true, diversityReporting: true, sasbAligned: false,
    }}),
    prisma.client.create({ data: {
      name: 'Ito Private Equity', shortName: 'Ito PE', primaryStrategy: 'Private Equity',
      hqCity: 'Hong Kong', hqCountry: 'Hong Kong', region: 'APAC',
      relationshipStart: new Date('2021-11-12'), status: 'Active',
      totalEntities: 15, totalNavMm: 2950, totalCommitmentMm: 5100, revenueL12m: 18700, marginPct: 35.6,
      teamLead: 'Jason Cooper', podId: 'POD-C', serviceLine: 'Full Service', yearFounded: 2014, employeeCount: 68,
      aumMm: 5100, strategyMix: 'Asia Growth,Tech', portfolioCompanyCount: 24, typicalDealSizeMm: 135, firstFundVintage: 2015, latestFundVintage: 2024,
      waterfallType: 'American', hurdleRatePct: 8.0, mgmtFeePct: 2.0, carriedInterestPct: 20.0, gpCommitPct: 2.0,
      auditFirm: 'Deloitte', legalCounsel: 'Freshfields', primaryCustodian: 'HSBC', taxAdvisor: 'EY', bankingRelationship: 'Standard Chartered', dataRoomPlatform: 'Datasite',
      secRegistered: false, advFilingDate: null, formPfRequired: false, amlRiskTier: 'Medium',
      lastContactAt: new Date('2026-04-12'), nextMeetingAt: new Date('2026-04-28'), accountExecutive: 'Kenji Tanaka', nps: 71,
      usesFundAdmin: true, usesInvestorPortal: true, usesTaxServices: true, usesComplianceSupport: true, usesTreasuryServices: false,
      billingFrequency: 'Quarterly', arAgingDays: 19, lastInvoiceAt: new Date('2026-03-31'), paymentMethod: 'Wire',
      esgPolicy: true, diversityReporting: true, sasbAligned: false,
    }}),
    prisma.client.create({ data: {
      name: 'Chen Growth Fund', shortName: 'Chen', primaryStrategy: 'Growth Equity',
      hqCity: 'Shanghai', hqCountry: 'China', region: 'APAC',
      relationshipStart: new Date('2022-03-18'), status: 'Active',
      totalEntities: 11, totalNavMm: 1720, totalCommitmentMm: 2900, revenueL12m: 10100, marginPct: 28.3,
      teamLead: 'Jason Cooper', podId: 'POD-C', serviceLine: 'Fund Accounting', yearFounded: 2016, employeeCount: 42,
      aumMm: 2900, strategyMix: 'China Growth,Consumer Tech', portfolioCompanyCount: 18, typicalDealSizeMm: 85, firstFundVintage: 2017, latestFundVintage: 2023,
      waterfallType: 'American', hurdleRatePct: 8.0, mgmtFeePct: 2.0, carriedInterestPct: 20.0, gpCommitPct: 2.0,
      auditFirm: 'PwC', legalCounsel: 'King & Wood Mallesons', primaryCustodian: 'Bank of China', taxAdvisor: 'EY', bankingRelationship: 'ICBC', dataRoomPlatform: 'Firmex',
      secRegistered: false, advFilingDate: null, formPfRequired: false, amlRiskTier: 'High',
      lastContactAt: new Date('2026-04-04'), nextMeetingAt: new Date('2026-05-07'), accountExecutive: 'Kenji Tanaka', nps: 48,
      usesFundAdmin: true, usesInvestorPortal: false, usesTaxServices: true, usesComplianceSupport: true, usesTreasuryServices: false,
      billingFrequency: 'Quarterly', arAgingDays: 52, lastInvoiceAt: new Date('2026-03-31'), paymentMethod: 'Wire',
      esgPolicy: false, diversityReporting: false, sasbAligned: false,
    }}),
    prisma.client.create({ data: {
      name: 'Weiss Hedge Fund', shortName: 'Weiss', primaryStrategy: 'Hedge Fund',
      hqCity: 'Tel Aviv', hqCountry: 'Israel', region: 'EMEA',
      relationshipStart: new Date('2020-04-28'), status: 'Active',
      totalEntities: 7, totalNavMm: 2850, totalCommitmentMm: 2850, revenueL12m: 19400, marginPct: 45.1,
      teamLead: 'Diana Smith', podId: 'POD-B', serviceLine: 'Full Service', yearFounded: 2006, employeeCount: 85,
      aumMm: 2850, strategyMix: 'Quantitative,Equity Long/Short', portfolioCompanyCount: null, typicalDealSizeMm: null, firstFundVintage: 2006, latestFundVintage: 2019,
      waterfallType: 'European', hurdleRatePct: 4.0, mgmtFeePct: 1.5, carriedInterestPct: 20.0, gpCommitPct: 4.0,
      auditFirm: 'EY', legalCounsel: 'Meitar', primaryCustodian: 'Leumi', taxAdvisor: 'PwC', bankingRelationship: 'Hapoalim', dataRoomPlatform: 'Datasite',
      secRegistered: true, advFilingDate: new Date('2025-03-30'), formPfRequired: true, amlRiskTier: 'Low',
      lastContactAt: new Date('2026-04-10'), nextMeetingAt: new Date('2026-04-24'), accountExecutive: 'Elena Vasquez', nps: 73,
      usesFundAdmin: true, usesInvestorPortal: true, usesTaxServices: false, usesComplianceSupport: true, usesTreasuryServices: true,
      billingFrequency: 'Monthly', arAgingDays: 13, lastInvoiceAt: new Date('2026-03-31'), paymentMethod: 'Wire',
      esgPolicy: false, diversityReporting: false, sasbAligned: false,
    }}),
    prisma.client.create({ data: {
      name: 'Osei Private Equity', shortName: 'Osei', primaryStrategy: 'Private Equity',
      hqCity: 'Accra', hqCountry: 'Ghana', region: 'EMEA',
      relationshipStart: new Date('2023-02-10'), status: 'Active',
      totalEntities: 5, totalNavMm: 320, totalCommitmentMm: 550, revenueL12m: 2800, marginPct: 21.7,
      teamLead: 'Jason Cooper', podId: 'POD-C', serviceLine: 'Fund Accounting', yearFounded: 2019, employeeCount: 18,
      aumMm: 550, strategyMix: 'West Africa PE', portfolioCompanyCount: 12, typicalDealSizeMm: 18, firstFundVintage: 2020, latestFundVintage: 2023,
      waterfallType: 'American', hurdleRatePct: 8.0, mgmtFeePct: 2.0, carriedInterestPct: 20.0, gpCommitPct: 2.0,
      auditFirm: 'KPMG', legalCounsel: 'Bentsi-Enchill', primaryCustodian: 'Stanbic', taxAdvisor: 'Deloitte', bankingRelationship: 'Ecobank', dataRoomPlatform: 'Firmex',
      secRegistered: false, advFilingDate: null, formPfRequired: false, amlRiskTier: 'High',
      lastContactAt: new Date('2026-04-02'), nextMeetingAt: new Date('2026-05-04'), accountExecutive: 'Elena Vasquez', nps: 52,
      usesFundAdmin: true, usesInvestorPortal: false, usesTaxServices: false, usesComplianceSupport: true, usesTreasuryServices: false,
      billingFrequency: 'Quarterly', arAgingDays: 48, lastInvoiceAt: new Date('2026-03-31'), paymentMethod: 'Wire',
      esgPolicy: true, diversityReporting: true, sasbAligned: false,
    }}),
    prisma.client.create({ data: {
      name: 'Hartman Real Estate', shortName: 'Hartman', primaryStrategy: 'Real Estate',
      hqCity: 'Denver', hqCountry: 'United States', region: 'Americas',
      relationshipStart: new Date('2018-12-05'), status: 'Active',
      totalEntities: 26, totalNavMm: 3280, totalCommitmentMm: 5200, revenueL12m: 22300, marginPct: 36.8,
      teamLead: 'Jessica Cruz', podId: 'POD-B', serviceLine: 'Full Service', yearFounded: 2004, employeeCount: 135,
      aumMm: 5200, strategyMix: 'Core-Plus Real Estate,Residential', portfolioCompanyCount: 94, typicalDealSizeMm: 42, firstFundVintage: 2005, latestFundVintage: 2024,
      waterfallType: 'American', hurdleRatePct: 8.0, mgmtFeePct: 1.75, carriedInterestPct: 20.0, gpCommitPct: 2.0,
      auditFirm: 'Grant Thornton', legalCounsel: 'Holland & Hart', primaryCustodian: 'Wells Fargo', taxAdvisor: 'BDO', bankingRelationship: 'US Bank', dataRoomPlatform: 'Intralinks',
      secRegistered: true, advFilingDate: new Date('2025-03-19'), formPfRequired: false, amlRiskTier: 'Low',
      lastContactAt: new Date('2026-04-13'), nextMeetingAt: new Date('2026-04-30'), accountExecutive: 'Nathan Bradley', nps: 65,
      usesFundAdmin: true, usesInvestorPortal: true, usesTaxServices: true, usesComplianceSupport: false, usesTreasuryServices: true,
      billingFrequency: 'Quarterly', arAgingDays: 21, lastInvoiceAt: new Date('2026-03-31'), paymentMethod: 'Wire',
      esgPolicy: true, diversityReporting: false, sasbAligned: false,
    }}),

    // ─── 5 CHURNED ───────────────────────────────────────────────────
    prisma.client.create({ data: {
      name: 'McBride Asset Management', shortName: 'McBride', primaryStrategy: 'Private Equity',
      hqCity: 'Philadelphia', hqCountry: 'United States', region: 'Americas',
      relationshipStart: new Date('2015-05-12'), status: 'Churned',
      totalEntities: 22, totalNavMm: 2800, totalCommitmentMm: 4500, revenueL12m: 0, marginPct: 0,
      teamLead: 'Megan Moore', podId: 'POD-A', serviceLine: 'Full Service', yearFounded: 2008, employeeCount: 95,
      aumMm: 4500, strategyMix: 'Middle Market Buyout', portfolioCompanyCount: 24, typicalDealSizeMm: 85, firstFundVintage: 2009, latestFundVintage: 2020,
      waterfallType: 'American', hurdleRatePct: 8.0, mgmtFeePct: 2.0, carriedInterestPct: 20.0, gpCommitPct: 2.0,
      auditFirm: 'PwC', legalCounsel: 'Morgan Lewis', primaryCustodian: 'State Street', taxAdvisor: 'EY', bankingRelationship: 'PNC', dataRoomPlatform: 'Intralinks',
      secRegistered: true, advFilingDate: new Date('2024-03-28'), formPfRequired: true, amlRiskTier: 'Low',
      churnDate: new Date('2025-06-30'), churnReason: 'Acquired by larger admin (SS&C)',
      lastContactAt: new Date('2025-06-30'), accountExecutive: 'Patricia Reese', nps: 42,
      usesFundAdmin: false, usesInvestorPortal: false, usesTaxServices: false, usesComplianceSupport: false, usesTreasuryServices: false,
      billingFrequency: 'Quarterly', arAgingDays: 0, lastInvoiceAt: new Date('2025-06-30'), paymentMethod: 'Wire',
      esgPolicy: false, diversityReporting: false, sasbAligned: false,
    }}),
    prisma.client.create({ data: {
      name: 'Bauer Capital Partners', shortName: 'Bauer', primaryStrategy: 'Credit',
      hqCity: 'Vienna', hqCountry: 'Austria', region: 'EMEA',
      relationshipStart: new Date('2017-08-20'), status: 'Churned',
      totalEntities: 14, totalNavMm: 1900, totalCommitmentMm: 3200, revenueL12m: 0, marginPct: 0,
      teamLead: 'Jason Cooper', podId: 'POD-C', serviceLine: 'Fund Accounting', yearFounded: 2005, employeeCount: 62,
      aumMm: 3200, strategyMix: 'European Direct Lending', portfolioCompanyCount: 58, typicalDealSizeMm: 30, firstFundVintage: 2006, latestFundVintage: 2021,
      waterfallType: 'European', hurdleRatePct: 7.0, mgmtFeePct: 1.5, carriedInterestPct: 15.0, gpCommitPct: 2.5,
      auditFirm: 'EY', legalCounsel: 'Schoenherr', primaryCustodian: 'Erste', taxAdvisor: 'KPMG', bankingRelationship: 'Raiffeisen', dataRoomPlatform: 'Datasite',
      secRegistered: false, advFilingDate: null, formPfRequired: false, amlRiskTier: 'Medium',
      churnDate: new Date('2025-03-15'), churnReason: 'Moved in-house — hired internal fund admin team',
      lastContactAt: new Date('2025-03-15'), accountExecutive: 'Elena Vasquez', nps: 38,
      usesFundAdmin: false, usesInvestorPortal: false, usesTaxServices: false, usesComplianceSupport: false, usesTreasuryServices: false,
      billingFrequency: 'Quarterly', arAgingDays: 0, lastInvoiceAt: new Date('2025-03-31'), paymentMethod: 'Wire',
      esgPolicy: true, diversityReporting: false, sasbAligned: false,
    }}),
    prisma.client.create({ data: {
      name: 'Ishikawa Private Equity', shortName: 'Ishikawa', primaryStrategy: 'Private Equity',
      hqCity: 'Osaka', hqCountry: 'Japan', region: 'APAC',
      relationshipStart: new Date('2016-11-08'), status: 'Churned',
      totalEntities: 9, totalNavMm: 1100, totalCommitmentMm: 1800, revenueL12m: 0, marginPct: 0,
      teamLead: 'Jason Cooper', podId: 'POD-C', serviceLine: 'Fund Accounting', yearFounded: 2009, employeeCount: 48,
      aumMm: 1800, strategyMix: 'Japan Mid-Market', portfolioCompanyCount: 16, typicalDealSizeMm: 55, firstFundVintage: 2010, latestFundVintage: 2019,
      waterfallType: 'American', hurdleRatePct: 8.0, mgmtFeePct: 2.0, carriedInterestPct: 20.0, gpCommitPct: 2.0,
      auditFirm: 'Deloitte', legalCounsel: 'Mori Hamada', primaryCustodian: 'Mizuho', taxAdvisor: 'EY', bankingRelationship: 'SMBC', dataRoomPlatform: 'Firmex',
      secRegistered: false, advFilingDate: null, formPfRequired: false, amlRiskTier: 'Low',
      churnDate: new Date('2024-12-01'), churnReason: 'Pricing — moved to lower-cost regional admin',
      lastContactAt: new Date('2024-12-01'), accountExecutive: 'Kenji Tanaka', nps: 35,
      usesFundAdmin: false, usesInvestorPortal: false, usesTaxServices: false, usesComplianceSupport: false, usesTreasuryServices: false,
      billingFrequency: 'Quarterly', arAgingDays: 0, lastInvoiceAt: new Date('2024-12-31'), paymentMethod: 'Wire',
      esgPolicy: false, diversityReporting: false, sasbAligned: false,
    }}),
    prisma.client.create({ data: {
      name: 'Navarro Venture Capital', shortName: 'Navarro', primaryStrategy: 'Venture Capital',
      hqCity: 'Buenos Aires', hqCountry: 'Argentina', region: 'Americas',
      relationshipStart: new Date('2020-02-28'), status: 'Churned',
      totalEntities: 6, totalNavMm: 340, totalCommitmentMm: 600, revenueL12m: 0, marginPct: 0,
      teamLead: 'Jessica Cruz', podId: 'POD-B', serviceLine: 'Fund Accounting', yearFounded: 2015, employeeCount: 22,
      aumMm: 600, strategyMix: 'LatAm Seed', portfolioCompanyCount: 38, typicalDealSizeMm: 2, firstFundVintage: 2016, latestFundVintage: 2022,
      waterfallType: 'American', hurdleRatePct: 0.0, mgmtFeePct: 2.5, carriedInterestPct: 25.0, gpCommitPct: 1.0,
      auditFirm: 'BDO', legalCounsel: 'Bruchou', primaryCustodian: 'BBVA', taxAdvisor: 'KPMG', bankingRelationship: 'Galicia', dataRoomPlatform: 'Datasite',
      secRegistered: false, advFilingDate: null, formPfRequired: false, amlRiskTier: 'High',
      churnDate: new Date('2025-09-15'), churnReason: 'Fund wind-down — LP base exited region',
      lastContactAt: new Date('2025-09-15'), accountExecutive: 'Nathan Bradley', nps: 44,
      usesFundAdmin: false, usesInvestorPortal: false, usesTaxServices: false, usesComplianceSupport: false, usesTreasuryServices: false,
      billingFrequency: 'Quarterly', arAgingDays: 0, lastInvoiceAt: new Date('2025-09-30'), paymentMethod: 'Wire',
      esgPolicy: false, diversityReporting: false, sasbAligned: false,
    }}),
    prisma.client.create({ data: {
      name: 'Desai Credit', shortName: 'Desai', primaryStrategy: 'Credit',
      hqCity: 'Mumbai', hqCountry: 'India', region: 'APAC',
      relationshipStart: new Date('2019-06-15'), status: 'Churned',
      totalEntities: 12, totalNavMm: 1550, totalCommitmentMm: 2500, revenueL12m: 0, marginPct: 0,
      teamLead: 'Jason Cooper', podId: 'POD-C', serviceLine: 'Full Service', yearFounded: 2012, employeeCount: 72,
      aumMm: 2500, strategyMix: 'India Structured Credit', portfolioCompanyCount: 44, typicalDealSizeMm: 25, firstFundVintage: 2013, latestFundVintage: 2022,
      waterfallType: 'European', hurdleRatePct: 8.0, mgmtFeePct: 1.75, carriedInterestPct: 15.0, gpCommitPct: 2.0,
      auditFirm: 'KPMG', legalCounsel: 'AZB', primaryCustodian: 'HDFC', taxAdvisor: 'Deloitte', bankingRelationship: 'ICICI', dataRoomPlatform: 'Intralinks',
      secRegistered: false, advFilingDate: null, formPfRequired: false, amlRiskTier: 'Medium',
      churnDate: new Date('2026-01-20'), churnReason: 'Service-quality concerns — chose specialized Asia credit admin',
      lastContactAt: new Date('2026-01-20'), accountExecutive: 'Kenji Tanaka', nps: 28,
      usesFundAdmin: false, usesInvestorPortal: false, usesTaxServices: false, usesComplianceSupport: false, usesTreasuryServices: false,
      billingFrequency: 'Quarterly', arAgingDays: 0, lastInvoiceAt: new Date('2026-01-31'), paymentMethod: 'Wire',
      esgPolicy: false, diversityReporting: false, sasbAligned: false,
    }}),
  ]);
  console.log(`Created ${clients.length} clients (8 existing + 30 new: 22 Active, 10 Prospect, 5 Churned, 1 Onboarding)`);

  // ── v2 enrichment: apply 120 derived fields + website + notes to all 38 clients ──
  await Promise.all(clients.map((c) => prisma.client.update({
    where: { id: c.id },
    data: gpEnrichment({ name: c.name, status: c.status, aumMm: (c as any).aumMm, strategyMix: (c as any).strategyMix, primaryStrategy: c.primaryStrategy, website: c.website, notes: c.notes }),
  })));
  console.log(`Enriched ${clients.length} clients with v2 profile fields (websites + notes included)`);

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
    // ── Walker deeper structure: Blocker → Holding → Portfolio Companies ──
    prisma.entity.create({ data: {
      entityId: 'ENT-000016', name: 'Walker III UBTI Blocker Corp', entityType: 'Blocker Corp',
      structureType: 'Corp', domicile: 'Delaware', strategy: 'Private Equity',
      lifecycleStatus: 'Active', clientId: clients[0].id,
      reportingFrequency: 'Annually', currency: 'USD',
      inceptionDate: new Date('2021-04-15'), region: 'Americas',
      dataQualityScore: 82.0, confidenceScore: 0.78,
      assetClass: 'Private Equity', shortName: 'Walker III Blocker', domicileCountry: 'United States',
      domicileState: 'Delaware', entityRole: 'Blocker', fundStructure: 'Corporation',
      booksComplexityTier: 'Tier 1', generalLedgerSystem: 'JSQ Investran',
      accountingFramework: 'US GAAP',
      bankAccountCount: 1, primaryCurrency: 'USD',
      scopeFundAccounting: true,
      auditTrailEnabled: true, dataClassificationLevel: 'Confidential',
      fundComplexName: 'Walker Enterprise Complex', sponsorGpOrg: 'Walker Asset Management',
    }}),
    prisma.entity.create({ data: {
      entityId: 'ENT-000017', name: 'Walker III Holdings LLC', entityType: 'Holding Company',
      structureType: 'LLC', domicile: 'Delaware', strategy: 'Private Equity',
      lifecycleStatus: 'Active', clientId: clients[0].id,
      reportingFrequency: 'Quarterly', currency: 'USD',
      inceptionDate: new Date('2021-05-01'), region: 'Americas',
      dataQualityScore: 80.0, confidenceScore: 0.76,
      assetClass: 'Private Equity', shortName: 'Walker III Holdings', domicileCountry: 'United States',
      domicileState: 'Delaware', entityRole: 'Holding Company', fundStructure: 'LLC',
      booksComplexityTier: 'Tier 2', generalLedgerSystem: 'JSQ Investran',
      accountingFramework: 'US GAAP',
      bankAccountCount: 2, primaryCurrency: 'USD',
      scopeFundAccounting: true,
      auditTrailEnabled: true, dataClassificationLevel: 'Confidential',
      fundComplexName: 'Walker Enterprise Complex', sponsorGpOrg: 'Walker Asset Management',
    }}),
    prisma.entity.create({ data: {
      entityId: 'ENT-000018', name: 'Apex Manufacturing Inc', entityType: 'Portfolio Company',
      structureType: 'Corp', domicile: 'Delaware', strategy: 'Private Equity',
      lifecycleStatus: 'Active', clientId: clients[0].id,
      navMm: 320, commitmentMm: 280,
      reportingFrequency: 'Quarterly', currency: 'USD',
      inceptionDate: new Date('2022-03-15'), region: 'Americas',
      dataQualityScore: 75.0, confidenceScore: 0.70,
      assetClass: 'Private Equity', shortName: 'Apex Mfg', domicileCountry: 'United States',
      domicileState: 'Delaware', entityRole: 'Portfolio Company', fundStructure: 'Corporation',
      fundComplexName: 'Walker Enterprise Complex', sponsorGpOrg: 'Walker Asset Management',
    }}),
    prisma.entity.create({ data: {
      entityId: 'ENT-000019', name: 'Vanguard Logistics LP', entityType: 'Portfolio Company',
      structureType: 'LP', domicile: 'Delaware', strategy: 'Private Equity',
      lifecycleStatus: 'Active', clientId: clients[0].id,
      navMm: 185, commitmentMm: 160,
      reportingFrequency: 'Quarterly', currency: 'USD',
      inceptionDate: new Date('2023-01-10'), region: 'Americas',
      dataQualityScore: 73.0, confidenceScore: 0.68,
      assetClass: 'Private Equity', shortName: 'Vanguard Logistics', domicileCountry: 'United States',
      domicileState: 'Delaware', entityRole: 'Portfolio Company', fundStructure: 'Limited Partnership',
      fundComplexName: 'Walker Enterprise Complex', sponsorGpOrg: 'Walker Asset Management',
    }}),
  ]);
  console.log(`Created ${entities.length} existing hand-crafted entities`);

  // Backfill scopeStatus on existing 19 entities — they're all actively admined
  await prisma.entity.updateMany({
    where: { scopeStatus: null },
    data: { scopeStatus: 'Contracted' },
  });

  // ── v2 entity generator: create full complex for each client ──
  // Each GP gets ManCo + GP Carry + Funds + Feeders + Blockers + SPVs with scopeStatus reflecting sale stage
  const entitySpecs: EntitySeedInput[] = [];
  let entityIdCounter = 1000; // start generated IDs at ENT-001001 to avoid collision with existing ENT-000001..19
  for (const c of clients) {
    const specs = generateEntitiesForClient(
      {
        id: c.id, name: c.name, shortName: c.shortName, primaryStrategy: c.primaryStrategy,
        status: c.status, aumMm: c.aumMm, hqCity: c.hqCity, hqCountry: c.hqCountry, region: c.region,
        yearFounded: c.yearFounded, firstFundVintage: c.firstFundVintage, latestFundVintage: c.latestFundVintage,
        waterfallType: c.waterfallType, hurdleRatePct: c.hurdleRatePct, mgmtFeePct: c.mgmtFeePct,
        carriedInterestPct: c.carriedInterestPct, gpCommitPct: c.gpCommitPct,
      },
      entityIdCounter,
    );
    entitySpecs.push(...specs);
    entityIdCounter += specs.length;
  }

  await Promise.all(entitySpecs.map((spec) => prisma.entity.create({ data: spec })));
  console.log(`Generated ${entitySpecs.length} additional entities across ${clients.length} GPs (ManCo + GP Carry + Funds + Feeders + Blockers + SPVs)`);

  // ── Recompute client-level totals from actual entities so numbers tie out ──
  await Promise.all(clients.map(async (c) => {
    const ents = await prisma.entity.findMany({ where: { clientId: c.id }, select: { commitmentMm: true, navMm: true } });
    const totalCommitment = ents.reduce((s, e) => s + (e.commitmentMm ? Number(e.commitmentMm) : 0), 0);
    const totalNav = ents.reduce((s, e) => s + (e.navMm ? Number(e.navMm) : 0), 0);
    await prisma.client.update({
      where: { id: c.id },
      data: {
        totalEntities: ents.length,
        totalCommitmentMm: Math.round(totalCommitment),
        totalNavMm: Math.round(totalNav),
        aumMm: Math.round(totalCommitment),
      },
    });
  }));
  console.log(`Recomputed client totals from entity rollups`);

  // (podId assignment moved to after internal user CSV seeding below)

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
  const securities = await Promise.all([
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
  // SECURITY → ENTITY LINKS (per-client custom setup)
  // ═══════════════════════════════════════════════
  await Promise.all([
    // SEC-001 MSFT — held by Walker III (ENT-000002) and Campbell Growth (ENT-000007)
    prisma.securityEntityLink.create({ data: { securityId: securities[0].id, entityId: entities[1].id, financialStatementName: 'Microsoft Corporation — Common Stock', clientNickname: 'MSFT', dealPartner: 'James Walker', investmentThesis: 'Core large-cap technology position; cloud and AI tailwinds support long-term compounding. Held as part of the public equity sleeve.', acquisitionDate: new Date('2021-03-15'), costAtAcquisition: 18200, currentCarryingValue: 48200, ownershipPct: 0.042, isActiveholding: true, watchlistFlag: false }}),
    prisma.securityEntityLink.create({ data: { securityId: securities[0].id, entityId: entities[6].id, financialStatementName: 'Microsoft Corp. — Equity Investment', clientNickname: 'Microsoft', dealPartner: 'Rachel Campbell', investmentThesis: 'Public equity hedge within growth portfolio. Provides liquidity buffer alongside private holdings.', acquisitionDate: new Date('2022-06-01'), costAtAcquisition: 13900, currentCarryingValue: 22100, ownershipPct: 0.018, isActiveholding: true, watchlistFlag: false }}),
    // SEC-003 NVDA — held by Walker III (ENT-000002) and Sullivan Alpha (ENT-000008)
    prisma.securityEntityLink.create({ data: { securityId: securities[2].id, entityId: entities[1].id, financialStatementName: 'NVIDIA Corporation — Common Stock', clientNickname: 'NVDA', dealPartner: 'James Walker', investmentThesis: 'High-conviction AI infrastructure bet. Position sized at 3× initial allocation following data center revenue inflection.', acquisitionDate: new Date('2019-11-20'), costAtAcquisition: 5400, currentCarryingValue: 55300, ownershipPct: 0.061, isActiveholding: true, watchlistFlag: false }}),
    prisma.securityEntityLink.create({ data: { securityId: securities[2].id, entityId: entities[7].id, financialStatementName: 'NVIDIA Corp. — Long Position', clientNickname: 'Jensen Play', dealPartner: 'Nina Sullivan', investmentThesis: 'Tactical allocation to GPU semiconductor cycle. Monitor for AI spending deceleration as exit trigger.', acquisitionDate: new Date('2023-01-10'), costAtAcquisition: 12800, currentCarryingValue: 33200, ownershipPct: 0.029, isActiveholding: true, watchlistFlag: true, notes: 'Watchlisted due to elevated valuation multiple; review at next IC.' }}),
    // SEC-006 US Treasury — held by White Senior Credit (ENT-000011) and Sullivan Alpha (ENT-000008)
    prisma.securityEntityLink.create({ data: { securityId: securities[5].id, entityId: entities[10].id, financialStatementName: 'U.S. Treasury Note 4.25% due 11/15/2034', clientNickname: 'UST 10Y', dealPartner: 'Michael White', investmentThesis: 'Risk-free rate anchor. Held as duration hedge against floating-rate credit book exposure.', acquisitionDate: new Date('2024-02-14'), costAtAcquisition: 100000, currentCarryingValue: 98500, ownershipPct: null, isActiveholding: true, watchlistFlag: false }}),
    prisma.securityEntityLink.create({ data: { securityId: securities[5].id, entityId: entities[7].id, financialStatementName: 'US Treasury Note — 10 Year', clientNickname: 'T-Note 34', dealPartner: 'Nina Sullivan', investmentThesis: 'Safe-haven allocation; increased position during Q3 2025 volatility. Reduces net equity beta.', acquisitionDate: new Date('2025-08-03'), costAtAcquisition: 50000, currentCarryingValue: 49200, ownershipPct: null, isActiveholding: true, watchlistFlag: false }}),
    // SEC-009 Acme Software (PE) — held by Walker III (ENT-000002) and Campbell Growth (ENT-000007)
    prisma.securityEntityLink.create({ data: { securityId: securities[8].id, entityId: entities[1].id, financialStatementName: 'Acme Software Holdings, Inc. — Series C Preferred', clientNickname: 'Acme Software', dealPartner: 'James Walker', investmentThesis: 'B2B SaaS platform targeting mid-market ERP replacement. Thesis: margin expansion via net revenue retention > 120% and path to EBITDA profitability by FY2027.', acquisitionDate: new Date('2022-09-12'), costAtAcquisition: 5000, currentCarryingValue: 12500, ownershipPct: 8.4, isActiveholding: true, watchlistFlag: false }}),
    prisma.securityEntityLink.create({ data: { securityId: securities[8].id, entityId: entities[6].id, financialStatementName: 'Acme Software Holdings — Preferred Stock', clientNickname: 'AcmeSoft', dealPartner: 'Rachel Campbell', investmentThesis: 'Co-invest alongside Walker; entry on same terms. Monitor ARR growth quarterly.', acquisitionDate: new Date('2022-09-12'), costAtAcquisition: 3000, currentCarryingValue: 7200, ownershipPct: 5.1, isActiveholding: true, watchlistFlag: false, notes: 'Co-investment right exercised per LPA Section 7.3' }}),
    // SEC-010 NexGen Health (PE) — held by Walker III (ENT-000002) and Cruz Ventures (ENT-000009)
    prisma.securityEntityLink.create({ data: { securityId: securities[9].id, entityId: entities[1].id, financialStatementName: 'NexGen Health Systems, Inc. — Growth Round', clientNickname: 'NexGen Health', dealPartner: 'James Walker', investmentThesis: 'Digital health platform enabling value-based care transitions. Revenue growing 65% YoY. Exit target: strategic acquiree or Series D at 2× current valuation.', acquisitionDate: new Date('2023-05-18'), costAtAcquisition: 8000, currentCarryingValue: 18700, ownershipPct: 11.2, isActiveholding: true, watchlistFlag: false }}),
    prisma.securityEntityLink.create({ data: { securityId: securities[9].id, entityId: entities[8].id, financialStatementName: 'NexGen Health Systems — Growth Equity', clientNickname: 'NexGen', dealPartner: 'Carlos Cruz', investmentThesis: 'Lead investor in healthcare digitisation. Board seat held. Clinical workflow automation driving sticky enterprise contracts.', acquisitionDate: new Date('2023-05-18'), costAtAcquisition: 7000, currentCarryingValue: 16400, ownershipPct: 9.8, isActiveholding: true, watchlistFlag: false }}),
    // SEC-012 London Bridge Office — held by Lopez RE (ENT-000010)
    prisma.securityEntityLink.create({ data: { securityId: securities[11].id, entityId: entities[9].id, financialStatementName: 'London Bridge Office Complex — Freehold', clientNickname: 'London Bridge', dealPartner: 'Maria Lopez', investmentThesis: 'Core-plus London office with 92% occupancy and 7-year WAULT. Targeted 6.5% net yield. Currency hedged to USD via FX forward overlay.', acquisitionDate: new Date('2021-07-01'), costAtAcquisition: 38000, currentCarryingValue: 45000, ownershipPct: 100, isActiveholding: true, watchlistFlag: false, notes: 'GBP/USD hedge reviewed annually. Next review: Q3 2026.' }}),
    // SEC-018 CloudScale AI (PE) — held by Walker III (ENT-000002) and Cruz Ventures (ENT-000009)
    prisma.securityEntityLink.create({ data: { securityId: securities[17].id, entityId: entities[1].id, financialStatementName: 'CloudScale AI, Inc. — Series B Preferred', clientNickname: 'CloudScale', dealPartner: 'James Walker', investmentThesis: 'Enterprise AI inference platform. 3× revenue growth in trailing 12 months. Potential strategic acquisition target within 18–24 months.', acquisitionDate: new Date('2024-04-22'), costAtAcquisition: 3000, currentCarryingValue: 8200, ownershipPct: 6.7, isActiveholding: true, watchlistFlag: false }}),
    prisma.securityEntityLink.create({ data: { securityId: securities[17].id, entityId: entities[8].id, financialStatementName: 'CloudScale AI — Series B', clientNickname: 'CloudScale AI', dealPartner: 'Carlos Cruz', investmentThesis: 'Follow-on from seed. AI-native DevOps toolchain with strong net promoter metrics. Exit horizon 2027.', acquisitionDate: new Date('2024-04-22'), costAtAcquisition: 2000, currentCarryingValue: 5500, ownershipPct: 4.4, isActiveholding: true, watchlistFlag: true, notes: 'Founder vesting cliff reached June 2025. Monitor key-person risk.' }}),
    // SEC-017 CLO Mezz — held by White Senior Credit (ENT-000011)
    prisma.securityEntityLink.create({ data: { securityId: securities[16].id, entityId: entities[10].id, financialStatementName: 'CLO Mezzanine Tranche — Ares Capital XXXV', clientNickname: 'Ares CLO XXXV', dealPartner: 'Michael White', investmentThesis: 'Structured credit yield enhancement. BBB-rated mezz tranche of diversified CLO pool. Spread of L+275. Complements senior credit sleeve.', acquisitionDate: new Date('2023-11-01'), costAtAcquisition: 12000, currentCarryingValue: 12000, ownershipPct: null, isActiveholding: true, watchlistFlag: false }}),
  ]);
  console.log('Created security entity links');

  // ═══════════════════════════════════════════════
  // TASK DEFINITIONS (12 SOPs)
  // ═══════════════════════════════════════════════
  const taskDefs = await Promise.all([
    prisma.taskDefinition.create({ data: { taskCode: 'SOP-001', name: 'Monthly NAV Calculation', description: 'Calculate net asset value for all fund entities including position valuation, accrued expenses, and fee computation.', category: 'NAV Calculation', frequency: 'Monthly', estimatedMinutes: 480, priority: 'Critical', department: 'Fund Accounting', steps: JSON.stringify([{name:'Collect position data from custodian',dueDaysFromStart:0,dueTime:'09:00'},{name:'Verify market prices and valuations',dueDaysFromStart:0,dueTime:'14:00'},{name:'Calculate accrued management fees',dueDaysFromStart:1,dueTime:'10:00'},{name:'Calculate accrued carried interest',dueDaysFromStart:1,dueTime:'14:00'},{name:'Compute gross and net NAV',dueDaysFromStart:1,dueTime:'17:00'},{name:'Prepare NAV package for review',dueDaysFromStart:2,dueTime:'12:00'},{name:'Submit for partner sign-off',dueDaysFromStart:2,dueTime:'17:00'}]) }}),
    prisma.taskDefinition.create({ data: { taskCode: 'SOP-002', name: 'Quarterly Investor Capital Statement', description: 'Prepare and distribute quarterly capital account statements to all limited partners.', category: 'Investor Services', frequency: 'Quarterly', estimatedMinutes: 360, priority: 'High', department: 'Investor Services', steps: JSON.stringify([{name:'Pull capital account balances',dueDaysFromStart:0,dueTime:'10:00'},{name:'Calculate period P&L allocation',dueDaysFromStart:1,dueTime:'17:00'},{name:'Prepare statement template',dueDaysFromStart:3,dueTime:'17:00'},{name:'QC review with second checker',dueDaysFromStart:5,dueTime:'12:00'},{name:'Distribute via investor portal',dueDaysFromStart:5,dueTime:'17:00'},{name:'Track acknowledgments',dueDaysFromStart:7,dueTime:'17:00'}]) }}),
    prisma.taskDefinition.create({ data: { taskCode: 'SOP-003', name: 'Annual K-1 Preparation', description: 'Prepare Schedule K-1 tax documents for all US partners and coordinate with external tax advisor.', category: 'Tax', frequency: 'Annually', estimatedMinutes: 960, priority: 'Critical', department: 'Tax', steps: JSON.stringify([{name:'Gather partner tax information',dueDaysFromStart:-14,dueTime:'17:00'},{name:'Coordinate with external tax advisor',dueDaysFromStart:-7,dueTime:'17:00'},{name:'Prepare draft K-1 allocations',dueDaysFromStart:-3,dueTime:'17:00'},{name:'Review state-level nexus',dueDaysFromStart:-2,dueTime:'17:00'},{name:'Generate K-1 documents',dueDaysFromStart:0,dueTime:'12:00'},{name:'Distribute to partners',dueDaysFromStart:1,dueTime:'17:00'},{name:'File with IRS',dueDaysFromStart:2,dueTime:'17:00'}]) }}),
    prisma.taskDefinition.create({ data: { taskCode: 'SOP-004', name: 'Capital Call Processing', description: 'Process capital call notices including calculation, notice generation, wire tracking, and booking.', category: 'Fund Accounting', frequency: 'Event-Driven', estimatedMinutes: 240, priority: 'High', department: 'Fund Accounting', steps: JSON.stringify([{name:'Calculate call amounts per LP',dueDaysFromStart:0,dueTime:'10:00'},{name:'Generate call notices',dueDaysFromStart:0,dueTime:'14:00'},{name:'Distribute via portal',dueDaysFromStart:0,dueTime:'17:00'},{name:'Track wire receipts',dueDaysFromStart:3,dueTime:'17:00'},{name:'Reconcile received funds',dueDaysFromStart:4,dueTime:'12:00'},{name:'Book journal entries',dueDaysFromStart:4,dueTime:'17:00'}]) }}),
    prisma.taskDefinition.create({ data: { taskCode: 'SOP-005', name: 'Distribution Notice Processing', description: 'Process fund distributions including waterfall calculations, tax withholding, and wire initiation.', category: 'Fund Accounting', frequency: 'Event-Driven', estimatedMinutes: 300, priority: 'High', department: 'Fund Accounting', steps: JSON.stringify([{name:'Calculate distribution per waterfall',dueDaysFromStart:0,dueTime:'10:00'},{name:'Apply withholding rates by jurisdiction',dueDaysFromStart:0,dueTime:'14:00'},{name:'Generate distribution notices',dueDaysFromStart:1,dueTime:'10:00'},{name:'Obtain GP approval',dueDaysFromStart:1,dueTime:'17:00'},{name:'Initiate wire transfers',dueDaysFromStart:2,dueTime:'12:00'},{name:'Book journal entries',dueDaysFromStart:2,dueTime:'17:00'},{name:'Update capital accounts',dueDaysFromStart:3,dueTime:'10:00'}]) }}),
    prisma.taskDefinition.create({ data: { taskCode: 'SOP-006', name: 'Annual Audit Coordination', description: 'Coordinate annual financial statement audit with external auditors including PBC list management.', category: 'Reporting', frequency: 'Annually', estimatedMinutes: 2400, priority: 'Critical', department: 'Fund Accounting', steps: JSON.stringify([{name:'Receive PBC list from auditors',dueDaysFromStart:-60,dueTime:'17:00'},{name:'Assign PBC items to team members',dueDaysFromStart:-55,dueTime:'17:00'},{name:'Prepare financial statements draft',dueDaysFromStart:-30,dueTime:'17:00'},{name:'Respond to auditor inquiries',dueDaysFromStart:-14,dueTime:'17:00'},{name:'Review draft audit report',dueDaysFromStart:-7,dueTime:'17:00'},{name:'Obtain management sign-off',dueDaysFromStart:-3,dueTime:'17:00'},{name:'File audited financials',dueDaysFromStart:0,dueTime:'17:00'}]) }}),
    prisma.taskDefinition.create({ data: { taskCode: 'SOP-007', name: 'FATCA/CRS Reporting', description: 'Prepare and file FATCA and CRS reports for applicable fund entities.', category: 'Compliance', frequency: 'Annually', estimatedMinutes: 480, priority: 'High', department: 'Compliance', steps: JSON.stringify([{name:'Identify reportable accounts',dueDaysFromStart:-30,dueTime:'17:00'},{name:'Collect self-certification forms',dueDaysFromStart:-20,dueTime:'17:00'},{name:'Prepare XML filing data',dueDaysFromStart:-7,dueTime:'17:00'},{name:'QC review of filings',dueDaysFromStart:-3,dueTime:'12:00'},{name:'Submit to relevant tax authorities',dueDaysFromStart:0,dueTime:'17:00'},{name:'Archive confirmation receipts',dueDaysFromStart:1,dueTime:'17:00'}]) }}),
    prisma.taskDefinition.create({ data: { taskCode: 'SOP-008', name: 'Investor Onboarding / KYC', description: 'Complete full KYC/AML screening and documentation collection for new investor subscriptions.', category: 'Compliance', frequency: 'Event-Driven', estimatedMinutes: 180, priority: 'High', department: 'Compliance', steps: JSON.stringify([{name:'Receive subscription documents',dueDaysFromStart:0,dueTime:'17:00'},{name:'Perform identity verification',dueDaysFromStart:1,dueTime:'17:00'},{name:'Screen against sanctions lists',dueDaysFromStart:2,dueTime:'12:00'},{name:'Verify source of funds',dueDaysFromStart:3,dueTime:'17:00'},{name:'Complete risk assessment',dueDaysFromStart:5,dueTime:'17:00'},{name:'Obtain compliance approval',dueDaysFromStart:7,dueTime:'12:00'},{name:'Issue acceptance letter',dueDaysFromStart:7,dueTime:'17:00'}]) }}),
    prisma.taskDefinition.create({ data: { taskCode: 'SOP-009', name: 'Monthly Bank Reconciliation', description: 'Reconcile all fund bank accounts against custodian and accounting records.', category: 'Reconciliation', frequency: 'Monthly', estimatedMinutes: 120, priority: 'Medium', department: 'Fund Accounting', steps: JSON.stringify([{name:'Download bank statements',dueDaysFromStart:0,dueTime:'10:00'},{name:'Match transactions to GL',dueDaysFromStart:0,dueTime:'14:00'},{name:'Investigate unmatched items',dueDaysFromStart:1,dueTime:'12:00'},{name:'Prepare reconciliation report',dueDaysFromStart:1,dueTime:'17:00'},{name:'Obtain manager sign-off',dueDaysFromStart:2,dueTime:'12:00'}]) }}),
    prisma.taskDefinition.create({ data: { taskCode: 'SOP-010', name: 'Quarterly Board Package', description: 'Prepare quarterly board reporting package with performance, risk, and compliance summaries.', category: 'Reporting', frequency: 'Quarterly', estimatedMinutes: 420, priority: 'High', department: 'Client Services', steps: JSON.stringify([{name:'Compile performance data',dueDaysFromStart:-7,dueTime:'17:00'},{name:'Prepare portfolio summary',dueDaysFromStart:-5,dueTime:'17:00'},{name:'Draft risk commentary',dueDaysFromStart:-4,dueTime:'17:00'},{name:'Include compliance attestation',dueDaysFromStart:-3,dueTime:'17:00'},{name:'Format presentation',dueDaysFromStart:-2,dueTime:'17:00'},{name:'Distribute to board members',dueDaysFromStart:0,dueTime:'09:00'}]) }}),
    prisma.taskDefinition.create({ data: { taskCode: 'SOP-011', name: 'Management Fee Calculation', description: 'Calculate management fees based on committed capital or NAV per LPA terms.', category: 'Fund Accounting', frequency: 'Quarterly', estimatedMinutes: 180, priority: 'High', department: 'Fund Accounting', steps: JSON.stringify([{name:'Determine fee basis per LPA',dueDaysFromStart:0,dueTime:'10:00'},{name:'Calculate fee for period',dueDaysFromStart:0,dueTime:'14:00'},{name:'Apply fee offsets if applicable',dueDaysFromStart:1,dueTime:'10:00'},{name:'Prepare fee invoice',dueDaysFromStart:1,dueTime:'17:00'},{name:'Obtain GP approval',dueDaysFromStart:2,dueTime:'17:00'},{name:'Book fee journal entries',dueDaysFromStart:3,dueTime:'12:00'}]) }}),
    prisma.taskDefinition.create({ data: { taskCode: 'SOP-012', name: 'Carried Interest Waterfall', description: 'Calculate carried interest allocation per the fund waterfall including preferred return, catch-up, and carry splits.', category: 'Fund Accounting', frequency: 'Quarterly', estimatedMinutes: 600, priority: 'Critical', department: 'Fund Accounting', steps: JSON.stringify([{name:'Calculate total distributable proceeds',dueDaysFromStart:0,dueTime:'10:00'},{name:'Apply preferred return (8% hurdle)',dueDaysFromStart:0,dueTime:'14:00'},{name:'Calculate GP catch-up',dueDaysFromStart:1,dueTime:'10:00'},{name:'Apply carry percentage split',dueDaysFromStart:1,dueTime:'14:00'},{name:'Verify clawback provisions',dueDaysFromStart:2,dueTime:'12:00'},{name:'Prepare waterfall schedule',dueDaysFromStart:2,dueTime:'17:00'},{name:'Review with GP',dueDaysFromStart:3,dueTime:'17:00'}]) }}),
  ]);
  console.log(`Created ${taskDefs.length} task definitions`);

  // ═══════════════════════════════════════════════
  // INTERNAL USERS — populated from employees.csv (~949 rows)
  // ═══════════════════════════════════════════════
  const csvRows = parseCSV('prisma/employees.csv');
  const emailSeen = new Map<string, number>();
  const HIRE_START = new Date('2019-01-01');
  const HIRE_END = new Date('2026-03-01');
  const NOW_MS = Date.now();
  const SEVEN_DAYS = 7 * 86_400_000;
  const NINETY_DAYS = 90 * 86_400_000;

  const allUserData = csvRows.map((row, index) => {
    const { first, last } = parseName(row['Name'] ?? '');
    const email = makeEmail(first, last, emailSeen);
    const title = row['Job Title'] ?? '';
    const department = row['Department'] ?? '';
    const managerRaw = (row['Reports To'] ?? '').trim();
    let managerName: string | null = null;
    if (managerRaw) {
      const mgr = parseName(managerRaw);
      managerName = `${mgr.first} ${mgr.last}`;
    }
    const seniorityLevel = deriveSeniorityFromTitle(title);
    const access = deriveModuleAccess(department, seniorityLevel, email);

    return {
      employeeId: `JSQ-${String(index + 1).padStart(4, '0')}`,
      firstName: first,
      lastName: last,
      email,
      title,
      role: seedDeriveRole(title),
      department,
      managerName,
      officeLocation: row['Location'] ?? null,
      seniorityLevel,
      employmentStatus: 'Active',
      employmentType: 'Full-Time',
      mfaEnabled: true,
      crmAccess: access.crmAccess,
      investorPortalAccess: access.investorPortalAccess,
      reportingPlatformAccess: access.reportingPlatformAccess,
      complianceSystemAccess: access.complianceSystemAccess,
      dataWarehouseAccess: access.dataWarehouseAccess,
      biToolAccess: access.biToolAccess,
      apiAccess: access.apiAccess,
      adminPanelAccess: access.adminPanelAccess,
      documentMgmtAccess: access.documentMgmtAccess,
      hrSystemAccess: access.hrSystemAccess,
      githubAccess: access.githubAccess,
      vpnAccess: access.vpnAccess,
      hireDate: randomDate(HIRE_START, HIRE_END),
      lastLogin: new Date(NOW_MS - Math.random() * SEVEN_DAYS),
      lastPasswordChange: new Date(NOW_MS - Math.random() * NINETY_DAYS),
      requiredTrainingComplete: Math.random() < 0.92,
      dataQualityScore: randomInt(70, 99),
      confidenceScore: randomInt(75, 99) / 100,
    };
  });

  await prisma.internalUser.createMany({ data: allUserData });
  // Guarantee System Admin flags — emails use first-initial+last format (bwayne@, ahyder@, chammond@)
  const adminEmails = ['bwayne@junipersquare.com', 'ahyder@junipersquare.com', 'chammond@junipersquare.com'];
  for (const ae of adminEmails) {
    await prisma.internalUser.updateMany({
      where: { email: ae },
      data: {
        adminPanelAccess: true, crmAccess: true, investorPortalAccess: true,
        reportingPlatformAccess: true, complianceSystemAccess: true,
        dataWarehouseAccess: true, biToolAccess: true, apiAccess: true,
        documentMgmtAccess: true, hrSystemAccess: true, githubAccess: true,
        vpnAccess: true,
      },
    });
  }
  const users = await prisma.internalUser.findMany({ orderBy: { employeeId: 'asc' } });
  console.log(`Created ${users.length} internal users from CSV`);

  // ── Assign podId to a sampling of InternalUsers so Pod analysis page has team data ──
  const eligibleUsers = await prisma.internalUser.findMany({
    where: {
      department: { in: ['FA - Fund Accounting', 'FA - Onboarding', 'FA - Capital Events', 'FA - Core IS', 'FA - Fundraising', 'FA - Strategy & Ops'] },
    },
    select: { id: true, department: true },
    take: 90,
  });
  for (const u of eligibleUsers) {
    const pod = u.department === 'FA - Fund Accounting' ? pick(['POD-A', 'POD-A', 'POD-B', 'POD-C']) :
                u.department === 'FA - Onboarding' ? pick(['POD-B', 'POD-C']) :
                u.department === 'FA - Capital Events' ? pick(['POD-A', 'POD-B']) :
                u.department === 'FA - Core IS' ? pick(['POD-A', 'POD-B', 'POD-C']) :
                pick(['POD-A', 'POD-C']);
    await prisma.internalUser.update({ where: { id: u.id }, data: { podId: pod } });
  }
  console.log(`Assigned podId to ${eligibleUsers.length} internal users across POD-A/B/C`);

  // ──── end of InternalUser CSV section ────

  // ═══════════════════════════════════════════════
  // INTERNAL USER SURVEYS (Qualtrics FA Onboarding)
  // ═══════════════════════════════════════════════
  const S = (v: string) => v; // level helper for readability
  const ENTRY   = 'Entry-Level: 0-2 years';
  const JUNIOR  = 'Junior-Level: 2-5 years';
  const MID     = 'Mid-Level: 5-7 years';
  const SENIOR  = 'Senior-Level: 7-10 years';
  const EXPERT  = 'Specialist/Expert: 10+ years';
  const NONE    = 'None';

  await Promise.all([
    // EMP-001 Megan Moore — Managing Director, Private Equity, 18+ yrs industry
    prisma.internalUserSurvey.create({ data: {
      employeeId: users[0].id,
      college: 'University of Texas at Austin', graduateDegree: 'MBA', hasMba: true, hasCpa: false,
      otherCerts: 'CFA Level III',
      priorFaFirms: JSON.stringify(['Citco Fund Services', 'Alter Domus']),
      priorGpFirms: JSON.stringify(['KKR', 'Advent International']),
      priorAuditFirms: JSON.stringify([]),
      priorConsultingFirms: JSON.stringify(['McKinsey & Company']),
      csYears: 18, csLevel: EXPERT,
      complianceSkills: JSON.stringify({
        'Tax Services': EXPERT, 'FATCA/CRS Reporting': SENIOR, 'AML/KYC': SENIOR,
        'SEC Regulatory Reporting': EXPERT, 'State Registration / Blue Sky': SENIOR,
        'ERISA Compliance': MID, 'SOX Controls': SENIOR, 'Audit Coordination': EXPERT,
      }),
      pmYears: 18,
      pmAssetSkills: JSON.stringify({
        'Private Equity': EXPERT, 'Venture Capital': SENIOR, 'Real Estate (Equity)': MID,
        'Real Estate (Debt)': JUNIOR, 'Infrastructure': MID, 'Private Credit / Direct Lending': SENIOR,
        'CLOs / Structured Credit': JUNIOR, 'Hedge Funds': MID, 'Fund of Funds': SENIOR,
        'Co-Investments': EXPERT, 'Secondaries': SENIOR, 'GP-Led Secondaries': MID,
        'Continuation Vehicles': MID, 'Distressed / Special Situations': JUNIOR,
        'Growth Equity': SENIOR, 'Buyouts (Large-Cap)': EXPERT, 'Buyouts (Mid-Market)': EXPERT,
        'Buyouts (Small-Cap)': SENIOR, 'SPAC / Public Equity': JUNIOR,
        'Natural Resources / Commodities': ENTRY, 'Digital Assets / Crypto': NONE,
      }),
      allocationSkills: JSON.stringify({
        'Management Fee Calculations': EXPERT, 'Capital Call Processing': EXPERT,
        'Distribution Calculations': EXPERT, 'Waterfall Calculations': EXPERT,
        'Carried Interest Calculations': EXPERT, 'Preferred Return Calculations': EXPERT,
        'Hurdle Rate Calculations': EXPERT, 'Clawback Provisions': SENIOR,
        'Equalization / Catch-Up': SENIOR, 'Capital Account Statements': EXPERT,
        'PFIC Calculations': SENIOR, 'ECI / UBTI Tracking': SENIOR,
        'Section 754 Adjustments': MID, 'Income Allocation Methods': EXPERT,
        'Side Pocket Accounting': MID, 'In-Kind Distributions': SENIOR,
        'Tax Distribution Policy': SENIOR, 'Multi-Class Structures': EXPERT,
      }),
      otherOpSkills: JSON.stringify({
        'Wire Transfers': EXPERT, 'Cash Reconciliation': EXPERT, 'Bank Reconciliation': EXPERT,
        'Accounts Payable': SENIOR, 'Accounts Receivable': SENIOR, 'Expense Allocations': EXPERT,
        'GL Journal Entries': EXPERT, 'Month-End Close': EXPERT,
        'Financial Statement Preparation': EXPERT, 'Audit Support': EXPERT,
        'Investor Portal Management': SENIOR,
      }),
      preferredPmSoftware: 'Investran',
      technologySkills: JSON.stringify({
        'Investran': EXPERT, 'Allvue / AltaReturn': SENIOR, 'Geneva / SS&C': MID,
        'Excel': EXPERT, 'Power BI / Tableau': SENIOR, 'Salesforce': MID,
        'Juniper Square (Platform)': SENIOR, 'DocuSign / Contract Tools': SENIOR,
        'Python / SQL': ENTRY,
      }),
      submittedAt: new Date('2019-04-01'),
    }}),

    // EMP-002 Jessica Cruz — Director Client Services, 12 yrs
    prisma.internalUserSurvey.create({ data: {
      employeeId: users[1].id,
      college: 'University of Southern California', graduateDegree: null, hasMba: false, hasCpa: false,
      otherCerts: null,
      priorFaFirms: JSON.stringify(['SS&C GlobeOp', 'Vistra']),
      priorGpFirms: JSON.stringify(['Ares Management']),
      priorAuditFirms: JSON.stringify([]),
      priorConsultingFirms: JSON.stringify([]),
      csYears: 12, csLevel: EXPERT,
      complianceSkills: JSON.stringify({
        'Tax Services': MID, 'FATCA/CRS Reporting': SENIOR, 'AML/KYC': SENIOR,
        'SEC Regulatory Reporting': MID, 'State Registration / Blue Sky': JUNIOR,
        'ERISA Compliance': JUNIOR, 'SOX Controls': MID, 'Audit Coordination': SENIOR,
      }),
      pmYears: 12,
      pmAssetSkills: JSON.stringify({
        'Private Equity': EXPERT, 'Venture Capital': SENIOR, 'Real Estate (Equity)': JUNIOR,
        'Real Estate (Debt)': JUNIOR, 'Infrastructure': JUNIOR, 'Private Credit / Direct Lending': SENIOR,
        'CLOs / Structured Credit': ENTRY, 'Hedge Funds': JUNIOR, 'Fund of Funds': MID,
        'Co-Investments': SENIOR, 'Secondaries': MID, 'GP-Led Secondaries': ENTRY,
        'Continuation Vehicles': ENTRY, 'Distressed / Special Situations': JUNIOR,
        'Growth Equity': SENIOR, 'Buyouts (Large-Cap)': SENIOR, 'Buyouts (Mid-Market)': EXPERT,
        'Buyouts (Small-Cap)': SENIOR, 'SPAC / Public Equity': NONE,
        'Natural Resources / Commodities': NONE, 'Digital Assets / Crypto': NONE,
      }),
      allocationSkills: JSON.stringify({
        'Management Fee Calculations': SENIOR, 'Capital Call Processing': EXPERT,
        'Distribution Calculations': SENIOR, 'Waterfall Calculations': MID,
        'Carried Interest Calculations': MID, 'Preferred Return Calculations': SENIOR,
        'Hurdle Rate Calculations': MID, 'Clawback Provisions': JUNIOR,
        'Equalization / Catch-Up': MID, 'Capital Account Statements': SENIOR,
        'PFIC Calculations': JUNIOR, 'ECI / UBTI Tracking': JUNIOR,
        'Section 754 Adjustments': NONE, 'Income Allocation Methods': SENIOR,
        'Side Pocket Accounting': NONE, 'In-Kind Distributions': MID,
        'Tax Distribution Policy': MID, 'Multi-Class Structures': MID,
      }),
      otherOpSkills: JSON.stringify({
        'Wire Transfers': SENIOR, 'Cash Reconciliation': SENIOR, 'Bank Reconciliation': SENIOR,
        'Accounts Payable': MID, 'Accounts Receivable': MID, 'Expense Allocations': SENIOR,
        'GL Journal Entries': SENIOR, 'Month-End Close': SENIOR,
        'Financial Statement Preparation': SENIOR, 'Audit Support': SENIOR,
        'Investor Portal Management': EXPERT,
      }),
      preferredPmSoftware: 'Juniper Square',
      technologySkills: JSON.stringify({
        'Investran': SENIOR, 'Allvue / AltaReturn': MID, 'Geneva / SS&C': JUNIOR,
        'Excel': EXPERT, 'Power BI / Tableau': MID, 'Salesforce': SENIOR,
        'Juniper Square (Platform)': EXPERT, 'DocuSign / Contract Tools': SENIOR,
        'Python / SQL': NONE,
      }),
      submittedAt: new Date('2020-07-15'),
    }}),

    // EMP-003 Diana Smith — Director Fund Accounting, 15 yrs
    prisma.internalUserSurvey.create({ data: {
      employeeId: users[2].id,
      college: 'New York University (Stern)', graduateDegree: 'MBA', hasMba: true, hasCpa: true,
      otherCerts: null,
      priorFaFirms: JSON.stringify(['Citco Fund Services', 'Sanne Group']),
      priorGpFirms: JSON.stringify([]),
      priorAuditFirms: JSON.stringify(['PricewaterhouseCoopers']),
      priorConsultingFirms: JSON.stringify([]),
      csYears: 15, csLevel: EXPERT,
      complianceSkills: JSON.stringify({
        'Tax Services': EXPERT, 'FATCA/CRS Reporting': EXPERT, 'AML/KYC': SENIOR,
        'SEC Regulatory Reporting': EXPERT, 'State Registration / Blue Sky': MID,
        'ERISA Compliance': SENIOR, 'SOX Controls': EXPERT, 'Audit Coordination': EXPERT,
      }),
      pmYears: 15,
      pmAssetSkills: JSON.stringify({
        'Private Equity': EXPERT, 'Venture Capital': MID, 'Real Estate (Equity)': MID,
        'Real Estate (Debt)': JUNIOR, 'Infrastructure': JUNIOR, 'Private Credit / Direct Lending': SENIOR,
        'CLOs / Structured Credit': MID, 'Hedge Funds': SENIOR, 'Fund of Funds': SENIOR,
        'Co-Investments': EXPERT, 'Secondaries': SENIOR, 'GP-Led Secondaries': SENIOR,
        'Continuation Vehicles': MID, 'Distressed / Special Situations': MID,
        'Growth Equity': SENIOR, 'Buyouts (Large-Cap)': EXPERT, 'Buyouts (Mid-Market)': EXPERT,
        'Buyouts (Small-Cap)': SENIOR, 'SPAC / Public Equity': JUNIOR,
        'Natural Resources / Commodities': ENTRY, 'Digital Assets / Crypto': NONE,
      }),
      allocationSkills: JSON.stringify({
        'Management Fee Calculations': EXPERT, 'Capital Call Processing': EXPERT,
        'Distribution Calculations': EXPERT, 'Waterfall Calculations': EXPERT,
        'Carried Interest Calculations': EXPERT, 'Preferred Return Calculations': EXPERT,
        'Hurdle Rate Calculations': EXPERT, 'Clawback Provisions': EXPERT,
        'Equalization / Catch-Up': SENIOR, 'Capital Account Statements': EXPERT,
        'PFIC Calculations': EXPERT, 'ECI / UBTI Tracking': EXPERT,
        'Section 754 Adjustments': SENIOR, 'Income Allocation Methods': EXPERT,
        'Side Pocket Accounting': SENIOR, 'In-Kind Distributions': SENIOR,
        'Tax Distribution Policy': EXPERT, 'Multi-Class Structures': EXPERT,
      }),
      otherOpSkills: JSON.stringify({
        'Wire Transfers': EXPERT, 'Cash Reconciliation': EXPERT, 'Bank Reconciliation': EXPERT,
        'Accounts Payable': EXPERT, 'Accounts Receivable': EXPERT, 'Expense Allocations': EXPERT,
        'GL Journal Entries': EXPERT, 'Month-End Close': EXPERT,
        'Financial Statement Preparation': EXPERT, 'Audit Support': EXPERT,
        'Investor Portal Management': SENIOR,
      }),
      preferredPmSoftware: 'Investran',
      technologySkills: JSON.stringify({
        'Investran': EXPERT, 'Allvue / AltaReturn': EXPERT, 'Geneva / SS&C': SENIOR,
        'Excel': EXPERT, 'Power BI / Tableau': SENIOR, 'Salesforce': MID,
        'Juniper Square (Platform)': SENIOR, 'DocuSign / Contract Tools': SENIOR,
        'Python / SQL': JUNIOR,
      }),
      submittedAt: new Date('2018-02-01'),
    }}),

    // EMP-004 Jason Cooper — VP Investor Services, 10 yrs
    prisma.internalUserSurvey.create({ data: {
      employeeId: users[3].id,
      college: 'Boston College (Carroll)', graduateDegree: null, hasMba: false, hasCpa: false,
      otherCerts: 'CAIA Level I',
      priorFaFirms: JSON.stringify(['IQ-EQ', 'TMF Group']),
      priorGpFirms: JSON.stringify(['Bain Capital']),
      priorAuditFirms: JSON.stringify([]),
      priorConsultingFirms: JSON.stringify([]),
      csYears: 10, csLevel: EXPERT,
      complianceSkills: JSON.stringify({
        'Tax Services': JUNIOR, 'FATCA/CRS Reporting': SENIOR, 'AML/KYC': EXPERT,
        'SEC Regulatory Reporting': SENIOR, 'State Registration / Blue Sky': MID,
        'ERISA Compliance': SENIOR, 'SOX Controls': MID, 'Audit Coordination': MID,
      }),
      pmYears: 10,
      pmAssetSkills: JSON.stringify({
        'Private Equity': EXPERT, 'Venture Capital': SENIOR, 'Real Estate (Equity)': MID,
        'Real Estate (Debt)': JUNIOR, 'Infrastructure': JUNIOR, 'Private Credit / Direct Lending': SENIOR,
        'CLOs / Structured Credit': JUNIOR, 'Hedge Funds': MID, 'Fund of Funds': SENIOR,
        'Co-Investments': SENIOR, 'Secondaries': MID, 'GP-Led Secondaries': JUNIOR,
        'Continuation Vehicles': JUNIOR, 'Distressed / Special Situations': JUNIOR,
        'Growth Equity': SENIOR, 'Buyouts (Large-Cap)': SENIOR, 'Buyouts (Mid-Market)': EXPERT,
        'Buyouts (Small-Cap)': SENIOR, 'SPAC / Public Equity': JUNIOR,
        'Natural Resources / Commodities': NONE, 'Digital Assets / Crypto': NONE,
      }),
      allocationSkills: JSON.stringify({
        'Management Fee Calculations': SENIOR, 'Capital Call Processing': EXPERT,
        'Distribution Calculations': SENIOR, 'Waterfall Calculations': MID,
        'Carried Interest Calculations': JUNIOR, 'Preferred Return Calculations': SENIOR,
        'Hurdle Rate Calculations': MID, 'Clawback Provisions': JUNIOR,
        'Equalization / Catch-Up': JUNIOR, 'Capital Account Statements': SENIOR,
        'PFIC Calculations': ENTRY, 'ECI / UBTI Tracking': JUNIOR,
        'Section 754 Adjustments': NONE, 'Income Allocation Methods': SENIOR,
        'Side Pocket Accounting': NONE, 'In-Kind Distributions': SENIOR,
        'Tax Distribution Policy': JUNIOR, 'Multi-Class Structures': MID,
      }),
      otherOpSkills: JSON.stringify({
        'Wire Transfers': SENIOR, 'Cash Reconciliation': SENIOR, 'Bank Reconciliation': SENIOR,
        'Accounts Payable': JUNIOR, 'Accounts Receivable': JUNIOR, 'Expense Allocations': MID,
        'GL Journal Entries': MID, 'Month-End Close': SENIOR,
        'Financial Statement Preparation': SENIOR, 'Audit Support': SENIOR,
        'Investor Portal Management': EXPERT,
      }),
      preferredPmSoftware: 'Juniper Square',
      technologySkills: JSON.stringify({
        'Investran': MID, 'Allvue / AltaReturn': JUNIOR, 'Geneva / SS&C': ENTRY,
        'Excel': EXPERT, 'Power BI / Tableau': MID, 'Salesforce': EXPERT,
        'Juniper Square (Platform)': EXPERT, 'DocuSign / Contract Tools': EXPERT,
        'Python / SQL': ENTRY,
      }),
      submittedAt: new Date('2021-05-01'),
    }}),

    // EMP-005 Steven Wright — VP Fund Accounting, 9 yrs
    prisma.internalUserSurvey.create({ data: {
      employeeId: users[4].id,
      college: 'Southern Methodist University (Cox)', graduateDegree: null, hasMba: false, hasCpa: true,
      otherCerts: null,
      priorFaFirms: JSON.stringify(['Alter Domus', 'Vistra']),
      priorGpFirms: JSON.stringify([]),
      priorAuditFirms: JSON.stringify(['Deloitte']),
      priorConsultingFirms: JSON.stringify([]),
      csYears: 9, csLevel: SENIOR,
      complianceSkills: JSON.stringify({
        'Tax Services': SENIOR, 'FATCA/CRS Reporting': MID, 'AML/KYC': JUNIOR,
        'SEC Regulatory Reporting': SENIOR, 'State Registration / Blue Sky': JUNIOR,
        'ERISA Compliance': MID, 'SOX Controls': SENIOR, 'Audit Coordination': SENIOR,
      }),
      pmYears: 9,
      pmAssetSkills: JSON.stringify({
        'Private Equity': SENIOR, 'Venture Capital': MID, 'Real Estate (Equity)': JUNIOR,
        'Real Estate (Debt)': JUNIOR, 'Infrastructure': ENTRY, 'Private Credit / Direct Lending': SENIOR,
        'CLOs / Structured Credit': MID, 'Hedge Funds': SENIOR, 'Fund of Funds': MID,
        'Co-Investments': SENIOR, 'Secondaries': MID, 'GP-Led Secondaries': JUNIOR,
        'Continuation Vehicles': JUNIOR, 'Distressed / Special Situations': JUNIOR,
        'Growth Equity': MID, 'Buyouts (Large-Cap)': SENIOR, 'Buyouts (Mid-Market)': SENIOR,
        'Buyouts (Small-Cap)': SENIOR, 'SPAC / Public Equity': ENTRY,
        'Natural Resources / Commodities': ENTRY, 'Digital Assets / Crypto': NONE,
      }),
      allocationSkills: JSON.stringify({
        'Management Fee Calculations': SENIOR, 'Capital Call Processing': EXPERT,
        'Distribution Calculations': SENIOR, 'Waterfall Calculations': SENIOR,
        'Carried Interest Calculations': SENIOR, 'Preferred Return Calculations': SENIOR,
        'Hurdle Rate Calculations': SENIOR, 'Clawback Provisions': MID,
        'Equalization / Catch-Up': MID, 'Capital Account Statements': SENIOR,
        'PFIC Calculations': MID, 'ECI / UBTI Tracking': MID,
        'Section 754 Adjustments': JUNIOR, 'Income Allocation Methods': SENIOR,
        'Side Pocket Accounting': JUNIOR, 'In-Kind Distributions': MID,
        'Tax Distribution Policy': SENIOR, 'Multi-Class Structures': SENIOR,
      }),
      otherOpSkills: JSON.stringify({
        'Wire Transfers': EXPERT, 'Cash Reconciliation': EXPERT, 'Bank Reconciliation': EXPERT,
        'Accounts Payable': SENIOR, 'Accounts Receivable': SENIOR, 'Expense Allocations': EXPERT,
        'GL Journal Entries': EXPERT, 'Month-End Close': EXPERT,
        'Financial Statement Preparation': SENIOR, 'Audit Support': SENIOR,
        'Investor Portal Management': MID,
      }),
      preferredPmSoftware: 'Investran',
      technologySkills: JSON.stringify({
        'Investran': SENIOR, 'Allvue / AltaReturn': MID, 'Geneva / SS&C': JUNIOR,
        'Excel': EXPERT, 'Power BI / Tableau': MID, 'Salesforce': ENTRY,
        'Juniper Square (Platform)': MID, 'DocuSign / Contract Tools': MID,
        'Python / SQL': ENTRY,
      }),
      submittedAt: new Date('2022-02-15'),
    }}),

    // EMP-006 Michael Collins — Associate Operations, 4 yrs
    prisma.internalUserSurvey.create({ data: {
      employeeId: users[5].id,
      college: 'New York University', graduateDegree: null, hasMba: false, hasCpa: false,
      otherCerts: null,
      priorFaFirms: JSON.stringify(['Sanne Group']),
      priorGpFirms: JSON.stringify([]),
      priorAuditFirms: JSON.stringify([]),
      priorConsultingFirms: JSON.stringify(['Accenture']),
      csYears: 4, csLevel: JUNIOR,
      complianceSkills: JSON.stringify({
        'Tax Services': ENTRY, 'FATCA/CRS Reporting': JUNIOR, 'AML/KYC': MID,
        'SEC Regulatory Reporting': JUNIOR, 'State Registration / Blue Sky': NONE,
        'ERISA Compliance': ENTRY, 'SOX Controls': JUNIOR, 'Audit Coordination': JUNIOR,
      }),
      pmYears: 4,
      pmAssetSkills: JSON.stringify({
        'Private Equity': MID, 'Venture Capital': JUNIOR, 'Real Estate (Equity)': ENTRY,
        'Real Estate (Debt)': ENTRY, 'Infrastructure': NONE, 'Private Credit / Direct Lending': JUNIOR,
        'CLOs / Structured Credit': NONE, 'Hedge Funds': JUNIOR, 'Fund of Funds': JUNIOR,
        'Co-Investments': JUNIOR, 'Secondaries': ENTRY, 'GP-Led Secondaries': NONE,
        'Continuation Vehicles': NONE, 'Distressed / Special Situations': NONE,
        'Growth Equity': JUNIOR, 'Buyouts (Large-Cap)': JUNIOR, 'Buyouts (Mid-Market)': MID,
        'Buyouts (Small-Cap)': JUNIOR, 'SPAC / Public Equity': NONE,
        'Natural Resources / Commodities': NONE, 'Digital Assets / Crypto': ENTRY,
      }),
      allocationSkills: JSON.stringify({
        'Management Fee Calculations': MID, 'Capital Call Processing': MID,
        'Distribution Calculations': JUNIOR, 'Waterfall Calculations': ENTRY,
        'Carried Interest Calculations': ENTRY, 'Preferred Return Calculations': JUNIOR,
        'Hurdle Rate Calculations': ENTRY, 'Clawback Provisions': NONE,
        'Equalization / Catch-Up': NONE, 'Capital Account Statements': JUNIOR,
        'PFIC Calculations': NONE, 'ECI / UBTI Tracking': NONE,
        'Section 754 Adjustments': NONE, 'Income Allocation Methods': JUNIOR,
        'Side Pocket Accounting': NONE, 'In-Kind Distributions': NONE,
        'Tax Distribution Policy': NONE, 'Multi-Class Structures': ENTRY,
      }),
      otherOpSkills: JSON.stringify({
        'Wire Transfers': JUNIOR, 'Cash Reconciliation': MID, 'Bank Reconciliation': MID,
        'Accounts Payable': MID, 'Accounts Receivable': JUNIOR, 'Expense Allocations': MID,
        'GL Journal Entries': MID, 'Month-End Close': MID,
        'Financial Statement Preparation': JUNIOR, 'Audit Support': JUNIOR,
        'Investor Portal Management': JUNIOR,
      }),
      preferredPmSoftware: 'Allvue / AltaReturn',
      technologySkills: JSON.stringify({
        'Investran': JUNIOR, 'Allvue / AltaReturn': MID, 'Geneva / SS&C': NONE,
        'Excel': SENIOR, 'Power BI / Tableau': JUNIOR, 'Salesforce': MID,
        'Juniper Square (Platform)': MID, 'DocuSign / Contract Tools': MID,
        'Python / SQL': JUNIOR,
      }),
      submittedAt: new Date('2022-09-01'),
    }}),

    // EMP-007 Sarah Garcia — Associate Compliance, 4 yrs
    prisma.internalUserSurvey.create({ data: {
      employeeId: users[6].id,
      college: 'Boston University', graduateDegree: null, hasMba: false, hasCpa: false,
      otherCerts: 'CAMS (Certified Anti-Money Laundering Specialist)',
      priorFaFirms: JSON.stringify(['IQ-EQ']),
      priorGpFirms: JSON.stringify([]),
      priorAuditFirms: JSON.stringify([]),
      priorConsultingFirms: JSON.stringify([]),
      csYears: 4, csLevel: JUNIOR,
      complianceSkills: JSON.stringify({
        'Tax Services': ENTRY, 'FATCA/CRS Reporting': MID, 'AML/KYC': SENIOR,
        'SEC Regulatory Reporting': JUNIOR, 'State Registration / Blue Sky': JUNIOR,
        'ERISA Compliance': JUNIOR, 'SOX Controls': MID, 'Audit Coordination': MID,
      }),
      pmYears: 4,
      pmAssetSkills: JSON.stringify({
        'Private Equity': MID, 'Venture Capital': JUNIOR, 'Real Estate (Equity)': NONE,
        'Real Estate (Debt)': NONE, 'Infrastructure': NONE, 'Private Credit / Direct Lending': JUNIOR,
        'CLOs / Structured Credit': NONE, 'Hedge Funds': JUNIOR, 'Fund of Funds': MID,
        'Co-Investments': JUNIOR, 'Secondaries': NONE, 'GP-Led Secondaries': NONE,
        'Continuation Vehicles': NONE, 'Distressed / Special Situations': NONE,
        'Growth Equity': JUNIOR, 'Buyouts (Large-Cap)': JUNIOR, 'Buyouts (Mid-Market)': MID,
        'Buyouts (Small-Cap)': JUNIOR, 'SPAC / Public Equity': NONE,
        'Natural Resources / Commodities': NONE, 'Digital Assets / Crypto': ENTRY,
      }),
      allocationSkills: JSON.stringify({
        'Management Fee Calculations': ENTRY, 'Capital Call Processing': JUNIOR,
        'Distribution Calculations': ENTRY, 'Waterfall Calculations': NONE,
        'Carried Interest Calculations': NONE, 'Preferred Return Calculations': ENTRY,
        'Hurdle Rate Calculations': NONE, 'Clawback Provisions': NONE,
        'Equalization / Catch-Up': NONE, 'Capital Account Statements': JUNIOR,
        'PFIC Calculations': NONE, 'ECI / UBTI Tracking': ENTRY,
        'Section 754 Adjustments': NONE, 'Income Allocation Methods': ENTRY,
        'Side Pocket Accounting': NONE, 'In-Kind Distributions': NONE,
        'Tax Distribution Policy': NONE, 'Multi-Class Structures': NONE,
      }),
      otherOpSkills: JSON.stringify({
        'Wire Transfers': ENTRY, 'Cash Reconciliation': JUNIOR, 'Bank Reconciliation': JUNIOR,
        'Accounts Payable': NONE, 'Accounts Receivable': NONE, 'Expense Allocations': ENTRY,
        'GL Journal Entries': ENTRY, 'Month-End Close': ENTRY,
        'Financial Statement Preparation': JUNIOR, 'Audit Support': MID,
        'Investor Portal Management': MID,
      }),
      preferredPmSoftware: 'Juniper Square',
      technologySkills: JSON.stringify({
        'Investran': ENTRY, 'Allvue / AltaReturn': NONE, 'Geneva / SS&C': NONE,
        'Excel': SENIOR, 'Power BI / Tableau': MID, 'Salesforce': MID,
        'Juniper Square (Platform)': SENIOR, 'DocuSign / Contract Tools': SENIOR,
        'Python / SQL': ENTRY,
      }),
      submittedAt: new Date('2022-07-01'),
    }}),

    // EMP-008 Brandon Cohen — Analyst Tax, 2.5 yrs
    prisma.internalUserSurvey.create({ data: {
      employeeId: users[7].id,
      college: 'University of Texas at Dallas', graduateDegree: 'MS Accounting', hasMba: false, hasCpa: false,
      otherCerts: 'CPA Candidate (1 section passed)',
      priorFaFirms: JSON.stringify([]),
      priorGpFirms: JSON.stringify([]),
      priorAuditFirms: JSON.stringify(['Grant Thornton']),
      priorConsultingFirms: JSON.stringify([]),
      csYears: 2.5, csLevel: JUNIOR,
      complianceSkills: JSON.stringify({
        'Tax Services': MID, 'FATCA/CRS Reporting': JUNIOR, 'AML/KYC': ENTRY,
        'SEC Regulatory Reporting': ENTRY, 'State Registration / Blue Sky': NONE,
        'ERISA Compliance': NONE, 'SOX Controls': JUNIOR, 'Audit Coordination': JUNIOR,
      }),
      pmYears: 2.5,
      pmAssetSkills: JSON.stringify({
        'Private Equity': MID, 'Venture Capital': ENTRY, 'Real Estate (Equity)': JUNIOR,
        'Real Estate (Debt)': ENTRY, 'Infrastructure': NONE, 'Private Credit / Direct Lending': JUNIOR,
        'CLOs / Structured Credit': NONE, 'Hedge Funds': ENTRY, 'Fund of Funds': ENTRY,
        'Co-Investments': ENTRY, 'Secondaries': NONE, 'GP-Led Secondaries': NONE,
        'Continuation Vehicles': NONE, 'Distressed / Special Situations': NONE,
        'Growth Equity': ENTRY, 'Buyouts (Large-Cap)': JUNIOR, 'Buyouts (Mid-Market)': MID,
        'Buyouts (Small-Cap)': JUNIOR, 'SPAC / Public Equity': NONE,
        'Natural Resources / Commodities': NONE, 'Digital Assets / Crypto': NONE,
      }),
      allocationSkills: JSON.stringify({
        'Management Fee Calculations': JUNIOR, 'Capital Call Processing': JUNIOR,
        'Distribution Calculations': JUNIOR, 'Waterfall Calculations': ENTRY,
        'Carried Interest Calculations': ENTRY, 'Preferred Return Calculations': JUNIOR,
        'Hurdle Rate Calculations': ENTRY, 'Clawback Provisions': NONE,
        'Equalization / Catch-Up': NONE, 'Capital Account Statements': MID,
        'PFIC Calculations': MID, 'ECI / UBTI Tracking': MID,
        'Section 754 Adjustments': MID, 'Income Allocation Methods': JUNIOR,
        'Side Pocket Accounting': ENTRY, 'In-Kind Distributions': ENTRY,
        'Tax Distribution Policy': MID, 'Multi-Class Structures': ENTRY,
      }),
      otherOpSkills: JSON.stringify({
        'Wire Transfers': ENTRY, 'Cash Reconciliation': JUNIOR, 'Bank Reconciliation': JUNIOR,
        'Accounts Payable': JUNIOR, 'Accounts Receivable': JUNIOR, 'Expense Allocations': JUNIOR,
        'GL Journal Entries': MID, 'Month-End Close': JUNIOR,
        'Financial Statement Preparation': MID, 'Audit Support': MID,
        'Investor Portal Management': ENTRY,
      }),
      preferredPmSoftware: 'Investran',
      technologySkills: JSON.stringify({
        'Investran': JUNIOR, 'Allvue / AltaReturn': NONE, 'Geneva / SS&C': NONE,
        'Excel': EXPERT, 'Power BI / Tableau': MID, 'Salesforce': NONE,
        'Juniper Square (Platform)': ENTRY, 'DocuSign / Contract Tools': JUNIOR,
        'Python / SQL': MID,
      }),
      submittedAt: new Date('2023-09-15'),
    }}),

    // EMP-009 Tyler White — Analyst Technology, 2.2 yrs
    prisma.internalUserSurvey.create({ data: {
      employeeId: users[8].id,
      college: 'University of Texas at Austin (McCombs / CS)', graduateDegree: null, hasMba: false, hasCpa: false,
      otherCerts: null,
      priorFaFirms: JSON.stringify([]),
      priorGpFirms: JSON.stringify([]),
      priorAuditFirms: JSON.stringify([]),
      priorConsultingFirms: JSON.stringify(['Ernst & Young (EY Advisory)']),
      csYears: 2.2, csLevel: ENTRY,
      complianceSkills: JSON.stringify({
        'Tax Services': NONE, 'FATCA/CRS Reporting': NONE, 'AML/KYC': ENTRY,
        'SEC Regulatory Reporting': NONE, 'State Registration / Blue Sky': NONE,
        'ERISA Compliance': NONE, 'SOX Controls': ENTRY, 'Audit Coordination': ENTRY,
      }),
      pmYears: 2.2,
      pmAssetSkills: JSON.stringify({
        'Private Equity': JUNIOR, 'Venture Capital': JUNIOR, 'Real Estate (Equity)': NONE,
        'Real Estate (Debt)': NONE, 'Infrastructure': NONE, 'Private Credit / Direct Lending': ENTRY,
        'CLOs / Structured Credit': NONE, 'Hedge Funds': ENTRY, 'Fund of Funds': ENTRY,
        'Co-Investments': NONE, 'Secondaries': NONE, 'GP-Led Secondaries': NONE,
        'Continuation Vehicles': NONE, 'Distressed / Special Situations': NONE,
        'Growth Equity': ENTRY, 'Buyouts (Large-Cap)': ENTRY, 'Buyouts (Mid-Market)': JUNIOR,
        'Buyouts (Small-Cap)': ENTRY, 'SPAC / Public Equity': NONE,
        'Natural Resources / Commodities': NONE, 'Digital Assets / Crypto': MID,
      }),
      allocationSkills: JSON.stringify({
        'Management Fee Calculations': ENTRY, 'Capital Call Processing': ENTRY,
        'Distribution Calculations': NONE, 'Waterfall Calculations': NONE,
        'Carried Interest Calculations': NONE, 'Preferred Return Calculations': NONE,
        'Hurdle Rate Calculations': NONE, 'Clawback Provisions': NONE,
        'Equalization / Catch-Up': NONE, 'Capital Account Statements': ENTRY,
        'PFIC Calculations': NONE, 'ECI / UBTI Tracking': NONE,
        'Section 754 Adjustments': NONE, 'Income Allocation Methods': NONE,
        'Side Pocket Accounting': NONE, 'In-Kind Distributions': NONE,
        'Tax Distribution Policy': NONE, 'Multi-Class Structures': NONE,
      }),
      otherOpSkills: JSON.stringify({
        'Wire Transfers': NONE, 'Cash Reconciliation': ENTRY, 'Bank Reconciliation': ENTRY,
        'Accounts Payable': NONE, 'Accounts Receivable': NONE, 'Expense Allocations': ENTRY,
        'GL Journal Entries': ENTRY, 'Month-End Close': ENTRY,
        'Financial Statement Preparation': ENTRY, 'Audit Support': ENTRY,
        'Investor Portal Management': MID,
      }),
      preferredPmSoftware: 'Geneva / SS&C',
      technologySkills: JSON.stringify({
        'Investran': ENTRY, 'Allvue / AltaReturn': ENTRY, 'Geneva / SS&C': MID,
        'Excel': EXPERT, 'Power BI / Tableau': SENIOR, 'Salesforce': MID,
        'Juniper Square (Platform)': MID, 'DocuSign / Contract Tools': MID,
        'Python / SQL': EXPERT,
      }),
      submittedAt: new Date('2024-01-20'),
    }}),

    // EMP-010 Rebecca Sanders — Administrator Operations, 2.4 yrs
    prisma.internalUserSurvey.create({ data: {
      employeeId: users[9].id,
      college: 'Southern Methodist University', graduateDegree: null, hasMba: false, hasCpa: false,
      otherCerts: null,
      priorFaFirms: JSON.stringify([]),
      priorGpFirms: JSON.stringify([]),
      priorAuditFirms: JSON.stringify([]),
      priorConsultingFirms: JSON.stringify([]),
      csYears: 2.4, csLevel: JUNIOR,
      complianceSkills: JSON.stringify({
        'Tax Services': NONE, 'FATCA/CRS Reporting': NONE, 'AML/KYC': ENTRY,
        'SEC Regulatory Reporting': NONE, 'State Registration / Blue Sky': NONE,
        'ERISA Compliance': NONE, 'SOX Controls': ENTRY, 'Audit Coordination': ENTRY,
      }),
      pmYears: 2.4,
      pmAssetSkills: JSON.stringify({
        'Private Equity': ENTRY, 'Venture Capital': NONE, 'Real Estate (Equity)': NONE,
        'Real Estate (Debt)': NONE, 'Infrastructure': NONE, 'Private Credit / Direct Lending': NONE,
        'CLOs / Structured Credit': NONE, 'Hedge Funds': NONE, 'Fund of Funds': NONE,
        'Co-Investments': NONE, 'Secondaries': NONE, 'GP-Led Secondaries': NONE,
        'Continuation Vehicles': NONE, 'Distressed / Special Situations': NONE,
        'Growth Equity': NONE, 'Buyouts (Large-Cap)': NONE, 'Buyouts (Mid-Market)': ENTRY,
        'Buyouts (Small-Cap)': NONE, 'SPAC / Public Equity': NONE,
        'Natural Resources / Commodities': NONE, 'Digital Assets / Crypto': NONE,
      }),
      allocationSkills: JSON.stringify({
        'Management Fee Calculations': NONE, 'Capital Call Processing': ENTRY,
        'Distribution Calculations': NONE, 'Waterfall Calculations': NONE,
        'Carried Interest Calculations': NONE, 'Preferred Return Calculations': NONE,
        'Hurdle Rate Calculations': NONE, 'Clawback Provisions': NONE,
        'Equalization / Catch-Up': NONE, 'Capital Account Statements': ENTRY,
        'PFIC Calculations': NONE, 'ECI / UBTI Tracking': NONE,
        'Section 754 Adjustments': NONE, 'Income Allocation Methods': NONE,
        'Side Pocket Accounting': NONE, 'In-Kind Distributions': NONE,
        'Tax Distribution Policy': NONE, 'Multi-Class Structures': NONE,
      }),
      otherOpSkills: JSON.stringify({
        'Wire Transfers': ENTRY, 'Cash Reconciliation': ENTRY, 'Bank Reconciliation': ENTRY,
        'Accounts Payable': MID, 'Accounts Receivable': MID, 'Expense Allocations': JUNIOR,
        'GL Journal Entries': ENTRY, 'Month-End Close': ENTRY,
        'Financial Statement Preparation': NONE, 'Audit Support': ENTRY,
        'Investor Portal Management': JUNIOR,
      }),
      preferredPmSoftware: 'Juniper Square',
      technologySkills: JSON.stringify({
        'Investran': NONE, 'Allvue / AltaReturn': NONE, 'Geneva / SS&C': NONE,
        'Excel': SENIOR, 'Power BI / Tableau': ENTRY, 'Salesforce': MID,
        'Juniper Square (Platform)': MID, 'DocuSign / Contract Tools': SENIOR,
        'Python / SQL': NONE,
      }),
      submittedAt: new Date('2023-11-15'),
    }}),
  ]);
  console.log('Created 10 internal user surveys');

  // ═══════════════════════════════════════════════
  // TASK ASSIGNMENTS (25)
  // ═══════════════════════════════════════════════
  const now = new Date();
  const d = (days: number) => new Date(now.getTime() + days * 86400000);
  const iso = (days: number) => new Date(now.getTime() + days * 86400000).toISOString();
  const sc = (completedDays: number | null) => ({ completedAt: completedDays !== null ? iso(completedDays) : null });

  // stepCompletions: array of {completedAt: ISO|null}, index matches task step index
  await Promise.all([
    // SOP-001 (7 steps): Walker, Complete d(-5) — all on-time
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[0].id, entityName: 'Walker Enterprise Fund III LP', assignedToId: users[2].id, status: 'Complete', dueDate: d(-5), completedDate: d(-6), periodEnd: 'March 2026', priority: 'Critical', stepCompletions: JSON.stringify([sc(-7),sc(-7),sc(-6),sc(-6),sc(-6),sc(-5),sc(-5)]) }}),
    // SOP-001 (7 steps): Sullivan, In Progress d(3) — steps 0-3 done (deadlines future)
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[0].id, entityName: 'Sullivan Global Alpha Fund', assignedToId: users[4].id, status: 'In Progress', dueDate: d(3), periodEnd: 'March 2026', priority: 'Critical', stepCompletions: JSON.stringify([sc(-1),sc(-1),sc(0),sc(0),sc(null),sc(null),sc(null)]) }}),
    // SOP-001 (7 steps): White Senior Credit, Not Started d(10)
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[0].id, entityName: 'White Senior Credit Fund V', assignedToId: users[2].id, status: 'Not Started', dueDate: d(10), periodEnd: 'March 2026', priority: 'Critical', stepCompletions: JSON.stringify([sc(null),sc(null),sc(null),sc(null),sc(null),sc(null),sc(null)]) }}),
    // SOP-002 (6 steps): Walker, Under Review d(7) — steps 0-4 done (deadlines future)
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[1].id, entityName: 'Walker Enterprise Fund III LP', assignedToId: users[3].id, status: 'Under Review', dueDate: d(7), periodEnd: 'Q1 2026', priority: 'High', stepCompletions: JSON.stringify([sc(2),sc(3),sc(5),sc(6),sc(6),sc(null)]) }}),
    // SOP-002 (6 steps): Campbell, In Progress d(14) — steps 0-2 done
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[1].id, entityName: 'Campbell Growth Fund IV LP', assignedToId: users[3].id, status: 'In Progress', dueDate: d(14), periodEnd: 'Q1 2026', priority: 'High', stepCompletions: JSON.stringify([sc(6),sc(7),sc(10),sc(null),sc(null),sc(null)]) }}),
    // SOP-003 (7 steps): Walker, In Progress d(45) — steps 0-2 done (deadlines future)
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[2].id, entityName: 'Walker Enterprise Fund III LP', assignedToId: users[7].id, status: 'In Progress', dueDate: d(45), periodEnd: 'FY 2025', priority: 'Critical', notes: 'Waiting on external tax advisor review', stepCompletions: JSON.stringify([sc(15),sc(25),sc(30),sc(null),sc(null),sc(null),sc(null)]) }}),
    // SOP-003 (7 steps): Cruz, Not Started d(60)
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[2].id, entityName: 'Cruz Ventures Fund II LP', assignedToId: users[7].id, status: 'Not Started', dueDate: d(60), periodEnd: 'FY 2025', priority: 'High', stepCompletions: JSON.stringify([sc(null),sc(null),sc(null),sc(null),sc(null),sc(null),sc(null)]) }}),
    // SOP-004 (6 steps): Campbell, Complete d(-10) — all on-time
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[3].id, entityName: 'Campbell Growth Fund IV LP', assignedToId: users[4].id, status: 'Complete', dueDate: d(-10), completedDate: d(-12), periodEnd: 'March 2026', priority: 'High', stepCompletions: JSON.stringify([sc(-12),sc(-12),sc(-12),sc(-8),sc(-8),sc(-8)]) }}),
    // SOP-005 (7 steps): Walker I, Under Review d(5) — steps 0-4 done (deadlines future)
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[4].id, entityName: 'Walker Enterprise Fund I LP', assignedToId: users[4].id, status: 'Under Review', dueDate: d(5), periodEnd: 'Q1 2026', priority: 'High', notes: 'Final wind-down distribution', stepCompletions: JSON.stringify([sc(1),sc(1),sc(2),sc(2),sc(3),sc(null),sc(null)]) }}),
    // SOP-006 (7 steps): Walker III, In Progress d(30) — steps 0-2 done (step 0+1 deadlines past)
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[5].id, entityName: 'Walker Enterprise Fund III LP', assignedToId: users[2].id, status: 'In Progress', dueDate: d(30), periodEnd: 'FY 2025', priority: 'Critical', notes: 'PBC list received from PwC', stepCompletions: JSON.stringify([sc(-35),sc(-30),sc(-1),sc(null),sc(null),sc(null),sc(null)]) }}),
    // SOP-006 (7 steps): Sullivan, Not Started d(45) — steps 0-1 deadlines past, null (missed)
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[5].id, entityName: 'Sullivan Global Alpha Fund', assignedToId: users[5].id, status: 'Not Started', dueDate: d(45), periodEnd: 'FY 2025', priority: 'Critical', stepCompletions: JSON.stringify([sc(null),sc(null),sc(null),sc(null),sc(null),sc(null),sc(null)]) }}),
    // SOP-007 (6 steps): WFM Global, Overdue d(-7) — steps 0-1 on-time, 2-5 null
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[6].id, entityName: 'WFM Global Opportunities FoF', assignedToId: users[6].id, status: 'Overdue', dueDate: d(-7), periodEnd: 'FY 2025', priority: 'High', notes: 'Awaiting self-certification from 3 investors', stepCompletions: JSON.stringify([sc(-40),sc(-30),sc(null),sc(null),sc(null),sc(null)]) }}),
    // SOP-008 (7 steps): Rodriguez, In Progress d(14) — steps 0-2 done (deadlines future)
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[7].id, entityName: 'Rodriguez Emerging Markets FoF I', assignedToId: users[6].id, status: 'In Progress', dueDate: d(14), periodEnd: 'Q1 2026', priority: 'High', notes: 'KYC pending for Koch Industries FO', stepCompletions: JSON.stringify([sc(6),sc(7),sc(9),sc(null),sc(null),sc(null),sc(null)]) }}),
    // SOP-009 (5 steps): Walker III, Complete d(-2) — all on-time
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[8].id, entityName: 'Walker Enterprise Fund III LP', assignedToId: users[5].id, status: 'Complete', dueDate: d(-2), completedDate: d(-3), periodEnd: 'March 2026', priority: 'Medium', stepCompletions: JSON.stringify([sc(-4),sc(-4),sc(-3),sc(-3),sc(-2)]) }}),
    // SOP-009 (5 steps): White Senior Credit, Overdue d(-3) — steps 0-2 late, 3-4 null
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[8].id, entityName: 'White Senior Credit Fund V', assignedToId: users[5].id, status: 'Overdue', dueDate: d(-3), periodEnd: 'March 2026', priority: 'Medium', notes: 'Custodian statement delayed', stepCompletions: JSON.stringify([sc(-1),sc(-1),sc(-1),sc(null),sc(null)]) }}),
    // SOP-010 (6 steps): Walker III, Under Review d(12) — steps 0-4 done (deadlines future)
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[9].id, entityName: 'Walker Enterprise Fund III LP', assignedToId: users[0].id, status: 'Under Review', dueDate: d(12), periodEnd: 'Q1 2026', priority: 'High', stepCompletions: JSON.stringify([sc(3),sc(4),sc(5),sc(6),sc(7),sc(null)]) }}),
    // SOP-010 (6 steps): Lopez, Not Started d(20)
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[9].id, entityName: 'Lopez Real Estate Opportunities III', assignedToId: users[3].id, status: 'Not Started', dueDate: d(20), periodEnd: 'Q1 2026', priority: 'High', stepCompletions: JSON.stringify([sc(null),sc(null),sc(null),sc(null),sc(null),sc(null)]) }}),
    // SOP-011 (6 steps): Walker III, Complete d(-8) — all on-time
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[10].id, entityName: 'Walker Enterprise Fund III LP', assignedToId: users[4].id, status: 'Complete', dueDate: d(-8), completedDate: d(-10), periodEnd: 'Q1 2026', priority: 'High', stepCompletions: JSON.stringify([sc(-10),sc(-10),sc(-9),sc(-9),sc(-8),sc(-8)]) }}),
    // SOP-011 (6 steps): Sullivan, In Progress d(5) — steps 0-3 done (deadlines future)
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[10].id, entityName: 'Sullivan Global Alpha Fund', assignedToId: users[4].id, status: 'In Progress', dueDate: d(5), periodEnd: 'Q1 2026', priority: 'High', stepCompletions: JSON.stringify([sc(1),sc(1),sc(2),sc(2),sc(null),sc(null)]) }}),
    // SOP-012 (7 steps): Walker III, Under Review d(8) — steps 0-5 done (deadlines future)
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[11].id, entityName: 'Walker Enterprise Fund III LP', assignedToId: users[4].id, status: 'Under Review', dueDate: d(8), periodEnd: 'Q1 2026', priority: 'Critical', stepCompletions: JSON.stringify([sc(3),sc(3),sc(4),sc(4),sc(5),sc(5),sc(null)]) }}),
    // SOP-012 (7 steps): White Senior Credit, Blocked d(8)
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[11].id, entityName: 'White Senior Credit Fund V', assignedToId: users[2].id, status: 'Blocked', dueDate: d(8), periodEnd: 'Q1 2026', priority: 'Critical', notes: 'Pending valuation from Houlihan Lokey', stepCompletions: JSON.stringify([sc(3),sc(3),sc(null),sc(null),sc(null),sc(null),sc(null)]) }}),
    // SOP-001 (7 steps): Lopez Real Estate, Overdue d(-4) — steps 0-3 on-time, 4-6 null/missed
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[0].id, entityName: 'Lopez Real Estate Opportunities III', assignedToId: users[5].id, status: 'Overdue', dueDate: d(-4), periodEnd: 'March 2026', priority: 'Critical', notes: 'Property valuations delayed by 2 weeks', stepCompletions: JSON.stringify([sc(-6),sc(-6),sc(-5),sc(-5),sc(null),sc(null),sc(null)]) }}),
    // SOP-001 (7 steps): WFM Global, In Progress d(5) — steps 0-2 done (deadlines future)
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[0].id, entityName: 'WFM Global Opportunities FoF', assignedToId: users[2].id, status: 'In Progress', dueDate: d(5), periodEnd: 'March 2026', priority: 'Critical', stepCompletions: JSON.stringify([sc(1),sc(1),sc(2),sc(null),sc(null),sc(null),sc(null)]) }}),
    // SOP-007 (6 steps): Walker III Offshore, Overdue d(-14) — steps 0-2 late, 3-5 null
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[6].id, entityName: 'Walker III Offshore Feeder Ltd', assignedToId: users[6].id, status: 'Overdue', dueDate: d(-14), periodEnd: 'FY 2025', priority: 'High', notes: 'Cayman filing deadline missed — remediation in progress', stepCompletions: JSON.stringify([sc(-35),sc(-25),sc(-10),sc(null),sc(null),sc(null)]) }}),
    // SOP-009 (5 steps): Campbell Growth, Under Review d(1) — steps 0-3 done (deadlines future)
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[8].id, entityName: 'Campbell Growth Fund IV LP', assignedToId: users[5].id, status: 'Under Review', dueDate: d(1), periodEnd: 'March 2026', priority: 'Medium', stepCompletions: JSON.stringify([sc(-2),sc(-2),sc(-1),sc(-1),sc(null)]) }}),
  ]);

  // ═══════════════════════════════════════════════
  // HISTORICAL TASK ASSIGNMENTS FOR KPI SCORING
  // ═══════════════════════════════════════════════
  await Promise.all([
    // KPI 1: NAV Calculation — historical (target ~85% on-time)
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[0].id, entityName: 'Walker Enterprise Fund III LP', assignedToId: users[2].id, status: 'Complete', dueDate: d(-30), completedDate: d(-32), periodEnd: 'Feb 2026', priority: 'Critical', stepCompletions: JSON.stringify([sc(-32),sc(-32),sc(-31),sc(-31),sc(-31),sc(-30),sc(-30)]) }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[0].id, entityName: 'Sullivan Global Alpha Fund', assignedToId: users[4].id, status: 'Complete', dueDate: d(-60), completedDate: d(-62), periodEnd: 'Jan 2026', priority: 'Critical', stepCompletions: JSON.stringify([sc(-62),sc(-62),sc(-61),sc(-61),sc(-61),sc(-60),sc(-60)]) }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[0].id, entityName: 'Campbell Growth Fund IV LP', assignedToId: users[4].id, status: 'Complete', dueDate: d(-90), completedDate: d(-92), periodEnd: 'Dec 2025', priority: 'Critical', stepCompletions: JSON.stringify([sc(-92),sc(-92),sc(-91),sc(-91),sc(-91),sc(-90),sc(-90)]) }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[0].id, entityName: 'White Senior Credit Fund V', assignedToId: users[2].id, status: 'Complete', dueDate: d(-150), completedDate: d(-152), periodEnd: 'Oct 2025', priority: 'Critical', stepCompletions: JSON.stringify([sc(-152),sc(-152),sc(-151),sc(-151),sc(-151),sc(-150),sc(-150)]) }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[0].id, entityName: 'Lopez Real Estate Opportunities III', assignedToId: users[5].id, status: 'Complete', dueDate: d(-180), completedDate: d(-182), periodEnd: 'Sep 2025', priority: 'Critical', stepCompletions: JSON.stringify([sc(-182),sc(-182),sc(-181),sc(-181),sc(-181),sc(-180),sc(-180)]) }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[0].id, entityName: 'WFM Global Opportunities FoF', assignedToId: users[2].id, status: 'Overdue', dueDate: d(-120), periodEnd: 'Nov 2025', priority: 'Critical', stepCompletions: JSON.stringify([sc(-122),sc(-122),sc(-121),sc(-121),sc(null),sc(null),sc(null)]) }}),
    // KPI 2: Capital Statements — historical (target ~89% on-time)
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[1].id, entityName: 'Walker Enterprise Fund III LP', assignedToId: users[3].id, status: 'Complete', dueDate: d(-30), completedDate: d(-32), periodEnd: 'Q4 2025', priority: 'High', stepCompletions: JSON.stringify([sc(-32),sc(-31),sc(-29),sc(-27),sc(-27),sc(-24)]) }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[1].id, entityName: 'Campbell Growth Fund IV LP', assignedToId: users[3].id, status: 'Complete', dueDate: d(-60), completedDate: d(-62), periodEnd: 'Q3 2025', priority: 'High', stepCompletions: JSON.stringify([sc(-62),sc(-61),sc(-59),sc(-57),sc(-57),sc(-54)]) }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[1].id, entityName: 'Sullivan Global Alpha Fund', assignedToId: users[3].id, status: 'Complete', dueDate: d(-90), completedDate: d(-92), periodEnd: 'Q2 2025', priority: 'High', stepCompletions: JSON.stringify([sc(-92),sc(-91),sc(-89),sc(-87),sc(-87),sc(-84)]) }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[1].id, entityName: 'Cruz Ventures Fund II LP', assignedToId: users[3].id, status: 'Complete', dueDate: d(-120), completedDate: d(-122), periodEnd: 'Q1 2025', priority: 'High', stepCompletions: JSON.stringify([sc(-122),sc(-121),sc(-119),sc(-117),sc(-117),sc(-114)]) }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[1].id, entityName: 'White Senior Credit Fund V', assignedToId: users[3].id, status: 'Overdue', dueDate: d(-150), periodEnd: 'Q4 2024', priority: 'High', stepCompletions: JSON.stringify([sc(-150),sc(-149),sc(-147),sc(-146),sc(null),sc(null)]) }}),
    // KPI 3: K-1 Preparation — historical (target ~79% on-time)
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[2].id, entityName: 'Walker Enterprise Fund III LP', assignedToId: users[7].id, status: 'Complete', dueDate: d(-90), completedDate: d(-92), periodEnd: 'FY 2024', priority: 'Critical', stepCompletions: JSON.stringify([sc(-106),sc(-99),sc(-95),sc(-94),sc(-92),sc(-91),sc(-90)]) }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[2].id, entityName: 'Campbell Growth Fund IV LP', assignedToId: users[7].id, status: 'Complete', dueDate: d(-150), completedDate: d(-152), periodEnd: 'FY 2023', priority: 'Critical', stepCompletions: JSON.stringify([sc(-166),sc(-159),sc(-155),sc(-154),sc(-152),sc(-151),sc(-150)]) }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[2].id, entityName: 'Sullivan Global Alpha Fund', assignedToId: users[7].id, status: 'Complete', dueDate: d(-200), completedDate: d(-202), periodEnd: 'FY 2022', priority: 'Critical', stepCompletions: JSON.stringify([sc(-216),sc(-209),sc(-205),sc(-204),sc(-202),sc(-201),sc(-200)]) }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[2].id, entityName: 'Cruz Ventures Fund II LP', assignedToId: users[7].id, status: 'Overdue', dueDate: d(-250), periodEnd: 'FY 2021', priority: 'High', stepCompletions: JSON.stringify([sc(-266),sc(-258),sc(-252),sc(null),sc(null),sc(null),sc(null)]) }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[2].id, entityName: 'White Senior Credit Fund V', assignedToId: users[7].id, status: 'Overdue', dueDate: d(-300), periodEnd: 'FY 2020', priority: 'High', stepCompletions: JSON.stringify([sc(-315),sc(-308),sc(-303),sc(-302),sc(null),sc(null),sc(null)]) }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[2].id, entityName: 'Lopez Real Estate Opportunities III', assignedToId: users[7].id, status: 'Complete', dueDate: d(-350), completedDate: d(-352), periodEnd: 'FY 2019', priority: 'Critical', stepCompletions: JSON.stringify([sc(-366),sc(-359),sc(-355),sc(-354),sc(-352),sc(-351),sc(-350)]) }}),
    // KPI 4: Capital Calls (Fund Accounting SOP-004/005) — historical (target ~95% on-time)
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[3].id, entityName: 'Sullivan Global Alpha Fund', assignedToId: users[4].id, status: 'Complete', dueDate: d(-30), completedDate: d(-32), periodEnd: 'Mar 2026', priority: 'High', stepCompletions: JSON.stringify([sc(-32),sc(-32),sc(-32),sc(-29),sc(-28),sc(-28)]) }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[4].id, entityName: 'Walker Enterprise Fund III LP', assignedToId: users[4].id, status: 'Complete', dueDate: d(-60), completedDate: d(-62), periodEnd: 'Jan 2026', priority: 'High', stepCompletions: JSON.stringify([sc(-62),sc(-62),sc(-61),sc(-61),sc(-60),sc(-60),sc(-59)]) }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[4].id, entityName: 'Campbell Growth Fund IV LP', assignedToId: users[4].id, status: 'Complete', dueDate: d(-120), completedDate: d(-122), periodEnd: 'Oct 2025', priority: 'High', stepCompletions: JSON.stringify([sc(-122),sc(-122),sc(-121),sc(-121),sc(-120),sc(-120),sc(-119)]) }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[3].id, entityName: 'WFM Global Opportunities FoF', assignedToId: users[4].id, status: 'Overdue', dueDate: d(-180), periodEnd: 'Aug 2025', priority: 'High', stepCompletions: JSON.stringify([sc(-182),sc(-182),sc(-182),sc(-176),sc(-175),sc(null)]) }}),
    // KPI 5: Reconciliation — historical (target ~73% on-time)
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[8].id, entityName: 'Walker Enterprise Fund III LP', assignedToId: users[5].id, status: 'Complete', dueDate: d(-30), completedDate: d(-32), periodEnd: 'Feb 2026', priority: 'Medium', stepCompletions: JSON.stringify([sc(-32),sc(-32),sc(-31),sc(-31),sc(-30)]) }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[8].id, entityName: 'Sullivan Global Alpha Fund', assignedToId: users[5].id, status: 'Complete', dueDate: d(-60), completedDate: d(-62), periodEnd: 'Jan 2026', priority: 'Medium', stepCompletions: JSON.stringify([sc(-62),sc(-62),sc(-61),sc(-61),sc(-60)]) }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[8].id, entityName: 'Campbell Growth Fund IV LP', assignedToId: users[5].id, status: 'Overdue', dueDate: d(-90), periodEnd: 'Dec 2025', priority: 'Medium', stepCompletions: JSON.stringify([sc(-88),sc(-88),sc(null),sc(null),sc(null)]) }}),
    prisma.taskAssignment.create({ data: { taskDefinitionId: taskDefs[8].id, entityName: 'White Senior Credit Fund V', assignedToId: users[5].id, status: 'Complete', dueDate: d(-120), completedDate: d(-122), periodEnd: 'Nov 2025', priority: 'Medium', stepCompletions: JSON.stringify([sc(-122),sc(-122),sc(-121),sc(-121),sc(-120)]) }}),
  ]);
  console.log('Created 50 task assignments (25 current + 25 historical KPI)');

  // ═══════════════════════════════════════════════
  // EMPLOYEE ENTITY ASSIGNMENTS
  // Drives capacity planning & auto-assignment logic
  // ═══════════════════════════════════════════════
  await Promise.all([
    // Diana Smith — Fund Accounting Primary for Walker and White Senior Credit
    prisma.employeeEntityAssignment.create({ data: { employeeId: users[2].id, entityName: 'Walker Enterprise Fund III LP', clientName: 'Walker Asset Management', department: 'Fund Accounting', serviceLine: 'NAV Calculation', role: 'Primary', coveragePct: 100, startDate: new Date('2024-01-01'), status: 'Active' }}),
    prisma.employeeEntityAssignment.create({ data: { employeeId: users[2].id, entityName: 'White Senior Credit Fund V', clientName: 'White Fund Management', department: 'Fund Accounting', serviceLine: 'NAV Calculation', role: 'Primary', coveragePct: 100, startDate: new Date('2024-06-01'), status: 'Active' }}),
    prisma.employeeEntityAssignment.create({ data: { employeeId: users[2].id, entityName: 'Walker Enterprise Fund III LP', clientName: 'Walker Asset Management', department: 'Fund Accounting', serviceLine: 'Annual Audit Coordination', role: 'Primary', coveragePct: 100, startDate: new Date('2024-01-01'), status: 'Active' }}),
    prisma.employeeEntityAssignment.create({ data: { employeeId: users[2].id, entityName: 'Walker Enterprise Fund II LP', clientName: 'Walker Asset Management', department: 'Fund Accounting', serviceLine: 'Management Fee Calculation', role: 'Primary', coveragePct: 75, startDate: new Date('2024-01-01'), status: 'Active' }}),
    // Steven Wright — Fund Accounting Primary for Sullivan, Campbell, Cruz, Walker I (heavy load → overloaded)
    prisma.employeeEntityAssignment.create({ data: { employeeId: users[4].id, entityName: 'Sullivan Global Alpha Fund', clientName: 'Sullivan Investments', department: 'Fund Accounting', serviceLine: 'NAV Calculation', role: 'Primary', coveragePct: 100, startDate: new Date('2024-03-01'), status: 'Active' }}),
    prisma.employeeEntityAssignment.create({ data: { employeeId: users[4].id, entityName: 'Campbell Growth Fund IV LP', clientName: 'Campbell Capital Partners', department: 'Fund Accounting', serviceLine: 'Capital Call Processing', role: 'Primary', coveragePct: 100, startDate: new Date('2024-09-15'), status: 'Active' }}),
    prisma.employeeEntityAssignment.create({ data: { employeeId: users[4].id, entityName: 'Cruz Ventures Fund II LP', clientName: 'Cruz Ventures', department: 'Fund Accounting', serviceLine: 'Distribution Processing', role: 'Primary', coveragePct: 100, startDate: new Date('2024-09-15'), status: 'Active' }}),
    prisma.employeeEntityAssignment.create({ data: { employeeId: users[4].id, entityName: 'Walker Enterprise Fund I LP', clientName: 'Walker Asset Management', department: 'Fund Accounting', serviceLine: 'Distribution Processing', role: 'Primary', coveragePct: 80, startDate: new Date('2024-06-01'), status: 'Active' }}),
    prisma.employeeEntityAssignment.create({ data: { employeeId: users[4].id, entityName: 'Walker Enterprise Fund III LP', clientName: 'Walker Asset Management', department: 'Fund Accounting', serviceLine: 'Carried Interest Waterfall', role: 'Secondary', coveragePct: 40, startDate: new Date('2025-01-01'), status: 'Active' }}),
    // Jason Cooper — Investor Services Primary for Walker and Campbell
    prisma.employeeEntityAssignment.create({ data: { employeeId: users[3].id, entityName: 'Walker Enterprise Fund III LP', clientName: 'Walker Asset Management', department: 'Investor Services', serviceLine: 'Investor Capital Statements', role: 'Primary', coveragePct: 100, startDate: new Date('2024-07-01'), status: 'Active' }}),
    prisma.employeeEntityAssignment.create({ data: { employeeId: users[3].id, entityName: 'Campbell Growth Fund IV LP', clientName: 'Campbell Capital Partners', department: 'Investor Services', serviceLine: 'Investor Capital Statements', role: 'Primary', coveragePct: 100, startDate: new Date('2024-07-01'), status: 'Active' }}),
    prisma.employeeEntityAssignment.create({ data: { employeeId: users[3].id, entityName: 'Walker Enterprise Fund III LP', clientName: 'Walker Asset Management', department: 'Investor Services', serviceLine: 'LP Communications', role: 'Primary', coveragePct: 60, startDate: new Date('2024-10-01'), status: 'Active' }}),
    // Brandon Cohen — Tax Primary for Walker and Cruz
    prisma.employeeEntityAssignment.create({ data: { employeeId: users[7].id, entityName: 'Walker Enterprise Fund III LP', clientName: 'Walker Asset Management', department: 'Tax', serviceLine: 'K-1 Preparation', role: 'Primary', coveragePct: 100, startDate: new Date('2025-01-15'), status: 'Active' }}),
    prisma.employeeEntityAssignment.create({ data: { employeeId: users[7].id, entityName: 'Cruz Ventures Fund II LP', clientName: 'Cruz Ventures', department: 'Tax', serviceLine: 'K-1 Preparation', role: 'Primary', coveragePct: 100, startDate: new Date('2025-01-15'), status: 'Active' }}),
    prisma.employeeEntityAssignment.create({ data: { employeeId: users[7].id, entityName: 'White Senior Credit Fund V', clientName: 'White Fund Management', department: 'Tax', serviceLine: 'Tax Compliance', role: 'Secondary', coveragePct: 50, startDate: new Date('2025-03-01'), status: 'Active' }}),
    // Sarah Garcia — Compliance Primary for WFM and Rodriguez
    prisma.employeeEntityAssignment.create({ data: { employeeId: users[6].id, entityName: 'WFM Global Opportunities FoF', clientName: 'White Fund Management', department: 'Compliance', serviceLine: 'FATCA/CRS Reporting', role: 'Primary', coveragePct: 100, startDate: new Date('2024-08-01'), status: 'Active' }}),
    prisma.employeeEntityAssignment.create({ data: { employeeId: users[6].id, entityName: 'Rodriguez Emerging Markets FoF I', clientName: 'Rodriguez Capital', department: 'Compliance', serviceLine: 'Investor Onboarding / KYC', role: 'Primary', coveragePct: 100, startDate: new Date('2025-01-10'), status: 'Active' }}),
    // Rebecca Sanders — Operations / Reconciliation backup for Walker
    prisma.employeeEntityAssignment.create({ data: { employeeId: users[9].id, entityName: 'Walker Enterprise Fund III LP', clientName: 'Walker Asset Management', department: 'Fund Accounting', serviceLine: 'Bank Reconciliation', role: 'Primary', coveragePct: 100, startDate: new Date('2024-06-01'), status: 'Active' }}),
    // Michael Collins — Operations backup for Sullivan Audit
    prisma.employeeEntityAssignment.create({ data: { employeeId: users[5].id, entityName: 'Sullivan Global Alpha Fund', clientName: 'Sullivan Investments', department: 'Fund Accounting', serviceLine: 'Annual Audit Coordination', role: 'Secondary', coveragePct: 50, startDate: new Date('2025-04-01'), status: 'Active' }}),
    // Megan Moore — Client Services Primary for Walker
    prisma.employeeEntityAssignment.create({ data: { employeeId: users[0].id, entityName: 'Walker Enterprise Fund III LP', clientName: 'Walker Asset Management', department: 'Client Services', serviceLine: 'Quarterly Board Package', role: 'Primary', coveragePct: 100, startDate: new Date('2024-06-01'), status: 'Active' }}),
    prisma.employeeEntityAssignment.create({ data: { employeeId: users[0].id, entityName: 'Walker Enterprise Fund II LP', clientName: 'Walker Asset Management', department: 'Client Services', serviceLine: 'Quarterly Board Package', role: 'Primary', coveragePct: 75, startDate: new Date('2024-06-01'), status: 'Active' }}),
    // Jessica Cruz — Client Services for Rodriguez and Cruz Ventures
    prisma.employeeEntityAssignment.create({ data: { employeeId: users[1].id, entityName: 'Rodriguez Emerging Markets FoF I', clientName: 'Rodriguez Capital', department: 'Client Services', serviceLine: 'New Fund Setup', role: 'Primary', coveragePct: 100, startDate: new Date('2025-06-01'), status: 'Active' }}),
    prisma.employeeEntityAssignment.create({ data: { employeeId: users[1].id, entityName: 'Cruz Ventures Fund II LP', clientName: 'Cruz Ventures', department: 'Client Services', serviceLine: 'Quarterly Board Package', role: 'Primary', coveragePct: 80, startDate: new Date('2025-06-01'), status: 'Active' }}),
  ]);
  console.log('Created 23 employee entity assignments');

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
    // ── Walker deeper structure relationships ──
    prisma.relationship.create({ data: { relationshipId: 'REL-021', sourceType: 'entity', sourceId: entities[2].id, sourceName: 'Walker Enterprise III Master Fund LP', targetType: 'entity', targetId: entities[15].id, targetName: 'Walker III UBTI Blocker Corp', relationshipType: 'blocks_for', status: 'Active', effectiveDate: new Date('2021-04-15'), notes: 'Blocker corp shields tax-exempt LPs from UBTI on debt-financed income' }}),
    prisma.relationship.create({ data: { relationshipId: 'REL-022', sourceType: 'entity', sourceId: entities[2].id, sourceName: 'Walker Enterprise III Master Fund LP', targetType: 'entity', targetId: entities[16].id, targetName: 'Walker III Holdings LLC', relationshipType: 'holds_assets_for', status: 'Active', effectiveDate: new Date('2021-05-01'), notes: 'Holding company is legal owner of portfolio investments' }}),
    prisma.relationship.create({ data: { relationshipId: 'REL-023', sourceType: 'entity', sourceId: entities[16].id, sourceName: 'Walker III Holdings LLC', targetType: 'entity', targetId: entities[17].id, targetName: 'Apex Manufacturing Inc', relationshipType: 'portfolio_investment', status: 'Active', effectiveDate: new Date('2022-03-15'), notes: 'Platform acquisition — industrials sector' }}),
    prisma.relationship.create({ data: { relationshipId: 'REL-024', sourceType: 'entity', sourceId: entities[16].id, sourceName: 'Walker III Holdings LLC', targetType: 'entity', targetId: entities[18].id, targetName: 'Vanguard Logistics LP', relationshipType: 'portfolio_investment', status: 'Active', effectiveDate: new Date('2023-01-10'), notes: 'Add-on acquisition — logistics sector' }}),
  ]);
  console.log('Created 24 relationships');

  // ── Ownership percentages on key relationships ──
  const ownershipUpdates: Array<[string, number]> = [
    ['REL-001', 100],   // Walker AM → ManCo: 100% ownership
    ['REL-003', 60],    // Onshore Feeder → Master: 60% of capital
    ['REL-004', 40],    // Offshore Feeder → Master: 40% of capital
    ['REL-006', 1],     // GP LLC → Fund III: 1% GP commitment
    ['REL-008', 15],    // CalPERS → Fund III: 15%
    ['REL-009', 12],    // ADIA → Fund III: 12%
    ['REL-010', 8],     // Yale → Fund III: 8%
    ['REL-016', 100],   // Campbell → Campbell IV: 100% sponsor
    ['REL-021', 100],   // Master → Blocker: 100% ownership
    ['REL-022', 100],   // Master → Holdings: 100% ownership
    ['REL-023', 85],    // Holdings → Apex Mfg: 85% equity
    ['REL-024', 70],    // Holdings → Vanguard Logistics: 70% equity
  ];
  for (const [relId, pct] of ownershipUpdates) {
    await prisma.relationship.updateMany({ where: { relationshipId: relId }, data: { ownershipPct: pct } });
  }

  // ── Fund Family tags on entities ──
  const tagMap: Record<string, string[]> = {
    'ENT-000001': ['#WalkerComplex'],
    'ENT-000002': ['#WalkerComplex'],
    'ENT-000003': ['#WalkerComplex'],
    'ENT-000004': ['#WalkerComplex'],
    'ENT-000005': ['#WalkerComplex'],
    'ENT-000006': ['#WalkerComplex', '#SPVs'],
    'ENT-000007': ['#CampbellFunds'],
    'ENT-000008': ['#SullivanHF'],
    'ENT-000009': ['#CruzVC'],
    'ENT-000010': ['#LopezRE'],
    'ENT-000011': ['#WhiteCredit'],
    'ENT-000012': ['#WFMFoF'],
    'ENT-000013': ['#WalkerComplex', '#Legacy'],
    'ENT-000014': ['#WalkerComplex', '#SPVs'],
    'ENT-000015': ['#RodriguezEM'],
    'ENT-000016': ['#WalkerComplex', '#SPVs'],
    'ENT-000017': ['#WalkerComplex'],
    'ENT-000018': ['#WalkerComplex'],
    'ENT-000019': ['#WalkerComplex'],
  };
  for (const [eid, tags] of Object.entries(tagMap)) {
    await prisma.entity.updateMany({ where: { entityId: eid }, data: { fundFamilyTags: JSON.stringify(tags) } });
  }

  // ── Fund Family Tag managed list ──
  await prisma.fundFamilyTag.deleteMany();
  await prisma.fundFamilyTag.createMany({
    data: [
      { tag: '#WalkerComplex', description: 'Walker Enterprise fund family', color: '#1B3A4B' },
      { tag: '#CampbellFunds', description: 'Campbell Capital fund family', color: '#7c3aed' },
      { tag: '#SullivanHF',    description: 'Sullivan hedge fund complex',  color: '#0d9488' },
      { tag: '#CruzVC',        description: 'Cruz Ventures family',         color: '#00C97B' },
      { tag: '#LopezRE',       description: 'Lopez Real Estate family',     color: '#f59e0b' },
      { tag: '#WhiteCredit',   description: 'White Senior Credit family',   color: '#3b82f6' },
      { tag: '#WFMFoF',        description: 'White Fund Mgmt FoF family',   color: '#6366f1' },
      { tag: '#RodriguezEM',   description: 'Rodriguez Emerging Markets',   color: '#dc2626' },
      { tag: '#Legacy',        description: 'Legacy / winding-down vehicles', color: '#6b7280' },
      { tag: '#SPVs',          description: 'Special purpose vehicles',     color: '#92400e' },
    ],
  });
  console.log('Enriched relationships with ownership %, entity fund family tags, and managed tag list');

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

  // ═══════════════════════════════════════════════
  // TRANSACTION PARAMETERS — ILPA-aligned config
  // Sept 2025 CC&D Template + Jan 2025 RT v2.0
  // ═══════════════════════════════════════════════
  await prisma.fundTransactionOverride.deleteMany();
  await prisma.transactionParameter.deleteMany();

  const tpRef = 'ILPA CC&D Template Sept 2025 / Reporting Template v2.0 Jan 2025';

  await prisma.transactionParameter.createMany({ data: [
    // ── CAPITAL CALLS ─────────────────────────────────────────────────
    {
      code: 'CC-INV', sortOrder: 10,
      name: 'Capital Call: Investments',
      ilpaCategory: 'Capital Call', ilpaSubtype: 'CC — Investments', ilpaTemplateRef: tpRef,
      direction: 'Inflow', insideFund: true, recallable: false,
      navImpact: 'Increase NAV',
      glDebit: 'Cash & Cash Equivalents', glCredit: 'Capital Contributions — LP', journalType: 'JE-CC-INV',
      perfTemplateClass: 'Contribution', perfTemplateMethod: 'Both',
      feeOffset: false, feeOffsetType: 'None',
      waterfallTier: 'Return of Capital',
      commitmentImpact: 'Reduces Unfunded',
      settlementDays: 'T+3', autoReconcile: true, approvalRequired: true,
      taxReporting: 'Schedule K-1 — Item L',
      notes: 'Primary capital call for investment funding. Reduces LP unfunded commitment dollar-for-dollar.',
    },
    {
      code: 'CC-MGMT', sortOrder: 11,
      name: 'Capital Call: Management Fee',
      ilpaCategory: 'Capital Call', ilpaSubtype: 'CC — Management Fee', ilpaTemplateRef: tpRef,
      direction: 'Inflow', insideFund: true, recallable: false,
      navImpact: 'No NAV Impact',
      glDebit: 'Cash & Cash Equivalents', glCredit: 'Management Fee Payable', journalType: 'JE-CC-MGMT',
      perfTemplateClass: 'Fee', perfTemplateMethod: 'Both',
      feeOffset: true, feeOffsetType: 'Management Fee Base',
      waterfallTier: 'N/A',
      commitmentImpact: 'Reduces Unfunded',
      settlementDays: 'T+3', autoReconcile: true, approvalRequired: false,
      taxReporting: 'Schedule K-1 — Item F',
      notes: 'Capital called to fund management fee. Reduces unfunded per fund documents. Fee offset credits apply per LPA.',
    },
    {
      code: 'CC-EXP', sortOrder: 12,
      name: 'Capital Call: Partnership Expenses',
      ilpaCategory: 'Capital Call', ilpaSubtype: 'CC — Partnership Expenses', ilpaTemplateRef: tpRef,
      direction: 'Inflow', insideFund: true, recallable: false,
      navImpact: 'No NAV Impact',
      glDebit: 'Cash & Cash Equivalents', glCredit: 'Partnership Expense Payable', journalType: 'JE-CC-EXP',
      perfTemplateClass: 'Fee', perfTemplateMethod: 'Both',
      feeOffset: false, feeOffsetType: 'None',
      waterfallTier: 'N/A',
      commitmentImpact: 'Reduces Unfunded',
      settlementDays: 'T+3', autoReconcile: true, approvalRequired: false,
      taxReporting: 'Schedule K-1 — Item F',
      notes: 'Capital called for fund operating expenses (legal, audit, admin). Itemized per ILPA v2.0 22-category framework.',
    },
    {
      code: 'CC-WC', sortOrder: 13,
      name: 'Capital Call: Working Capital / Unallocated',
      ilpaCategory: 'Capital Call', ilpaSubtype: 'CC — Working Capital', ilpaTemplateRef: tpRef,
      direction: 'Inflow', insideFund: true, recallable: false,
      navImpact: 'Increase NAV',
      glDebit: 'Cash & Cash Equivalents', glCredit: 'Working Capital Reserve', journalType: 'JE-CC-WC',
      perfTemplateClass: 'Contribution', perfTemplateMethod: 'Gross Up',
      feeOffset: false, feeOffsetType: 'None',
      waterfallTier: 'Return of Capital',
      commitmentImpact: 'Reduces Unfunded',
      settlementDays: 'T+3', autoReconcile: true, approvalRequired: false,
      taxReporting: 'Schedule K-1 — Item L',
      notes: 'Used where GP has not itemized the specific utilization at time of call. Gross Up methodology applies.',
    },
    {
      code: 'CC-OF', sortOrder: 14,
      name: 'Capital Call: Outside Fund',
      ilpaCategory: 'Capital Call', ilpaSubtype: 'CC — Outside Fund', ilpaTemplateRef: tpRef,
      direction: 'Inflow', insideFund: false, recallable: false,
      navImpact: 'No NAV Impact',
      glDebit: 'Cash & Cash Equivalents', glCredit: 'Transfer Payable — LP', journalType: 'JE-CC-OF',
      perfTemplateClass: 'N/A', perfTemplateMethod: 'N/A',
      feeOffset: false, feeOffsetType: 'None',
      waterfallTier: 'N/A',
      commitmentImpact: 'No Impact',
      settlementDays: 'T+3', autoReconcile: false, approvalRequired: true,
      taxReporting: 'None',
      notes: 'Fund acts as conduit/intermediary — e.g., subsequent close interest transfers between LPs. Outside Fund per ILPA Sept 2025.',
    },
    // ── DISTRIBUTIONS ─────────────────────────────────────────────────
    {
      code: 'DIST-RG', sortOrder: 20,
      name: 'Distribution: Realized Gains',
      ilpaCategory: 'Distribution', ilpaSubtype: 'Dist — Realized Gains', ilpaTemplateRef: tpRef,
      direction: 'Outflow', insideFund: true, recallable: false,
      navImpact: 'Decrease NAV',
      glDebit: 'Capital Account — LP', glCredit: 'Cash & Cash Equivalents', journalType: 'JE-DIST-RG',
      perfTemplateClass: 'Distribution', perfTemplateMethod: 'Both',
      feeOffset: false, feeOffsetType: 'None',
      waterfallTier: 'Carried Interest',
      commitmentImpact: 'No Impact',
      settlementDays: 'T+5', autoReconcile: true, approvalRequired: true,
      taxReporting: 'Schedule K-1 — Item 9a',
      notes: 'Cash and in-kind distributions of realized gains. Includes stock distributions at fair value. ILPA Sept 2025 combines cash and stock.',
    },
    {
      code: 'DIST-ROC', sortOrder: 21,
      name: 'Distribution: Return of Capital',
      ilpaCategory: 'Distribution', ilpaSubtype: 'Dist — Return of Capital', ilpaTemplateRef: tpRef,
      direction: 'Outflow', insideFund: true, recallable: false,
      navImpact: 'Decrease NAV',
      glDebit: 'Capital Contributions — LP', glCredit: 'Cash & Cash Equivalents', journalType: 'JE-DIST-ROC',
      perfTemplateClass: 'Distribution', perfTemplateMethod: 'Both',
      feeOffset: false, feeOffsetType: 'None',
      waterfallTier: 'Return of Capital',
      commitmentImpact: 'No Impact',
      settlementDays: 'T+5', autoReconcile: true, approvalRequired: true,
      taxReporting: 'Schedule K-1 — Item L',
      notes: 'Return of previously contributed capital. Reduces LP capital account balance. Non-taxable return of basis.',
    },
    {
      code: 'DIST-ROC-R', sortOrder: 22,
      name: 'Distribution: Return of Capital (Recallable)',
      ilpaCategory: 'Distribution', ilpaSubtype: 'Dist — Return of Capital (Recallable)', ilpaTemplateRef: tpRef,
      direction: 'Outflow', insideFund: true, recallable: true,
      navImpact: 'Decrease NAV',
      glDebit: 'Capital Contributions — LP', glCredit: 'Cash & Cash Equivalents', journalType: 'JE-DIST-ROC-R',
      perfTemplateClass: 'Distribution', perfTemplateMethod: 'Both',
      feeOffset: false, feeOffsetType: 'None',
      waterfallTier: 'Return of Capital',
      commitmentImpact: 'Restores Unfunded',
      settlementDays: 'T+5', autoReconcile: true, approvalRequired: true,
      taxReporting: 'Schedule K-1 — Item L',
      notes: 'Recallable ROC — restores LP unfunded commitment upon distribution. Can be recalled per LPA. ILPA Sept 2025: inferred from unfunded commitment impact field.',
    },
    {
      code: 'DIST-RL', sortOrder: 23,
      name: 'Distribution: Realized Losses',
      ilpaCategory: 'Distribution', ilpaSubtype: 'Dist — Realized Losses', ilpaTemplateRef: tpRef,
      direction: 'Outflow', insideFund: true, recallable: false,
      navImpact: 'Decrease NAV',
      glDebit: 'Realized Loss — Investment', glCredit: 'Cash & Cash Equivalents', journalType: 'JE-DIST-RL',
      perfTemplateClass: 'Distribution', perfTemplateMethod: 'Both',
      feeOffset: false, feeOffsetType: 'None',
      waterfallTier: 'Return of Capital',
      commitmentImpact: 'No Impact',
      settlementDays: 'T+5', autoReconcile: true, approvalRequired: true,
      taxReporting: 'Schedule K-1 — Item 9c',
      notes: 'Distributions representing a return below cost basis — realized losses recognized on disposal. ILPA Sept 2025 separates RG and RL.',
    },
    {
      code: 'DIST-IK', sortOrder: 24,
      name: 'Distribution: In-Kind (Unrealized / Stock)',
      ilpaCategory: 'Distribution', ilpaSubtype: 'Dist — In-Kind / Unrealized', ilpaTemplateRef: tpRef,
      direction: 'Outflow', insideFund: true, recallable: false,
      navImpact: 'Decrease NAV',
      glDebit: 'Investment Portfolio — FV', glCredit: 'In-Kind Distribution Payable — LP', journalType: 'JE-DIST-IK',
      perfTemplateClass: 'Distribution', perfTemplateMethod: 'Both',
      feeOffset: false, feeOffsetType: 'None',
      waterfallTier: 'Carried Interest',
      commitmentImpact: 'No Impact',
      settlementDays: 'T+5', autoReconcile: false, approvalRequired: true,
      taxReporting: 'Schedule K-1 — Item 9a',
      notes: 'In-kind distribution of securities at fair value. Requires securities transfer agent coordination. FMV determination required.',
    },
    {
      code: 'DIST-MFO', sortOrder: 25,
      name: 'Distribution: Management Fee Offset',
      ilpaCategory: 'Distribution', ilpaSubtype: 'Dist — Mgmt Fee Offset', ilpaTemplateRef: tpRef,
      direction: 'Outflow', insideFund: true, recallable: false,
      navImpact: 'Decrease NAV',
      glDebit: 'Management Fee Payable', glCredit: 'Cash & Cash Equivalents', journalType: 'JE-DIST-MFO',
      perfTemplateClass: 'Fee', perfTemplateMethod: 'Both',
      feeOffset: true, feeOffsetType: 'Management Fee Base',
      waterfallTier: 'N/A',
      commitmentImpact: 'No Impact',
      settlementDays: 'T+0', autoReconcile: true, approvalRequired: false,
      taxReporting: 'Schedule K-1 — Item F',
      notes: 'Portfolio company fee income credited against management fee. ILPA v2.0 requires gross disclosure; offset shown separately.',
    },
    {
      code: 'DIST-CARRY-PAID', sortOrder: 26,
      name: 'Distribution: Carried Interest Paid',
      ilpaCategory: 'Distribution', ilpaSubtype: 'Dist — Carried Interest Paid', ilpaTemplateRef: tpRef,
      direction: 'Outflow', insideFund: true, recallable: false,
      navImpact: 'GP Allocation',
      glDebit: 'Carried Interest Payable — GP', glCredit: 'Cash & Cash Equivalents', journalType: 'JE-DIST-CARRY',
      perfTemplateClass: 'Carried Interest', perfTemplateMethod: 'Both',
      feeOffset: false, feeOffsetType: 'Carry Basis',
      waterfallTier: 'Carried Interest',
      commitmentImpact: 'No Impact',
      settlementDays: 'T+5', autoReconcile: false, approvalRequired: true,
      taxReporting: 'Schedule K-1 — Item 1',
      notes: 'Cash payment of accrued carried interest to GP. Requires final waterfall calculation sign-off. Clawback provisions apply per LPA.',
    },
    {
      code: 'DIST-OF', sortOrder: 27,
      name: 'Distribution: Outside Fund',
      ilpaCategory: 'Distribution', ilpaSubtype: 'Dist — Outside Fund', ilpaTemplateRef: tpRef,
      direction: 'Outflow', insideFund: false, recallable: false,
      navImpact: 'No NAV Impact',
      glDebit: 'Transfer Payable — LP', glCredit: 'Cash & Cash Equivalents', journalType: 'JE-DIST-OF',
      perfTemplateClass: 'N/A', perfTemplateMethod: 'N/A',
      feeOffset: false, feeOffsetType: 'None',
      waterfallTier: 'N/A',
      commitmentImpact: 'No Impact',
      settlementDays: 'T+5', autoReconcile: false, approvalRequired: true,
      taxReporting: 'None',
      notes: 'Fund acts as conduit for LP-to-LP transfers — e.g., secondary transfers. Outside Fund classification per ILPA Sept 2025.',
    },
    // ── FEES & EXPENSES ───────────────────────────────────────────────
    {
      code: 'FEE-MGMT', sortOrder: 30,
      name: 'Management Fee (Gross)',
      ilpaCategory: 'Fee & Expense', ilpaSubtype: 'Fee — Management Fee (Gross)', ilpaTemplateRef: tpRef,
      direction: 'Outflow', insideFund: true, recallable: false,
      navImpact: 'Decrease NAV',
      glDebit: 'Management Fee Expense', glCredit: 'Cash & Cash Equivalents', journalType: 'JE-FEE-MGMT',
      perfTemplateClass: 'Fee', perfTemplateMethod: 'Both',
      feeOffset: true, feeOffsetType: 'Management Fee Base',
      waterfallTier: 'N/A',
      commitmentImpact: 'No Impact',
      settlementDays: 'T+0', autoReconcile: true, approvalRequired: false,
      taxReporting: 'Schedule K-1 — Item F',
      notes: 'Gross management fee per LPA. ILPA RT v2.0 requires gross disclosure before offsets. Net fee = gross less applicable offsets.',
    },
    {
      code: 'FEE-MFO', sortOrder: 31,
      name: 'Management Fee Offset',
      ilpaCategory: 'Fee & Expense', ilpaSubtype: 'Fee — Management Fee Offset', ilpaTemplateRef: tpRef,
      direction: 'Inflow', insideFund: true, recallable: false,
      navImpact: 'Increase NAV',
      glDebit: 'Management Fee Payable', glCredit: 'Management Fee Offset Income', journalType: 'JE-FEE-MFO',
      perfTemplateClass: 'Fee', perfTemplateMethod: 'Both',
      feeOffset: true, feeOffsetType: 'Management Fee Base',
      waterfallTier: 'N/A',
      commitmentImpact: 'No Impact',
      settlementDays: 'T+0', autoReconcile: true, approvalRequired: false,
      taxReporting: 'Schedule K-1 — Item F',
      notes: 'Portfolio company monitoring/transaction/director fees credited against gross management fee. Disclosed separately per ILPA RT v2.0.',
    },
    {
      code: 'EXP-IC', sortOrder: 32,
      name: 'Internal Chargeback (GP/Related Party)',
      ilpaCategory: 'Fee & Expense', ilpaSubtype: 'Expense — Internal Chargeback', ilpaTemplateRef: tpRef,
      direction: 'Outflow', insideFund: true, recallable: false,
      navImpact: 'Decrease NAV',
      glDebit: 'Partnership Expense — Internal', glCredit: 'Due to GP / Related Person', journalType: 'JE-EXP-IC',
      perfTemplateClass: 'Fee', perfTemplateMethod: 'Both',
      feeOffset: false, feeOffsetType: 'None',
      waterfallTier: 'N/A',
      commitmentImpact: 'No Impact',
      settlementDays: 'T+0', autoReconcile: true, approvalRequired: true,
      taxReporting: 'Schedule K-1 — Item F',
      notes: 'NEW in ILPA RT v2.0 — separate category for expenses charged by GP or related persons. Requires disclosure of related-party nature.',
    },
    {
      code: 'EXP-OFFER', sortOrder: 33,
      name: 'Offering & Syndication Costs',
      ilpaCategory: 'Fee & Expense', ilpaSubtype: 'Expense — Offering & Syndication', ilpaTemplateRef: tpRef,
      direction: 'Outflow', insideFund: true, recallable: false,
      navImpact: 'Decrease NAV',
      glDebit: 'Offering & Syndication Expense', glCredit: 'Cash & Cash Equivalents', journalType: 'JE-EXP-OFFER',
      perfTemplateClass: 'Fee', perfTemplateMethod: 'Both',
      feeOffset: false, feeOffsetType: 'None',
      waterfallTier: 'N/A',
      commitmentImpact: 'No Impact',
      settlementDays: 'T+0', autoReconcile: true, approvalRequired: false,
      taxReporting: 'Schedule K-1 — Item F',
      notes: 'Costs of offering interests in fund — registration, marketing materials, road show costs. ILPA RT v2.0 separate line item.',
    },
    {
      code: 'EXP-PLACE', sortOrder: 34,
      name: 'Placement Fees',
      ilpaCategory: 'Fee & Expense', ilpaSubtype: 'Expense — Placement Fees', ilpaTemplateRef: tpRef,
      direction: 'Outflow', insideFund: true, recallable: false,
      navImpact: 'Decrease NAV',
      glDebit: 'Placement Fee Expense', glCredit: 'Cash & Cash Equivalents', journalType: 'JE-EXP-PLACE',
      perfTemplateClass: 'Fee', perfTemplateMethod: 'Both',
      feeOffset: false, feeOffsetType: 'None',
      waterfallTier: 'N/A',
      commitmentImpact: 'No Impact',
      settlementDays: 'T+0', autoReconcile: true, approvalRequired: false,
      taxReporting: 'Schedule K-1 — Item F',
      notes: 'Fees paid to placement agents for capital raising. Must be grossed up in ILPA RT v2.0 — often partially or fully offset against management fee.',
    },
    {
      code: 'EXP-PTRANS', sortOrder: 35,
      name: 'Partner Transfer Costs',
      ilpaCategory: 'Fee & Expense', ilpaSubtype: 'Expense — Partner Transfer', ilpaTemplateRef: tpRef,
      direction: 'Outflow', insideFund: true, recallable: false,
      navImpact: 'Decrease NAV',
      glDebit: 'Partnership Expense — Transfer', glCredit: 'Cash & Cash Equivalents', journalType: 'JE-EXP-PTRANS',
      perfTemplateClass: 'Fee', perfTemplateMethod: 'Both',
      feeOffset: false, feeOffsetType: 'None',
      waterfallTier: 'N/A',
      commitmentImpact: 'No Impact',
      settlementDays: 'T+0', autoReconcile: true, approvalRequired: false,
      taxReporting: 'Schedule K-1 — Item F',
      notes: 'Legal and administrative costs associated with LP interest transfers on the secondary market. NEW category in ILPA RT v2.0.',
    },
    {
      code: 'EXP-PROF', sortOrder: 36,
      name: 'Professional Fees (Legal, Accounting, Consulting)',
      ilpaCategory: 'Fee & Expense', ilpaSubtype: 'Expense — Professional Fees', ilpaTemplateRef: tpRef,
      direction: 'Outflow', insideFund: true, recallable: false,
      navImpact: 'Decrease NAV',
      glDebit: 'Professional Fee Expense', glCredit: 'Accounts Payable', journalType: 'JE-EXP-PROF',
      perfTemplateClass: 'Fee', perfTemplateMethod: 'Both',
      feeOffset: false, feeOffsetType: 'None',
      waterfallTier: 'N/A',
      commitmentImpact: 'No Impact',
      settlementDays: 'T+30', autoReconcile: true, approvalRequired: false,
      taxReporting: 'Schedule K-1 — Item F',
      notes: 'External counsel, audit/tax, and consulting fees charged at fund level. ILPA RT v2.0 requires external vs. internal distinction.',
    },
    {
      code: 'EXP-VAL', sortOrder: 37,
      name: 'Third-Party Valuation Fees',
      ilpaCategory: 'Fee & Expense', ilpaSubtype: 'Expense — Third-Party Valuations', ilpaTemplateRef: tpRef,
      direction: 'Outflow', insideFund: true, recallable: false,
      navImpact: 'Decrease NAV',
      glDebit: 'Valuation Fee Expense', glCredit: 'Accounts Payable', journalType: 'JE-EXP-VAL',
      perfTemplateClass: 'Fee', perfTemplateMethod: 'Both',
      feeOffset: false, feeOffsetType: 'None',
      waterfallTier: 'N/A',
      commitmentImpact: 'No Impact',
      settlementDays: 'T+30', autoReconcile: true, approvalRequired: false,
      taxReporting: 'Schedule K-1 — Item F',
      notes: 'Independent valuation agent fees. ILPA RT v2.0 requires separate disclosure. Often quarterly engagement for Level 3 assets.',
    },
    {
      code: 'EXP-SUB', sortOrder: 38,
      name: 'Subscription Facility Fees & Interest',
      ilpaCategory: 'Fee & Expense', ilpaSubtype: 'Expense — Subscription Facility', ilpaTemplateRef: tpRef,
      direction: 'Outflow', insideFund: true, recallable: false,
      navImpact: 'Decrease NAV',
      glDebit: 'Subscription Facility Interest Expense', glCredit: 'Cash & Cash Equivalents', journalType: 'JE-EXP-SUB',
      perfTemplateClass: 'Fee', perfTemplateMethod: 'Both',
      feeOffset: false, feeOffsetType: 'None',
      waterfallTier: 'N/A',
      commitmentImpact: 'No Impact',
      settlementDays: 'T+0', autoReconcile: true, approvalRequired: false,
      taxReporting: 'Schedule K-1 — Item F',
      notes: 'Commitment fees, drawn interest, and facility fees on subscription credit lines. ILPA RT v2.0 requires IRR with/without sub-line disclosure.',
    },
    {
      code: 'EXP-PORTCO', sortOrder: 39,
      name: 'Portfolio Company Fees',
      ilpaCategory: 'Fee & Expense', ilpaSubtype: 'Expense — Portfolio Company Fees', ilpaTemplateRef: tpRef,
      direction: 'Outflow', insideFund: true, recallable: false,
      navImpact: 'Decrease NAV',
      glDebit: 'Portfolio Company Fee Expense', glCredit: 'Cash & Cash Equivalents', journalType: 'JE-EXP-PORTCO',
      perfTemplateClass: 'Fee', perfTemplateMethod: 'Both',
      feeOffset: true, feeOffsetType: 'Management Fee Base',
      waterfallTier: 'N/A',
      commitmentImpact: 'No Impact',
      settlementDays: 'T+0', autoReconcile: true, approvalRequired: false,
      taxReporting: 'Schedule K-1 — Item F',
      notes: 'Management, monitoring, transaction, and director fees charged at portfolio company level that flow to fund. Often offset against management fee per LPA.',
    },
    {
      code: 'EXP-INS', sortOrder: 40,
      name: 'Insurance Fees',
      ilpaCategory: 'Fee & Expense', ilpaSubtype: 'Expense — Insurance', ilpaTemplateRef: tpRef,
      direction: 'Outflow', insideFund: true, recallable: false,
      navImpact: 'Decrease NAV',
      glDebit: 'Insurance Expense', glCredit: 'Cash & Cash Equivalents', journalType: 'JE-EXP-INS',
      perfTemplateClass: 'Fee', perfTemplateMethod: 'Both',
      feeOffset: false, feeOffsetType: 'None',
      waterfallTier: 'N/A',
      commitmentImpact: 'No Impact',
      settlementDays: 'T+0', autoReconcile: true, approvalRequired: false,
      taxReporting: 'Schedule K-1 — Item F',
      notes: 'D&O, E&O, and other insurance premiums charged at fund level. NEW explicit category in ILPA RT v2.0.',
    },
    {
      code: 'EXP-FORM', sortOrder: 41,
      name: 'Formation & Organization Costs',
      ilpaCategory: 'Fee & Expense', ilpaSubtype: 'Expense — Formation & Organization', ilpaTemplateRef: tpRef,
      direction: 'Outflow', insideFund: true, recallable: false,
      navImpact: 'Decrease NAV',
      glDebit: 'Formation & Organization Expense', glCredit: 'Cash & Cash Equivalents', journalType: 'JE-EXP-FORM',
      perfTemplateClass: 'Fee', perfTemplateMethod: 'Both',
      feeOffset: false, feeOffsetType: 'None',
      waterfallTier: 'N/A',
      commitmentImpact: 'No Impact',
      settlementDays: 'T+0', autoReconcile: true, approvalRequired: false,
      taxReporting: 'Schedule K-1 — Item F',
      notes: 'Legal, filing, and structuring costs to establish the fund entity. Often amortized over fund life. Note: ILPA RT v2.0 eliminated Capitalized Expense disclosure.',
    },
    {
      code: 'EXP-OTHER', sortOrder: 42,
      name: 'Other Third-Party Expenses',
      ilpaCategory: 'Fee & Expense', ilpaSubtype: 'Expense — Other Third-Party', ilpaTemplateRef: tpRef,
      direction: 'Outflow', insideFund: true, recallable: false,
      navImpact: 'Decrease NAV',
      glDebit: 'Other Partnership Expense', glCredit: 'Cash & Cash Equivalents', journalType: 'JE-EXP-OTHER',
      perfTemplateClass: 'Fee', perfTemplateMethod: 'Both',
      feeOffset: false, feeOffsetType: 'None',
      waterfallTier: 'N/A',
      commitmentImpact: 'No Impact',
      settlementDays: 'T+30', autoReconcile: true, approvalRequired: false,
      taxReporting: 'Schedule K-1 — Item F',
      notes: 'Catch-all for third-party expenses not covered in other categories. Should be minimized; GP should use specific categories where possible.',
    },
    // ── CARRIED INTEREST ──────────────────────────────────────────────
    {
      code: 'CARRY-ACC', sortOrder: 50,
      name: 'Carried Interest: Accrued',
      ilpaCategory: 'Carried Interest', ilpaSubtype: 'Carry — Accrued', ilpaTemplateRef: tpRef,
      direction: 'N/A', insideFund: true, recallable: false,
      navImpact: 'GP Allocation',
      glDebit: 'Unrealized Carried Interest Expense', glCredit: 'Carried Interest Payable — GP (Accrued)', journalType: 'JE-CARRY-ACC',
      perfTemplateClass: 'Carried Interest', perfTemplateMethod: 'Both',
      feeOffset: false, feeOffsetType: 'Carry Basis',
      waterfallTier: 'Carried Interest',
      commitmentImpact: 'No Impact',
      settlementDays: 'T+0', autoReconcile: true, approvalRequired: false,
      taxReporting: 'Schedule K-1 — Item 1',
      notes: 'Quarterly accrual of carried interest per waterfall. Gross-of-carry NAV reduced; shown separately in ILPA RT v2.0 Ending NAV rollforward.',
    },
    {
      code: 'CARRY-REAL', sortOrder: 51,
      name: 'Carried Interest: Realized',
      ilpaCategory: 'Carried Interest', ilpaSubtype: 'Carry — Realized', ilpaTemplateRef: tpRef,
      direction: 'N/A', insideFund: true, recallable: false,
      navImpact: 'GP Allocation',
      glDebit: 'Realized Carried Interest Expense', glCredit: 'Carried Interest Payable — GP (Realized)', journalType: 'JE-CARRY-REAL',
      perfTemplateClass: 'Carried Interest', perfTemplateMethod: 'Both',
      feeOffset: false, feeOffsetType: 'Carry Basis',
      waterfallTier: 'Carried Interest',
      commitmentImpact: 'No Impact',
      settlementDays: 'T+0', autoReconcile: true, approvalRequired: false,
      taxReporting: 'Schedule K-1 — Item 1',
      notes: 'Crystallized carry on realized investments. Triggers clawback calculations. ILPA RT v2.0 requires roll-forward: Opening + Accrued + Realized - Paid = Closing.',
    },
    {
      code: 'CARRY-UNREAL', sortOrder: 52,
      name: 'Carried Interest: Unrealized',
      ilpaCategory: 'Carried Interest', ilpaSubtype: 'Carry — Unrealized', ilpaTemplateRef: tpRef,
      direction: 'N/A', insideFund: true, recallable: false,
      navImpact: 'GP Allocation',
      glDebit: 'Unrealized Carry Mark-to-Market', glCredit: 'Carried Interest Payable — GP (Unrealized)', journalType: 'JE-CARRY-UNREAL',
      perfTemplateClass: 'Carried Interest', perfTemplateMethod: 'Both',
      feeOffset: false, feeOffsetType: 'Carry Basis',
      waterfallTier: 'Carried Interest',
      commitmentImpact: 'No Impact',
      settlementDays: 'T+0', autoReconcile: true, approvalRequired: false,
      taxReporting: 'Schedule K-1 — Item 1',
      notes: 'Mark-to-market carry on unrealized portfolio. Not cash-settled; reverses on realization. ILPA RT v2.0: gross-of-carry vs. net-of-carry NAV both reported.',
    },
    {
      code: 'CARRY-PAID', sortOrder: 53,
      name: 'Carried Interest: Paid (Cash Settlement)',
      ilpaCategory: 'Carried Interest', ilpaSubtype: 'Carry — Paid', ilpaTemplateRef: tpRef,
      direction: 'Outflow', insideFund: true, recallable: false,
      navImpact: 'Decrease NAV',
      glDebit: 'Carried Interest Payable — GP', glCredit: 'Cash & Cash Equivalents', journalType: 'JE-CARRY-PAID',
      perfTemplateClass: 'Carried Interest', perfTemplateMethod: 'Both',
      feeOffset: false, feeOffsetType: 'Carry Basis',
      waterfallTier: 'Carried Interest',
      commitmentImpact: 'No Impact',
      settlementDays: 'T+5', autoReconcile: false, approvalRequired: true,
      taxReporting: 'Schedule K-1 — Item 1',
      notes: 'Cash settlement of accrued/realized carried interest. Corresponds to DIST-CARRY-PAID on LP side. Clawback escrow provisions apply.',
    },
    // ── SUBSCRIPTION FACILITY / DEBT ──────────────────────────────────
    {
      code: 'FACIL-DRAW', sortOrder: 60,
      name: 'Subscription Facility: Draw',
      ilpaCategory: 'Facility / Debt', ilpaSubtype: 'Facility — Draw', ilpaTemplateRef: tpRef,
      direction: 'Inflow', insideFund: true, recallable: false,
      navImpact: 'No NAV Impact',
      glDebit: 'Cash & Cash Equivalents', glCredit: 'Subscription Facility Payable', journalType: 'JE-FACIL-DRAW',
      perfTemplateClass: 'N/A', perfTemplateMethod: 'N/A',
      feeOffset: false, feeOffsetType: 'None',
      waterfallTier: 'N/A',
      commitmentImpact: 'No Impact',
      settlementDays: 'T+0', autoReconcile: true, approvalRequired: true,
      taxReporting: 'None',
      notes: 'Draw on subscription/capital call credit facility. Defers LP capital calls. ILPA requires dual IRR reporting (with/without facility impact).',
    },
    {
      code: 'FACIL-REPAY', sortOrder: 61,
      name: 'Subscription Facility: Repayment',
      ilpaCategory: 'Facility / Debt', ilpaSubtype: 'Facility — Repayment', ilpaTemplateRef: tpRef,
      direction: 'Outflow', insideFund: true, recallable: false,
      navImpact: 'No NAV Impact',
      glDebit: 'Subscription Facility Payable', glCredit: 'Cash & Cash Equivalents', journalType: 'JE-FACIL-REPAY',
      perfTemplateClass: 'N/A', perfTemplateMethod: 'N/A',
      feeOffset: false, feeOffsetType: 'None',
      waterfallTier: 'N/A',
      commitmentImpact: 'No Impact',
      settlementDays: 'T+0', autoReconcile: true, approvalRequired: true,
      taxReporting: 'None',
      notes: 'Principal repayment of subscription credit facility. Triggers LP capital call to fund repayment. Part of unfunded commitment reduction.',
    },
    {
      code: 'FACIL-INT', sortOrder: 62,
      name: 'Subscription Facility: Interest Payment',
      ilpaCategory: 'Facility / Debt', ilpaSubtype: 'Facility — Interest', ilpaTemplateRef: tpRef,
      direction: 'Outflow', insideFund: true, recallable: false,
      navImpact: 'Decrease NAV',
      glDebit: 'Interest Expense — Facility', glCredit: 'Cash & Cash Equivalents', journalType: 'JE-FACIL-INT',
      perfTemplateClass: 'Fee', perfTemplateMethod: 'Both',
      feeOffset: false, feeOffsetType: 'None',
      waterfallTier: 'N/A',
      commitmentImpact: 'No Impact',
      settlementDays: 'T+0', autoReconcile: true, approvalRequired: false,
      taxReporting: 'Schedule K-1 — Item F',
      notes: 'Cash interest paid on outstanding subscription facility balance. Separate from EXP-SUB (accrued fees). Charged to fund as operating expense.',
    },
    // ── OTHER INCOME & ADJUSTMENTS ────────────────────────────────────
    {
      code: 'INC-DIV', sortOrder: 70,
      name: 'Dividend Income',
      ilpaCategory: 'Other', ilpaSubtype: 'Income — Dividend', ilpaTemplateRef: tpRef,
      direction: 'Inflow', insideFund: true, recallable: false,
      navImpact: 'Increase NAV',
      glDebit: 'Cash & Cash Equivalents', glCredit: 'Dividend Income', journalType: 'JE-INC-DIV',
      perfTemplateClass: 'N/A', perfTemplateMethod: 'N/A',
      feeOffset: false, feeOffsetType: 'None',
      waterfallTier: 'Preferred Return',
      commitmentImpact: 'No Impact',
      settlementDays: 'T+1', autoReconcile: true, approvalRequired: false,
      taxReporting: 'Schedule K-1 — Item 6a',
      notes: 'Cash dividends received from portfolio company holdings or securities. Gross of withholding tax; net withholding reported separately.',
    },
    {
      code: 'INC-INT', sortOrder: 71,
      name: 'Interest Income',
      ilpaCategory: 'Other', ilpaSubtype: 'Income — Interest', ilpaTemplateRef: tpRef,
      direction: 'Inflow', insideFund: true, recallable: false,
      navImpact: 'Increase NAV',
      glDebit: 'Cash & Cash Equivalents', glCredit: 'Interest Income', journalType: 'JE-INC-INT',
      perfTemplateClass: 'N/A', perfTemplateMethod: 'N/A',
      feeOffset: false, feeOffsetType: 'None',
      waterfallTier: 'Preferred Return',
      commitmentImpact: 'No Impact',
      settlementDays: 'T+1', autoReconcile: true, approvalRequired: false,
      taxReporting: 'Schedule K-1 — Item 5',
      notes: 'Interest income from cash balances, money market, promissory notes, or portfolio company debt instruments.',
    },
    {
      code: 'INC-FX', sortOrder: 72,
      name: 'Foreign Exchange Gain / Loss',
      ilpaCategory: 'Other', ilpaSubtype: 'Income — FX Gain/Loss', ilpaTemplateRef: tpRef,
      direction: 'Bilateral', insideFund: true, recallable: false,
      navImpact: 'Increase NAV',
      glDebit: 'FX Gain/Loss — Unrealized', glCredit: 'Unrealized FX Adjustment', journalType: 'JE-FX',
      perfTemplateClass: 'N/A', perfTemplateMethod: 'N/A',
      feeOffset: false, feeOffsetType: 'None',
      waterfallTier: 'N/A',
      commitmentImpact: 'No Impact',
      settlementDays: 'T+0', autoReconcile: true, approvalRequired: false,
      taxReporting: 'Schedule K-1 — Item 11 (Sec 988)',
      notes: 'Realized and unrealized FX gains/losses on non-base-currency assets and liabilities. Section 988 ordinary income treatment may apply.',
    },
    {
      code: 'ADJ-RECL', sortOrder: 80,
      name: 'Adjustment / Reclassification',
      ilpaCategory: 'Other', ilpaSubtype: 'Adjustment — Reclassification', ilpaTemplateRef: tpRef,
      direction: 'Bilateral', insideFund: true, recallable: false,
      navImpact: 'No NAV Impact',
      glDebit: 'Prior Period Adjustment Account', glCredit: 'Reclassification Contra Account', journalType: 'JE-ADJ',
      perfTemplateClass: 'N/A', perfTemplateMethod: 'N/A',
      feeOffset: false, feeOffsetType: 'None',
      waterfallTier: 'N/A',
      commitmentImpact: 'No Impact',
      settlementDays: 'T+0', autoReconcile: false, approvalRequired: true,
      taxReporting: 'None',
      notes: 'Correction entries, period reclassifications, and balance sheet adjustments. Requires director approval and audit trail documentation.',
    },
  ]});

  console.log('Created ILPA transaction parameters');

  // ── Waterfall Engine ─────────────────────────────────────────────────────
  // Clear existing Wf* data in FK-safe order
  await prisma.wfDiuBatchLine.deleteMany();
  await prisma.wfDiuBatch.deleteMany();
  await prisma.wfRecommendedAction.deleteMany();
  await prisma.wfException.deleteMany();
  await prisma.wfFundInvestor.deleteMany();
  await prisma.wfNavSnapshot.deleteMany();
  await prisma.wfWaterfallStep.deleteMany();
  await prisma.wfFundTerm.deleteMany();
  await prisma.wfFund.deleteMany();
  await prisma.wfAuditLog.deleteMany();

  // Look up entity IDs by their hardcoded business IDs
  const walkerEntity   = await prisma.entity.findFirst({ where: { entityId: 'ENT-000002' } });
  const campbellEntity = await prisma.entity.findFirst({ where: { entityId: 'ENT-000007' } });
  const sullivanEntity = await prisma.entity.findFirst({ where: { entityId: 'ENT-000008' } });

  const WF_FUNDS = [
    {
      name: 'Walker Enterprise Fund III LP',
      shortName: 'WEF-III',
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
      entityId: walkerEntity?.id ?? null,
      terms: { hurdleRate: 0.08, carryPct: 0.20, catchupType: 'full', mgmtFeeRate: 0.02, mgmtFeeBasis: 'committed', fundLife: 10, investmentPeriod: 5, preferredReturn: 0.08 },
      steps: [
        { stepOrder: 1, stepName: 'Return of Capital',     lpSplit: 1.00, gpSplit: 0.00, description: 'Return LP capital contributions' },
        { stepOrder: 2, stepName: 'Preferred Return (8%)', lpSplit: 1.00, gpSplit: 0.00, description: 'Compound 8% preferred return on contributed capital' },
        { stepOrder: 3, stepName: 'GP Catch-Up',           lpSplit: 0.00, gpSplit: 1.00, description: 'GP catches up to 20% of preferred return' },
        { stepOrder: 4, stepName: 'Carried Interest Split',lpSplit: 0.80, gpSplit: 0.20, description: '80/20 split of remaining distributions' },
      ],
      investors: [
        { investorName: 'Stanford Endowment',    investorType: 'endowment',    investorClass: 'A', commitment: 150_000_000, contributed: 120_000_000, distributed: 20_000_000, nav: 140_000_000 },
        { investorName: 'CalPERS',               investorType: 'pension',       investorClass: 'A', commitment: 200_000_000, contributed: 160_000_000, distributed: 25_000_000, nav: 185_000_000 },
        { investorName: 'Blackstone Credit',     investorType: 'institutional', investorClass: 'B', commitment: 100_000_000, contributed:  80_000_000, distributed: 15_000_000, nav:  90_000_000 },
        { investorName: 'CPPIB',                 investorType: 'pension',       investorClass: 'A', commitment: 250_000_000, contributed: 200_000_000, distributed: 30_000_000, nav: 240_000_000 },
        { investorName: 'Rockefeller Family Office', investorType: 'family_office', investorClass: 'B', commitment: 50_000_000, contributed: 40_000_000, distributed: 8_000_000, nav: 45_000_000 },
        { investorName: 'Harvard Management',   investorType: 'endowment',    investorClass: 'A', commitment: 100_000_000, contributed:  80_000_000, distributed: 12_000_000, nav: 220_000_000 },
      ],
      exceptions: [
        { exceptionType: 'side_letter_not_applied', severity: 'critical', title: 'CPPIB Side Letter Carry Override Not Applied', description: 'CPPIB negotiated a 15% carry rate in side letter executed 2022-03-15. Current waterfall uses default 20%, resulting in an overcharge of ~$4.2M on Q4 2025 distributions.', impactAmount: 4_200_000, recommendedFix: 'Update FundInvestor.overrideCarryPct to 0.15 for CPPIB and regenerate Q4 2025 distribution calculation.', confidence: 0.96, status: 'open' },
        { exceptionType: 'missing_equalization',    severity: 'high',     title: 'Rockefeller Family Office Equalization Shortfall', description: 'Rockefeller Family Office joined Q2 2022 closing. Equalization interest of $2.1M was not recorded, causing allocation discrepancy vs Class A investors.', impactAmount: 2_100_000, recommendedFix: 'Book equalization entry of $2.1M and update hasEqualization flag.', confidence: 0.89, status: 'open' },
      ],
    },
    {
      name: 'Campbell Growth Fund IV LP',
      shortName: 'CGF-IV',
      strategy: 'Growth Equity',
      waterfallType: 'american',
      status: 'active',
      vintage: 2023,
      totalCommitment: 500_000_000,
      totalNav: 610_000_000,
      totalDistributed: 85_000_000,
      totalUnrealized: 525_000_000,
      exceptionCount: 1,
      validationStatus: 'ok',
      complexityScore: 48,
      entityId: campbellEntity?.id ?? null,
      terms: { hurdleRate: 0.07, carryPct: 0.20, catchupType: 'partial', mgmtFeeRate: 0.0175, mgmtFeeBasis: 'invested', fundLife: 10, investmentPeriod: 5, preferredReturn: 0.07 },
      steps: [
        { stepOrder: 1, stepName: 'Return of Capital',    lpSplit: 1.00, gpSplit: 0.00, description: 'Return LP capital contributions' },
        { stepOrder: 2, stepName: 'Preferred Return (7%)',lpSplit: 1.00, gpSplit: 0.00, description: '7% preferred return on contributed capital' },
        { stepOrder: 3, stepName: 'Carried Interest',     lpSplit: 0.80, gpSplit: 0.20, description: '80/20 split — no full catch-up' },
      ],
      investors: [
        { investorName: 'Ontario Teachers',        investorType: 'pension',        investorClass: 'A', commitment: 100_000_000, contributed:  90_000_000, distributed: 20_000_000, nav: 115_000_000 },
        { investorName: 'Andreessen Horowitz',     investorType: 'institutional',  investorClass: 'A', commitment:  75_000_000, contributed:  68_000_000, distributed: 12_000_000, nav:  88_000_000 },
        { investorName: 'Yale Endowment',          investorType: 'endowment',      investorClass: 'A', commitment: 150_000_000, contributed: 135_000_000, distributed: 30_000_000, nav: 190_000_000 },
        { investorName: 'Pacific Investment Group',investorType: 'institutional',  investorClass: 'B', commitment:  80_000_000, contributed:  72_000_000, distributed: 14_000_000, nav:  94_000_000 },
        { investorName: 'Morgan Creek Capital',    investorType: 'fund_of_funds',  investorClass: 'A', commitment:  95_000_000, contributed:  85_000_000, distributed:  9_000_000, nav: 123_000_000 },
      ],
      exceptions: [
        { exceptionType: 'fee_calculation_discrepancy', severity: 'medium', title: 'Management Fee Basis Discrepancy — Q3 2025', description: 'Q3 2025 fees calculated on committed capital ($500M) rather than invested capital. LPA specifies invested-capital basis post investment period (ended 2025-01-01). Overcharge ~$875K.', impactAmount: 875_000, recommendedFix: 'Reverse Q3 2025 management fee entries and rebook on invested capital basis ($395M).', confidence: 0.94, status: 'open' },
      ],
    },
    {
      name: 'Sullivan Global Alpha Fund',
      shortName: 'SGA',
      strategy: 'Hedge Fund',
      waterfallType: 'american',
      status: 'active',
      vintage: 2017,
      totalCommitment: 350_000_000,
      totalNav: 180_000_000,
      totalDistributed: 420_000_000,
      totalUnrealized: 180_000_000,
      exceptionCount: 0,
      validationStatus: 'ok',
      complexityScore: 35,
      entityId: sullivanEntity?.id ?? null,
      terms: { hurdleRate: 0.09, carryPct: 0.15, catchupType: 'none', mgmtFeeRate: 0.015, mgmtFeeBasis: 'nav', fundLife: 12, investmentPeriod: 5, preferredReturn: 0.09 },
      steps: [
        { stepOrder: 1, stepName: 'Return of Capital',        lpSplit: 1.00, gpSplit: 0.00, description: 'Return LP capital contributions' },
        { stepOrder: 2, stepName: 'Preferred Return (9%)',    lpSplit: 1.00, gpSplit: 0.00, description: '9% compound preferred return' },
        { stepOrder: 3, stepName: 'Carried Interest (15%)',   lpSplit: 0.85, gpSplit: 0.15, description: '85/15 split — no catch-up' },
      ],
      investors: [
        { investorName: 'GIC Singapore',         investorType: 'sovereign_wealth', investorClass: 'A', commitment:  80_000_000, contributed:  80_000_000, distributed: 100_000_000, nav:  42_000_000 },
        { investorName: 'Dutch Pension APG',      investorType: 'pension',          investorClass: 'A', commitment: 120_000_000, contributed: 120_000_000, distributed: 150_000_000, nav:  63_000_000 },
        { investorName: 'Vanguard Infrastructure',investorType: 'institutional',    investorClass: 'B', commitment:  70_000_000, contributed:  70_000_000, distributed:  85_000_000, nav:  37_000_000 },
        { investorName: 'Brookfield Secondaries', investorType: 'institutional',    investorClass: 'B', commitment:  80_000_000, contributed:  80_000_000, distributed:  85_000_000, nav:  38_000_000 },
      ],
      exceptions: [],
    },
  ];

  const wfFundIds: string[] = [];
  for (const f of WF_FUNDS) {
    const { terms, steps, investors, exceptions, entityId, ...fundData } = f;
    const fund = await prisma.wfFund.create({
      data: {
        ...fundData,
        ...(entityId ? { entityId } : {}),
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
            { snapshotDate: new Date('2025-12-31'), totalNav: fundData.totalNav,         unrealized: fundData.totalUnrealized },
          ],
        },
      },
    });
    wfFundIds.push(fund.id);
    for (const exc of exceptions) {
      await prisma.wfException.create({ data: { ...exc, fundId: fund.id } });
    }
  }

  await prisma.wfAuditLog.createMany({
    data: [
      { entityType: 'fund', entityId: wfFundIds[0], action: 'validated', note: 'WEF-III waterfall validation completed — 2 exceptions detected',         createdAt: new Date(Date.now() - 1_800_000) },
      { entityType: 'fund', entityId: wfFundIds[1], action: 'validated', note: 'CGF-IV fee calculation discrepancy flagged',                             createdAt: new Date(Date.now() - 7_200_000) },
      { entityType: 'fund', entityId: wfFundIds[2], action: 'refreshed', note: 'SGA distribution model refreshed — no exceptions',                       createdAt: new Date(Date.now() - 14_400_000) },
    ],
  });

  console.log(`Created ${WF_FUNDS.length} waterfall funds linked to Canopy entities`);
  // ─────────────────────────────────────────────────────────────────────────

  console.log('\n✅ Seed complete!');

  // RevOps — quote-to-cash pipeline data
  await seedRevOps(prisma);
  console.log('✅ RevOps seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
