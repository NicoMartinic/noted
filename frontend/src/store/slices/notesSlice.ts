import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Note, NotesState, CreateNotePayload, UpdateNotePayload } from '@/types';

interface Pagination {
  total: number; page: number; per_page: number;
  total_pages: number; has_next: boolean; has_previous: boolean;
}

const defaultPagination: Pagination = {
  total: 0, page: 1, per_page: 20,
  total_pages: 1, has_next: false, has_previous: false,
};

const initialState: NotesState = {
  notes: [],
  currentNote: null,
  isLoading: false,
  error: null,
  filters: { search: '', categoryId: null, isArchived: false, ordering: '-updated_at' },
  pagination: { ...defaultPagination },
};

const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    fetchNotesRequest:    (state) => { state.isLoading = true;  state.error = null; },
    fetchNoteRequest:     (state, _: PayloadAction<number>) => { state.isLoading = true;  state.error = null; },
    createNoteRequest:    (state, _: PayloadAction<CreateNotePayload>) => { state.isLoading = true;  state.error = null; },
    updateNoteRequest:    (state, _: PayloadAction<UpdateNotePayload>) => { state.isLoading = true;  state.error = null; },
    deleteNoteRequest:    (state, _: PayloadAction<number>) => { state.isLoading = true;  state.error = null; },
    toggleArchiveRequest: (state, _: PayloadAction<number>) => { state.isLoading = true; },
    togglePinRequest:     (state, _: PayloadAction<number>) => { state.isLoading = true; },

    fetchNotesSuccess: (state, action: PayloadAction<{ notes: Note[]; pagination: Pagination }>) => {
      state.isLoading = false;
      state.notes = action.payload.notes;
      state.pagination = action.payload.pagination ?? { ...defaultPagination };
    },
    fetchNoteSuccess: (state, action: PayloadAction<Note>) => {
      state.isLoading = false;
      state.currentNote = action.payload;
    },
    createNoteSuccess: (state, action: PayloadAction<Note>) => {
      state.isLoading = false;
      state.notes.unshift(action.payload);
      state.currentNote = action.payload;
      if (state.pagination.total !== undefined) state.pagination.total += 1;
    },
    updateNoteSuccess: (state, action: PayloadAction<Note>) => {
      state.isLoading = false;
      state.currentNote = action.payload;
      const idx = state.notes.findIndex(n => n.id === action.payload.id);
      if (idx !== -1) state.notes[idx] = action.payload;
    },
    deleteNoteSuccess: (state, action: PayloadAction<number>) => {
      state.isLoading = false;
      state.notes = state.notes.filter(n => n.id !== action.payload);
      state.currentNote = null;
      // Optimistically update total
      const p = state.pagination ?? defaultPagination;
      const newTotal = Math.max(0, p.total - 1);
      // If we emptied the current page and we're not on page 1, go back one page
      // (the page change will trigger a re-fetch via useEffect deps)
      const shouldGoBack = state.notes.length === 0 && p.page > 1;
      state.pagination = {
        ...p,
        total: newTotal,
        page: shouldGoBack ? p.page - 1 : p.page,
      };
    },
    toggleArchiveSuccess: (state, action: PayloadAction<Note>) => {
      state.isLoading = false;
      // Remove from current list (archiving changes the visible set)
      state.notes = state.notes.filter(n => n.id !== action.payload.id);
      if (state.currentNote?.id === action.payload.id) state.currentNote = action.payload;
    },
    togglePinSuccess: (state, action: PayloadAction<Note>) => {
      state.isLoading = false;
      const idx = state.notes.findIndex(n => n.id === action.payload.id);
      if (idx !== -1) state.notes[idx] = action.payload;
      if (state.currentNote?.id === action.payload.id) state.currentNote = action.payload;
    },
    notesFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<NotesState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination = { ...(state.pagination ?? defaultPagination), page: 1 };
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination = { ...(state.pagination ?? defaultPagination), page: action.payload };
    },
    clearCurrentNote: (state) => { state.currentNote = null; },
    clearNotesError:  (state) => { state.error = null; },
  },
});

export const {
  fetchNotesRequest, fetchNoteRequest, createNoteRequest, updateNoteRequest,
  deleteNoteRequest, toggleArchiveRequest, togglePinRequest,
  fetchNotesSuccess, fetchNoteSuccess, createNoteSuccess, updateNoteSuccess,
  deleteNoteSuccess, toggleArchiveSuccess, togglePinSuccess, notesFailure,
  setFilters, setPage, clearCurrentNote, clearNotesError,
} = notesSlice.actions;

export default notesSlice.reducer;
