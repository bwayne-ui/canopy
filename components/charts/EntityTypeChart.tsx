'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Props {
  data: { type: string; count: number }[];
}

export default function EntityTypeChart({ data }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Entities by Type</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical" barSize={18}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis dataKey="type" type="category" tick={{ fontSize: 10 }} width={120} />
          <Tooltip />
          <Bar dataKey="count" fill="#1B3A4B" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
