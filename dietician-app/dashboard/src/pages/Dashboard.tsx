import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../services/firebase'
import PageWrapper from '../components/layout/PageWrapper'
import { Search, UserPlus, Users, TrendingUp, Activity } from 'lucide-react'

interface User {
  id: string
  name: string
  goal: string
  userId: string
  status: string
  createdAt: string
}

type StatusKey = 'active' | 'no-plan' | 'inactive'

interface StatusInfo {
  label: string
  bg: string
  text: string
  dot: string
  border: string
}

const statusConfig: Record<StatusKey, StatusInfo> = {
  active: {
    label: 'Plan Active',
    bg: '#f0fdf4',
    text: '#15803d',
    dot: '#22c55e',
    border: '#bbf7d0',
  },
  'no-plan': {
    label: 'No Plan',
    bg: '#fffbeb',
    text: '#b45309',
    dot: '#f59e0b',
    border: '#fde68a',
  },
  inactive: {
    label: 'Inactive',
    bg: '#fff5f5',
    text: '#c53030',
    dot: '#fc8181',
    border: '#fed7d7',
  },
}

function getStatus(status: string): StatusInfo {
  if (status in statusConfig) {
    return statusConfig[status as StatusKey]
  }
  return statusConfig['no-plan']
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[]
    },
  })

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  )

  const totalUsers = users.length
  const activePlans = users.filter((u) => u.status === 'active').length
  const noPlan = users.filter((u) => u.status === 'no-plan').length

  return (
    <PageWrapper title="Dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Stats */}
        <div className="dash-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[
            {
              label: 'Total Patients',
              value: totalUsers,
              icon: <Users size={20} color="#1a73e8" />,
              iconBg: '#eef3ff',
              trend: 'All registered users',
              trendIcon: <TrendingUp size={12} color="#1a73e8" />,
              border: '#dbe8ff',
              bg: '#ffffff',
            },
            {
              label: 'Active Diet Plans',
              value: activePlans,
              icon: <Activity size={20} color="#0d9488" />,
              iconBg: '#f0fdfa',
              trend: 'Currently following plan',
              trendIcon: <TrendingUp size={12} color="#0d9488" />,
              border: '#99f6e4',
              bg: '#ffffff',
            },
            {
              label: 'Awaiting Plan',
              value: noPlan,
              icon: <Users size={20} color="#d97706" />,
              iconBg: '#fffbeb',
              trend: 'Need plan assignment',
              trendIcon: <TrendingUp size={12} color="#d97706" />,
              border: '#fde68a',
              bg: '#ffffff',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="dash-stat-card"
              style={{
                background: stat.bg,
                border: `1px solid ${stat.border}`,
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 2px 12px rgba(26,115,232,0.06)',
              }}
            >
              <div
                className="dash-stat-icon-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <div
                  className="dash-stat-icon"
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px',
                    background: stat.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {stat.icon}
                </div>
              </div>
              <div className="dash-stat-body">
                <div
                  className="dash-stat-value"
                  style={{
                    fontSize: '32px',
                    fontWeight: '800',
                    color: '#0d1b3e',
                    letterSpacing: '-1px',
                    lineHeight: 1,
                    marginBottom: '6px',
                  }}
                >
                  {stat.value}
                </div>
                <div
                  className="dash-stat-label"
                  style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#4a5568',
                    marginBottom: '8px',
                  }}
                >
                  {stat.label}
                </div>
                <div
                  className="dash-stat-trend"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    color: '#8a9bc4',
                    fontWeight: '500',
                  }}
                >
                  {stat.trendIcon}
                  {stat.trend}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Add Row */}
        <div className="dash-search-row" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={16}
              color={searchFocused ? '#1a73e8' : '#b0bdd8'}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                transition: 'color 0.15s',
              }}
            />
            <input
              type="text"
              placeholder="Search patients by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 42px',
                borderRadius: '14px',
                border: searchFocused
                  ? '2px solid #1a73e8'
                  : '2px solid #e8eef8',
                background: searchFocused ? '#fafcff' : '#ffffff',
                fontSize: '14px',
                fontWeight: '500',
                color: '#0d1b3e',
                outline: 'none',
                transition: 'all 0.15s ease',
                boxShadow: '0 2px 8px rgba(26,115,232,0.04)',
              }}
            />
          </div>

          <button
            onClick={() => navigate('/users/new')}
            className="dash-add-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #1a73e8, #1557b0)',
              border: 'none',
              color: 'white',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(26,115,232,0.35)',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(26,115,232,0.45)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,115,232,0.35)'
            }}
          >
            <UserPlus size={17} />
            Add Patient
          </button>
        </div>

        {/* Table */}
        <div className="dash-table-wrap" style={{ borderRadius: '20px', boxShadow: '0 2px 16px rgba(26,115,232,0.06)' }}>
        <div
          className="dash-table-inner"
          style={{
            background: '#ffffff',
            border: '1px solid #e8eef8',
            borderRadius: '20px',
            overflow: 'hidden',
          }}
        >
          {/* Table Header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr',
              padding: '16px 24px',
              background: '#f8fafd',
              borderBottom: '1px solid #e8eef8',
            }}
          >
            {['Patient', 'Goal', 'Status', 'Action'].map((h) => (
              <div
                key={h}
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#b0bdd8',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Loading */}
          {isLoading && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: '3px solid #dbe8ff',
                  borderTopColor: '#1a73e8',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <span style={{ fontSize: '13px', color: '#b0bdd8', fontWeight: '500' }}>
                Loading patients...
              </span>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Empty */}
          {!isLoading && filtered.length === 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '80px 40px',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '20px',
                  background: '#f8fafd',
                  border: '1px solid #e8eef8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Users size={28} color="#d0d8f0" />
              </div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#4a5568' }}>
                {search ? 'No patients found' : 'No patients yet'}
              </div>
              <div style={{ fontSize: '13px', color: '#b0bdd8', fontWeight: '500' }}>
                {search
                  ? 'Try a different search term'
                  : 'Add your first patient to get started'}
              </div>
              {!search && (
                <button
                  onClick={() => navigate('/users/new')}
                  style={{
                    marginTop: '8px',
                    padding: '12px 24px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #1a73e8, #1557b0)',
                    border: 'none',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(26,115,232,0.35)',
                  }}
                >
                  + Add First Patient
                </button>
              )}
            </div>
          )}

          {/* Rows */}
          {!isLoading &&
            filtered.map((user, index) => {
              const status = getStatus(user.status)
              return (
                <div
                  key={user.id}
                  onClick={() => navigate(`/users/${user.id}`)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr',
                    padding: '16px 24px',
                    alignItems: 'center',
                    borderBottom:
                      index < filtered.length - 1
                        ? '1px solid #f0f4ff'
                        : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = '#fafcff')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'transparent')
                  }
                >
                  {/* Patient */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #1a73e8, #0d47a1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        fontWeight: '700',
                        color: 'white',
                        flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(26,115,232,0.25)',
                      }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#0d1b3e',
                        }}
                      >
                        {user.name}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#b0bdd8',
                          fontWeight: '500',
                        }}
                      >
                        {user.userId}
                      </div>
                    </div>
                  </div>

                  {/* Goal */}
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#4a5568',
                    }}
                  >
                    {user.goal || '—'}
                  </div>

                  {/* Status */}
                  <div>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 12px',
                        borderRadius: '40px',
                        background: status.bg,
                        border: `1px solid ${status.border}`,
                        fontSize: '12px',
                        fontWeight: '600',
                        color: status.text,
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: status.dot,
                          flexShrink: 0,
                        }}
                      />
                      {status.label}
                    </span>
                  </div>

                  {/* Action */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/users/${user.id}`)
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '7px 14px',
                      borderRadius: '10px',
                      background: '#eef3ff',
                      border: '1px solid #dbe8ff',
                      color: '#1a73e8',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      width: 'fit-content',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#dbe8ff'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#eef3ff'
                    }}
                  >
                    View →
                  </button>
                </div>
              )
            })}
        </div>
        </div>
      </div>
    </PageWrapper>
  )
}