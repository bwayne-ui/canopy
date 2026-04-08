import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const events = await prisma.calendarEvent.findMany({ orderBy: { startTime: 'asc' } });
  return NextResponse.json({
    items: events.map((e) => ({
      id: e.id, eventId: e.eventId, title: e.title, description: e.description,
      eventType: e.eventType, startTime: e.startTime.toISOString(),
      endTime: e.endTime.toISOString(), allDay: e.allDay, location: e.location,
      clientName: e.clientName, status: e.status, priority: e.priority,
    })),
  });
}
