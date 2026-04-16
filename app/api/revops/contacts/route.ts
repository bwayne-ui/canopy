import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const accountId = searchParams.get('accountId')

  const where = accountId ? { accountId } : undefined

  const records = await prisma.contact.findMany({
    where,
    orderBy: { lastName: 'asc' },
  })

  const items = records.map((c) => ({
    id: c.id,
    contactId: c.contactId,
    firstName: c.firstName,
    lastName: c.lastName,
    title: c.title,
    email: c.email,
    phone: c.phone,
    accountId: c.accountId,
    accountName: c.accountName,
    contactType: c.contactType,
    status: c.status,
    isPrimary: c.isPrimary,
  }))

  return NextResponse.json({ items })
}

export async function POST(request: Request) {
  const body = await request.json()
  const {
    firstName,
    lastName,
    title,
    email,
    phone,
    accountId,
    accountName,
    contactType,
    isPrimary,
  } = body

  const contact = await prisma.contact.create({
    data: {
      contactId: `CON-${Date.now()}`,
      firstName,
      lastName,
      title,
      email,
      phone,
      accountId,
      accountName,
      contactType: contactType ?? 'Contact',
      isPrimary: isPrimary ?? false,
    },
  })

  return NextResponse.json(contact)
}
