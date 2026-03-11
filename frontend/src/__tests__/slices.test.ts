/**
 * Unit tests for Redux slices — pure reducer logic, no side effects.
 */
import authReducer, {
  authFailure,
  authSuccess,
  clearErrors,
  loginRequest,
  logoutSuccess,
} from "@/store/slices/authSlice";
import categoriesReducer, {
  createCategorySuccess,
  deleteCategorySuccess,
  fetchCategoriesSuccess,
} from "@/store/slices/categoriesSlice";
import notesReducer, {
  deleteNoteSuccess,
  fetchNotesSuccess,
  setFilters,
  setPage,
  toggleArchiveSuccess,
  togglePinSuccess,
} from "@/store/slices/notesSlice";

// ── Auth slice ────────────────────────────────────────────────────────────────
describe("authSlice", () => {
  const initial = authReducer(undefined, { type: "@@INIT" });

  test("loginRequest sets isLoading", () => {
    const s = authReducer(initial, loginRequest({ username: "u", password: "p" }));
    expect(s.isLoading).toBe(true);
    expect(s.error).toBeNull();
  });

  test("authSuccess stores user and token", () => {
    const user = { id: 1, username: "alice", date_joined: "2024-01-01" };
    const s = authReducer(initial, authSuccess({ user, access_token: "tok123" }));
    expect(s.user).toEqual(user);
    expect(s.accessToken).toBe("tok123");
    expect(s.isLoading).toBe(false);
  });

  test("authSuccess with __KEEP__ preserves existing token", () => {
    const withToken = { ...initial, accessToken: "existing" };
    const user = { id: 1, username: "alice", date_joined: "2024-01-01" };
    const s = authReducer(withToken, authSuccess({ user, access_token: "__KEEP__" }));
    expect(s.accessToken).toBe("existing");
  });

  test("authSuccess stores successMessage", () => {
    const user = { id: 1, username: "alice", date_joined: "2024-01-01" };
    const s = authReducer(
      initial,
      authSuccess({ user, access_token: "__KEEP__", message: "Saved!" })
    );
    expect(s.successMessage).toBe("Saved!");
  });

  test("authFailure stores error", () => {
    const s = authReducer(initial, authFailure({ error: "Bad creds" }));
    expect(s.error).toBe("Bad creds");
    expect(s.isLoading).toBe(false);
  });

  test("logoutSuccess clears user and token", () => {
    const loggedIn = {
      ...initial,
      user: { id: 1, username: "a", date_joined: "" },
      accessToken: "tok",
    };
    const s = authReducer(loggedIn, logoutSuccess());
    expect(s.user).toBeNull();
    expect(s.accessToken).toBeNull();
  });

  test("clearErrors clears error and successMessage", () => {
    const withErr = { ...initial, error: "oops", successMessage: "old" };
    const s = authReducer(withErr, clearErrors());
    expect(s.error).toBeNull();
    expect(s.successMessage).toBeNull();
  });
});

// ── Notes slice ───────────────────────────────────────────────────────────────
describe("notesSlice", () => {
  const initial = notesReducer(undefined, { type: "@@INIT" });

  const mockPagination = {
    total: 3,
    page: 1,
    per_page: 20,
    total_pages: 1,
    has_next: false,
    has_previous: false,
  };

  const makeNote = (id: number, overrides = {}) => ({
    id,
    title: `Note ${id}`,
    content: "",
    category: null,
    category_id: null,
    is_pinned: false,
    is_archived: false,
    created_at: "",
    updated_at: "",
    ...overrides,
  });

  test("initial state has default ordering", () => {
    expect(initial.filters.ordering).toBe("-updated_at");
  });

  test("fetchNotesSuccess populates notes and pagination", () => {
    const notes = [makeNote(1), makeNote(2)];
    const s = notesReducer(initial, fetchNotesSuccess({ notes, pagination: mockPagination }));
    expect(s.notes).toHaveLength(2);
    expect(s.pagination.total).toBe(3);
  });

  test("setFilters resets page to 1", () => {
    const onPage2 = notesReducer(initial, setPage(2));
    const s = notesReducer(onPage2, setFilters({ search: "hello" }));
    expect(s.pagination.page).toBe(1);
    expect(s.filters.search).toBe("hello");
  });

  test("setFilters updates ordering", () => {
    const s = notesReducer(initial, setFilters({ ordering: "title" }));
    expect(s.filters.ordering).toBe("title");
  });

  test("deleteNoteSuccess removes note from list", () => {
    const withNotes = notesReducer(
      initial,
      fetchNotesSuccess({ notes: [makeNote(1), makeNote(2)], pagination: mockPagination })
    );
    const s = notesReducer(withNotes, deleteNoteSuccess(1));
    expect(s.notes.find((n) => n.id === 1)).toBeUndefined();
    expect(s.notes).toHaveLength(1);
  });

  test("deleteNoteSuccess decrements page when last item on page > 1 removed", () => {
    const pag = {
      total: 21,
      page: 2,
      per_page: 20,
      total_pages: 2,
      has_next: false,
      has_previous: true,
    };
    const onPage2 = notesReducer(initial, fetchNotesSuccess({ notes: [makeNote(1)], pagination: pag }));
    const s = notesReducer(onPage2, deleteNoteSuccess(1));
    expect(s.pagination.page).toBe(1);
  });

  test("togglePinSuccess updates note in list", () => {
    const withNotes = notesReducer(
      initial,
      fetchNotesSuccess({ notes: [makeNote(1), makeNote(2)], pagination: mockPagination })
    );
    const pinned = makeNote(1, { is_pinned: true });
    const s = notesReducer(withNotes, togglePinSuccess(pinned));
    expect(s.notes.find((n) => n.id === 1)?.is_pinned).toBe(true);
    // Other notes unaffected
    expect(s.notes.find((n) => n.id === 2)?.is_pinned).toBe(false);
  });

  test("togglePinSuccess updates currentNote when it matches", () => {
    const withCurrent = { ...initial, currentNote: makeNote(1, { is_pinned: false }) };
    const pinned = makeNote(1, { is_pinned: true });
    const s = notesReducer(withCurrent, togglePinSuccess(pinned));
    expect(s.currentNote?.is_pinned).toBe(true);
  });

  test("togglePinSuccess does not affect currentNote when id differs", () => {
    const withCurrent = { ...initial, currentNote: makeNote(2, { is_pinned: false }) };
    const pinned = makeNote(1, { is_pinned: true });
    const s = notesReducer(withCurrent, togglePinSuccess(pinned));
    expect(s.currentNote?.is_pinned).toBe(false);
  });

  test("toggleArchiveSuccess removes note from current list", () => {
    const archived = makeNote(1, { is_archived: true });
    const withNotes = notesReducer(
      initial,
      fetchNotesSuccess({ notes: [makeNote(1), makeNote(2)], pagination: mockPagination })
    );
    const s = notesReducer(withNotes, toggleArchiveSuccess(archived));
    expect(s.notes.find((n) => n.id === 1)).toBeUndefined();
  });
});

// ── Categories slice ──────────────────────────────────────────────────────────
describe("categoriesSlice", () => {
  const initial = categoriesReducer(undefined, { type: "@@INIT" });
  const mockPag = {
    total: 1,
    page: 1,
    per_page: 20,
    total_pages: 1,
    has_next: false,
    has_previous: false,
  };

  const makeCat = (id: number) => ({
    id,
    title: `Cat ${id}`,
    description: "",
    color: "#fff",
    notes_count: 0,
    created_at: "",
    updated_at: "",
  });

  test("fetchCategoriesSuccess stores list and pagination", () => {
    const s = categoriesReducer(
      initial,
      fetchCategoriesSuccess({ categories: [makeCat(1)], pagination: mockPag })
    );
    expect(s.categories).toHaveLength(1);
    expect(s.isLoadingList).toBe(false);
  });

  test("createCategorySuccess increments mutationCount", () => {
    const before = initial.mutationCount;
    const s = categoriesReducer(initial, createCategorySuccess());
    expect(s.mutationCount).toBe(before + 1);
  });

  test("deleteCategorySuccess removes from sidebarCategories", () => {
    const withSidebar = { ...initial, sidebarCategories: [makeCat(1), makeCat(2)] };
    const s = categoriesReducer(withSidebar, deleteCategorySuccess(1));
    expect(s.sidebarCategories.find((c) => c.id === 1)).toBeUndefined();
  });

  test("categories with notes_count badge data present", () => {
    const cat = makeCat(1);
    const s = categoriesReducer(
      initial,
      fetchCategoriesSuccess({ categories: [cat], pagination: mockPag })
    );
    expect(s.categories[0].notes_count).toBe(0);
  });
});
