import { useAuthStore } from '../../store/authStore'
import { Bell, Menu } from 'lucide-react'

interface HeaderProps {
  title: string
  onMenuToggle?: () => void
}

export default function Header({ title, onMenuToggle }: HeaderProps) {
  const { user } = useAuthStore()
  const email = user?.email ?? ''
  const avatarLetter = email.charAt(0).toUpperCase()

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div
      className="relative h-14 sm:h-18 px-2.5 min-[401px]:px-3.5 lg:px-8 shrink-0"
      style={{
        background: '#ffffff',
        borderBottom: '1px solid #e8eef8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 8px rgba(31,87,255,0.04)',
      }}
    >
      {/* Left: hamburger (mobile) + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        <button className="flex lg:hidden items-center justify-center w-10 h-10 rounded-xl bg-[#f5f7ff] border border-[#e8eef8] cursor-pointer shrink-0 transition-colors hover:bg-[#eef3ff]" onClick={onMenuToggle} aria-label="Open menu">
          <Menu size={18} color="#4a5568" />
        </button>

        <div style={{ minWidth: 0 }}>
          <div
            className="text-[15px] sm:text-xl truncate"
            style={{
              fontWeight: '700',
              color: '#0d1b3e',
              letterSpacing: '-0.4px',
            }}
          >
            {title}
          </div>
          <div
            className="hidden sm:block"
            style={{
              fontSize: '12px',
              color: '#8a9bc4',
              fontWeight: '500',
              marginTop: '1px',
              whiteSpace: 'nowrap',
            }}
          >
            {today}
          </div>
        </div>
      </div>

      {/* Right: bell + admin pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: '#f5f7ff',
            border: '1px solid #e8eef8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Bell size={17} color="#8a9bc4" />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 14px 6px 6px',
            borderRadius: '40px',
            background: '#f5f7ff',
            border: '1px solid #e8eef8',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1a73e8, #0d47a1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: '700',
              color: 'white',
              boxShadow: '0 2px 8px rgba(26,115,232,0.3)',
              flexShrink: 0,
            }}
          >
            {avatarLetter}
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#0d1b3e', lineHeight: 1.2 }}>
              Admin
            </div>
            <div
              className="hidden sm:block truncate max-w-35"
              style={{
                fontSize: '11px',
                color: '#8a9bc4',
              }}
            >
              {email}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
