import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UIState } from '@/types';

// Read localStorage synchronously when store is created (client-only, safe here)
const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('notes-app-theme');
    if (saved === 'dark' || saved === 'light') return saved;
  }
  return 'light';
};

const initialState: UIState = {
  theme: getInitialTheme(),
  sidebarOpen: true,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
  },
});

export const { toggleTheme, setTheme, toggleSidebar } = uiSlice.actions;
export default uiSlice.reducer;
