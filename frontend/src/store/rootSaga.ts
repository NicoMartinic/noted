import { all } from 'redux-saga/effects';
import authSaga from '@/sagas/authSaga';
import notesSaga from '@/sagas/notesSaga';
import categoriesSaga from '@/sagas/categoriesSaga';
import userSaga from '@/sagas/userSaga';

export default function* rootSaga() {
  yield all([authSaga(), notesSaga(), categoriesSaga(), userSaga()]);
}
