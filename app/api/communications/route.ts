import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const comms = await prisma.communication.findMany({ orderBy: { communicationDate: 'desc' } });
  return NextResponse.json({
    items: comms.map((c) => ({
      id: c.id, communicationId: c.communicationId, channel: c.channel, direction: c.direction,
      subject: c.subject, summary: c.summary, fromName: c.fromName, toName: c.toName,
      clientName: c.clientName, sentiment: c.sentiment, urgency: c.urgency, status: c.status,
      communicationDate: c.communicationDate.toISOString().split('T')[0],
      hasAttachments: c.hasAttachments,
    })),
  });
}
