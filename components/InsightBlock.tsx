'use client';

interface Props {
  variant: 'teal' | 'green' | 'amber' | 'red';
  children: React.ReactNode;
}

const styles: Record<string, string> = {
  teal: 'bg-[#005868]/[0.04] border-[#005868]/[0.12] border-l-[#006E82]',
  green: 'bg-emerald-50/60 border-emerald-200/60 border-l-emerald-500',
  amber: 'bg-amber-50/60 border-amber-200/60 border-l-amber-500',
  red: 'bg-red-50/60 border-red-200/60 border-l-red-500',
};

export default function InsightBlock({ variant, children }: Props) {
  return (
    <div className={`border border-l-[3px] rounded-r-lg px-3.5 py-2.5 text-xs text-gray-600 leading-relaxed ${styles[variant]}`}>
      {children}
    </div>
  );
}
