'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { BookOpen, Tag, User, LogOut, PenSquare, Archive, Search } from 'lucide-react';
import clsx from 'clsx';
import { logoutRequest } from '@/store/slices/authSlice';
import { setFilters } from '@/store/slices/notesSlice';
import { fetchSidebarCategoriesRequest } from '@/store/slices/categoriesSlice';
import { RootState } from '@/store';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function Sidebar() {
  const dispatch  = useDispatch();
  const pathname  = usePathname();
  const router    = useRouter();
  const user             = useSelector((s: RootState) => s.auth.user);
  const sidebarCategories = useSelector((s: RootState) => s.categories.sidebarCategories);
  const filters          = useSelector((s: RootState) => s.notes.filters);

  const [catSearch, setCatSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isNotesActive   = pathname === '/notes' && !filters.isArchived;
  const isArchiveActive = pathname === '/notes' && !!filters.isArchived;

  // Debounce search → backend fetch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      dispatch(fetchSidebarCategoriesRequest(catSearch.trim() ? { search: catSearch } : undefined));
    }, catSearch.trim() ? 300 : 0);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [catSearch, dispatch]);

  const goNotes = (partial: Partial<typeof filters> = {}) => {
    dispatch(setFilters({ search: '', categoryId: null, isArchived: false, ...partial }));
    router.push('/notes');
  };

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 flex flex-col bg-cream-50 dark:bg-ink-900 border-r border-cream-200 dark:border-ink-800">
      <div className="px-6 pt-8 pb-6">
        <span className="font-display text-2xl font-bold text-ink-900 dark:text-cream-100">Noted.</span>
        <p className="text-xs text-ink-400 mt-0.5">Your thoughts, organized</p>
      </div>

      <div className="px-4 mb-4">
        <Link href="/notes/new"
          className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl bg-amber-accent hover:bg-amber-light text-white text-sm font-medium transition-colors">
          <PenSquare className="w-4 h-4" /> New Note
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="space-y-0.5">
          <NavBtn label="Notes"    icon={BookOpen} active={isNotesActive}   onClick={() => goNotes()} />
          <NavBtn label="Archived" icon={Archive}  active={isArchiveActive} onClick={() => goNotes({ isArchived: true })} />
        </div>

        <div className="pt-5">
          <p className="px-3 mb-2 text-xs font-medium text-ink-400 uppercase tracking-wider">Categories</p>

          {/* Inline backend search */}
          <div className="relative mb-2 px-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-ink-400 pointer-events-none" />
            <input
              value={catSearch}
              onChange={e => setCatSearch(e.target.value)}
              placeholder="Search categories…"
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-cream-100 dark:bg-ink-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-accent/50 text-ink-700 dark:text-ink-300 placeholder:text-ink-400"
            />
          </div>

          <div className="space-y-0.5">
            {sidebarCategories.map(cat => (
              <NavBtn
                key={cat.id}
                label={cat.title}
                dot={cat.color}
                count={cat.notes_count}
                active={pathname === '/notes' && filters.categoryId === cat.id}
                onClick={() => goNotes({ categoryId: cat.id })}
              />
            ))}
            {sidebarCategories.length === 0 && catSearch && (
              <p className="px-3 py-2 text-xs text-ink-400 italic">No match</p>
            )}
            {!catSearch && (
              <Link href="/categories"
                className="flex items-center gap-2 px-3 py-2 text-xs text-amber-accent hover:underline">
                View all categories →
              </Link>
            )}
          </div>
        </div>

        <div className="pt-5 space-y-0.5">
          <NavLink href="/categories" label="Manage Categories" icon={Tag}  active={pathname === '/categories'} />
          <NavLink href="/profile"    label="Profile"           icon={User} active={pathname === '/profile'} />
        </div>
      </nav>

      <div className="px-4 py-4 border-t border-cream-200 dark:border-ink-800">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink-800 dark:text-cream-100 truncate">{user?.username}</p>
            <p className="text-xs text-ink-400">Member</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <ThemeToggle />
            <button onClick={() => dispatch(logoutRequest())}
              className="p-2 rounded-xl hover:bg-cream-100 dark:hover:bg-ink-700 text-ink-400 transition-colors"
              title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

const navCls = (active: boolean) => clsx(
  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 w-full text-left',
  active
    ? 'bg-amber-accent/10 text-amber-accent font-medium'
    : 'text-ink-600 dark:text-ink-400 hover:bg-cream-100 dark:hover:bg-ink-800 hover:text-ink-900 dark:hover:text-cream-100'
);
function NavBtn({ label, icon: Icon, active, dot, count, onClick }: { label: string; icon?: React.ElementType; active: boolean; dot?: string; count?: number; onClick: () => void; }) {
  return (
    <button onClick={onClick} className={navCls(active)}>
      {dot  && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dot }} />}
      {Icon && !dot && <Icon className="w-4 h-4 shrink-0" />}
      <span className="truncate flex-1">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="ml-auto text-xs bg-cream-200 dark:bg-ink-700 text-ink-500 dark:text-ink-400 rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center leading-tight">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
function NavLink({ href, label, icon: Icon, active }: { href: string; label: string; icon?: React.ElementType; active: boolean; }) {
  return (
    <Link href={href} className={navCls(active)}>
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      <span className="truncate">{label}</span>
    </Link>
  );
}
