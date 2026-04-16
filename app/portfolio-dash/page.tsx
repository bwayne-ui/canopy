'use client';

import { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import { fmtMoney, fmtPct } from '@/lib/utils';

interface Security {
  id: string;
  securityId: string;
  name: string;
  securityType: string;
  ticker: string | null;
  marketValue: number;
  costBasis: number;
  unrealizedGain: number;
  sector: string;
  currency: string;
}

const COLORS = ['#00C97B', '#1B3A4B', '#00A866', '#f59e0b', '#6366f1', '#ec4899', '#14b8a6'];

export default function PortfolioDashPage() {
  const [items, setItems] = useState<Security[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/securities')
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const totalMarketValue = useMemo(() => items.reduce((s, i) => s + i.marketValue, 0), [items]);
  const totalCostBasis = useMemo(() => items.reduce((s, i) => s + i.costBasis, 0), [items]);
  const totalUnrealizedGain = useMemo(() => items.reduce((s, i) => s + i.unrealizedGain, 0), [items]);

  const typeAllocation = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((i) => {
      map[i.securityType] = (map[i.securityType] || 0) + i.marketValue;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [items]);

  const sectorAllocation = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((i) => {
      const sector = i.sector || 'Unknown';
      map[sector] = (map[sector] || 0) + i.marketValue;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [items]);

  const columns: Column[] = [
    {
      key: 'ticker',
      label: 'Ticker',
      sortable: true,
      render: (v: string | null) => (
        <span className="text-xs">{v || '\u2014'}</span>
      ),
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (v: string) => <span className="font-semibold">{v}</span>,
    },
    {
      key: 'securityType',
      label: 'Type',
      sortable: true,
      render: (v: string) => (
        <span className="inline-block rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 text-xs font-medium">
          {v}
        </span>
      ),
    },
    {
      key: 'marketValue',
      label: 'Market Value',
      sortable: true,
      align: 'right',
      render: (v: number) => fmtMoney(v),
    },
    {
      key: 'costBasis',
      label: 'Cost Basis',
      sortable: true,
      align: 'right',
      render: (v: number) => fmtMoney(v),
    },
    {
      key: 'unrealizedGain',
      label: 'Unrealized G/L',
      sortable: true,
      align: 'right',
      render: (v: number) => (
        <span className={v >= 0 ? 'text-emerald-600' : 'text-red-600'}>
          {v >= 0 ? '+' : ''}{fmtMoney(v)}
        </span>
      ),
    },
    {
      key: 'weight',
      label: 'Weight %',
      sortable: true,
      align: 'right',
      render: (_: any, row: Security) =>
        totalMarketValue > 0
          ? fmtPct((row.marketValue / totalMarketValue) * 100)
          : '0.0%',
    },
    { key: 'sector', label: 'Sector', sortable: true },
    { key: 'currency', label: 'Currency', sortable: true },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader title="Portfolio Dashboard" subtitle="Cross-fund portfolio analytics and position monitoring" />
        <div className="text-gray-400 text-sm mt-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Portfolio Dashboard" subtitle="Cross-fund portfolio analytics and position monitoring" />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="Total Market Value" value={fmtMoney(totalMarketValue)} color="green" />
        <MetricCard title="Total Cost Basis" value={fmtMoney(totalCostBasis)} color="teal" />
        <MetricCard
          title="Unrealized Gain/Loss"
          value={(totalUnrealizedGain >= 0 ? '+' : '') + fmtMoney(totalUnrealizedGain)}
          color={totalUnrealizedGain >= 0 ? 'green' : 'red'}
        />
        <MetricCard title="Positions" value={String(items.length)} color="teal" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Allocation by Security Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={typeAllocation}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
              >
                {typeAllocation.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => fmtMoney(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Allocation by Sector</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sectorAllocation}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
              >
                {sectorAllocation.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => fmtMoney(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Securities Table */}
      <DataTable
        columns={columns}
        data={items}
        searchPlaceholder="Search securities..."
      />
    </div>
  );
}
