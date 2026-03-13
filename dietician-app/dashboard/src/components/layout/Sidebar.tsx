import { NavLink, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../services/firebase'
import {
  LayoutDashboard,
  UserPlus,
  Settings,
  LogOut,
  Stethoscope,
  ChevronRight,
  BookOpen,
} from 'lucide-react'
import { ROUTES } from '../../constants/routes'

export default function Sidebar() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate(ROUTES.LOGIN)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const navItems = [
    { to: ROUTES.DASHBOARD, icon: <LayoutDashboard size={17} />, label: 'Dashboard' },
    { to: ROUTES.CREATE_USER, icon: <UserPlus size={17} />, label: 'Add New User' },
    { to: ROUTES.TEMPLATES, icon: <BookOpen size={17} />, label: 'Diet Templates' },
  ]

  return (
    <div style={{ width: '280px', minHeight: '100vh', background: '#ffffff', borderRight: '1px solid #e8eef8', display: 'flex', flexDirection: 'column', boxShadow: '2px 0 12px rgba(31, 87, 255, 0.04)' }}>

      {/* Logo */}
      <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid #f0f4ff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg, #1a73e8, #0d47a1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(26, 115, 232, 0.35)' }}>
            <Stethoscope size={22} color="white" />
          </div>
          <div>
            <div style={{ fontSize: '17px', fontWeight: '700', color: '#0d1b3e', letterSpacing: '-0.3px' }}>DietAdmin</div>
            <div style={{ fontSize: '11px', color: '#8a9bc4', fontWeight: '500', marginTop: '1px' }}>Dietician Platform</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: '16px 12px', flex: 1 }}>
        <div style={{ fontSize: '10px', fontWeight: '700', color: '#b0bdd8', letterSpacing: '1.2px', textTransform: 'uppercase', padding: '0 12px', marginBottom: '8px' }}>
          Main Menu
        </div>

        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: '14px',
              textDecoration: 'none',
              marginBottom: '4px',
              background: isActive ? '#eef3ff' : 'transparent',
              color: isActive ? '#1a73e8' : '#4a5568',
              fontWeight: isActive ? '600' : '500',
              fontSize: '14px',
              transition: 'all 0.15s ease',
            })}
          >
            {({ isActive }) => (
              <>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: isActive ? '#dbe8ff' : '#f5f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {isActive
                    ? <span style={{ color: '#1a73e8' }}>{item.icon}</span>
                    : <span style={{ color: '#8a9bc4' }}>{item.icon}</span>
                  }
                </div>
                {item.label}
                {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto', color: '#1a73e8' }} />}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Bottom */}
      <div style={{ padding: '12px 12px 20px', borderTop: '1px solid #f0f4ff' }}>
        <button
          disabled
          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '14px', background: 'transparent', border: 'none', cursor: 'not-allowed', width: '100%', marginBottom: '4px', opacity: 0.4 }}
        >
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f5f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Settings size={17} color="#8a9bc4" />
          </div>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#4a5568' }}>Settings</span>
        </button>

        <button
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '14px', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', transition: 'background 0.15s ease' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#fff1f1')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fff1f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogOut size={17} color="#e53e3e" />
          </div>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#e53e3e' }}>Logout</span>
        </button>
      </div>
    </div>
  )
}