import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  // 1. Fetch the lead
  const lead = await prisma.lead.findUniqueOrThrow({ where: { id: params.id } })

  // 2. Create Account
  const account = await prisma.account.create({
    data: {
      accountId: `ACC-${Date.now()}`,
      name: lead.company || `${lead.firstName} ${lead.lastName}`,
      status: 'Prospect',
      ownerName: lead.ownerName ?? undefined,
    },
  })

  // 3. Create Contact
  const contact = await prisma.contact.create({
    data: {
      contactId: `CON-${Date.now()}`,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email ?? undefined,
      phone: lead.phone ?? undefined,
      title: lead.title ?? undefined,
      accountId: account.id,
      accountName: account.name,
      isPrimary: true,
    },
  })

  // 4. Create Opportunity
  const opportunity = await prisma.opportunity.create({
    data: {
      opportunityId: `OPP-${Date.now()}`,
      name: `${lead.company || lead.lastName} - New Opportunity`,
      accountId: account.id,
      accountName: account.name,
      stage: 'Prospecting',
      probability: 10,
      leadSource: lead.leadSource ?? undefined,
      ownerName: lead.ownerName ?? undefined,
    },
  })

  // 5. Update lead to Converted
  await prisma.lead.update({
    where: { id: params.id },
    data: {
      status: 'Converted',
      convertedAt: new Date(),
      convertedAccountId: account.id,
      convertedContactId: contact.id,
      convertedOpportunityId: opportunity.id,
    },
  })

  // 6. Return result
  return NextResponse.json({ account, contact, opportunity })
}
