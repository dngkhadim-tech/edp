import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, setAuthTokens, clearAuthTokens } from '@/lib/api';
import type { User } from '@edp/shared';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: Record<string, unknown>) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          setAuthTokens(data.accessToken, data.refreshToken);
          await get().fetchMe();
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (formData) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/register', formData);
          setAuthTokens(data.accessToken, data.refreshToken);
          await get().fetchMe();
        } finally {
          set({ isLoading: false });
        }
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

      updateUser: (user) => set({ user }),
    }),
    {
      name: 'edp-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
