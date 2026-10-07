import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useConnection } from '@/stores/connection.store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Cuánto esperar antes de mostrar "Despertando servidor..."
const WAKE_UP_THRESHOLD_MS = 3000;

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ===========================================
// INTERCEPTOR: DETECCIÓN DE COLD START
// ===========================================

let wakeUpTimer: ReturnType<typeof setTimeout> | null = null;
let pendingRequests = 0;

function startWakeUpTimer() {
  if (pendingRequests === 0) {
    wakeUpTimer = setTimeout(() => {
      useConnection.getState().setWakingUp(true);
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

// ===========================================
// REQUEST INTERCEPTOR
// ===========================================

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('zoe_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Arrancar timer de cold start
  config.__wakeUpTracked = true;
  startWakeUpTimer();

  return config;
});

// ===========================================
// RESPONSE INTERCEPTOR
// ===========================================

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    // Parar timer
    if ((response.config as InternalAxiosRequestConfig & { __wakeUpTracked?: boolean }).__wakeUpTracked) {
      stopWakeUpTimer();
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      __wakeUpTracked?: boolean;
    };

    // Parar timer (aunque sea error)
    if (originalRequest?.__wakeUpTracked) {
      stopWakeUpTimer();
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = data.accessToken as string;
        localStorage.setItem('zoe_access_token', newToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        localStorage.removeItem('zoe_access_token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ===========================================
// ERROR HELPER
// ===========================================

export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  details?: Record<string, string[]>;
}

export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    return data?.message || error.message || 'Error de conexión';
  }
  if (error instanceof Error) return error.message;
  return 'Error desconocido';
}