'use client';
import { memo, useRef, useEffect } from 'react';
import { useFormik } from 'formik';
import { useDispatch, useSelector } from 'react-redux';
import { createCategoryRequest, updateCategoryRequest, clearCategoriesError } from '@/store/slices/categoriesSlice';
import { RootState } from '@/store';
import { categorySchema, CategoryInput } from '@/schemas';
import { zodValidate } from '@/utils/helpers';
import { Category } from '@/types';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import ColorPicker from '@/components/ui/ColorPicker';

function CategoryForm({ category, onClose }: { category?: Category; onClose: () => void }) {
  const dispatch = useDispatch();
  const isMutating    = useSelector((s: RootState) => s.categories.isMutating);
  const error         = useSelector((s: RootState) => s.categories.error);
  const mutationCount = useSelector((s: RootState) => s.categories.mutationCount);

  const onCloseRef        = useRef(onClose);
  const submittedRef      = useRef(false);
  const initialCountRef   = useRef(mutationCount); // capture count at mount

  useEffect(() => { onCloseRef.current = onClose; });
  useEffect(() => () => { dispatch(clearCategoriesError()); }, [dispatch]);

  // Close when mutationCount increases after we submitted
  useEffect(() => {
    if (submittedRef.current && mutationCount > initialCountRef.current) {
      submittedRef.current = false;
      onCloseRef.current();
    }
  }, [mutationCount]);

  const formik = useFormik<CategoryInput>({
    initialValues: {
      title:       category?.title       || '',
      description: category?.description || '',
      color:       category?.color       || '#6366f1',
    },
    validate: zodValidate(categorySchema),
    onSubmit: (values) => {
      submittedRef.current = true;
      if (category) dispatch(updateCategoryRequest({ id: category.id, ...values }));
      else          dispatch(createCategoryRequest(values));
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-5">
      {/* label only — no name prop (avoids duplicate id/name attributes from getFieldProps) */}
      <Input
        label="Title"
        autoFocus
        {...formik.getFieldProps('title')}
        error={formik.touched.title ? formik.errors.title : undefined}
        placeholder="Category name…"
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-ink-600 dark:text-ink-400 uppercase tracking-wider">Description</label>
        <textarea
          {...formik.getFieldProps('description')}
          rows={3}
          placeholder="Optional description…"
          className="w-full px-4 py-2.5 rounded-xl border border-cream-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-900 dark:text-cream-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-accent/40 transition-all resize-none"
        />
      </div>

      <ColorPicker
        value={formik.values.color}
        onChange={c => formik.setFieldValue('color', c)}
        error={formik.touched.color ? formik.errors.color : undefined}
      />

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">{error}</p>
      )}

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="secondary" onClick={() => onCloseRef.current()}>Cancel</Button>
        <Button type="submit" isLoading={isMutating}>{category ? 'Update' : 'Create'} Category</Button>
      </div>
    </form>
  );
}

export default memo(CategoryForm);
