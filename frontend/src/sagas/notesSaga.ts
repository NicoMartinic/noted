import { call, put, takeLatest, select } from 'typed-redux-saga';
import { AxiosError } from 'axios';
import { notesApi } from '@/services/api';
import {
  fetchNotesRequest, fetchNoteRequest, createNoteRequest, updateNoteRequest,
  deleteNoteRequest, toggleArchiveRequest, togglePinRequest,
  fetchNotesSuccess, fetchNoteSuccess, createNoteSuccess, updateNoteSuccess,
  deleteNoteSuccess, toggleArchiveSuccess, togglePinSuccess, notesFailure,
} from '@/store/slices/notesSlice';
import { RootState } from '@/store';

function getError(err: unknown): string {
  const e = err as AxiosError<{ error?: string }>;
  return e.response?.data?.error || 'Something went wrong.';
}

function* doFetchNotes() {
  const filters = yield* select((s: RootState) => s.notes.filters);
  const page    = yield* select((s: RootState) => s.notes.pagination?.page ?? 1);
  const params: Record<string, unknown> = { page };
  if (filters.search)              params.search      = filters.search;
  if (filters.categoryId !== null) params.category_id = filters.categoryId;
  if (filters.isArchived)          params.is_archived = true;
  if (filters.ordering)             params.ordering = filters.ordering;
  if (filters.ordering)            params.ordering    = filters.ordering;
  const { data } = yield* call([notesApi, notesApi.list], params);
  yield* put(fetchNotesSuccess({ notes: data.notes, pagination: data.pagination }));
}

function* handleFetchNotes() {
  try   { yield* doFetchNotes(); }
  catch (err) { yield* put(notesFailure(getError(err))); }
}

function* handleFetchNote(action: ReturnType<typeof fetchNoteRequest>) {
  try   { const { data } = yield* call([notesApi, notesApi.get], action.payload); yield* put(fetchNoteSuccess(data.note)); }
  catch (err) { yield* put(notesFailure(getError(err))); }
}

function* handleCreateNote(action: ReturnType<typeof createNoteRequest>) {
  try   { const { data } = yield* call([notesApi, notesApi.create], action.payload); yield* put(createNoteSuccess(data.note)); }
  catch (err) { yield* put(notesFailure(getError(err))); }
}

function* handleUpdateNote(action: ReturnType<typeof updateNoteRequest>) {
  try {
    const { id, ...rest } = action.payload;
    const { data } = yield* call([notesApi, notesApi.update], id, rest);
    yield* put(updateNoteSuccess(data.note));
  } catch (err) { yield* put(notesFailure(getError(err))); }
}

function* handleDeleteNote(action: ReturnType<typeof deleteNoteRequest>) {
  try {
    yield* call([notesApi, notesApi.delete], action.payload);
    yield* put(deleteNoteSuccess(action.payload));
    // Re-fetch to get accurate pagination from server (reducer already adjusted page if needed)
    yield* doFetchNotes();
  } catch (err) { yield* put(notesFailure(getError(err))); }
}

function* handleToggleArchive(action: ReturnType<typeof toggleArchiveRequest>) {
  try {
    const { data } = yield* call([notesApi, notesApi.toggleArchive], action.payload);
    yield* put(toggleArchiveSuccess(data.note));
    // Re-fetch to keep list and counts accurate
    yield* doFetchNotes();
  } catch (err) { yield* put(notesFailure(getError(err))); }
}

function* handleTogglePin(action: ReturnType<typeof togglePinRequest>) {
  try {
    const { data } = yield* call([notesApi, notesApi.pin], action.payload);
    yield* put(togglePinSuccess(data.note));
    yield* doFetchNotes(); // re-sort: pinned notes move to top
  } catch (err) { yield* put(notesFailure(getError(err))); }
}

export default function* notesSaga() {
  yield* takeLatest(fetchNotesRequest.type,    handleFetchNotes);
  yield* takeLatest(fetchNoteRequest.type,     handleFetchNote);
  yield* takeLatest(createNoteRequest.type,    handleCreateNote);
  yield* takeLatest(updateNoteRequest.type,    handleUpdateNote);
  yield* takeLatest(deleteNoteRequest.type,    handleDeleteNote);
  yield* takeLatest(toggleArchiveRequest.type, handleToggleArchive);
  yield* takeLatest(togglePinRequest.type,     handleTogglePin);
}
