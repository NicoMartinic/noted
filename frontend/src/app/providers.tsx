'use client';
import { useEffect } from 'react';
import { Provider, useSelector } from 'react-redux';
import { store, RootState } from '@/store';

const THEME_KEY = 'notes-app-theme';

function ThemeApplier({ children }: { children: React.ReactNode }) {
  const theme = useSelector((s: RootState) => s.ui.theme);

  // Apply class and persist whenever theme changes (store already initialised from localStorage)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeApplier>{children}</ThemeApplier>
    </Provider>
  );
}
