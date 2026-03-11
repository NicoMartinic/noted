import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User } from '@/types';

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isLoading: false,
  error: null,
  fieldErrors: null,
  isInitialized: false,
  successMessage: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginRequest: (state, _: PayloadAction<{ username: string; password: string }>) => {
      state.isLoading = true; state.error = null; state.fieldErrors = null; state.successMessage = null;
    },
    registerRequest: (state, _: PayloadAction<{ username: string; password: string; password2: string }>) => {
      state.isLoading = true; state.error = null; state.fieldErrors = null; state.successMessage = null;
    },
    logoutRequest:  (state) => { state.isLoading = true; },
    refreshRequest: (state) => { state.isLoading = true; },

    authSuccess: (state, action: PayloadAction<{ user: User; access_token: string; message?: string }>) => {
      state.isLoading = false;
      state.user = action.payload.user;
      if (action.payload.access_token !== '__KEEP__') {
        state.accessToken = action.payload.access_token;
      }
      state.error = null;
      state.fieldErrors = null;
      state.isInitialized = true;
      state.successMessage = action.payload.message ?? null;
    },
    authFailure: (state, action: PayloadAction<{ error?: string; errors?: Record<string, string> }>) => {
      state.isLoading = false;
      state.error = action.payload.error || 'An error occurred.';
      state.fieldErrors = action.payload.errors || null;
      state.isInitialized = true;
      state.successMessage = null;
    },
    logoutSuccess: (state) => {
      state.isLoading = false;
      state.user = null;
      state.accessToken = null;
      state.error = null;
      state.fieldErrors = null;
      state.successMessage = null;
    },
    setAccessToken: (state, action: PayloadAction<string>) => { state.accessToken = action.payload; },
    clearAuth: (state) => {
      state.user = null; state.accessToken = null;
      state.isLoading = false; state.isInitialized = true;
    },
    setInitialized: (state) => { state.isInitialized = true; },
    clearErrors:    (state) => { state.error = null; state.fieldErrors = null; state.successMessage = null; },
  },
});

export const {
  loginRequest, registerRequest, logoutRequest, refreshRequest,
  authSuccess, authFailure, logoutSuccess,
  setAccessToken, clearAuth, setInitialized, clearErrors,
} = authSlice.actions;

export default authSlice.reducer;
