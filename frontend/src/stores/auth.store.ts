import { create } from 'zustand';
import { api, getApiError } from '@/lib/api';
import type { AuthResponse, Church, User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateChurch: (data: Partial<Church>) => Promise<void>;
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
  loading: false,
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

  clearError: () => set({ error: null }),
}));