'use client';

import { statusColor } from '@/lib/utils';

interface Props {
  status: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: Props) {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-block rounded-full font-medium whitespace-nowrap ${sizeClass} ${statusColor(status)}`}>
      {status}
    </span>
  );
}
