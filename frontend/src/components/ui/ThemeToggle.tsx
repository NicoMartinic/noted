'use client';
import { Sun, Moon } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '@/store/slices/uiSlice';
import { RootState } from '@/store';

export default function ThemeToggle() {
  const dispatch = useDispatch();
  const theme = useSelector((s: RootState) => s.ui.theme);
  return (
    <button
      onClick={() => dispatch(toggleTheme())}
      className="p-2 rounded-xl hover:bg-cream-100 dark:hover:bg-ink-700 text-ink-500 dark:text-ink-400 transition-colors"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </button>
  );
}
