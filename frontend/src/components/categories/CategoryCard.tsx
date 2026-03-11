'use client';
import { memo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Category } from '@/types';

interface Props {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

function CategoryCard({ category, onEdit, onDelete }: Props) {
  return (
    <div className="group bg-white dark:bg-ink-800 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden">
      <div className="h-2" style={{ backgroundColor: category.color }} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: category.color }} />
              <h3 className="font-display font-semibold text-ink-900 dark:text-cream-100 truncate">{category.title}</h3>
            </div>
            {category.description && (
              <p className="text-sm text-ink-500 dark:text-ink-400 leading-relaxed">{category.description}</p>
            )}
            <p className="mt-2 text-xs text-ink-400">{category.notes_count} note{category.notes_count !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => onEdit(category)}
              className="p-1.5 rounded-lg hover:bg-cream-100 dark:hover:bg-ink-700 text-ink-400 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(category)}
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-ink-400 hover:text-red-500 transition-colors" data-testid="delete-cat"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(CategoryCard);
