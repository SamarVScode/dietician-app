import { create } from 'zustand';
import { User } from 'firebase/auth';
import { UserProfile, DietPlan } from '../types';

interface AuthState {
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  dietPlan: DietPlan | null;
  isLoading: boolean;
  setFirebaseUser: (user: User | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setDietPlan: (plan: DietPlan | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  userProfile: null,
  dietPlan: null,
  isLoading: true,
  setFirebaseUser: (user) => set({ firebaseUser: user }),
  setUserProfile: (profile) => set({ userProfile: profile }),
  setDietPlan: (plan) => set({ dietPlan: plan }),
  setLoading: (loading) => set({ isLoading: loading }),
  clear: () => set({ firebaseUser: null, userProfile: null, dietPlan: null }),
}));
