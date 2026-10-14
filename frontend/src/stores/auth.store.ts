import { create } from 'zustand';
import { api, getApiError } from '@/lib/api';
import type { AuthResponse, Church, User } from '@/types';
import type { LoginResult } from '@/ui';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  loginWithResult: (data: {
    correo: string;
    clave: string;
    cuenta: 'plataforma' | 'iglesia';
    codigo?: string;
  }) => Promise<LoginResult>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateChurch: (data: Partial<Church>) => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  clearError: () => void;
}

export interface RegisterData {
  churchName: string;
  churchSlug: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('zoe_access_token'),
  // Si hay token guardado, arrancamos "cargando" hasta que /auth/me responda
  loading: Boolean(localStorage.getItem('zoe_access_token')),
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
      localStorage.setItem('zoe_access_token', data.accessToken);
      set({ token: data.accessToken });
      await get().loadUser();
    } catch (err) {
      const message = getApiError(err);
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },
    loginWithResult: async (data) => {
    set({ loading: true, error: null });
    try {
      const { data: res } = await api.post<AuthResponse>('/auth/login', {
        email: data.correo,
        password: data.clave,
      });
      localStorage.setItem('zoe_access_token', res.accessToken);
      set({ token: res.accessToken });
      await get().loadUser();
      return { ok: true };
    } catch (err: unknown) {
      set({ loading: false });
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) return { ok: false, reason: 'credenciales' };
      if (status === 423) return { ok: false, reason: 'bloqueada' };
      return { ok: false, reason: 'red' };
    }
  },


  register: async (input) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post<AuthResponse>('/auth/register', input);
      localStorage.setItem('zoe_access_token', data.accessToken);
      set({ token: data.accessToken });
      await get().loadUser();
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
      // silencioso
    }
    localStorage.removeItem('zoe_access_token');
    set({ user: null, token: null });
  },

  loadUser: async () => {
    const token = localStorage.getItem('zoe_access_token');
    if (!token) {
      set({ user: null, loading: false });
      return;
    }
    set({ loading: true });
    try {
      const { data } = await api.get<{ user: User }>('/auth/me');
      set({ user: data.user, token, loading: false });
    } catch {
      localStorage.removeItem('zoe_access_token');
      set({ user: null, token: null, loading: false });
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