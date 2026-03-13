// Store: authStore
// Zustand store for auth state in mobile
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
    user: null,
    setUser: (user: any) => set({ user }),
}));
