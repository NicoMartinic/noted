export interface User { id: number; username: string; date_joined: string; }

export interface Category {
  id: number; title: string; description: string; color: string;
  notes_count: number; created_at: string; updated_at: string;
}

export interface Note {
  id: number; title: string; content: string;
  category: Category | null; category_id: number | null;
  is_pinned: boolean; is_archived: boolean; created_at: string; updated_at: string;
}

export interface Pagination {
  total: number; page: number; per_page: number; total_pages: number;
  has_next: boolean; has_previous: boolean;
}

export interface ApiError { error?: string; errors?: Record<string, string>; }

export interface AuthState {
  user: User | null; accessToken: string | null;
  isLoading: boolean; error: string | null;
  fieldErrors: Record<string, string> | null; isInitialized: boolean;
  successMessage: string | null;
}

export interface NotesState {
  notes: Note[]; currentNote: Note | null;
  isLoading: boolean; error: string | null;
  filters: { search: string; categoryId: number | null | 'null'; isArchived: boolean; ordering: string; };
  pagination: Pagination;
}

export interface CategoriesState {
  categories: Category[];
  sidebarCategories: Category[];
  currentCategory: Category | null;
  isLoadingList: boolean;
  isMutating: boolean;
  mutationCount: number;
  error: string | null;
  pagination: Pagination;
}

export interface UIState { theme: 'light' | 'dark'; sidebarOpen: boolean; }

export interface LoginPayload { username: string; password: string; }
export interface RegisterPayload { username: string; password: string; password2: string; }
export interface UpdateProfilePayload { current_username: string; current_password: string; new_username?: string; new_password?: string; }
export interface CreateCategoryPayload { title: string; description?: string; color?: string; }
export interface UpdateCategoryPayload extends CreateCategoryPayload { id: number; }
export interface CreateNotePayload { title: string; content?: string; category_id?: number | null; }
export interface UpdateNotePayload extends CreateNotePayload { id: number; is_pinned?: boolean; is_archived?: boolean; }
