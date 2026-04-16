import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { toNum } from '@/lib/utils'

const STAGE_PROBABILITY: Record<string, number> = {
  Prospecting: 10,
  Discovery: 25,
  Proposal: 50,
  Negotiation: 75,
  'Closed Won': 100,
  'Closed Lost': 0,
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const stage = searchParams.get('stage')
  const accountId = searchParams.get('accountId')

  const where: Record<string, string> = {}
  if (stage) where.stage = stage
  if (accountId) where.accountId = accountId

  const records = await prisma.opportunity.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    orderBy: { createdAt: 'desc' },
  })

  const items = records.map((o) => ({
    id: o.id,
    opportunityId: o.opportunityId,
    name: o.name,
    accountId: o.accountId,
    accountName: o.accountName,
    stage: o.stage,
    probability: o.probability,
    closeDate: o.closeDate ? o.closeDate.toISOString() : null,
    amount: toNum(o.amount),
    tcv: toNum(o.tcv),
    currency: o.currency,
    ownerName: o.ownerName,
    entityCount: o.entityCount,
    aumMm: toNum(o.aumMm),
    closedAt: o.closedAt,
    dealType: o.dealType,
    clientId: o.clientId,
    clientName: o.clientName,
  }))

  return NextResponse.json({ items })
}

export async function POST(request: Request) {
  const body = await request.json()
  const {
    name,
    accountId,
    accountName,
    stage,
    closeDate,
    amount,
    tcv,
    ownerName,
    entityCount,
    aumMm,
    leadSource,
    description,
  } = body

  const resolvedStage = stage ?? 'Prospecting'
  const probability = STAGE_PROBABILITY[resolvedStage] ?? 10

  const opportunity = await prisma.opportunity.create({
    data: {
      opportunityId: `OPP-${Date.now()}`,
      name,
      accountId,
      accountName,
      stage: resolvedStage,
      probability,
      closeDate: closeDate ? new Date(closeDate) : undefined,
      amount,
      tcv,
      ownerName,
      entityCount,
      aumMm,
      leadSource,
      description,
    },
  })

  return NextResponse.json({
    ...opportunity,
    amount: toNum(opportunity.amount),
    tcv: toNum(opportunity.tcv),
    aumMm: toNum(opportunity.aumMm),
  })
}
