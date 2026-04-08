'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import StatusBadge from '@/components/StatusBadge';
import { fmtNumber, fmtDate } from '@/lib/utils';

interface ToolRow {
  id: string;
  toolId: string;
  name: string;
  description: string;
  category: string;
  builtBy: string;
  status: string;
  version: string;
  language: string;
  runCount: number;
  lastRunDate: string;
  tags: string[];
}

export default function ToolboxPage() {
  const [items, setItems] = useState<ToolRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tools')
      .then((res) => res.json())
      .then((data) => setItems(data.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const active = items.filter((t) => t.status === 'Active').length;
  const totalRuns = items.reduce((s, t) => s + t.runCount, 0);
  const categories = new Set(items.map((t) => t.category)).size;

  return (
    <div className="space-y-5">
      <PageHeader title="Toolbox" subtitle="Internal tools and utilities" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Tools" value={items.length} />
        <MetricCard title="Active" value={active} />
        <MetricCard title="Total Runs" value={fmtNumber(totalRuns)} />
        <MetricCard title="Categories" value={categories} />
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading tools...</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {items.map((tool) => (
            <div
              key={tool.id}
              className="rounded-lg bg-white p-5 shadow-sm"
            >
              {/* Header: name, version, status */}
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-gray-900">
                  {tool.name}
                </h3>
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  v{tool.version}
                </span>
                <StatusBadge status={tool.status} />
              </div>

              {/* Description */}
              <p className="mt-2 text-sm text-gray-600">{tool.description}</p>

              {/* Metadata */}
              <p className="mt-3 text-xs text-gray-400">
                Built by {tool.builtBy} &middot; {tool.language} &middot;{' '}
                {fmtNumber(tool.runCount)} runs
              </p>

              {/* Tags */}
              {tool.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tool.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Last run */}
              <p className="mt-3 text-xs text-gray-400">
                Last run: {fmtDate(tool.lastRunDate)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
