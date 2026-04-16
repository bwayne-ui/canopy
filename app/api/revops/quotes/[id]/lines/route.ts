import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { toNum } from '@/lib/utils'

async function recalcQuote(quoteId: string) {
  const lines = await prisma.quoteLine.findMany({ where: { quoteId } })
  const totalArr = lines.reduce((s, l) => s + (Number(l.annualValue) || 0), 0)
  await prisma.quote.update({ where: { id: quoteId }, data: { totalArr } })
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json()
  const {
    service,
    description,
    aumTierLabel,
    aumTierMin,
    aumTierMax,
    pricePerEntity,
    estimatedEntities,
    notes,
    sortOrder,
  } = body

  const annualValue = Number(pricePerEntity) * Number(estimatedEntities)

  const line = await prisma.quoteLine.create({
    data: {
      quoteId: params.id,
      service,
      description,
      aumTierLabel,
      aumTierMin,
      aumTierMax,
      pricePerEntity,
      estimatedEntities,
      annualValue,
      notes,
      sortOrder: sortOrder ?? 0,
    },
  })

  await recalcQuote(params.id)

  return NextResponse.json({
    ...line,
    aumTierMin: toNum(line.aumTierMin),
    aumTierMax: toNum(line.aumTierMax),
    pricePerEntity: toNum(line.pricePerEntity),
    annualValue: toNum(line.annualValue),
  })
}
