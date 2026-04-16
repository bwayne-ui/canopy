'use client';

import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  'Complete': '#00C97B',
  'In Progress': '#3b82f6',
  'Under Review': '#f59e0b',
  'Not Started': '#94a3b8',
  'Overdue': '#ef4444',
  'Blocked': '#dc2626',
};

interface Props {
  data: { status: string; count: number }[];
}

export default function TaskCompletionChart({ data }: Props) {
  const router = useRouter();

  function handleClick(entry: { status: string }) {
    router.push(`/activity/task-list?search=${encodeURIComponent(entry.status)}`);
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tasks by Status</h3>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} layout="vertical" barSize={12}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis dataKey="status" type="category" tick={{ fontSize: 11 }} width={90} />
          <Tooltip />
          <Bar
            dataKey="count"
            radius={[0, 4, 4, 0]}
            style={{ cursor: 'pointer' }}
            onClick={(_: unknown, index: number) => handleClick(data[index])}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={STATUS_COLORS[entry.status] || '#94a3b8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
