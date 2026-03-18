import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../services/firebase'
import PageWrapper from '../components/layout/PageWrapper'
import { Users, TrendingUp, Activity, Clock, AlertTriangle, UserPlus, ArrowRight } from 'lucide-react'

interface User {
  id: string
  name: string
  goal: string
  userId: string
  status: string
  createdAt: string
}

interface AssignedPlan {
  id: string
  templateName: string
  days: { day: number; dayName: string; meals: unknown[] }[]
  assignedAt: string
  status: string
}

interface ExpiringPlan {
  userId: string
  userName: string
  planName: string
  assignedAt: string
  totalDays: number
  daysLeft: number
  goal: string
}

function getDaysLeft(assignedAt: string, totalDays: number): number {
  const start = new Date(assignedAt)
  const end = new Date(start)
  end.setDate(end.getDate() + totalDays)
  const now = new Date()
  const diff = end.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function Dashboard() {
  const navigate = useNavigate()

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as User[]
    },
  })

  const { data: expiringPlans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['expiring-plans', users],
    enabled: users.length > 0,
    queryFn: async () => {
      const expiring: ExpiringPlan[] = []
      const activeUsers = users.filter((u) => u.status === 'active')

      for (const user of activeUsers) {
        const plansSnap = await getDocs(collection(db, 'users', user.id, 'dietPlans'))
        for (const planDoc of plansSnap.docs) {
          const plan = planDoc.data() as AssignedPlan
          if (plan.status !== 'active') continue
          const totalDays = plan.days?.length ?? 7
          const daysLeft = getDaysLeft(plan.assignedAt, totalDays)
          if (daysLeft <= 2 && daysLeft >= -1) {
            expiring.push({
              userId: user.id,
              userName: user.name,
              planName: plan.templateName,
              assignedAt: plan.assignedAt,
              totalDays,
              daysLeft,
              goal: user.goal,
            })
          }
        }
      }

      return expiring.sort((a, b) => a.daysLeft - b.daysLeft)
    },
  })

  const isLoading = usersLoading || plansLoading
  const totalUsers = users.length
  const activePlans = users.filter((u) => u.status === 'active').length
  const noPlan = users.filter((u) => u.status === 'no-plan').length
  const recentUsers = users.slice(0, 5)

  const stats = [
    {
      label: 'Total Patients',
      value: totalUsers,
      icon: <Users size={20} color="#1a73e8" />,
      iconBg: '#eef3ff',
      trend: 'All registered patients',
      trendIcon: <TrendingUp size={12} color="#1a73e8" />,
      border: '#dbe8ff',
    },
    {
      label: 'Active Diet Plans',
      value: activePlans,
      icon: <Activity size={20} color="#0d9488" />,
      iconBg: '#f0fdfa',
      trend: 'Currently following a plan',
      trendIcon: <TrendingUp size={12} color="#0d9488" />,
      border: '#99f6e4',
    },
    {
      label: 'Awaiting Plan',
      value: noPlan,
      icon: <Clock size={20} color="#d97706" />,
      iconBg: '#fffbeb',
      trend: 'Need plan assignment',
      trendIcon: <TrendingUp size={12} color="#d97706" />,
      border: '#fde68a',
    },
    {
      label: 'Expiring Soon',
      value: expiringPlans.length,
      icon: <AlertTriangle size={20} color="#e53e3e" />,
      iconBg: '#fff5f5',
      trend: 'Plans ending in 1-2 days',
      trendIcon: <AlertTriangle size={12} color="#e53e3e" />,
      border: '#fed7d7',
    },
  ]

  return (
    <PageWrapper title="Dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-row items-center gap-3 rounded-[14px] p-3 sm:block sm:p-[18px] sm:rounded-[20px] lg:p-6"
              style={{
                background: '#ffffff',
                border: `1px solid ${stat.border}`,
                boxShadow: '0 2px 12px rgba(26,115,232,0.06)',
              }}
            >
              <div className="mb-0 shrink-0 sm:flex sm:items-center sm:justify-between sm:mb-4">
                <div
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 sm:w-11 sm:h-11 sm:rounded-[14px]"
                  style={{ background: stat.iconBg }}
                >
                  {stat.icon}
                </div>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div
                  className="text-xl font-extrabold leading-none mb-[1px] sm:text-[26px] lg:text-[32px] sm:mb-1.5"
                  style={{ color: '#0d1b3e', letterSpacing: '-1px' }}
                >
                  {stat.value}
                </div>
                <div className="text-[11px] font-semibold mb-0 sm:text-[13px] sm:mb-2" style={{ color: '#4a5568' }}>
                  {stat.label}
                </div>
                <div className="hidden sm:flex items-center gap-1" style={{ fontSize: '11px', color: '#8a9bc4', fontWeight: '500' }}>
                  {stat.trendIcon}
                  {stat.trend}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Expiring Plans — only shown when there are expiring plans */}
        {!isLoading && expiringPlans.length > 0 && (
          <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e8eef8', boxShadow: '0 2px 12px rgba(26,115,232,0.06)', overflow: 'hidden' }}>
            <div className="p-4 sm:p-6" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f4ff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fff5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={17} color="#e53e3e" />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#0d1b3e' }}>Expiring Plans</div>
                  <div style={{ fontSize: '12px', color: '#8a9bc4', fontWeight: '500' }}>Plans ending within 2 days</div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {expiringPlans.map((plan) => (
                  <div
                    key={plan.userId}
                    onClick={() => navigate(`/users/${plan.userId}`)}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                    style={{
                      padding: '14px 16px',
                      borderRadius: '14px',
                      background: plan.daysLeft <= 0 ? '#fff5f5' : '#fffbeb',
                      border: `1px solid ${plan.daysLeft <= 0 ? '#fed7d7' : '#fde68a'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #1a73e8, #0d47a1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '14px', fontWeight: '700', color: 'white', flexShrink: 0,
                      }}>
                        {plan.userName.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#0d1b3e' }} className="truncate">{plan.userName}</div>
                        <div style={{ fontSize: '12px', color: '#8a9bc4', fontWeight: '500' }} className="truncate">{plan.planName}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <span style={{
                        padding: '4px 10px', borderRadius: '40px', fontSize: '12px', fontWeight: '700',
                        background: plan.daysLeft <= 0 ? '#fff5f5' : '#fffbeb',
                        border: `1px solid ${plan.daysLeft <= 0 ? '#fed7d7' : '#fde68a'}`,
                        color: plan.daysLeft <= 0 ? '#c53030' : '#b45309',
                      }}>
                        {plan.daysLeft <= 0 ? 'Expired' : plan.daysLeft === 1 ? 'Expires tomorrow' : `${plan.daysLeft} days left`}
                      </span>
                      <ArrowRight size={14} color="#8a9bc4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Patients */}
        <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e8eef8', boxShadow: '0 2px 12px rgba(26,115,232,0.06)', overflow: 'hidden' }}>
          <div className="p-4 sm:p-6" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f4ff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eef3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={17} color="#1a73e8" />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#0d1b3e' }}>Recent Patients</div>
                <div style={{ fontSize: '12px', color: '#8a9bc4', fontWeight: '500' }}>Latest added patients</div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {isLoading ? (
              <div className="p-5 sm:p-10" style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '3px solid #dbe8ff', borderTopColor: '#1a73e8', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : recentUsers.length === 0 ? (
              <div className="px-5 py-8 sm:py-12" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#4a5568', marginBottom: '4px' }}>No patients yet</div>
                <div style={{ fontSize: '13px', color: '#b0bdd8', fontWeight: '500', marginBottom: '16px' }}>Add your first patient to get started</div>
                <button
                  onClick={() => navigate('/users/new')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '14px', background: 'linear-gradient(135deg, #1a73e8, #1557b0)', border: 'none', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(26,115,232,0.35)' }}
                >
                  <UserPlus size={16} /> Add Patient
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentUsers.map((user) => {
                  const statusMap: Record<string, { label: string; bg: string; color: string; border: string; dot: string }> = {
                    active: { label: 'Active', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', dot: '#22c55e' },
                    'no-plan': { label: 'No Plan', bg: '#fffbeb', color: '#b45309', border: '#fde68a', dot: '#f59e0b' },
                    inactive: { label: 'Inactive', bg: '#fff5f5', color: '#c53030', border: '#fed7d7', dot: '#fc8181' },
                  }
                  const s = statusMap[user.status] ?? statusMap['no-plan']
                  return (
                    <div
                      key={user.id}
                      onClick={() => navigate(`/users/${user.id}`)}
                      className="flex items-center justify-between"
                      style={{ padding: '12px 14px', borderRadius: '12px', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#fafcff')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        <div style={{
                          width: '38px', height: '38px', borderRadius: '12px',
                          background: 'linear-gradient(135deg, #1a73e8, #0d47a1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '14px', fontWeight: '700', color: 'white', flexShrink: 0,
                          boxShadow: '0 2px 8px rgba(26,115,232,0.25)',
                        }}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#0d1b3e' }} className="truncate">{user.name}</div>
                          <div style={{ fontSize: '12px', color: '#b0bdd8', fontWeight: '500' }}>{user.goal || '—'}</div>
                        </div>
                      </div>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '4px 10px', borderRadius: '40px',
                        background: s.bg, border: `1px solid ${s.border}`,
                        fontSize: '11px', fontWeight: '600', color: s.color, flexShrink: 0,
                      }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: s.dot }} />
                        {s.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </PageWrapper>
  )
}
