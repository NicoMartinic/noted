'use client';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import clsx from 'clsx';

export interface SelectOption { value: string | number | null; label: string; color?: string; }

interface Props {
  options: SelectOption[];
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  placeholder?: string;
  label?: string;
}

export default function SearchableSelect({ options, value, onChange, placeholder = 'Select…', label }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()));
  const selected = options.find(o => o.value === value);

  return (
    <div className="relative" ref={ref}>
      {label && <label className="block mb-1.5 text-xs font-medium text-ink-600 dark:text-ink-400 uppercase tracking-wider">{label}</label>}
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setQuery(''); }}
        className={clsx(
          'w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border text-sm text-left transition-all',
          'bg-white dark:bg-ink-800 text-ink-900 dark:text-cream-100',
          'border-cream-200 dark:border-ink-700 hover:border-ink-400 dark:hover:border-ink-600',
          'focus:outline-none focus:ring-2 focus:ring-amber-accent/40'
        )}
      >
        <span className="flex items-center gap-2 truncate">
          {selected?.color && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: selected.color }} />}
          <span className={selected ? '' : 'text-ink-400'}>{selected?.label ?? placeholder}</span>
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value !== null && value !== '' && (
            <span onClick={(e) => { e.stopPropagation(); onChange(null); }} className="p-0.5 hover:text-red-500 transition-colors">
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={clsx('w-4 h-4 text-ink-400 transition-transform', open && 'rotate-180')} />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-ink-800 border border-cream-200 dark:border-ink-700 rounded-xl shadow-modal overflow-hidden animate-scale-in">
          <div className="p-2 border-b border-cream-200 dark:border-ink-700">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search…"
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-cream-50 dark:bg-ink-700 rounded-lg focus:outline-none text-ink-900 dark:text-cream-100"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-ink-400">No results</p>
            ) : (
              filtered.map(opt => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={clsx(
                    'w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors',
                    opt.value === value
                      ? 'bg-amber-accent/10 text-amber-accent'
                      : 'text-ink-700 dark:text-ink-300 hover:bg-cream-50 dark:hover:bg-ink-700'
                  )}
                >
                  {opt.color && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />}
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
