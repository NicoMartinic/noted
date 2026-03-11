'use client';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' };

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* No backdrop-blur — it forces GPU compositing on every card in the list */}
      <div className="absolute inset-0 bg-ink-900/50" onClick={onClose} />
      <div className={clsx(
        'relative w-full bg-white dark:bg-ink-800 rounded-2xl shadow-modal overflow-hidden',
        sizes[size]
      )}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 dark:border-ink-700">
            <h2 className="font-display text-lg font-semibold text-ink-900 dark:text-cream-100">{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-cream-100 dark:hover:bg-ink-700 text-ink-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
