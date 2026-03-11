import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Category, CategoriesState, CreateCategoryPayload, UpdateCategoryPayload } from '@/types';

interface Pagination {
  total: number; page: number; per_page: number;
  total_pages: number; has_next: boolean; has_previous: boolean;
}
const defaultPagination: Pagination = {
  total: 0, page: 1, per_page: 20, total_pages: 1, has_next: false, has_previous: false,
};

const initialState: CategoriesState = {
  categories: [],
  sidebarCategories: [],
  currentCategory: null,
  isLoadingList: false,
  isMutating: false,
  mutationCount: 0,      // increments on every successful mutation — forms watch this
  error: null,
  pagination: { ...defaultPagination },
};

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    // ── List ────────────────────────────────────────────────────────────────
    fetchCategoriesRequest: (state, _: PayloadAction<{ search?: string; page?: number; per_page?: number } | undefined>) => {
      state.isLoadingList = true; state.error = null;
    },
    fetchCategoriesSuccess: (state, action: PayloadAction<{ categories: Category[]; pagination: Pagination }>) => {
      state.isLoadingList = false;
      state.categories = action.payload.categories;
      state.pagination = action.payload.pagination ?? { ...defaultPagination };
    },

    // ── Sidebar ─────────────────────────────────────────────────────────────
    fetchSidebarCategoriesRequest: (state, _: PayloadAction<{ search?: string } | undefined>) => { /* silent */ },
    fetchSidebarCategoriesSuccess: (state, action: PayloadAction<Category[]>) => {
      state.sidebarCategories = action.payload;
    },

    // ── Mutations ────────────────────────────────────────────────────────────
    createCategoryRequest: (state, _: PayloadAction<CreateCategoryPayload>) => { state.isMutating = true; state.error = null; },
    updateCategoryRequest: (state, _: PayloadAction<UpdateCategoryPayload>) => { state.isMutating = true; state.error = null; },
    deleteCategoryRequest: (state, _: PayloadAction<number>)               => { state.isMutating = true; state.error = null; },

    // Success actions do NOT touch the categories list — the saga re-fetches after each mutation
    // so pagination stays accurate. Only mutationCount increments so forms know to close.
    createCategorySuccess: (state) => {
      state.isMutating = false;
      state.mutationCount += 1;
    },
    updateCategorySuccess: (state, action: PayloadAction<Category>) => {
      state.isMutating = false;
      state.mutationCount += 1;
      // Update sidebar in place (doesn't require a re-fetch)
      const idx = state.sidebarCategories.findIndex(c => c.id === action.payload.id);
      if (idx !== -1) state.sidebarCategories[idx] = action.payload;
    },
    deleteCategorySuccess: (state, action: PayloadAction<number>) => {
      state.isMutating = false;
      state.mutationCount += 1;
      state.sidebarCategories = state.sidebarCategories.filter(c => c.id !== action.payload);
      // If we'd empty the current page and aren't on page 1, go back
      const p = state.pagination;
      const remaining = state.categories.filter(c => c.id !== action.payload).length;
      state.pagination = {
        ...p,
        page: remaining === 0 && p.page > 1 ? p.page - 1 : p.page,
      };
    },

    categoriesFailure: (state, action: PayloadAction<string>) => {
      state.isLoadingList = false; state.isMutating = false; state.error = action.payload;
    },
    setCurrentCategory:  (state, action: PayloadAction<Category | null>) => { state.currentCategory = action.payload; },
    setCategoriesPage:   (state, action: PayloadAction<number>) => {
      state.pagination = { ...(state.pagination ?? defaultPagination), page: action.payload };
    },
    clearCategoriesError: (state) => { state.error = null; },
  },
});

export const {
  fetchCategoriesRequest, fetchCategoriesSuccess,
  fetchSidebarCategoriesRequest, fetchSidebarCategoriesSuccess,
  createCategoryRequest, updateCategoryRequest, deleteCategoryRequest,
  createCategorySuccess, updateCategorySuccess, deleteCategorySuccess,
  categoriesFailure, setCurrentCategory, setCategoriesPage, clearCategoriesError,
} = categoriesSlice.actions;

export default categoriesSlice.reducer;
