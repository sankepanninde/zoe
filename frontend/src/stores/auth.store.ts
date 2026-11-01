import { create } from 'zustand';
import type { AxiosError } from 'axios';
import { api, getApiError, refreshAccessToken } from '@/lib/api';
import { session } from '@/lib/session';
import type { Church, User } from '@/types';
import type { LoginResult } from '@/ui';

interface LoginResponse {
  accessToken: string;
  user: User;
}

interface MeResponse {
  user: User;
}

export interface RegisterData {
  churchName: string;
  churchSlug: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginInput {
  correo: string;
  clave: string;
  cuenta?: 'plataforma' | 'iglesia';
  codigo?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;

  restoreSession: () => Promise<void>;
  loginWithResult: (data: LoginInput) => Promise<LoginResult>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateChurch: (data: Partial<Church>) => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  clearError: () => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  error: null,

  // Al arrancar la app: si existe la cookie de refresh, recupera la sesión.
  restoreSession: async () => {
    set({ loading: true });
    const token = await refreshAccessToken();
    if (!token) {
      set({ user: null, loading: false });
      return;
    }
    await get().loadUser();
  },

  loginWithResult: async (input) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post<LoginResponse>('/auth/login', {
        email: input.correo,
        password: input.clave,
      });
      session.setToken(data.accessToken);
      set({ user: data.user, loading: false });
      return { ok: true };
    } catch (err) {
      set({ loading: false });
      const status = (err as AxiosError).response?.status;
      if (status === 401) return { ok: false, reason: 'credenciales' };
      if (status === 423) return { ok: false, reason: 'bloqueada' };
      return { ok: false, reason: 'red' };
    }
  },

  register: async (input) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post<LoginResponse>('/auth/register', input);
      session.setToken(data.accessToken);
      set({ user: data.user, loading: false });
    } catch (err) {
      const message = getApiError(err);
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Aunque falle la petición, la sesión local se limpia igual.
    }
    session.setToken(null);
    set({ user: null });
  },

  loadUser: async () => {
    try {
      const { data } = await api.get<MeResponse>('/auth/me');
      set({ user: data.user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  updateChurch: async (data) => {
    const { data: res } = await api.patch<{ church: Church }>('/churches/me', data);
    const currentUser = get().user;
    if (currentUser) {
      set({ user: { ...currentUser, church: res.church } });
    }
  },

  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),

  clearError: () => set({ error: null }),
}));

// Si el refresh falla en cualquier petición, la sesión termina aquí.
session.onExpired(() => {
  useAuth.setState({ user: null, loading: false });
});