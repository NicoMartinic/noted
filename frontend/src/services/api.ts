import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { store } from '@/store';
import { setAccessToken, clearAuth } from '@/store/slices/authSlice';

// Always use same-origin proxy — Next.js rewrites forward to the backend server-side.
// This works in local dev, Docker, and Playwright without any per-environment config.
const BASE_URL = '/api-proxy';

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : null;
}

api.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  const csrf = getCsrfToken();
  if (csrf) config.headers['X-CSRFToken'] = csrf;
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token!));
  failedQueue = [];
}

api.interceptors.response.use(
  res => res,
  async (error) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
          .then(token => { original.headers = { ...original.headers, Authorization: `Bearer ${token}` }; return api(original); });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh/`, {}, {
          withCredentials: true,
          headers: { 'X-CSRFToken': getCsrfToken() || '' },
        });
        store.dispatch(setAccessToken(data.access_token));
        processQueue(null, data.access_token);
        original.headers = { ...original.headers, Authorization: `Bearer ${data.access_token}` };
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        store.dispatch(clearAuth());
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  getCsrf: () => api.get('/auth/csrf/'),
  register: (data: object) => api.post('/auth/register/', data),
  login: (data: object) => api.post('/auth/login/', data),
  logout: () => api.post('/auth/logout/'),
  refresh: () => api.post('/auth/refresh/'),
};

export const usersApi = {
  getMe: () => api.get('/users/me/'),
  updateMe: (data: object) => api.put('/users/me/update/', data),
};

export const categoriesApi = {
  list: (params?: object) => api.get('/categories/', { params }),
  create: (data: object) => api.post('/categories/create/', data),
  get: (id: number) => api.get(`/categories/${id}/`),
  update: (id: number, data: object) => api.put(`/categories/${id}/update/`, data),
  delete: (id: number) => api.delete(`/categories/${id}/delete/`),
  notesCount: (id: number) => api.get(`/categories/${id}/notes-count/`),
};

export const notesApi = {
  list: (params?: object) => api.get('/notes/', { params }),
  create: (data: object) => api.post('/notes/create/', data),
  get: (id: number) => api.get(`/notes/${id}/`),
  update: (id: number, data: object) => api.put(`/notes/${id}/update/`, data),
  delete: (id: number) => api.delete(`/notes/${id}/delete/`),
  pin: (id: number) =>
    api.patch(`/notes/${id}/pin/`),
  toggleArchive: (id: number) => api.patch(`/notes/${id}/archive/`),
};
