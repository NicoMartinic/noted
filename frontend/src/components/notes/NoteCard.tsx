'use client';
import { useDispatch } from 'react-redux';
import Link from 'next/link';
import { Archive, ArchiveRestore, Trash2, Pin, PinOff } from 'lucide-react';
import { Note } from '@/types';
import { toggleArchiveRequest, deleteNoteRequest, togglePinRequest } from '@/store/slices/notesSlice';
import { truncate, formatDate } from '@/utils/helpers';

export default function NoteCard({ note }: { note: Note }) {
  const dispatch = useDispatch();

  return (
    <div className={`group relative bg-white dark:bg-ink-800 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden animate-fade-in${note.is_pinned ? ' ring-1 ring-amber-accent/30' : ''}`}>
      {note.category && (
        <div className="h-1" style={{ backgroundColor: note.category.color }} />
      )}
      {note.is_pinned && (
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <Pin className="w-3 h-3 text-amber-accent fill-amber-accent" />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Link href={`/notes/${note.id}`} className={`flex-1 ${note.is_pinned ? 'pl-4' : ''}`}>
            <h3 className="font-display font-semibold text-ink-900 dark:text-cream-100 leading-snug hover:text-amber-accent transition-colors">
              {note.title}
            </h3>
          </Link>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => dispatch(togglePinRequest(note.id))}
              className="p-1.5 rounded-lg hover:bg-cream-100 dark:hover:bg-ink-700 text-ink-400 hover:text-amber-accent transition-colors"
              title={note.is_pinned ? 'Unpin' : 'Pin'}
            >
              {note.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => dispatch(toggleArchiveRequest(note.id))}
              className="p-1.5 rounded-lg hover:bg-cream-100 dark:hover:bg-ink-700 text-ink-400 transition-colors"
              title={note.is_archived ? 'Unarchive' : 'Archive'}
            >
              {note.is_archived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => dispatch(deleteNoteRequest(note.id))}
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-ink-400 hover:text-red-500 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {note.content && (
          <p className="text-sm text-ink-500 dark:text-ink-400 leading-relaxed mb-3">
            {truncate(note.content, 120)}
          </p>
        )}

        <div className="flex items-center justify-between">
          {note.category ? (
            <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium"
              style={{ backgroundColor: note.category.color + '20', color: note.category.color }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: note.category.color }} />
              {note.category.title}
            </span>
          ) : <span />}
          <span className="text-xs text-ink-400">{formatDate(note.updated_at)}</span>
        </div>
      </div>
    </div>
  );
}
