import { call, put, takeLatest } from 'typed-redux-saga';
import { AxiosError } from 'axios';
import { authApi, usersApi } from '@/services/api';
import {
  loginRequest, registerRequest, logoutRequest, refreshRequest,
  authSuccess, authFailure, logoutSuccess, clearAuth, setInitialized,
} from '@/store/slices/authSlice';

function extractError(err: unknown) {
  const e = err as AxiosError<{ error?: string; errors?: Record<string, string> }>;
  const data = e.response?.data;
  return { error: data?.error, errors: data?.errors };
}

function* handleLogin(action: ReturnType<typeof loginRequest>) {
  try {
    yield* call([authApi, authApi.getCsrf]);
    const { data } = yield* call([authApi, authApi.login], action.payload);
    yield* put(authSuccess({ user: data.user, access_token: data.access_token }));
  } catch (err) {
    yield* put(authFailure(extractError(err)));
  }
}

function* handleRegister(action: ReturnType<typeof registerRequest>) {
  try {
    yield* call([authApi, authApi.getCsrf]);
    const { data } = yield* call([authApi, authApi.register], action.payload);
    yield* put(authSuccess({ user: data.user, access_token: data.access_token }));
  } catch (err) {
    yield* put(authFailure(extractError(err)));
  }
}

function* handleLogout() {
  try {
    yield* call([authApi, authApi.logout]);
  } catch (_) {
    // Logout even if request fails — always clear state
  } finally {
    yield* put(logoutSuccess());
  }
}

function* handleRefresh() {
  try {
    // Step 1: get a fresh access token from the httpOnly refresh cookie
    const { data: refreshData } = yield* call([authApi, authApi.refresh]);
    // Step 2: fetch the user profile to restore state after F5
    const { data: meData } = yield* call([usersApi, usersApi.getMe]);
    yield* put(authSuccess({ user: meData.user, access_token: refreshData.access_token }));
  } catch (_) {
    // Cookie missing/expired — user must log in again
    yield* put(clearAuth());
  }
}

export default function* authSaga() {
  yield* takeLatest(loginRequest.type, handleLogin);
  yield* takeLatest(registerRequest.type, handleRegister);
  yield* takeLatest(logoutRequest.type, handleLogout);
  yield* takeLatest(refreshRequest.type, handleRefresh);
}
