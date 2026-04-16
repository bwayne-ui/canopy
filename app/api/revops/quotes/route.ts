import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { toNum } from '@/lib/utils'

export async function GET() {
  const records = await prisma.quote.findMany({
    orderBy: { createdAt: 'desc' },
    include: { lines: true },
  })

  const items = records.map((q) => ({
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
  }))

  return NextResponse.json({ items })
}

export async function POST(request: Request) {
  const body = await request.json()
  const {
    name,
    opportunityId,
    opportunityName,
    accountId,
    accountName,
    validUntil,
    notes,
    createdByName,
  } = body

  const quoteId = `Q-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`

  const quote = await prisma.quote.create({
    data: {
      quoteId,
      name,
      opportunityId,
      opportunityName,
      accountId,
      accountName,
      validUntil: validUntil ? new Date(validUntil) : undefined,
      notes,
      createdByName,
    },
    include: { lines: true },
  })

  return NextResponse.json({
    ...quote,
    totalArr: toNum(quote.totalArr),
    totalTcv: toNum(quote.totalTcv),
    discountPct: toNum(quote.discountPct),
    lines: [],
  })
}
