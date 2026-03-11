'use client';
import PrivateLayout from '@/components/layout/PrivateLayout';
import NoteForm from '@/components/notes/NoteForm';

export default function NewNotePage() {
  return (
    <PrivateLayout>
      <div className="p-8 max-w-3xl mx-auto">
        <h1 className="font-display text-3xl font-bold text-ink-900 dark:text-cream-100 mb-8">New Note</h1>
        <div className="bg-white dark:bg-ink-800 rounded-2xl shadow-card p-8">
          <NoteForm />
        </div>
      </div>
    </PrivateLayout>
  );
}
