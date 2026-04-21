import { create } from 'zustand';
import type { AuthResponse } from '../types';

type AuthUser = AuthResponse['user'];

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setAuth: (data: AuthResponse) => void;
  logout: () => void;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: (() => {
    try {
      const raw = localStorage.getItem('auth_user');
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  })(),
  token: localStorage.getItem('access_token'),

  setAuth(data) {
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    set({ token: data.access_token, user: data.user });
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_user');
    set({ token: null, user: null });
  },

  isAdmin() {
    return get().user?.role === 'ADMIN';
  },
}));
