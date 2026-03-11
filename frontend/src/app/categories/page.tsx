'use client';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Tag } from 'lucide-react';
import {
  fetchCategoriesRequest, setCategoriesPage, clearCategoriesError,
  deleteCategoryRequest,
} from '@/store/slices/categoriesSlice';
import { RootState } from '@/store';
import { Category } from '@/types';
import PrivateLayout from '@/components/layout/PrivateLayout';
import CategoryCard from '@/components/categories/CategoryCard';
import CategoryForm from '@/components/categories/CategoryForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import { LoadingOverlay } from '@/components/ui/Spinner';

export default function CategoriesPage() {
  const dispatch      = useDispatch();
  const categories    = useSelector((s: RootState) => s.categories.categories);
  const isLoadingList = useSelector((s: RootState) => s.categories.isLoadingList);
  const isMutating    = useSelector((s: RootState) => s.categories.isMutating);
  const pagination    = useSelector((s: RootState) => s.categories.pagination);
  const accessToken   = useSelector((s: RootState) => s.auth.accessToken);

  const [search, setSearch]             = useState('');
  const [showCreate, setShowCreate]     = useState(false);
  const [editTarget, setEditTarget]     = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const currentPage = pagination?.page ?? 1;

  useEffect(() => {
    if (!accessToken) return;
    const t = setTimeout(() => {
      dispatch(fetchCategoriesRequest({ search: search.trim() || undefined, page: currentPage, per_page: 20 }));
    }, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [search, currentPage, accessToken, dispatch]);

  const closeCreate = () => { dispatch(clearCategoriesError()); setShowCreate(false); };
  const closeEdit   = () => { dispatch(clearCategoriesError()); setEditTarget(null); };

  return (
    <PrivateLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-ink-900 dark:text-cream-100">Categories</h1>
            <p className="text-ink-400 text-sm mt-1">{pagination?.total ?? 0} total</p>
          </div>
          <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> New Category</Button>
        </div>

        <div className="mb-6">
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); dispatch(setCategoriesPage(1)); }}
            placeholder="Search categories…"
            className="w-full max-w-sm px-4 py-2.5 rounded-xl border border-cream-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-sm text-ink-900 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-amber-accent/40 transition-all"
          />
        </div>

        {isLoadingList ? (
          <LoadingOverlay />
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-cream-200 dark:bg-ink-700 flex items-center justify-center mb-4">
              <Tag className="w-7 h-7 text-ink-400" />
            </div>
            <h3 className="font-display text-xl font-semibold text-ink-600 dark:text-ink-400 mb-2">
              {search ? 'No categories match' : 'No categories yet'}
            </h3>
            {!search && (
              <>
                <p className="text-ink-400 text-sm mb-6">Create categories to organise your notes</p>
                <Button onClick={() => setShowCreate(true)}>Create first category</Button>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(cat => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  onEdit={setEditTarget}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
            <Pagination pagination={pagination} onPageChange={p => dispatch(setCategoriesPage(p))} />
          </>
        )}
      </div>

      {/* Single create modal — not duplicated per card */}
      <Modal isOpen={showCreate} onClose={closeCreate} title="New Category">
        <CategoryForm onClose={closeCreate} />
      </Modal>

      {/* Single edit modal */}
      <Modal isOpen={!!editTarget} onClose={closeEdit} title="Edit Category">
        {editTarget && <CategoryForm category={editTarget} onClose={closeEdit} />}
      </Modal>

      {/* Single delete modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Category" size="sm">
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-ink-600 dark:text-ink-400">
              Delete <strong className="text-ink-900 dark:text-cream-100">{deleteTarget.title}</strong>?
            </p>
            {deleteTarget.notes_count > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-amber-700 dark:text-amber-400 text-sm">
                ⚠️ <strong>{deleteTarget.notes_count}</strong> note{deleteTarget.notes_count !== 1 ? 's' : ''} will become uncategorised.
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button
                variant="danger"
                isLoading={isMutating}
                onClick={() => {
                  dispatch(deleteCategoryRequest(deleteTarget.id));
                  setDeleteTarget(null);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PrivateLayout>
  );
}
