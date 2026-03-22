import { create } from 'zustand';
import type { User } from 'firebase/auth';
import type { UserProfile } from '../types';

interface AuthState {
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setFirebaseUser: (user: User | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  userProfile: null,
  isLoading: true,
  isAuthenticated: false,
  setFirebaseUser: (user) =>
    set({ firebaseUser: user, isAuthenticated: !!user }),
  setUserProfile: (profile) => set({ userProfile: profile }),
  setLoading: (loading) => set({ isLoading: loading }),
  reset: () =>
    set({
      firebaseUser: null,
      userProfile: null,
      isAuthenticated: false,
      isLoading: false,
    }),
}));
