'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
} from 'recharts';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import StatusBadge from '@/components/StatusBadge';
import { fmtMoney, fmtMoneyFull, fmtDate } from '@/lib/utils';

interface Account {
  accountId: string;
  accountName: string;
  accountType: string;
  institution: string;
  currentBalance: number;
  availableBalance: number;
  pendingInflows: number;
  pendingOutflows: number;
  entityName: string;
  status: string;
}

interface CashFlow {
  cashFlowId: string;
  flowType: string;
  category: string;
  amount: number;
  accountName: string;
  entityName: string;
  counterparty: string;
  description: string;
  transactionDate: string;
  status: string;
}

export default function CashDashPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cashFlows, setCashFlows] = useState<CashFlow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/treasury')
      .then((r) => r.json())
      .then((d) => {
        setAccounts(d.accounts ?? []);
        setCashFlows(d.cashFlows ?? []);
      })
      .catch(() => {
        setAccounts([]);
        setCashFlows([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalCash = useMemo(
    () => accounts.filter((a) => a.currentBalance > 0).reduce((s, a) => s + a.currentBalance, 0),
    [accounts]
  );
  const creditFacilities = useMemo(
    () => Math.abs(accounts.filter((a) => a.currentBalance < 0).reduce((s, a) => s + a.currentBalance, 0)),
    [accounts]
  );
  const netInflows = useMemo(
    () => cashFlows.filter((f) => f.flowType === 'Inflow').reduce((s, f) => s + f.amount, 0),
    [cashFlows]
  );
  const netOutflows = useMemo(
    () => Math.abs(cashFlows.filter((f) => f.flowType === 'Outflow').reduce((s, f) => s + f.amount, 0)),
    [cashFlows]
  );

  const topAccounts = useMemo(() => {
    return [...accounts]
      .sort((a, b) => Math.abs(b.currentBalance) - Math.abs(a.currentBalance))
      .slice(0, 6)
      .map((a) => ({ name: a.accountName, balance: a.currentBalance }));
  }, [accounts]);

  const flowsByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    cashFlows.forEach((f) => {
      map[f.category] = (map[f.category] || 0) + f.amount;
    });
    return Object.entries(map).map(([name, amount]) => ({ name, amount }));
  }, [cashFlows]);

  const recentFlows = useMemo(
    () =>
      [...cashFlows]
        .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
        .slice(0, 10),
    [cashFlows]
  );

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader title="Cash Dashboard" subtitle="Real-time cash positions and flow analysis" />
        <div className="text-gray-400 text-sm mt-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Cash Dashboard" subtitle="Real-time cash positions and flow analysis" />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="Total Cash Position" value={fmtMoney(totalCash)} color="green" />
        <MetricCard title="Credit Facilities" value={fmtMoney(creditFacilities)} color="red" />
        <MetricCard title="Net Inflows" value={fmtMoney(netInflows)} color="green" />
        <MetricCard title="Net Outflows" value={fmtMoney(netOutflows)} color="red" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Cash by Account (Top 6)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topAccounts} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => fmtMoney(v)} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => fmtMoneyFull(v)} />
              <Bar dataKey="balance" radius={[0, 4, 4, 0]}>
                {topAccounts.map((entry, idx) => (
                  <Cell key={idx} fill={entry.balance >= 0 ? '#00C97B' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Cash Flows by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={flowsByCategory} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => fmtMoney(v)} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => fmtMoneyFull(v)} />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                {flowsByCategory.map((entry, idx) => (
                  <Cell key={idx} fill={entry.amount >= 0 ? '#00C97B' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Account Positions */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Account Positions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Institution</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Balance</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Available</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Entity</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.accountId} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium">{a.accountName}</td>
                  <td className="px-4 py-3">{a.accountType}</td>
                  <td className="px-4 py-3">{a.institution}</td>
                  <td className={`px-4 py-3 text-right font-medium ${a.currentBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {fmtMoneyFull(a.currentBalance)}
                  </td>
                  <td className="px-4 py-3 text-right">{fmtMoneyFull(a.availableBalance)}</td>
                  <td className="px-4 py-3">{a.entityName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Flows */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Recent Flows</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Category</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Amount</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Account</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Counterparty</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentFlows.map((f) => (
                <tr key={f.cashFlowId} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3">{fmtDate(f.transactionDate)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        f.flowType === 'Inflow'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {f.flowType}
                    </span>
                  </td>
                  <td className="px-4 py-3">{f.category}</td>
                  <td className={`px-4 py-3 text-right font-medium ${f.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {fmtMoneyFull(f.amount)}
                  </td>
                  <td className="px-4 py-3">{f.accountName}</td>
                  <td className="px-4 py-3">{f.counterparty}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={f.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
