'use client';

import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = [
  '#00C97B', '#1B3A4B', '#00A866', '#f59e0b', '#6366f1',
  '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#64748b',
];

interface Props {
  data: { strategy: string; aum: number; count: number }[];
}

export default function StrategyPieChart({ data }: Props) {
  const router = useRouter();

  function handleClick(entry: { strategy: string }) {
    router.push(`/data-vault/entities?search=${encodeURIComponent(entry.strategy)}`);
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">AUM by Strategy</h3>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={data}
            dataKey="aum"
            nameKey="strategy"
            cx="50%"
            cy="50%"
            outerRadius={55}
            style={{ cursor: 'pointer' }}
            onClick={(_: unknown, index: number) => handleClick(data[index])}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => [`$${(v / 1000).toFixed(1)}B`, 'AUM']} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
