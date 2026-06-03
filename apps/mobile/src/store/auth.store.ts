import { create } from 'zustand';
import { api, setAuthTokens, clearAuthTokens } from '../lib/api';
import type { User } from '@edp/shared';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    const { data } = await api.post('/auth/login', { email, password });
    setAuthTokens(data.accessToken, data.refreshToken);
    await get().fetchMe();
    set({ isLoading: false });
  },

  register: async (formData) => {
    set({ isLoading: true });
    const { data } = await api.post('/auth/register', formData);
    setAuthTokens(data.accessToken, data.refreshToken);
    await get().fetchMe();
    set({ isLoading: false });
  },

  logout: () => {
    clearAuthTokens();
    set({ user: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get('/users/me');
      set({ user: data, isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false });
    }
  },
}));
