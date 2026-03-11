'use client';
import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Archive, ArchiveRestore, Trash2, Pin, PinOff } from 'lucide-react';
import {
  fetchNoteRequest, deleteNoteRequest, toggleArchiveRequest,
  togglePinRequest, clearNotesError
} from '@/store/slices/notesSlice';
import { RootState } from '@/store';
import PrivateLayout from '@/components/layout/PrivateLayout';
import NoteForm from '@/components/notes/NoteForm';
import MarkdownContent from '@/components/notes/MarkdownContent';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import { formatDateTime } from '@/utils/helpers';

export default function NoteDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const dispatch = useDispatch();
  const router   = useRouter();
  const { currentNote, isLoading } = useSelector((s: RootState) => s.notes);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const deletingRef = useRef(false);
  useEffect(() => {
    if (deletingRef.current && !isLoading) {
      deletingRef.current = false;
      router.push('/notes');
    }
  }, [isLoading, router]);

  useEffect(() => {
    if (id) dispatch(fetchNoteRequest(Number(id)));
    return () => { dispatch(clearNotesError()); };
  }, [id, dispatch]);

  if (!currentNote || (isLoading && !isEditing)) {
    return (
      <PrivateLayout>
        <div className="p-8 flex justify-center"><Spinner /></div>
      </PrivateLayout>
    );
  }

  return (
    <PrivateLayout>
      <div className="p-8 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push('/notes')}
            className="p-2 rounded-xl hover:bg-cream-100 dark:hover:bg-ink-700 text-ink-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1" />
          {!isEditing && (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Button>
              <Button variant="secondary" size="sm"
                onClick={() => dispatch(togglePinRequest(currentNote.id))}
                title={currentNote.is_pinned ? 'Unpin' : 'Pin'}>
                {currentNote.is_pinned
                  ? <><PinOff className="w-3.5 h-3.5" /> Unpin</>
                  : <><Pin className="w-3.5 h-3.5" /> Pin</>}
              </Button>
              <Button variant="secondary" size="sm"
                onClick={() => dispatch(toggleArchiveRequest(currentNote.id))}>
                {currentNote.is_archived
                  ? <><ArchiveRestore className="w-3.5 h-3.5" /> Unarchive</>
                  : <><Archive className="w-3.5 h-3.5" /> Archive</>}
              </Button>
              <Button variant="danger" size="sm"
                onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-ink-800 rounded-2xl shadow-card overflow-hidden">
          {currentNote.category && (
            <div className="h-1.5" style={{ backgroundColor: currentNote.category.color }} />
          )}
          <div className="p-8">
            {isEditing ? (
              <NoteForm note={currentNote} onSuccess={() => setIsEditing(false)} />
            ) : (
              <>
                <div className="flex items-start gap-3 mb-2">
                  {currentNote.is_pinned && (
                    <Pin className="w-4 h-4 text-amber-accent fill-amber-accent mt-1 shrink-0" />
                  )}
                  <h1 className="font-display text-3xl font-bold text-ink-900 dark:text-cream-100 leading-tight">
                    {currentNote.title}
                  </h1>
                </div>
                <div className="flex items-center gap-3 mb-6">
                  {currentNote.category && (
                    <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ backgroundColor: currentNote.category.color + '20', color: currentNote.category.color }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentNote.category.color }} />
                      {currentNote.category.title}
                    </span>
                  )}
                  <span className="text-xs text-ink-400">Updated {formatDateTime(currentNote.updated_at)}</span>
                  {currentNote.is_archived && (
                    <span className="text-xs bg-cream-200 dark:bg-ink-700 text-ink-500 px-2 py-1 rounded-full">Archived</span>
                  )}
                </div>
                <MarkdownContent content={currentNote.content} />
              </>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete note?">
        <p className="text-sm text-ink-600 dark:text-ink-400 mb-6">This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
          <Button variant="danger" isLoading={deletingRef.current && isLoading}
            onClick={() => {
              setShowDeleteConfirm(false);
              deletingRef.current = true;
              dispatch(deleteNoteRequest(currentNote.id));
            }}>
            Confirm Delete
          </Button>
        </div>
      </Modal>
    </PrivateLayout>
  );
}
