'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { refreshRequest } from '@/store/slices/authSlice';
import Spinner from '@/components/ui/Spinner';

export default function RootPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, isInitialized } = useSelector((s: RootState) => s.auth);

  // Must dispatch here — PrivateLayout isn't mounted on the root page
  useEffect(() => {
    if (!isInitialized) dispatch(refreshRequest());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isInitialized) router.replace(user ? '/notes' : '/login');
  }, [isInitialized, user, router]);

  return (
    <div className="flex items-center justify-center h-screen bg-cream-50 dark:bg-ink-900">
      <Spinner size="lg" />
    </div>
  );
}
