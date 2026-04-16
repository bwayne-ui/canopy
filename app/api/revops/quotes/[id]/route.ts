import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { toNum } from '@/lib/utils'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const quote = await prisma.quote.findUniqueOrThrow({
    where: { id: params.id },
    include: {
      lines: { orderBy: { sortOrder: 'asc' } },
    },
  })

  return NextResponse.json({
    ...quote,
    totalArr: toNum(quote.totalArr),
    totalTcv: toNum(quote.totalTcv),
    discountPct: toNum(quote.discountPct),
    lines: quote.lines.map((l) => ({
      ...l,
      aumTierMin: toNum(l.aumTierMin),
      aumTierMax: toNum(l.aumTierMax),
      pricePerEntity: toNum(l.pricePerEntity),
      annualValue: toNum(l.annualValue),
    })),
  })
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json()
  const {
    status,
    validUntil,
    discountPct,
    discountReason,
    notes,
    sentAt,
    acceptedAt,
    rejectedAt,
  } = body

  const updateData: Record<string, unknown> = {}
  if (status !== undefined) updateData.status = status
  if (validUntil !== undefined) updateData.validUntil = validUntil ? new Date(validUntil) : null
  if (discountPct !== undefined) updateData.discountPct = discountPct
  if (discountReason !== undefined) updateData.discountReason = discountReason
  if (notes !== undefined) updateData.notes = notes
  if (sentAt !== undefined) updateData.sentAt = sentAt ? new Date(sentAt) : null
  if (acceptedAt !== undefined) updateData.acceptedAt = acceptedAt ? new Date(acceptedAt) : null
  if (rejectedAt !== undefined) updateData.rejectedAt = rejectedAt ? new Date(rejectedAt) : null

  const quote = await prisma.quote.update({
    where: { id: params.id },
    data: updateData,
    include: {
      lines: { orderBy: { sortOrder: 'asc' } },
    },
  })

  return NextResponse.json({
    ...quote,
    totalArr: toNum(quote.totalArr),
    totalTcv: toNum(quote.totalTcv),
    discountPct: toNum(quote.discountPct),
    lines: quote.lines.map((l) => ({
      ...l,
      aumTierMin: toNum(l.aumTierMin),
      aumTierMax: toNum(l.aumTierMax),
      pricePerEntity: toNum(l.pricePerEntity),
      annualValue: toNum(l.annualValue),
    })),
  })
}
