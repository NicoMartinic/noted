'use client';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export default function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-ink-600 dark:text-ink-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        className={clsx(
          'w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-ink-800 text-ink-900 dark:text-cream-100 font-sans text-sm',
          'placeholder:text-ink-400 dark:placeholder:text-ink-500',
          'focus:outline-none focus:ring-2 focus:ring-amber-accent/40 transition-all duration-150',
          error
            ? 'border-red-400 focus:ring-red-400/30'
            : 'border-cream-200 dark:border-ink-700 hover:border-ink-400 dark:hover:border-ink-600',
          className
        )}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-ink-400">{hint}</p>}
    </div>
  );
}
