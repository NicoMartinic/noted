import { call, put, select, takeLatest } from 'typed-redux-saga';
import { AxiosError } from 'axios';
import { categoriesApi } from '@/services/api';
import {
  fetchCategoriesRequest, fetchCategoriesSuccess,
  fetchSidebarCategoriesRequest, fetchSidebarCategoriesSuccess,
  createCategoryRequest, updateCategoryRequest, deleteCategoryRequest,
  createCategorySuccess, updateCategorySuccess, deleteCategorySuccess,
  categoriesFailure,
} from '@/store/slices/categoriesSlice';
import { RootState } from '@/store';

function getError(err: unknown): string {
  const e = err as AxiosError<{ error?: string; errors?: Record<string, string> }>;
  const d = e.response?.data;
  if (d?.errors) {
    const first = Object.values(d.errors)[0];
    return typeof first === 'string' ? first : 'Validation error.';
  }
  return d?.error || 'Something went wrong.';
}

function* doFetchCategories() {
  const pagination = yield* select((s: RootState) => s.categories.pagination);
  const params = { per_page: 20, ordering: 'title', page: pagination?.page ?? 1 };
  const { data } = yield* call([categoriesApi, categoriesApi.list], params);
  yield* put(fetchCategoriesSuccess({ categories: data.categories, pagination: data.pagination }));
}

function* handleFetchCategories(action: ReturnType<typeof fetchCategoriesRequest>) {
  try {
    const params = { per_page: 20, ordering: 'title', ...(action.payload ?? {}) };
    const { data } = yield* call([categoriesApi, categoriesApi.list], params);
    yield* put(fetchCategoriesSuccess({ categories: data.categories, pagination: data.pagination }));
  } catch (err) {
    yield* put(categoriesFailure(getError(err)));
  }
}

// Sidebar: top 5 by notes_count, then by created_at desc; or search results (also max 5)
function* handleFetchSidebarCategories(action: ReturnType<typeof fetchSidebarCategoriesRequest>) {
  try {
    const search = action.payload?.search?.trim();
    const params: Record<string, unknown> = { per_page: 5, ordering: '-notes_count' };
    if (search) params.search = search;
    const { data } = yield* call([categoriesApi, categoriesApi.list], params);
    yield* put(fetchSidebarCategoriesSuccess(data.categories));
  } catch (err) {
    console.error('Sidebar fetch failed:', err);
  }
}

function* handleCreateCategory(action: ReturnType<typeof createCategoryRequest>) {
  try {
    yield* call([categoriesApi, categoriesApi.create], action.payload);
    yield* put(createCategorySuccess());
    // Re-fetch list so pagination is accurate (new total, may add a page)
    yield* doFetchCategories();
    yield* put(fetchSidebarCategoriesRequest(undefined));
  } catch (err) {
    yield* put(categoriesFailure(getError(err)));
  }
}

function* handleUpdateCategory(action: ReturnType<typeof updateCategoryRequest>) {
  try {
    const { id, ...rest } = action.payload;
    const { data } = yield* call([categoriesApi, categoriesApi.update], id, rest);
    yield* put(updateCategorySuccess(data.category));
    yield* doFetchCategories();
    yield* put(fetchSidebarCategoriesRequest(undefined));
  } catch (err) {
    yield* put(categoriesFailure(getError(err)));
  }
}

function* handleDeleteCategory(action: ReturnType<typeof deleteCategoryRequest>) {
  try {
    yield* call([categoriesApi, categoriesApi.delete], action.payload);
    yield* put(deleteCategorySuccess(action.payload));
    yield* doFetchCategories();
    yield* put(fetchSidebarCategoriesRequest(undefined));
  } catch (err) {
    yield* put(categoriesFailure(getError(err)));
  }
}

export default function* categoriesSaga() {
  yield* takeLatest(fetchCategoriesRequest.type,        handleFetchCategories);
  yield* takeLatest(fetchSidebarCategoriesRequest.type, handleFetchSidebarCategories);
  yield* takeLatest(createCategoryRequest.type,         handleCreateCategory);
  yield* takeLatest(updateCategoryRequest.type,         handleUpdateCategory);
  yield* takeLatest(deleteCategoryRequest.type,         handleDeleteCategory);
}
