'use client';

import { CheckCircle, AlertCircle, FileText, Upload, UserPlus, Clock, MessageSquare, DollarSign } from 'lucide-react';
import type { ActivityItem } from '@/types';

const iconMap: Record<string, React.ReactNode> = {
  completed: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  overdue: <AlertCircle className="w-4 h-4 text-red-500" />,
  uploaded: <Upload className="w-4 h-4 text-blue-500" />,
  created: <FileText className="w-4 h-4 text-gray-500" />,
  assigned: <UserPlus className="w-4 h-4 text-amber-500" />,
  scheduled: <Clock className="w-4 h-4 text-purple-500" />,
  communication: <MessageSquare className="w-4 h-4 text-blue-400" />,
  transaction: <DollarSign className="w-4 h-4 text-emerald-400" />,
};

interface Props {
  items: ActivityItem[];
}

export default function ActivityFeed({ items }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent Activity</h3>
      <div className="space-y-0">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-2.5 py-1.5 border-b border-gray-50/80 last:border-0">
            <div className="mt-0.5">{iconMap[item.icon || 'created'] || iconMap.created}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-800">
                <span className="font-medium">{item.action}</span>{' '}
                <span className="text-gray-500">{item.subject}</span>
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {item.user && <span className="text-[10px] text-gray-400">{item.user}</span>}
                <span className="text-[10px] text-gray-300">{item.timestamp}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
