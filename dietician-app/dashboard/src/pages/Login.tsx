import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../services/firebase'
import { ROUTES } from '../constants/routes'
import { Stethoscope, Mail, Lock, ArrowRight } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) return setError('Email is required')
    if (!password) return setError('Password is required')
    setIsLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate(ROUTES.DASHBOARD)
    } catch {
      setError('Invalid email or password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: '#f8fafd',
      }}
    >
      {/* Left Panel */}
      <div
        style={{
          flex: 1,
          background: 'linear-gradient(145deg, #1a73e8 0%, #0d47a1 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decoration */}
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-60px',
            left: '-60px',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
          }}
        />

        {/* Content */}
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '28px',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 28px',
            }}
          >
            <Stethoscope size={40} color="white" />
          </div>

          <div
            style={{
              fontSize: '36px',
              fontWeight: '800',
              color: 'white',
              letterSpacing: '-1px',
              marginBottom: '12px',
              lineHeight: 1.1,
            }}
          >
            Diet<br />Admin
          </div>

          <div
            style={{
              fontSize: '15px',
              color: 'rgba(255,255,255,0.7)',
              fontWeight: '500',
              maxWidth: '260px',
              lineHeight: 1.6,
            }}
          >
            Professional dietician management platform for modern healthcare
          </div>

          {/* Feature pills */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginTop: '40px',
              alignItems: 'flex-start',
            }}
          >
            {[
              '👥 Manage all your patients',
              '🥗 Assign personalized diet plans',
              '📊 Track daily progress reports',
              '🤖 AI powered plan generation',
            ].map((item) => (
              <div
                key={item}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 16px',
                  borderRadius: '40px',
                  background: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: '500',
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div
        style={{
          width: '480px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 48px',
          background: 'white',
          boxShadow: '-4px 0 40px rgba(26,115,232,0.06)',
        }}
      >
        <div style={{ width: '100%', maxWidth: '360px' }}>

          {/* Header */}
          <div style={{ marginBottom: '40px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '40px',
                background: '#eef3ff',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#1a73e8',
                }}
              />
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#1a73e8',
                }}
              >
                Admin Access Only
              </span>
            </div>

            <div
              style={{
                fontSize: '28px',
                fontWeight: '800',
                color: '#0d1b3e',
                letterSpacing: '-0.8px',
                marginBottom: '8px',
              }}
            >
              Welcome back
            </div>
            <div style={{ fontSize: '14px', color: '#8a9bc4', fontWeight: '500' }}>
              Sign in to manage your patients
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Email */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#0d1b3e',
                  marginBottom: '8px',
                }}
              >
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  color={focusedField === 'email' ? '#1a73e8' : '#b0bdd8'}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    transition: 'color 0.15s',
                  }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="admin@dietapp.com"
                  style={{
                    width: '100%',
                    padding: '13px 14px 13px 42px',
                    borderRadius: '14px',
                    border: focusedField === 'email'
                      ? '2px solid #1a73e8'
                      : '2px solid #e8eef8',
                    background: focusedField === 'email' ? '#fafcff' : '#f8fafd',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#0d1b3e',
                    outline: 'none',
                    transition: 'all 0.15s ease',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#0d1b3e',
                  marginBottom: '8px',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  color={focusedField === 'password' ? '#1a73e8' : '#b0bdd8'}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    transition: 'color 0.15s',
                  }}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '13px 14px 13px 42px',
                    borderRadius: '14px',
                    border: focusedField === 'password'
                      ? '2px solid #1a73e8'
                      : '2px solid #e8eef8',
                    background: focusedField === 'password' ? '#fafcff' : '#f8fafd',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#0d1b3e',
                    outline: 'none',
                    transition: 'all 0.15s ease',
                  }}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: '#fff5f5',
                  border: '1px solid #fed7d7',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#c53030',
                }}
              >
                ⚠️ {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '14px',
                borderRadius: '14px',
                background: isLoading
                  ? '#93b4f0'
                  : 'linear-gradient(135deg, #1a73e8, #1557b0)',
                border: 'none',
                color: 'white',
                fontSize: '15px',
                fontWeight: '700',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: isLoading
                  ? 'none'
                  : '0 4px 16px rgba(26,115,232,0.35)',
                transition: 'all 0.2s ease',
                marginTop: '4px',
              }}
            >
              {isLoading ? (
                <>
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.4)',
                      borderTopColor: 'white',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div
            style={{
              textAlign: 'center',
              marginTop: '32px',
              fontSize: '12px',
              color: '#b0bdd8',
              fontWeight: '500',
            }}
          >
            Admin access only · Contact support if locked out
          </div>
        </div>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  )
}