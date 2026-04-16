import { Decimal } from '@prisma/client/runtime/library';

export function toNum(v: Decimal | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  return typeof v === 'number' ? v : Number(v);
}

export function fmtMoney(n: number): string {
  return '$' + Math.round(n).toLocaleString('en-US');
}

export function fmtMoneyFull(n: number): string {
  return '$' + Math.round(n).toLocaleString('en-US');
}

export function fmtPct(n: number): string {
  return n.toFixed(1) + '%';
}

export function fmtNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fmtDateShort(d: string | Date | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (['active', 'complete', 'completed', 'available', 'executed', 'final', 'settled'].includes(s)) {
    return 'bg-emerald-100 text-emerald-700';
  }
  if (['in progress', 'in_progress', 'beta', 'training', 'under review', 'fundraising', 'open'].includes(s)) {
    return 'bg-blue-100 text-blue-700';
  }
  if (['on hold', 'coming soon', 'pending', 'scheduled', 'draft'].includes(s)) {
    return 'bg-amber-100 text-amber-700';
  }
  if (['overdue', 'blocked', 'deprecated', 'terminated', 'expired', 'cancelled', 'critical', 'urgent'].includes(s)) {
    return 'bg-red-100 text-red-700';
  }
  if (['planning', 'onboarding', 'not started', 'not_started'].includes(s)) {
    return 'bg-gray-100 text-gray-600';
  }
  if (['inactive', 'on leave', 'superseded', 'redeemed'].includes(s)) {
    return 'bg-gray-100 text-gray-500';
  }
  return 'bg-gray-100 text-gray-600';
}

export function priorityColor(priority: string): string {
  const p = priority.toLowerCase();
  if (p === 'critical') return 'bg-red-100 text-red-700';
  if (p === 'high') return 'bg-orange-100 text-orange-700';
  if (p === 'medium') return 'bg-blue-100 text-blue-700';
  if (p === 'low') return 'bg-gray-100 text-gray-500';
  return 'bg-gray-100 text-gray-600';
}
