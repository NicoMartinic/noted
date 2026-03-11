'use client';
import { useRef, useEffect, useState } from 'react';
import { useFormik } from 'formik';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createNoteRequest, updateNoteRequest, clearNotesError } from '@/store/slices/notesSlice';
import { RootState } from '@/store';
import { noteSchema, NoteInput } from '@/schemas';
import { zodValidate } from '@/utils/helpers';
import { Note } from '@/types';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import SearchableSelect, { SelectOption } from '@/components/ui/SearchableSelect';

interface Props {
  note?: Note;
  onSuccess?: () => void;
}

export default function NoteForm({ note, onSuccess }: Props) {
  const dispatch  = useDispatch();
  const router    = useRouter();
  const { isLoading, error } = useSelector((s: RootState) => s.notes);
  const allCategories = useSelector((s: RootState) => s.categories.sidebarCategories);
  const [tab, setTab] = useState<'write' | 'preview'>('write');

  const onSuccessRef = useRef(onSuccess);
  useEffect(() => { onSuccessRef.current = onSuccess; });

  const submittedRef = useRef(false);
  useEffect(() => {
    if (submittedRef.current && !isLoading && !error) {
      submittedRef.current = false;
      if (onSuccessRef.current) onSuccessRef.current();
      else router.push('/notes');
    }
  }, [isLoading, error, router]);

  useEffect(() => () => { dispatch(clearNotesError()); }, [dispatch]);

  const categoryOptions: SelectOption[] = [
    { value: null, label: 'No category' },
    ...allCategories.map(c => ({ value: c.id, label: c.title, color: c.color })),
  ];

  const formik = useFormik<NoteInput>({
    initialValues: {
      title:       note?.title       || '',
      content:     note?.content     || '',
      category_id: note?.category?.id ?? null,
    },
    validate: zodValidate(noteSchema),
    onSubmit: (values) => {
      submittedRef.current = true;
      if (note) dispatch(updateNoteRequest({ id: note.id, ...values }));
      else      dispatch(createNoteRequest(values));
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-5">
      <Input label="Title" name="title" autoFocus
        value={formik.values.title} onChange={formik.handleChange} onBlur={formik.handleBlur}
        error={formik.touched.title ? formik.errors.title : undefined}
        placeholder="Note title…" />

      <SearchableSelect label="Category" options={categoryOptions}
        value={formik.values.category_id ?? null}
        onChange={v => formik.setFieldValue('category_id', v)}
        placeholder="No category" />

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-ink-600 dark:text-ink-400 uppercase tracking-wider">Content</label>
          <div className="flex rounded-lg border border-cream-200 dark:border-ink-700 overflow-hidden text-xs">
            <button type="button" onClick={() => setTab('write')}
              className={`px-3 py-1 transition-colors ${tab === 'write' ? 'bg-amber-accent text-white' : 'text-ink-500 hover:bg-cream-100 dark:hover:bg-ink-700'}`}>
              Write
            </button>
            <button type="button" onClick={() => setTab('preview')}
              className={`px-3 py-1 transition-colors ${tab === 'preview' ? 'bg-amber-accent text-white' : 'text-ink-500 hover:bg-cream-100 dark:hover:bg-ink-700'}`}>
              Preview
            </button>
          </div>
        </div>
        {tab === 'write' ? (
          <textarea name="content" value={formik.values.content} onChange={formik.handleChange} rows={12}
            placeholder="Write your note here… Markdown is supported."
            className="w-full px-4 py-3 rounded-xl border border-cream-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-900 dark:text-cream-100 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-accent/40 transition-all resize-none" />
        ) : (
          <div className="min-h-48 px-4 py-3 rounded-xl border border-cream-200 dark:border-ink-700 bg-cream-50 dark:bg-ink-900">
            {formik.values.content ? (
              <div className="prose prose-sm dark:prose-invert max-w-none text-ink-700 dark:text-ink-300">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{formik.values.content}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm italic text-ink-400">Nothing to preview yet…</p>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">{error}</p>}

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="secondary"
          onClick={() => { if (onSuccessRef.current) onSuccessRef.current(); else router.push('/notes'); }}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>{note ? 'Update Note' : 'Create Note'}</Button>
      </div>
    </form>
  );
}
