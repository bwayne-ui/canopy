import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const contacts = await prisma.externalContact.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json({
    items: contacts.map((c) => ({
      id: c.id, contactId: c.contactId, name: c.name, organization: c.organization,
      role: c.role, contactType: c.contactType, email: c.email, city: c.city, status: c.status,
    })),
  });
}
