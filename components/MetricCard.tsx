'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  color?: 'green' | 'teal' | 'signal' | 'amber' | 'red';
}

const colorMap = {
  green: 'border-l-[#00C97B] bg-[#E6F9F0]/30',
  teal: 'border-l-[#1B3A4B] bg-[#1B3A4B]/5',
  signal: 'border-l-[#00A866] bg-[#E6F9F0]/20',
  amber: 'border-l-amber-500 bg-amber-50/30',
  red: 'border-l-red-500 bg-red-50/30',
};

const changeColors = {
  up: 'text-emerald-600',
  down: 'text-red-500',
  neutral: 'text-gray-400',
};

export default function MetricCard({ title, value, change, changeType = 'neutral', icon, color = 'teal' }: Props) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border-l-[3px] p-3.5 ${colorMap[color]} transition-shadow duration-200 hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
          <p className="text-lg font-bold text-gray-900 mt-0.5 truncate">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          {change && (
            <div className={`flex items-center gap-1 mt-1 text-[10px] font-medium ${changeColors[changeType]}`}>
              {changeType === 'up' && <TrendingUp className="w-2.5 h-2.5" />}
              {changeType === 'down' && <TrendingDown className="w-2.5 h-2.5" />}
              {changeType === 'neutral' && <Minus className="w-2.5 h-2.5" />}
              <span>{change}</span>
            </div>
          )}
        </div>
        {icon && <div className="text-gray-300/70">{icon}</div>}
      </div>
    </div>
  );
}
