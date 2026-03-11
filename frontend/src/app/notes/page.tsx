'use client';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { PenSquare, ArrowUpDown } from 'lucide-react';
import { fetchNotesRequest, setFilters, setPage } from '@/store/slices/notesSlice';
import { RootState } from '@/store';
import PrivateLayout from '@/components/layout/PrivateLayout';
import NoteCard from '@/components/notes/NoteCard';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import SearchableSelect, { SelectOption } from '@/components/ui/SearchableSelect';
import { LoadingOverlay } from '@/components/ui/Spinner';

const ORDERING_OPTIONS = [
  { value: '-updated_at', label: 'Last updated' },
  { value: '-created_at', label: 'Newest first' },
  { value: 'created_at',  label: 'Oldest first' },
  { value: 'title',       label: 'Title A–Z' },
  { value: '-title',      label: 'Title Z–A' },
  { value: 'pinned',      label: 'Pinned first' },
];

export default function NotesPage() {
  const dispatch = useDispatch();
  const { notes, isLoading, filters, pagination } = useSelector((s: RootState) => s.notes);
  const ordering = filters.ordering ?? '-updated_at';
  const allCategories = useSelector((s: RootState) => s.categories.sidebarCategories);
  const accessToken   = useSelector((s: RootState) => s.auth.accessToken);
  const [searchInput, setSearchInput] = useState(filters.search);

  const currentPage = pagination?.page  ?? 1;
  const totalNotes  = pagination?.total ?? 0;

  useEffect(() => {
    if (!accessToken) return;
    dispatch(fetchNotesRequest());
  }, [filters.search, filters.categoryId, filters.isArchived, filters.ordering, currentPage, accessToken, dispatch]);

  useEffect(() => {
    const t = setTimeout(() => dispatch(setFilters({ search: searchInput })), 350);
    return () => clearTimeout(t);
  }, [searchInput, dispatch]);

  const categoryOptions: SelectOption[] = [
    { value: null,   label: 'All categories' },
    { value: 'null', label: 'No category' },
    ...allCategories.map(c => ({ value: c.id, label: c.title, color: c.color })),
  ];

  const isFiltering = !!(filters.search || filters.categoryId !== null);

  return (
    <PrivateLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-ink-900 dark:text-cream-100">
              {filters.isArchived ? 'Archived Notes' : 'Notes'}
            </h1>
            <p className="text-ink-400 text-sm mt-1">{totalNotes} note{totalNotes !== 1 ? 's' : ''}</p>
          </div>
          {!filters.isArchived && (
            <Link href="/notes/new">
              <Button size="md"><PenSquare className="w-4 h-4" /> New Note</Button>
            </Link>
          )}
        </div>

        <div className="flex gap-3 mb-6 flex-wrap items-end">
          <div className="flex-1 min-w-48">
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
              placeholder="Search notes…"
              className="w-full px-4 py-2.5 rounded-xl border border-cream-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-sm text-ink-900 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-amber-accent/40 transition-all" />
          </div>
          <div className="w-52">
            <SearchableSelect
              options={categoryOptions}
              value={filters.categoryId as string | number | null}
              onChange={v => dispatch(setFilters({ categoryId: v as typeof filters.categoryId }))}
              placeholder="All categories"
            />
          </div>
          {/* Sort order */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-ink-400 shrink-0" />
            <select
              value={filters.ordering}
              onChange={e => dispatch(setFilters({ ordering: e.target.value }))}
              className="px-3 py-2.5 rounded-xl border border-cream-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-sm text-ink-900 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-amber-accent/40 transition-all cursor-pointer"
            >
              {ORDERING_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <LoadingOverlay />
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-cream-200 dark:bg-ink-700 flex items-center justify-center mb-4">
              <PenSquare className="w-7 h-7 text-ink-400" />
            </div>
            <h3 className="font-display text-xl font-semibold text-ink-600 dark:text-ink-400">
              {isFiltering || filters.isArchived ? 'No notes match' : 'No notes yet'}
            </h3>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {notes.map(note => <NoteCard key={note.id} note={note} />)}
            </div>
            <Pagination pagination={pagination} onPageChange={p => dispatch(setPage(p))} />
          </>
        )}
      </div>
    </PrivateLayout>
  );
}
