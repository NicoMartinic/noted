'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { refreshRequest } from '@/store/slices/authSlice';
import { fetchSidebarCategoriesRequest } from '@/store/slices/categoriesSlice';
import Sidebar from './Sidebar';
import Spinner from '@/components/ui/Spinner';

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const router   = useRouter();
  const { user, isInitialized, accessToken } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    if (!isInitialized) dispatch(refreshRequest());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isInitialized && !user) router.replace('/login');
  }, [isInitialized, user, router]);

  // Load sidebar categories (top 8 by notes_count) once authenticated
  useEffect(() => {
    if (user && accessToken) dispatch(fetchSidebarCategoriesRequest(undefined));
  }, [user, accessToken, dispatch]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-cream-50 dark:bg-ink-900">
        <Spinner size="lg" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-cream-50 dark:bg-ink-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
