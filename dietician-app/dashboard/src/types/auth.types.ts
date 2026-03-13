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