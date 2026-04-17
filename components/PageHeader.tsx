'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface Props {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, breadcrumbs, actions }: Props) {
  return (
    <div className="mb-3">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-[10px] text-gray-400 mb-1.5 font-medium uppercase tracking-wider">
          {breadcrumbs.map((bc, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-2.5 h-2.5" />}
              {bc.href ? (
                <Link href={bc.href} className="hover:text-[#00C97B] transition-colors">{bc.label}</Link>
              ) : (
                <span className="text-gray-500">{bc.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-start justify-between">
        <div>
          <div className="w-6 h-0.5 bg-gradient-to-r from-[#005868] to-[#00C97B] rounded mb-1.5" />
          <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Lora', serif" }}>{title}</h1>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "'Lora', serif", fontStyle: 'italic' }}>{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 mt-1">{actions}</div>}
      </div>
    </div>
  );
}
