'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: string;
}

interface Props {
  columns: Column[];
  data: any[];
  searchable?: boolean;
  searchPlaceholder?: string;
  onRowClick?: (row: any) => void;
  emptyMessage?: string;
  initialSearch?: string;
}

export default function DataTable({
  columns,
  data,
  searchable = true,
  searchPlaceholder = 'Search...',
  onRowClick,
  emptyMessage = 'No data found',
  initialSearch = '',
}: Props) {
  const [search, setSearch] = useState(initialSearch);

  // Sync when parent supplies initialSearch after async load (e.g. URL param read via useEffect)
  useEffect(() => {
    if (initialSearch) setSearch(initialSearch);
  }, [initialSearch]);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = row[col.key];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const va = a[sortKey] ?? '';
      const vb = b[sortKey] ?? '';
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va;
      }
      const sa = String(va).toLowerCase();
      const sb = String(vb).toLowerCase();
      return sortDir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
  }, [filtered, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const alignClass = (align?: string) => {
    if (align === 'right') return 'text-right';
    if (align === 'center') return 'text-center';
    return 'text-left';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {searchable && (
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-4 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-[#00C97B] focus:border-[#00C97B] outline-none transition-shadow"
            />
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider ${alignClass(col.align)} ${col.width || ''} ${
                    col.sortable ? 'cursor-pointer select-none hover:text-gray-900' : ''
                  }`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      sortKey === col.key ? (
                        sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-gray-300" />
                      )
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sorted.map((row, i) => (
                <tr
                  key={row.id || i}
                  className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-3 py-2 ${alignClass(col.align)}`}>
                      {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {sorted.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
          Showing {sorted.length} of {data.length} records
        </div>
      )}
    </div>
  );
}
