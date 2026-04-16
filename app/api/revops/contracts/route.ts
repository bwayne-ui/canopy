import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { toNum } from '@/lib/utils'

export async function GET() {
  const records = await prisma.contract.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const items = records.map((c) => ({
    ...c,
    annualValue: toNum(c.annualValue),
    totalValue: toNum(c.totalValue),
    startDate: c.startDate ? c.startDate.toISOString() : null,
    endDate: c.endDate ? c.endDate.toISOString() : null,
  }))

  return NextResponse.json({ items })
}

export async function POST(request: Request) {
  const body = await request.json()
  const {
    name,
    opportunityId,
    accountId,
    accountName,
    contractType,
    startDate,
    endDate,
    annualValue,
    totalValue,
    billingFrequency,
    paymentTerms,
    jsqSignatory,
    counterpartySignatory,
  } = body

  const contractId = `C-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`

  const contract = await prisma.contract.create({
    data: {
      contractId,
      name,
      opportunityId,
      accountId,
      accountName,
      contractType: contractType ?? 'MSA',
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      annualValue,
      totalValue,
      billingFrequency: billingFrequency ?? 'Quarterly',
      paymentTerms,
      jsqSignatory,
      counterpartySignatory,
    },
  })

  return NextResponse.json({
    ...contract,
    annualValue: toNum(contract.annualValue),
    totalValue: toNum(contract.totalValue),
    startDate: contract.startDate ? contract.startDate.toISOString() : null,
    endDate: contract.endDate ? contract.endDate.toISOString() : null,
  })
}
