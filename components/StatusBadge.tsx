'use client';

import { statusColor } from '@/lib/utils';

interface Props {
  status?: string | null;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: Props) {
  if (!status) return <span className="text-gray-400 text-xs">—</span>;
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-block rounded-full font-medium whitespace-nowrap ${sizeClass} ${statusColor(status)}`}>
      {status}
    </span>
  );
}
