import { PrismaClient } from '@prisma/client';

// Real Client IDs from the Canopy Client table
const REAL_CLIENTS: Record<string, { id: string; name: string }> = {
  'Walker Asset Management':        { id: 'cmo15h2z80000ojiza1vumn56', name: 'Walker Asset Management' },
  'Campbell Capital Partners':      { id: 'cmo15h2z80001ojizp01njqdd', name: 'Campbell Capital Partners' },
  'Cruz Capital Management':        { id: 'cmo15h2z80002ojizf2pm3io5', name: 'Cruz Capital Management' },
  'Sullivan Investments':           { id: 'cmo15h2z80003ojizmd03jbo9', name: 'Sullivan Investments' },
  'White Fund Management':          { id: 'cmo15h2z80004ojizrfjv77mv', name: 'White Fund Management' },
  'Lopez Asset Partners':           { id: 'cmo15h2z80005ojizomgnf134', name: 'Lopez Asset Partners' },
  'Rodriguez Capital Management':   { id: 'cmo15h2z80006ojizgrhk879f', name: 'Rodriguez Capital Management' },
  'White Advisors':                 { id: 'cmo15h2z90007ojizbm5b5jxk', name: 'White Advisors' },
};

export async function seedRevOps(prisma: PrismaClient): Promise<void> {
  // ── Cleanup (reverse dependency order) ───────────────────────────
  await prisma.order.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.quoteLine.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.opportunityContact.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.account.deleteMany();
  await prisma.priceBook.deleteMany();

  // ── 1. PriceBook ─────────────────────────────────────────────────
  await prisma.priceBook.createMany({
    data: [
      { service: 'Fund Accounting',   aumTierLabel: '<$250M',    aumTierMin: null, aumTierMax: 250,  pricePerEntity: 18000, isActive: true },
      { service: 'Fund Accounting',   aumTierLabel: '$250M–$1B', aumTierMin: 250,  aumTierMax: 1000, pricePerEntity: 28000, isActive: true },
      { service: 'Fund Accounting',   aumTierLabel: '$1B–$5B',   aumTierMin: 1000, aumTierMax: 5000, pricePerEntity: 42000, isActive: true },
      { service: 'Fund Accounting',   aumTierLabel: '$5B+',      aumTierMin: 5000, aumTierMax: null, pricePerEntity: 65000, isActive: true },
      { service: 'Investor Services', aumTierLabel: '<$250M',    aumTierMin: null, aumTierMax: 250,  pricePerEntity: 10000, isActive: true },
      { service: 'Investor Services', aumTierLabel: '$250M–$1B', aumTierMin: 250,  aumTierMax: 1000, pricePerEntity: 15000, isActive: true },
      { service: 'Investor Services', aumTierLabel: '$1B–$5B',   aumTierMin: 1000, aumTierMax: 5000, pricePerEntity: 22000, isActive: true },
      { service: 'Tax Services',      aumTierLabel: 'All',       aumTierMin: null, aumTierMax: null, pricePerEntity: 8000,  isActive: true },
      { service: 'Treasury',          aumTierLabel: 'All',       aumTierMin: null, aumTierMax: null, pricePerEntity: 6000,  isActive: true },
      { service: 'Loan Admin',        aumTierLabel: 'All',       aumTierMin: null, aumTierMax: null, pricePerEntity: 12000, isActive: true },
    ],
  });

  // ── 2. Accounts ───────────────────────────────────────────────────
  // 2a. Mirror accounts for existing Clients (Active Client status)
  await prisma.account.createMany({
    data: [
      {
        id: 'acc-c01', accountId: 'ACC-C01',
        name: 'Walker Asset Management', industry: 'Private Equity',
        hqCity: 'Chicago', hqState: 'IL', hqCountry: 'United States', region: 'Americas',
        aumMm: 4200, website: 'walkerasset.com', ownerName: 'Sarah Chen',
        status: 'Active Client', clientId: REAL_CLIENTS['Walker Asset Management'].id,
      },
      {
        id: 'acc-c02', accountId: 'ACC-C02',
        name: 'Campbell Capital Partners', industry: 'Private Equity',
        hqCity: 'New York', hqState: 'NY', hqCountry: 'United States', region: 'Americas',
        aumMm: 2800, website: 'campbellcp.com', ownerName: 'Marcus Williams',
        status: 'Active Client', clientId: REAL_CLIENTS['Campbell Capital Partners'].id,
      },
      {
        id: 'acc-c03', accountId: 'ACC-C03',
        name: 'Cruz Capital Management', industry: 'Venture Capital',
        hqCity: 'San Francisco', hqState: 'CA', hqCountry: 'United States', region: 'Americas',
        aumMm: 1600, website: 'cruzcapital.com', ownerName: 'Priya Patel',
        status: 'Active Client', clientId: REAL_CLIENTS['Cruz Capital Management'].id,
      },
      {
        id: 'acc-c04', accountId: 'ACC-C04',
        name: 'Sullivan Investments', industry: 'Real Estate',
        hqCity: 'Boston', hqState: 'MA', hqCountry: 'United States', region: 'Americas',
        aumMm: 3100, website: 'sullivaninv.com', ownerName: 'David Kim',
        status: 'Active Client', clientId: REAL_CLIENTS['Sullivan Investments'].id,
      },
      {
        id: 'acc-c05', accountId: 'ACC-C05',
        name: 'White Fund Management', industry: 'Fund of Funds',
        hqCity: 'Dallas', hqState: 'TX', hqCountry: 'United States', region: 'Americas',
        aumMm: 5800, website: 'whitefundmgmt.com', ownerName: 'Sarah Chen',
        status: 'Active Client', clientId: REAL_CLIENTS['White Fund Management'].id,
      },
      {
        id: 'acc-c06', accountId: 'ACC-C06',
        name: 'Lopez Asset Partners', industry: 'Credit',
        hqCity: 'Miami', hqState: 'FL', hqCountry: 'United States', region: 'Americas',
        aumMm: 1200, website: 'lopezassets.com', ownerName: 'Marcus Williams',
        status: 'Active Client', clientId: REAL_CLIENTS['Lopez Asset Partners'].id,
      },
      {
        id: 'acc-c07', accountId: 'ACC-C07',
        name: 'Rodriguez Capital Management', industry: 'Private Equity',
        hqCity: 'Los Angeles', hqState: 'CA', hqCountry: 'United States', region: 'Americas',
        aumMm: 2200, website: 'rodriguezcm.com', ownerName: 'Priya Patel',
        status: 'Active Client', clientId: REAL_CLIENTS['Rodriguez Capital Management'].id,
      },
      {
        id: 'acc-c08', accountId: 'ACC-C08',
        name: 'White Advisors', industry: 'Credit',
        hqCity: 'Charlotte', hqState: 'NC', hqCountry: 'United States', region: 'Americas',
        aumMm: 3400, website: 'whiteadvisors.com', ownerName: 'David Kim',
        status: 'Active Client', clientId: REAL_CLIENTS['White Advisors'].id,
      },
    ],
  });

  // 2b. Prospect accounts (new logos)
  await prisma.account.createMany({
    data: [
      { id: 'acc-p01', accountId: 'ACC-P01', name: 'Meridian Capital Partners',     industry: 'Private Equity', hqCity: 'New York',     hqState: 'NY', hqCountry: 'United States', region: 'Americas', aumMm: 3200, website: 'meridiancp.com',     ownerName: 'Sarah Chen',     status: 'Prospect' },
      { id: 'acc-p02', accountId: 'ACC-P02', name: 'Harborview Credit Strategies',  industry: 'Credit',         hqCity: 'Chicago',      hqState: 'IL', hqCountry: 'United States', region: 'Americas', aumMm: 2400, website: 'harborviewcredit.com', ownerName: 'Marcus Williams', status: 'Prospect' },
      { id: 'acc-p03', accountId: 'ACC-P03', name: 'Pinnacle Fund of Funds',        industry: 'Fund of Funds',  hqCity: 'Boston',       hqState: 'MA', hqCountry: 'United States', region: 'Americas', aumMm: 1750, website: 'pinnaclefof.com',     ownerName: 'Priya Patel',    status: 'Prospect' },
      { id: 'acc-p04', accountId: 'ACC-P04', name: 'Cerulean Private Credit',       industry: 'Credit',         hqCity: 'New York',     hqState: 'NY', hqCountry: 'United States', region: 'Americas', aumMm: 700,  website: 'ceruleancredit.com',  ownerName: 'David Kim',      status: 'Prospect' },
      { id: 'acc-p05', accountId: 'ACC-P05', name: 'Summit Ridge Ventures',         industry: 'Venture Capital',hqCity: 'Austin',       hqState: 'TX', hqCountry: 'United States', region: 'Americas', aumMm: 420,  website: 'summitridgevc.com',   ownerName: 'Sarah Chen',     status: 'Prospect' },
      { id: 'acc-p06', accountId: 'ACC-P06', name: 'Bluewater Capital Management',  industry: 'Private Equity', hqCity: 'Miami',        hqState: 'FL', hqCountry: 'United States', region: 'Americas', aumMm: 1300, website: 'bluewatercm.com',     ownerName: 'Marcus Williams', status: 'Prospect' },
      { id: 'acc-p07', accountId: 'ACC-P07', name: 'Northfield Equity Partners',    industry: 'Private Equity', hqCity: 'Minneapolis',  hqState: 'MN', hqCountry: 'United States', region: 'Americas', aumMm: 950,  website: 'northfieldep.com',    ownerName: 'Priya Patel',    status: 'Prospect' },
      { id: 'acc-p08', accountId: 'ACC-P08', name: 'Thornwick Asset Management',    industry: 'Fund of Funds',  hqCity: 'London',       hqState: null, hqCountry: 'United Kingdom', region: 'EMEA',    aumMm: 4200, website: 'thornwickam.co.uk',   ownerName: 'David Kim',      status: 'Prospect' },
      { id: 'acc-p09', accountId: 'ACC-P09', name: 'Vega Capital Advisors',         industry: 'Credit',         hqCity: 'Amsterdam',    hqState: null, hqCountry: 'Netherlands',   region: 'EMEA',    aumMm: 1100, website: 'vegacapital.nl',      ownerName: 'Sarah Chen',     status: 'Prospect' },
      { id: 'acc-p10', accountId: 'ACC-P10', name: 'Radiance Real Estate Fund',     industry: 'Real Estate',    hqCity: 'Dubai',        hqState: null, hqCountry: 'UAE',           region: 'EMEA',    aumMm: 3700, website: 'radiancere.ae',       ownerName: 'Marcus Williams', status: 'Prospect' },
      { id: 'acc-p11', accountId: 'ACC-P11', name: 'Indus Growth Capital',          industry: 'Private Equity', hqCity: 'Singapore',    hqState: null, hqCountry: 'Singapore',     region: 'APAC',    aumMm: 1600, website: 'indusgrowth.sg',      ownerName: 'Priya Patel',    status: 'Prospect' },
      { id: 'acc-p12', accountId: 'ACC-P12', name: 'Jade Tree Real Assets',         industry: 'Real Estate',    hqCity: 'Hong Kong',    hqState: null, hqCountry: 'Hong Kong',     region: 'APAC',    aumMm: 2800, website: 'jadetreera.hk',       ownerName: 'David Kim',      status: 'Prospect' },
      { id: 'acc-p13', accountId: 'ACC-P13', name: 'Sunrise Credit Opportunities',  industry: 'Credit',         hqCity: 'Sydney',       hqState: null, hqCountry: 'Australia',     region: 'APAC',    aumMm: 780,  website: 'sunrisecredit.com.au',ownerName: 'Sarah Chen',     status: 'Prospect' },
      { id: 'acc-p14', accountId: 'ACC-P14', name: 'Pacific Ridge Equity',          industry: 'Private Equity', hqCity: 'Tokyo',        hqState: null, hqCountry: 'Japan',         region: 'APAC',    aumMm: 3500, website: 'pacificridgeeq.jp',   ownerName: 'Marcus Williams', status: 'Prospect' },
      { id: 'acc-p15', accountId: 'ACC-P15', name: 'Kestrel Fund Advisors',         industry: 'Fund of Funds',  hqCity: 'Melbourne',    hqState: null, hqCountry: 'Australia',     region: 'APAC',    aumMm: 620,  website: 'kestrelfunds.com.au', ownerName: 'Priya Patel',    status: 'Prospect' },
      { id: 'acc-p16', accountId: 'ACC-P16', name: 'Redwood Growth Partners',       industry: 'Venture Capital',hqCity: 'Seattle',      hqState: 'WA', hqCountry: 'United States', region: 'Americas', aumMm: 480,  website: 'redwoodgp.com',       ownerName: 'David Kim',      status: 'Prospect' },
      { id: 'acc-p17', accountId: 'ACC-P17', name: 'Foxcroft Capital Group',        industry: 'Private Equity', hqCity: 'Charlotte',    hqState: 'NC', hqCountry: 'United States', region: 'Americas', aumMm: 1900, website: 'foxcroftcg.com',      ownerName: 'Sarah Chen',     status: 'Prospect' },
      { id: 'acc-p18', accountId: 'ACC-P18', name: 'Lakeside Real Estate Advisors', industry: 'Real Estate',    hqCity: 'Nashville',    hqState: 'TN', hqCountry: 'United States', region: 'Americas', aumMm: 2100, website: 'lakesiderea.com',     ownerName: 'Marcus Williams', status: 'Prospect' },
      { id: 'acc-p19', accountId: 'ACC-P19', name: 'Altus Private Markets',         industry: 'Private Equity', hqCity: 'New York',     hqState: 'NY', hqCountry: 'United States', region: 'Americas', aumMm: 7800, website: 'altusprivatemarkets.com', ownerName: 'Priya Patel', status: 'Prospect' },
      { id: 'acc-p20', accountId: 'ACC-P20', name: 'Ironwood Real Estate Partners', industry: 'Real Estate',    hqCity: 'Los Angeles',  hqState: 'CA', hqCountry: 'United States', region: 'Americas', aumMm: 6800, website: 'ironwoodre.com',      ownerName: 'David Kim',      status: 'Prospect' },
      { id: 'acc-p21', accountId: 'ACC-P21', name: 'Castellan Private Equity',      industry: 'Private Equity', hqCity: 'Frankfurt',    hqState: null, hqCountry: 'Germany',       region: 'EMEA',    aumMm: 2900, website: 'castellanpe.de',      ownerName: 'Sarah Chen',     status: 'Disqualified' },
      { id: 'acc-p22', accountId: 'ACC-P22', name: 'Cobalt Venture Partners',       industry: 'Venture Capital',hqCity: 'Stockholm',    hqState: null, hqCountry: 'Sweden',        region: 'EMEA',    aumMm: 340,  website: 'cobaltventures.se',   ownerName: 'Marcus Williams', status: 'Disqualified' },
      { id: 'acc-p23', accountId: 'ACC-P23', name: 'Silverstone Credit Fund',       industry: 'Credit',         hqCity: 'Denver',       hqState: 'CO', hqCountry: 'United States', region: 'Americas', aumMm: 390,  website: 'silverstonecf.com',   ownerName: 'Priya Patel',    status: 'Disqualified' },
    ],
  });

  const allAccounts = await prisma.account.findMany({ orderBy: { accountId: 'asc' } });
  const accByAccId = Object.fromEntries(allAccounts.map(a => [a.accountId, a]));

  // ── 3. Contacts ───────────────────────────────────────────────────
  type ContactDef = [string, string, string, string, string, string, string, boolean];
  const contactDefs: ContactDef[] = [
    // contactId, accId, firstName, lastName, title, email, contactType, isPrimary
    // Client mirror accounts — key stakeholders
    ['CON-C01', 'ACC-C01', 'James',   'Walker',    'CFO',                        'jwalker@walkerasset.com',          'Decision Maker', true],
    ['CON-C02', 'ACC-C01', 'Elena',   'Novak',     'Controller',                 'enovak@walkerasset.com',            'Influencer',     false],
    ['CON-C03', 'ACC-C02', 'Thomas',  'Campbell',  'Managing Partner',           'tcampbell@campbellcp.com',          'Decision Maker', true],
    ['CON-C04', 'ACC-C02', 'Mark',    'Donovan',   'CFO',                        'mdonovan@campbellcp.com',           'Economic Buyer', false],
    ['CON-C05', 'ACC-C03', 'Elena',   'Cruz',      'CFO',                        'ecruz@cruzcapital.com',             'Decision Maker', true],
    ['CON-C06', 'ACC-C03', 'Sophie',  'van Dijk',  'Head of Fund Operations',    'svandijk@cruzcapital.com',          'Champion',       false],
    ['CON-C07', 'ACC-C04', 'Daniel',  'Sullivan',  'COO',                        'dsullivan@sullivaninv.com',         'Decision Maker', true],
    ['CON-C08', 'ACC-C04', 'Rachel',  'Brennan',   'CFO',                        'rbrennan@sullivaninv.com',          'Economic Buyer', false],
    ['CON-C09', 'ACC-C05', 'Patricia','White',     'Managing Director',          'pwhite@whitefundmgmt.com',          'Decision Maker', true],
    ['CON-C10', 'ACC-C05', 'Gregory', 'Marsh',     'CFO',                        'gmarsh@whitefundmgmt.com',          'Economic Buyer', false],
    ['CON-C11', 'ACC-C06', 'Carlos',  'Lopez',     'Partner',                    'clopez@lopezassets.com',            'Decision Maker', true],
    ['CON-C12', 'ACC-C06', 'Maria',   'Gutierrez', 'Controller',                 'mgutierrez@lopezassets.com',        'Influencer',     false],
    ['CON-C13', 'ACC-C07', 'Miguel',  'Rodriguez', 'CFO',                        'mrodriguez@rodriguezcm.com',        'Decision Maker', true],
    ['CON-C14', 'ACC-C07', 'Andrea',  'Morales',   'Head of Fund Operations',    'amorales@rodriguezcm.com',          'Champion',       false],
    ['CON-C15', 'ACC-C08', 'Robert',  'White',     'COO',                        'rwhite@whiteadvisors.com',          'Decision Maker', true],
    ['CON-C16', 'ACC-C08', 'Jessica', 'Hawkins',   'CFO',                        'jhawkins@whiteadvisors.com',        'Economic Buyer', false],
    // Prospect accounts
    ['CON-P01', 'ACC-P01', 'James',   'Whitfield',  'CFO',                       'jwhitfield@meridiancp.com',         'Decision Maker', true],
    ['CON-P02', 'ACC-P01', 'Angela',  'Torres',     'Controller',                'atorres@meridiancp.com',            'Influencer',     false],
    ['CON-P03', 'ACC-P01', 'Brian',   'Nakamura',   'COO',                       'bnakamura@meridiancp.com',          'Champion',       false],
    ['CON-P04', 'ACC-P02', 'Patricia','Russo',      'CFO',                       'prusso@harborviewcredit.com',       'Decision Maker', true],
    ['CON-P05', 'ACC-P02', 'Derek',   'Chung',      'Controller',                'dchung@harborviewcredit.com',       'Influencer',     false],
    ['CON-P06', 'ACC-P03', 'William', 'Hartley',    'Partner',                   'whartley@pinnaclefof.com',          'Decision Maker', true],
    ['CON-P07', 'ACC-P03', 'Maria',   'Santos',     'VP Finance',                'msantos@pinnaclefof.com',           'Economic Buyer', false],
    ['CON-P08', 'ACC-P04', 'Gregory', 'Asante',     'COO',                       'gasante@ceruleancredit.com',        'Decision Maker', true],
    ['CON-P09', 'ACC-P05', 'Nathan',  'Reyes',      'Managing Director',         'nreyes@summitridgevc.com',          'Decision Maker', true],
    ['CON-P10', 'ACC-P06', 'Michael', 'Eriksson',   'COO',                       'meriksson@bluewatercm.com',         'Decision Maker', true],
    ['CON-P11', 'ACC-P07', 'Christopher','Patel',   'CFO',                       'cpatel@northfieldep.com',           'Decision Maker', true],
    ['CON-P12', 'ACC-P08', 'Edward',  'Clarke',     'Managing Director',         'eclarke@thornwickam.co.uk',         'Decision Maker', true],
    ['CON-P13', 'ACC-P08', 'Fiona',   'McLaren',    'CFO',                       'fmclaren@thornwickam.co.uk',        'Economic Buyer', false],
    ['CON-P14', 'ACC-P09', 'Annette', 'Visser',     'CFO',                       'avisser@vegacapital.nl',            'Decision Maker', true],
    ['CON-P15', 'ACC-P10', 'Omar',    'Al-Rashid',  'CFO',                       'oalrashid@radiancere.ae',           'Decision Maker', true],
    ['CON-P16', 'ACC-P10', 'Leila',   'Hassan',     'Head of Fund Operations',   'lhassan@radiancere.ae',             'Champion',       false],
    ['CON-P17', 'ACC-P11', 'Anjali',  'Mehta',      'CFO',                       'amehta@indusgrowth.sg',             'Decision Maker', true],
    ['CON-P18', 'ACC-P12', 'David',   'Lam',        'Partner',                   'dlam@jadetreera.hk',                'Decision Maker', true],
    ['CON-P19', 'ACC-P13', 'Andrew',  'Flynn',      'CFO',                       'aflynn@sunrisecredit.com.au',       'Decision Maker', true],
    ['CON-P20', 'ACC-P14', 'Hiroshi', 'Tanaka',     'Managing Director',         'htanaka@pacificridgeeq.jp',         'Decision Maker', true],
    ['CON-P21', 'ACC-P15', 'Claire',  'Beaumont',   'CFO',                       'cbeaumont@kestrelfunds.com.au',     'Decision Maker', true],
    ['CON-P22', 'ACC-P16', 'Marcus',  'Donnelly',   'COO',                       'mdonnelly@redwoodgp.com',           'Decision Maker', true],
    ['CON-P23', 'ACC-P17', 'Robert',  'Haines',     'CFO',                       'rhaines@foxcroftcg.com',            'Decision Maker', true],
    ['CON-P24', 'ACC-P17', 'Teresa',  'Monroe',     'VP Finance',                'tmonroe@foxcroftcg.com',            'Economic Buyer', false],
    ['CON-P25', 'ACC-P18', 'Jennifer','Baldwin',    'CFO',                       'jbaldwin@lakesiderea.com',          'Decision Maker', true],
    ['CON-P26', 'ACC-P18', 'Charles', 'Griffin',    'Head of Fund Operations',   'cgriffin@lakesiderea.com',          'Champion',       false],
    ['CON-P27', 'ACC-P19', 'Victoria','Hammond',    'Managing Director',         'vhammond@altusprivatemarkets.com',  'Decision Maker', true],
    ['CON-P28', 'ACC-P19', 'Jonathan','Price',      'CFO',                       'jprice@altusprivatemarkets.com',    'Economic Buyer', false],
    ['CON-P29', 'ACC-P20', 'Steven',  'Moreau',     'CFO',                       'smoreau@ironwoodre.com',            'Decision Maker', true],
    ['CON-P30', 'ACC-P20', 'Carmen',  'Diaz',       'Head of Fund Operations',   'cdiaz@ironwoodre.com',              'Champion',       false],
  ];

  await prisma.contact.createMany({
    data: contactDefs.map(([contactId, accId, firstName, lastName, title, email, contactType, isPrimary]) => ({
      contactId: contactId as string,
      firstName: firstName as string,
      lastName: lastName as string,
      title: title as string,
      email: email as string,
      contactType: contactType as string,
      isPrimary: isPrimary as boolean,
      accountId: accByAccId[accId as string]?.id ?? null,
      accountName: accByAccId[accId as string]?.name ?? null,
      status: 'Active',
    })),
  });

  const contacts = await prisma.contact.findMany({ orderBy: { contactId: 'asc' } });
  const primaryConByAccId: Record<string, typeof contacts[0]> = {};
  for (const c of contacts) {
    if (c.isPrimary && c.accountId && !primaryConByAccId[c.accountId]) {
      primaryConByAccId[c.accountId] = c;
    }
  }

  // ── 4. Leads ──────────────────────────────────────────────────────
  const D = (days: number) => new Date(Date.now() - days * 86400000);
  const reps = ['Sarah Chen', 'Marcus Williams', 'Priya Patel', 'David Kim'];

  await prisma.lead.createMany({
    data: [
      { leadId: 'LEAD-001', firstName: 'Emma',     lastName: 'Larson',    title: 'Director of Finance', company: 'Crestwood Capital',       status: 'New',          leadSource: 'Inbound',    email: 'elarson@crestwoodcap.com',       ownerName: reps[0], assignedAt: D(90) },
      { leadId: 'LEAD-002', firstName: 'Oliver',   lastName: 'Huang',     title: 'CFO',                 company: 'Waverly PE Group',         status: 'Working',      leadSource: 'Referral',   email: 'ohuang@waverlyeg.com',           ownerName: reps[1], assignedAt: D(75) },
      { leadId: 'LEAD-003', firstName: 'Sofia',    lastName: 'Brennan',   title: 'Controller',          company: 'Highland Credit Co',       status: 'Working',      leadSource: 'Conference', email: 'sbrennan@highlandcc.com',        ownerName: reps[2], assignedAt: D(60) },
      { leadId: 'LEAD-004', firstName: 'Carlos',   lastName: 'Ferreira',  title: 'COO',                 company: 'Redstone Ventures',        status: 'New',          leadSource: 'LinkedIn',   email: 'cferreira@redstonevt.com',       ownerName: reps[3], assignedAt: D(45) },
      { leadId: 'LEAD-005', firstName: 'Hannah',   lastName: 'Ostrowski', title: 'VP Finance',          company: 'Crescent RE Fund',         status: 'New',          leadSource: 'Inbound',    email: 'hostrowski@crescentref.com',     ownerName: reps[0], assignedAt: D(30) },
      { leadId: 'LEAD-006', firstName: 'Lucas',    lastName: 'Petrov',    title: 'Managing Director',   company: 'Azimuth Capital',          status: 'Working',      leadSource: 'Referral',   email: 'lpetrov@azimuthcp.com',          ownerName: reps[1], assignedAt: D(25) },
      { leadId: 'LEAD-007', firstName: 'Grace',    lastName: 'Nakamura',  title: 'CFO',                 company: 'Sable Credit Mgmt',        status: 'Converted',    leadSource: 'Referral',   email: 'gnakamura@sablecm.com',          ownerName: reps[2], assignedAt: D(120), convertedAt: D(30) },
      { leadId: 'LEAD-008', firstName: 'Ethan',    lastName: 'Morrison',  title: 'Head of Ops',         company: 'Copperhead PE',            status: 'Working',      leadSource: 'Conference', email: 'emorrison@copperheadpe.com',     ownerName: reps[3], assignedAt: D(20) },
      { leadId: 'LEAD-009', firstName: 'Isabella', lastName: 'Reyes',     title: 'Controller',          company: 'Tourmaline Equity',        status: 'New',          leadSource: 'Website',    email: 'ireyes@tourmalineq.com',         ownerName: reps[0], assignedAt: D(15) },
      { leadId: 'LEAD-010', firstName: 'Aiden',    lastName: 'Fischer',   title: 'Partner',             company: 'Amber Capital Partners',   status: 'Working',      leadSource: 'Referral',   email: 'afischer@ambercp.com',           ownerName: reps[1], assignedAt: D(12) },
      { leadId: 'LEAD-011', firstName: 'Zoe',      lastName: 'Yamamoto',  title: 'Fund Administrator',  company: 'Sunstone RE Advisors',     status: 'New',          leadSource: 'Inbound',    email: 'zyamamoto@sunstonera.com',       ownerName: reps[2], assignedAt: D(10) },
      { leadId: 'LEAD-012', firstName: 'Noah',     lastName: 'Adeyemi',   title: 'CFO',                 company: 'Glacier Growth Fund',      status: 'Working',      leadSource: 'Conference', email: 'nadeyemi@glaciergf.com',         ownerName: reps[3], assignedAt: D(8) },
      { leadId: 'LEAD-013', firstName: 'Mia',      lastName: 'Johansson', title: 'COO',                 company: 'Riviera Credit Fund',      status: 'New',          leadSource: 'LinkedIn',   email: 'mjohansson@rivieracf.com',       ownerName: reps[0], assignedAt: D(7) },
      { leadId: 'LEAD-014', firstName: 'Liam',     lastName: "O'Brien",   title: 'Managing Director',   company: 'Skyline Real Assets',      status: 'Working',      leadSource: 'Referral',   email: 'lobrien@skylinerealassets.com',  ownerName: reps[1], assignedAt: D(6) },
      { leadId: 'LEAD-015', firstName: 'Ava',      lastName: 'Hernandez', title: 'Controller',          company: 'Equinox Fund Mgmt',        status: 'New',          leadSource: 'Inbound',    email: 'ahernandez@equinoxfm.com',       ownerName: reps[2], assignedAt: D(5) },
      { leadId: 'LEAD-016', firstName: 'Caleb',    lastName: 'Nguyen',    title: 'VP Finance',          company: 'Foxhound Equity',          status: 'Disqualified', leadSource: 'LinkedIn',   email: 'cnguyen@foxhoundeq.com',         ownerName: reps[3], assignedAt: D(90) },
      { leadId: 'LEAD-017', firstName: 'Ella',     lastName: 'Becker',    title: 'CFO',                 company: 'Westbury Capital',         status: 'Working',      leadSource: 'Conference', email: 'ebecker@westburycap.com',        ownerName: reps[0], assignedAt: D(4) },
      { leadId: 'LEAD-018', firstName: 'Mason',    lastName: 'Pereira',   title: 'Partner',             company: 'Goldenrod Ventures',       status: 'Converted',    leadSource: 'Referral',   email: 'mpereira@goldenrodv.com',        ownerName: reps[1], assignedAt: D(100), convertedAt: D(20) },
      { leadId: 'LEAD-019', firstName: 'Aria',     lastName: 'Dubois',    title: 'Head of Fund Ops',    company: 'Aspen Credit Partners',    status: 'New',          leadSource: 'Website',    email: 'adubois@aspencredp.com',         ownerName: reps[2], assignedAt: D(3) },
      { leadId: 'LEAD-020', firstName: 'Finn',     lastName: 'Watanabe',  title: 'Controller',          company: 'Opal Private Equity',      status: 'Disqualified', leadSource: 'Inbound',    email: 'fwatanabe@opalpe.com',           ownerName: reps[3], assignedAt: D(60) },
    ],
  });

  // ── 5. Opportunities ─────────────────────────────────────────────
  type OppStage = 'Prospecting' | 'Discovery' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
  const stageProb: Record<OppStage, number> = {
    Prospecting: 10, Discovery: 25, Proposal: 50, Negotiation: 75, 'Closed Won': 100, 'Closed Lost': 0,
  };
  const future = (days: number) => new Date(Date.now() + days * 86400000);

  // 5a. Expansion deals — existing clients adding new funds
  type ExpansionDef = {
    oppId: string; accId: string; clientKey: string; name: string;
    stage: OppStage; amount: number; entityCount: number; aumMm: number;
    owner: string; scopeNotes: string;
  };
  const expansionOpps: ExpansionDef[] = [
    {
      oppId: 'OPP-X01', accId: 'acc-c01', clientKey: 'Walker Asset Management',
      name: 'Walker — Fund VI Co-Invest Programme',
      stage: 'Negotiation', amount: 336000, entityCount: 12, aumMm: 4200,
      owner: reps[0], scopeNotes: '3 new co-invest vehicles + 9 existing entities expanding into GP-led secondaries',
    },
    {
      oppId: 'OPP-X02', accId: 'acc-c08', clientKey: 'White Advisors',
      name: 'White Advisors — CLO III & IV Expansion',
      stage: 'Negotiation', amount: 420000, entityCount: 8, aumMm: 3400,
      owner: reps[3], scopeNotes: 'Two new CLO vehicles; requires Loan Admin + Tax Services add-on',
    },
    {
      oppId: 'OPP-X03', accId: 'acc-c03', clientKey: 'Cruz Capital Management',
      name: 'Cruz Capital — Fund V 2025 Vintage Add-On',
      stage: 'Proposal', amount: 280000, entityCount: 10, aumMm: 1600,
      owner: reps[2], scopeNotes: 'New vintage fund + parallel SPV; FA + IS full service',
    },
    {
      oppId: 'OPP-X04', accId: 'acc-c05', clientKey: 'White Fund Management',
      name: 'White Fund Management — Separately Managed Accounts',
      stage: 'Proposal', amount: 350000, entityCount: 15, aumMm: 5800,
      owner: reps[0], scopeNotes: '15 SMA vehicles for large institutional LP; IS + FA',
    },
    {
      oppId: 'OPP-X05', accId: 'acc-c02', clientKey: 'Campbell Capital Partners',
      name: 'Campbell — Fund IV International Feeders',
      stage: 'Discovery', amount: 196000, entityCount: 7, aumMm: 2800,
      owner: reps[1], scopeNotes: 'Cayman + Delaware feeder structures for new fund raise',
    },
    {
      oppId: 'OPP-X06', accId: 'acc-c04', clientKey: 'Sullivan Investments',
      name: 'Sullivan — Treasury Management Upsell',
      stage: 'Discovery', amount: 144000, entityCount: 6, aumMm: 3100,
      owner: reps[3], scopeNotes: 'Adding Treasury module to 6 existing RE fund entities',
    },
    {
      oppId: 'OPP-X07', accId: 'acc-c07', clientKey: 'Rodriguez Capital Management',
      name: 'Rodriguez — Credit Secondaries Platform',
      stage: 'Closed Won', amount: 462000, entityCount: 11, aumMm: 2200,
      owner: reps[2], scopeNotes: 'New credit secondaries strategy; FA + IS + Loan Admin full suite',
    },
    {
      oppId: 'OPP-X08', accId: 'acc-c06', clientKey: 'Lopez Asset Partners',
      name: 'Lopez — Tax Services Add-On',
      stage: 'Closed Won', amount: 112000, entityCount: 14, aumMm: 1200,
      owner: reps[1], scopeNotes: 'Tax K-1 preparation for all 14 existing fund entities',
    },
  ];

  await prisma.opportunity.createMany({
    data: expansionOpps.map(o => {
      const client = REAL_CLIENTS[o.clientKey];
      const isClosed = o.stage === 'Closed Won' || o.stage === 'Closed Lost';
      return {
        opportunityId: o.oppId,
        name: o.name,
        stage: o.stage,
        probability: stageProb[o.stage],
        amount: o.amount,
        tcv: o.amount * 3,
        entityCount: o.entityCount,
        aumMm: o.aumMm,
        accountId: accByAccId[o.accId]?.id ?? null,
        accountName: accByAccId[o.accId]?.name ?? '',
        dealType: 'Expansion',
        clientId: client.id,
        clientName: client.name,
        ownerName: o.owner,
        scopeNotes: o.scopeNotes,
        closeDate: isClosed ? D(180) : future(45),
        closedAt: isClosed ? D(180) : null,
        leadSource: 'Existing Client',
      };
    }),
  });

  // 5b. New Logo deals
  type NewLogoDef = [string, string, string, OppStage, number, number, number, string];
  const newLogoOpps: NewLogoDef[] = [
    ['OPP-N01', 'acc-p01', 'Meridian — Fund Accounting + IS',        'Prospecting',  180000, 8,  3200, reps[0]],
    ['OPP-N02', 'acc-p02', 'Harborview — FA + Tax Package',          'Prospecting',  145000, 6,  2400, reps[1]],
    ['OPP-N03', 'acc-p05', 'Summit Ridge — IS Starter',              'Prospecting',  120000, 5,  420,  reps[2]],
    ['OPP-N04', 'acc-p06', 'Bluewater — Full Platform',              'Prospecting',  320000, 12, 1300, reps[3]],
    ['OPP-N05', 'acc-p09', 'Vega — FA + Loan Admin',                 'Prospecting',  210000, 9,  1100, reps[0]],
    ['OPP-N06', 'acc-p16', 'Redwood — VC IS Bundle',                 'Prospecting',  135000, 5,  480,  reps[1]],
    ['OPP-N07', 'acc-p03', 'Pinnacle — FOF Full Suite',              'Discovery',    380000, 15, 1750, reps[2]],
    ['OPP-N08', 'acc-p07', 'Northfield — FA Mid-Market',             'Discovery',    240000, 10, 950,  reps[3]],
    ['OPP-N09', 'acc-p10', 'Radiance — RE Platform',                 'Discovery',    450000, 18, 3700, reps[0]],
    ['OPP-N10', 'acc-p11', 'Indus — Asia PE Suite',                  'Discovery',    295000, 11, 1600, reps[1]],
    ['OPP-N11', 'acc-p17', 'Foxcroft — FA + Tax',                    'Discovery',    270000, 12, 1900, reps[2]],
    ['OPP-N12', 'acc-p18', 'Lakeside — RE Full Platform',            'Discovery',    360000, 14, 2100, reps[3]],
    ['OPP-N13', 'acc-p04', 'Cerulean — Credit FA',                   'Proposal',     185000, 7,  700,  reps[0]],
    ['OPP-N14', 'acc-p08', 'Thornwick — EMEA FOF Bundle',            'Proposal',     520000, 20, 4200, reps[1]],
    ['OPP-N15', 'acc-p12', 'Jade Tree — HK RE Suite',                'Proposal',     410000, 16, 2800, reps[2]],
    ['OPP-N16', 'acc-p15', 'Kestrel — APAC FOF',                     'Proposal',     175000, 7,  620,  reps[3]],
    ['OPP-N17', 'acc-p19', 'Altus — Enterprise Platform',            'Proposal',     780000, 30, 7800, reps[0]],
    ['OPP-N18', 'acc-p13', 'Sunrise — Credit IS',                    'Negotiation',  200000, 8,  780,  reps[1]],
    ['OPP-N19', 'acc-p14', 'Pacific Ridge — Japan PE Suite',         'Closed Won',   430000, 17, 3500, reps[2]],
    ['OPP-N20', 'acc-p20', 'Ironwood — RE Enterprise',               'Closed Won',   560000, 22, 6800, reps[3]],
  ];

  await prisma.opportunity.createMany({
    data: newLogoOpps.map(([oppId, accId, name, stage, amount, entityCount, aumMm, owner]) => {
      const s = stage as OppStage;
      const isClosed = s === 'Closed Won' || s === 'Closed Lost';
      return {
        opportunityId: oppId as string,
        name: name as string,
        stage: s,
        probability: stageProb[s],
        amount: amount as number,
        tcv: (amount as number) * 3,
        entityCount: entityCount as number,
        aumMm: aumMm as number,
        accountId: accByAccId[accId as string]?.id ?? null,
        accountName: accByAccId[accId as string]?.name ?? '',
        dealType: 'New Logo',
        ownerName: owner as string,
        closeDate: isClosed ? D(150) : future(60),
        closedAt: isClosed ? D(150) : null,
        leadSource: 'Referral',
      };
    }),
  });

  const allOpps = await prisma.opportunity.findMany({ orderBy: { opportunityId: 'asc' } });
  const oppByOppId = Object.fromEntries(allOpps.map(o => [o.opportunityId, o]));

  // ── 6. OpportunityContact links ──────────────────────────────────
  const linkedStages = ['Proposal', 'Negotiation', 'Closed Won'];
  const ocData = allOpps
    .filter(o => linkedStages.includes(o.stage))
    .flatMap((o, idx) => {
      const primaryCon = o.accountId ? primaryConByAccId[o.accountId] : null;
      if (!primaryCon) return [];
      return [{
        opportunityId: o.id,
        contactId: primaryCon.id,
        role: 'Primary',
      }];
    });
  if (ocData.length > 0) await prisma.opportunityContact.createMany({ data: ocData });

  // ── 7. Activities ────────────────────────────────────────────────
  const actSubjects = [
    'Discovery call — fund ops review',
    'Demo — investor portal walkthrough',
    'Follow-up on RFP questions',
    'Intro call — FA capabilities overview',
    'Demo — fund accounting workflow',
    'Scoping call — entity count review',
    'Follow-up email — pricing proposal',
    'Meeting — compliance & reporting needs',
    'Call — tax services deep dive',
    'Demo — treasury module walkthrough',
    'Email — contract redline questions',
    'Meeting — executive sponsor intro',
    'Call — integration requirements',
    'Follow-up — security & SOC 2 review',
    'Demo — Loan Admin capabilities',
  ];
  const actTypes = ['Call', 'Meeting', 'Email', 'Demo'];
  const activeOpps = allOpps.filter(o => o.stage !== 'Closed Lost');

  const activityData = activeOpps.slice(0, 22).flatMap((o, oi) => {
    const count = oi % 3 === 0 ? 3 : 2;
    return Array.from({ length: count }, (_, ai) => ({
      activityId: `ACT-${String(oi * 3 + ai + 1).padStart(3, '0')}`,
      type: actTypes[(oi + ai) % 4],
      subject: actSubjects[(oi + ai) % actSubjects.length],
      opportunityId: o.id,
      opportunityName: o.name,
      accountId: o.accountId,
      accountName: o.accountName,
      ownerName: o.ownerName,
      activityDate: D((oi + 1) * 5 - ai * 2),
      durationMinutes: [30, 45, 60, 90][(oi + ai) % 4],
      completed: true,
    }));
  });
  await prisma.activity.createMany({ data: activityData.slice(0, 50) });

  // ── 8. Quotes ────────────────────────────────────────────────────
  const quotableOpps = allOpps.filter(o => ['Proposal', 'Negotiation', 'Closed Won'].includes(o.stage));
  const quoteStatuses = ['Draft', 'Draft', 'Sent', 'Sent', 'Sent', 'Accepted', 'Accepted', 'Accepted', 'Accepted', 'Accepted', 'Accepted', 'Rejected'];

  const quoteInserts = quotableOpps.slice(0, 15).map((o, i) => {
    const status = quoteStatuses[i] ?? 'Draft';
    const arr = Number(o.amount ?? 0);
    return {
      quoteId: `QTE-${String(i + 1).padStart(3, '0')}`,
      name: `${o.accountName} — Quote ${i + 1}`,
      opportunityId: o.id,
      opportunityName: o.name,
      accountId: o.accountId,
      accountName: o.accountName,
      status,
      totalArr: arr,
      totalTcv: arr * 3,
      validUntil: future(30),
      sentAt: status !== 'Draft' ? D(30) : null,
      acceptedAt: status === 'Accepted' ? D(15) : null,
      rejectedAt: status === 'Rejected' ? D(10) : null,
      createdByName: o.ownerName,
    };
  });
  await prisma.quote.createMany({ data: quoteInserts });

  const quotes = await prisma.quote.findMany({ orderBy: { quoteId: 'asc' } });

  // ── 9. QuoteLines ─────────────────────────────────────────────────
  const svcTemplates: Array<[string, string, number | null, number | null, number]> = [
    ['Fund Accounting',   '$1B–$5B',   1000, 5000, 42000],
    ['Investor Services', '$1B–$5B',   1000, 5000, 22000],
    ['Tax Services',      'All',       null, null,  8000],
    ['Fund Accounting',   '$250M–$1B',  250, 1000, 28000],
    ['Loan Admin',        'All',       null, null, 12000],
  ];
  const qlInserts = quotes.flatMap((q, qi) => {
    const linesCount = (qi % 3) + 2;
    return svcTemplates.slice(0, linesCount).map((svc, si) => {
      const entities = 5 + (qi + si) % 15;
      return {
        quoteId: q.id,
        service: svc[0],
        aumTierLabel: svc[1],
        aumTierMin: svc[2],
        aumTierMax: svc[3],
        pricePerEntity: svc[4],
        estimatedEntities: entities,
        annualValue: svc[4] * entities,
        sortOrder: si,
      };
    });
  });
  await prisma.quoteLine.createMany({ data: qlInserts.slice(0, 40) });

  // ── 10. Contracts ─────────────────────────────────────────────────
  const wonOpps = allOpps.filter(o => o.stage === 'Closed Won');
  const contractDefs = wonOpps.slice(0, 8).map((o, i) => {
    const startDate = D(365 - i * 60);
    const endDate = new Date(startDate.getTime() + (2 + (i % 2)) * 365 * 86400000);
    const status = i < 5 ? 'Active' : 'Executed';
    return {
      contractId: `CTR-${String(i + 1).padStart(3, '0')}`,
      name: `${o.accountName} — MSA ${2024 - Math.floor(i / 3)}`,
      opportunityId: o.id,
      accountId: o.accountId,
      accountName: o.accountName,
      status,
      contractType: 'MSA',
      startDate,
      endDate,
      autoRenew: true,
      noticePeriodDays: 90,
      annualValue: o.amount,
      totalValue: o.amount ? Number(o.amount) * 3 : null,
      billingFrequency: i < 5 ? 'Quarterly' : 'Annually',
      signedDate: D(185 + i * 5),
      executedDate: status === 'Executed' ? D(180 + i * 5) : null,
      jsqSignatory: 'Michael Blandino',
      counterpartySignatory: `${o.accountName} CFO`,
    };
  });
  await prisma.contract.createMany({ data: contractDefs });

  const contracts = await prisma.contract.findMany({ orderBy: { contractId: 'asc' } });
  const activeContracts = contracts.filter(c => c.status === 'Active');

  // ── 11. Orders ─────────────────────────────────────────────────────
  const orderStatuses = ['Active', 'Active', 'Active', 'Active', 'Pending'];
  await prisma.order.createMany({
    data: activeContracts.slice(0, 5).map((c, i) => ({
      orderId: `ORD-${String(i + 1).padStart(3, '0')}`,
      contractId: c.id,
      accountId: c.accountId,
      accountName: c.accountName,
      status: orderStatuses[i],
      billingStartDate: c.startDate,
      billingEndDate: c.endDate,
      annualValue: c.annualValue,
      billingFrequency: c.billingFrequency,
      nextBillingDate: future(30 + i * 15),
      entityCount: 8 + i * 3,
    })),
  });

  console.log(
    `RevOps seed: ${allAccounts.length} accounts (8 client mirrors + 23 prospects), ` +
    `${contacts.length} contacts, 20 leads, ` +
    `${expansionOpps.length} expansion + ${newLogoOpps.length} new logo opps, ` +
    `${activityData.slice(0, 50).length} activities, ${quotes.length} quotes, ` +
    `${contracts.length} contracts, ${activeContracts.slice(0, 5).length} orders`,
  );
}
