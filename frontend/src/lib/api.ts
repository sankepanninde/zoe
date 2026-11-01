import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useConnection } from '@/stores/connection.store';
import { session } from '@/lib/session';

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
    _wakeUpTracked?: boolean;
  }
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  throw new Error('Falta la variable VITE_API_URL en el build de producción.');
}

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Cliente sin interceptores, para no entrar en bucle al refrescar.
const refreshClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// ===========================================
// DETECCIÓN DE COLD START (Render)
// ===========================================

const WAKE_UP_THRESHOLD_MS = 8000;
let wakeUpTimer: ReturnType<typeof setTimeout> | null = null;
let pendingRequests = 0;

function startWakeUpTimer() {
  if (sessionStorage.getItem('wakeup-shown')) return;
  if (pendingRequests === 0) {
    wakeUpTimer = setTimeout(() => {
      useConnection.getState().setWakingUp(true);
      sessionStorage.setItem('wakeup-shown', '1');
    }, WAKE_UP_THRESHOLD_MS);
  }
  pendingRequests++;
}

function stopWakeUpTimer() {
  pendingRequests = Math.max(0, pendingRequests - 1);
  if (pendingRequests === 0) {
    if (wakeUpTimer) {
      clearTimeout(wakeUpTimer);
      wakeUpTimer = null;
    }
    useConnection.getState().setWakingUp(false);
  }
}

function isWakeUpRelevant(url: string | undefined): boolean {
  if (!url) return false;
  return ['/auth/login', '/auth/register', '/auth/me', '/health'].some((p) => url.includes(p));
}

// ===========================================
// REFRESH DE SESIÓN
// ===========================================

// Estos endpoints nunca disparan refresh: un 401 aquí es una respuesta normal.
const ENDPOINTS_WITHOUT_REFRESH = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

function skipsRefresh(url: string | undefined): boolean {
  return !url || ENDPOINTS_WITHOUT_REFRESH.some((p) => url.includes(p));
}

// Una sola petición de refresh a la vez: las demás esperan la misma promesa.
let refreshPromise: Promise<string | null> | null = null;

export function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<{ accessToken: string }>('/auth/refresh')
      .then(({ data }) => {
        session.setToken(data.accessToken);
        return data.accessToken;
      })
      .catch(() => {
        session.setToken(null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// ===========================================
// INTERCEPTORES
// ===========================================

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = session.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (isWakeUpRelevant(config.url) && !sessionStorage.getItem('wakeup-shown')) {
    config._wakeUpTracked = true;
    startWakeUpTimer();
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.config._wakeUpTracked) stopWakeUpTimer();
    return response;
  },
  async (error: AxiosError) => {
    const original = error.config;
    if (original?._wakeUpTracked) stopWakeUpTimer();

    if (!original || error.response?.status !== 401 || original._retry || skipsRefresh(original.url)) {
      return Promise.reject(error);
    }

    original._retry = true;

    // Si otra petición ya refrescó el token mientras esta volaba, reintenta con el nuevo.
    const current = session.getToken();
    if (current && original.headers.Authorization !== `Bearer ${current}`) {
      original.headers.Authorization = `Bearer ${current}`;
      return api(original);
    }

    const token = await refreshAccessToken();
    if (!token) {
      session.notifyExpired();
      return Promise.reject(error);
    }

    original.headers.Authorization = `Bearer ${token}`;
    return api(original);
  }
);

// ===========================================
// ERRORES
// ===========================================

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as Partial<ApiErrorBody> | undefined;
    if (body?.message) return body.message;
    return error.response ? 'Error del servidor' : 'No hay conexión con el servidor';
  }
  if (error instanceof Error) return error.message;
  return 'Error desconocido';
}