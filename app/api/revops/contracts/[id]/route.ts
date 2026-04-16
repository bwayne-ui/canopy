import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { toNum } from '@/lib/utils'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const contract = await prisma.contract.findUniqueOrThrow({
    where: { id: params.id },
    include: { orders: true },
  })

  return NextResponse.json({
    ...contract,
    annualValue: toNum(contract.annualValue),
    totalValue: toNum(contract.totalValue),
    startDate: contract.startDate ? contract.startDate.toISOString() : null,
    endDate: contract.endDate ? contract.endDate.toISOString() : null,
    orders: contract.orders.map((o) => ({
      ...o,
      annualValue: toNum(o.annualValue),
    })),
  })
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json()

  const updateData: Record<string, unknown> = { ...body }
  if (body.signedDate) updateData.signedDate = new Date(body.signedDate)
  if (body.executedDate) updateData.executedDate = new Date(body.executedDate)
  if (body.startDate) updateData.startDate = new Date(body.startDate)
  if (body.endDate) updateData.endDate = new Date(body.endDate)

  const contract = await prisma.contract.update({
    where: { id: params.id },
    data: updateData,
  })

  return NextResponse.json({
    ...contract,
    annualValue: toNum(contract.annualValue),
    totalValue: toNum(contract.totalValue),
    startDate: contract.startDate ? contract.startDate.toISOString() : null,
    endDate: contract.endDate ? contract.endDate.toISOString() : null,
  })
}
