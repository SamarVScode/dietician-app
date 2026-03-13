import { create } from 'zustand'

export interface AdminUser {
  uid: string
  email: string
  displayName: string
}

export interface AuthState {
  user: AdminUser | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthStore extends AuthState {
  setUser: (user: AdminUser) => void
  clearUser: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: (user) =>
    set({ user, isAuthenticated: true, isLoading: false }),
  clearUser: () =>
    set({ user: null, isAuthenticated: false, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}))