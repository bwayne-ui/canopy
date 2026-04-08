'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { fmtMoney } from '@/lib/utils';

interface AgentRow {
  id: string;
  name: string;
  description: string;
  category: string;
  provider: string;
  status: string;
  rating: number;
  reviewCount: number;
  monthlyPrice: number | null;
  capabilities: string[];
  icon: string;
}

const CATEGORIES = [
  'All',
  'Fund Accounting',
  'Compliance',
  'Investor Relations',
  'Data Management',
  'Tax',
  'Risk',
  'Onboarding',
  'Reporting',
];

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-0.5 text-sm">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < full ? 'text-amber-400' : 'text-gray-300'}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function MarketplacePage() {
  const [items, setItems] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/agents')
      .then((res) => res.json())
      .then((data) => setItems(data.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((agent) => {
    const matchesCategory =
      activeCategory === 'All' || agent.category === activeCategory;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      agent.name.toLowerCase().includes(q) ||
      agent.description.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Agent Marketplace"
        subtitle="Free AI Skills created by Juniper Square employees — approved and hosted in the global company marketplace"
      />

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search agents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-[#1B3A4B] focus:outline-none focus:ring-1 focus:ring-[#1B3A4B]"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 ${
              activeCategory === cat
                ? 'bg-[#1B3A4B] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading agents...</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((agent) => (
            <div
              key={agent.id}
              className="flex flex-col rounded-lg bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              {/* Icon + Name */}
              <div className="mb-3 flex items-start gap-3">
                <span className="text-2xl">{agent.icon}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {agent.name}
                  </h3>
                  <span className="inline-block rounded-full bg-[#E6F9F0] px-2 py-0.5 text-xs font-medium text-[#00A866]">
                    {agent.category}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-400">{agent.provider}</p>

              {/* Description */}
              <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                {agent.description}
              </p>

              {/* Capabilities */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {agent.capabilities.slice(0, 3).map((cap) => (
                  <span
                    key={cap}
                    className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                  >
                    {cap}
                  </span>
                ))}
              </div>

              {/* Rating */}
              <div className="mt-3 flex items-center gap-2">
                <Stars rating={agent.rating} />
                <span className="text-xs text-gray-400">
                  ({agent.reviewCount})
                </span>
              </div>

              {/* Bottom: Status + Price + Button */}
              <div className="mt-auto flex items-center justify-between pt-4">
                <div className="flex items-center gap-2">
                  <StatusBadge status={agent.status} />
                  {agent.monthlyPrice != null && (
                    <span className="text-sm font-medium text-gray-700">
                      {fmtMoney(agent.monthlyPrice)}/mo
                    </span>
                  )}
                </div>
                <button className="rounded-md bg-[#1B3A4B] px-4 py-2 text-sm text-white hover:bg-[#15303f] transition">
                  Learn More
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
