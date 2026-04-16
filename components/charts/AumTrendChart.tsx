'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Props {
  data: { month: string; aum: number }[];
}

export default function AumTrendChart({ data }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">AUM Trend (12 Months)</h3>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="aumGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00C97B" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00C97B" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}B`} />
          <Tooltip formatter={(v: number) => [`$${(v / 1000).toFixed(1)}B`, 'AUM']} />
          <Area type="monotone" dataKey="aum" stroke="#00C97B" strokeWidth={2} fill="url(#aumGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
