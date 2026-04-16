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

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const opportunity = await prisma.opportunity.findUniqueOrThrow({
    where: { id: params.id },
    include: {
      contacts: {
        include: { contact: true },
      },
      activities: {
        orderBy: { activityDate: 'desc' },
      },
      quotes: {
        include: {
          lines: { orderBy: { sortOrder: 'asc' } },
        },
      },
      contracts: true,
    },
  })

  return NextResponse.json({
    ...opportunity,
    amount: toNum(opportunity.amount),
    tcv: toNum(opportunity.tcv),
    aumMm: toNum(opportunity.aumMm),
    contracts: opportunity.contracts.map((c) => ({
      ...c,
      annualValue: toNum(c.annualValue),
      totalValue: toNum(c.totalValue),
    })),
    quotes: opportunity.quotes.map((q) => ({
      ...q,
      totalArr: toNum(q.totalArr),
      totalTcv: toNum(q.totalTcv),
      discountPct: toNum(q.discountPct),
      lines: q.lines.map((l) => ({
        ...l,
        aumTierMin: toNum(l.aumTierMin),
        aumTierMax: toNum(l.aumTierMax),
        pricePerEntity: toNum(l.pricePerEntity),
        annualValue: toNum(l.annualValue),
      })),
    })),
  })
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json()

  const updateData: Record<string, unknown> = { ...body }

  if (body.stage !== undefined) {
    updateData.probability = STAGE_PROBABILITY[body.stage] ?? updateData.probability
    if (body.stage === 'Closed Won' || body.stage === 'Closed Lost') {
      updateData.closedAt = new Date()
    }
  }

  const opportunity = await prisma.opportunity.update({
    where: { id: params.id },
    data: updateData,
  })

  return NextResponse.json({
    ...opportunity,
    amount: toNum(opportunity.amount),
    tcv: toNum(opportunity.tcv),
    aumMm: toNum(opportunity.aumMm),
  })
}
