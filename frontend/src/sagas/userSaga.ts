import { call, put, takeLatest } from 'typed-redux-saga';
import { AxiosError } from 'axios';
import { usersApi } from '@/services/api';
import { authSuccess, authFailure } from '@/store/slices/authSlice';
import { UPDATE_PROFILE } from '@/store/actions/userActions';

function* handleUpdateProfile(action: { type: string; payload: object }) {
  try {
    const { data } = yield* call([usersApi, usersApi.updateMe], action.payload);
    yield* put(authSuccess({
      user: data.user,
      access_token: '__KEEP__',
      message: data.message ?? 'Profile updated successfully.',
    }));
  } catch (err) {
    const e = err as AxiosError<{ error?: string; errors?: Record<string, string> }>;
    const d = e.response?.data;
    yield* put(authFailure({ error: d?.error, errors: d?.errors }));
  }
}

export default function* userSaga() {
  yield* takeLatest(UPDATE_PROFILE, handleUpdateProfile);
}
