import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: { contactId: string } }) {
  const contact = await prisma.externalContact.findUnique({
    where: { contactId: params.contactId },
  });

  if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Resolve linked entity names from JSON array
  let linkedEntityIds: string[] = [];
  try {
    if (contact.linkedEntityIds) linkedEntityIds = JSON.parse(contact.linkedEntityIds);
  } catch {}

  const linkedEntities = linkedEntityIds.length
    ? await prisma.entity.findMany({
        where: { entityId: { in: linkedEntityIds } },
        select: { entityId: true, name: true, entityType: true, lifecycleStatus: true },
      })
    : [];

  return NextResponse.json({
    contact: {
      id: contact.id,
      contactId: contact.contactId,
      name: contact.name,
      organization: contact.organization,
      role: contact.role,
      contactType: contact.contactType,
      email: contact.email,
      phone: contact.phone,
      city: contact.city,
      country: contact.country,
      status: contact.status,
      linkedEntityIds,
      createdAt: contact.createdAt.toISOString(),
      updatedAt: contact.updatedAt.toISOString(),
    },
    linkedEntities,
  });
}
