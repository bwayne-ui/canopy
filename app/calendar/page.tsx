'use client';

import { useEffect, useState, useMemo } from 'react';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import StatusBadge from '@/components/StatusBadge';

interface CalendarEvent {
  id: string;
  eventId: string;
  title: string;
  description: string;
  eventType: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  location: string;
  clientName: string;
  status: string;
  priority: string;
}

const priorityBorder: Record<string, string> = {
  Critical: 'border-l-red-500',
  High: 'border-l-amber-500',
  Medium: 'border-l-blue-500',
  Low: 'border-l-gray-400',
};

const eventTypeBadge: Record<string, string> = {
  Deadline: 'bg-red-100 text-red-700',
  Meeting: 'bg-purple-100 text-purple-700',
  Review: 'bg-blue-100 text-blue-700',
  Filing: 'bg-amber-100 text-amber-700',
  Call: 'bg-green-100 text-green-700',
};

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso));
}

function formatDayHeader(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateStr));
}

export default function CalendarPage() {
  const [items, setItems] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/calendar')
      .then((res) => res.json())
      .then((data) => setItems(data.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const thisWeek = items.filter((e) => {
    const d = new Date(e.startTime);
    return d >= now && d <= oneWeek;
  }).length;
  const deadlines = items.filter((e) => e.eventType === 'Deadline').length;
  const atRisk = items.filter((e) => e.status === 'At Risk').length;

  const grouped = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    const sorted = [...items].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    for (const event of sorted) {
      const dateKey = new Date(event.startTime).toISOString().split('T')[0];
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(event);
    }
    return Array.from(map.entries());
  }, [items]);

  return (
    <div className="space-y-5">
      <PageHeader title="Calendar" subtitle="Upcoming Events & Deadlines" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Events" value={items.length} />
        <MetricCard title="This Week" value={thisWeek} />
        <MetricCard title="Deadlines" value={deadlines} />
        <MetricCard title="At Risk" value={atRisk} />
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading events...</p>
      ) : (
        <div className="space-y-8">
          {grouped.map(([dateKey, events]) => (
            <div key={dateKey}>
              <h3 className="mb-2 text-sm font-semibold text-gray-800">
                {formatDayHeader(dateKey + 'T12:00:00')}
              </h3>
              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className={`rounded-lg border-l-4 bg-white p-4 shadow-sm ${priorityBorder[event.priority] ?? 'border-l-gray-300'}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-500">
                          {event.allDay ? 'All Day' : formatTime(event.startTime)}
                        </span>
                        <span className="text-base font-semibold text-gray-900">
                          {event.title}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${eventTypeBadge[event.eventType] ?? 'bg-gray-100 text-gray-700'}`}
                        >
                          {event.eventType}
                        </span>
                      </div>
                      <StatusBadge status={event.status} />
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-4 text-sm text-gray-500">
                      {event.location && <span>Location: {event.location}</span>}
                      {event.clientName && <span>Client: {event.clientName}</span>}
                      {!event.allDay && (
                        <span>
                          {formatTime(event.startTime)} &ndash;{' '}
                          {formatTime(event.endTime)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
