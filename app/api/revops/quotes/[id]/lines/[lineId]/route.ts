import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { toNum } from '@/lib/utils'

async function recalcQuote(quoteId: string) {
  const lines = await prisma.quoteLine.findMany({ where: { quoteId } })
  const totalArr = lines.reduce((s, l) => s + (Number(l.annualValue) || 0), 0)
  await prisma.quote.update({ where: { id: quoteId }, data: { totalArr } })
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string; lineId: string } }
) {
  const body = await request.json()

  const line = await prisma.quoteLine.update({
    where: { id: params.lineId },
    data: body,
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

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; lineId: string } }
) {
  await prisma.quoteLine.delete({ where: { id: params.lineId } })
  await recalcQuote(params.id)
  return NextResponse.json({ ok: true })
}
