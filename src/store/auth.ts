import { create } from 'zustand';
import type { User } from '@/types';

/** Access token lives only in memory; the refresh token is an httpOnly cookie. */
interface AuthState {
  user: User | null;
  accessToken: string | null;
  status: 'loading' | 'authenticated' | 'guest';
  setSession: (user: User, accessToken: string) => void;
  setUser: (user: User) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  status: 'loading',
  setSession: (user, accessToken) => set({ user, accessToken, status: 'authenticated' }),
  setUser: (user) => set({ user }),
  clear: () => set({ user: null, accessToken: null, status: 'guest' }),
}));
