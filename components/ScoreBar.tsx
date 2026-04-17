'use client';

interface Props {
  label: string;
  value: number;
  max: number;
  color: string;
}

export default function ScoreBar({ label, value, max, color }: Props) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <span className="text-xs text-gray-500 w-36 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-10 text-right font-mono">{Math.round(pct)}%</span>
    </div>
  );
}
