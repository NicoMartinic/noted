'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Pagination as PaginationType } from '@/types';

interface Props { pagination: PaginationType | undefined; onPageChange: (page: number) => void; }

export default function Pagination({ pagination, onPageChange }: Props) {
  if (!pagination || pagination.total_pages <= 1) return null;
  const { page, total_pages, has_next, has_previous, total } = pagination;

  const pages = Array.from({ length: total_pages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === total_pages || Math.abs(p - page) <= 1)
    .reduce<(number | 'ellipsis')[]>((acc, p, i, arr) => {
      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('ellipsis');
      acc.push(p); return acc;
    }, []);

  return (
    <div className="flex items-center justify-between mt-8">
      <p className="text-sm text-ink-400">{total} total</p>
      <div className="flex items-center gap-2">
        <button onClick={() => onPageChange(page - 1)} disabled={!has_previous}
          className="p-2 rounded-xl hover:bg-cream-100 dark:hover:bg-ink-800 disabled:opacity-40 disabled:cursor-not-allowed text-ink-600 dark:text-ink-400 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((item, i) =>
          item === 'ellipsis' ? (
            <span key={`e${i}`} className="px-1 text-ink-400">…</span>
          ) : (
            <button key={item} onClick={() => onPageChange(item as number)}
              className={`w-8 h-8 rounded-xl text-sm font-medium transition-colors ${
                item === page ? 'bg-amber-accent text-white' : 'hover:bg-cream-100 dark:hover:bg-ink-800 text-ink-600 dark:text-ink-400'
              }`}>{item}</button>
          )
        )}
        <button onClick={() => onPageChange(page + 1)} disabled={!has_next}
          className="p-2 rounded-xl hover:bg-cream-100 dark:hover:bg-ink-800 disabled:opacity-40 disabled:cursor-not-allowed text-ink-600 dark:text-ink-400 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
