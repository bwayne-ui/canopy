import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { toNum } from '@/lib/utils'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const account = await prisma.account.findUniqueOrThrow({
    where: { id: params.id },
    include: {
      contacts: true,
      opportunities: {
        select: {
          id: true,
          opportunityId: true,
          name: true,
          stage: true,
          amount: true,
          closeDate: true,
          probability: true,
          ownerName: true,
        },
      },
      activities: { orderBy: { activityDate: 'desc' } },
      contracts: true,
    },
  })

  return NextResponse.json({
    ...account,
    aumMm: toNum(account.aumMm),
    opportunities: account.opportunities.map((o) => ({
      ...o,
      amount: toNum(o.amount),
    })),
    contracts: account.contracts.map((c) => ({
      ...c,
      annualValue: toNum(c.annualValue),
      totalValue: toNum(c.totalValue),
    })),
  })
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json()

  const account = await prisma.account.update({
    where: { id: params.id },
    data: body,
  })

  return NextResponse.json({ ...account, aumMm: toNum(account.aumMm) })
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  await prisma.account.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
