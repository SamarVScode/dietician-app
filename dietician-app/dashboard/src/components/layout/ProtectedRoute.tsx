import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../../services/firebase'
import { useAuthStore } from '../../store/authStore'
import { ROUTES } from '../../constants/routes'
import { Stethoscope } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoading, isAuthenticated, setUser, clearUser } = useAuthStore()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email ?? '',
          displayName: firebaseUser.displayName ?? '',
        })
      } else {
        clearUser()
      }
    })
    return () => unsubscribe()
  }, [setUser, clearUser])

  if (isLoading) {
    return (
      <div
        style={{
          height: '100vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%)',
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #1a73e8, #0d47a1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(26,115,232,0.35)',
            marginBottom: '24px',
          }}
        >
          <Stethoscope size={36} color="white" />
        </div>

        {/* Spinner */}
        <div style={{ position: 'relative', width: '44px', height: '44px', marginBottom: '16px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: '3px solid #dbe8ff',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: '3px solid transparent',
              borderTopColor: '#1a73e8',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>

        <div
          style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#0d1b3e',
            marginBottom: '4px',
          }}
        >
          DietAdmin
        </div>
        <div style={{ fontSize: '13px', color: '#8a9bc4', fontWeight: '500' }}>
          Loading your dashboard...
        </div>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  return <>{children}</>
}