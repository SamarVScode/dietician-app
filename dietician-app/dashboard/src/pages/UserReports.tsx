import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  doc, getDoc, collection, query as fsQuery,
  where, orderBy, getDocs,
} from 'firebase/firestore'
import { db } from '../services/firebase'
import PageWrapper from '../components/layout/PageWrapper'
import {
  ArrowLeft, Droplets, UtensilsCrossed, CheckCircle, XCircle,
  Calendar, Activity, Clock, ChevronDown, ChevronUp,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface MealLog {
  planId: string; date: string; dayIndex: number
  mealId: string; mealName: string; scheduledTime: string
  completed: boolean; completedAt: string | null
}
interface WaterLog {
  planId: string; date: string; scheduledTime: string
  amountMl: number; completed: boolean; completedAt: string | null
}
interface UserData { id: string; name: string; status: string }
interface DietPlan { id: string; status: string; waterIntakeMl: number }

type FilterMode = 'today' | 'yesterday' | 'all' | 'custom'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toYMD(d: Date) { return d.toISOString().slice(0, 10) }
function todayYMD() { return toYMD(new Date()) }
function yesterdayYMD() { const d = new Date(); d.setDate(d.getDate() - 1); return toYMD(d) }

function formatDate(ymd: string) {
  return new Date(ymd + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function formatTime12h(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const cardS = {
  background: 'white',
  border: '1px solid #e8eef8',
  boxShadow: '0 2px 12px rgba(26,115,232,0.04)',
}

const labelS: React.CSSProperties = {
  fontSize: '10px', fontWeight: 700, color: '#b0bdd8',
  textTransform: 'uppercase', letterSpacing: '0.8px',
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function UserReports() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [filter, setFilter] = useState<FilterMode>('today')
  const [customFrom, setCustomFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7); return toYMD(d)
  })
  const [customTo, setCustomTo] = useState(todayYMD)
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set([todayYMD()]))

  // Compute query date range
  const { fromDate, toDate } = useMemo(() => {
    if (filter === 'today') return { fromDate: todayYMD(), toDate: todayYMD() }
    if (filter === 'yesterday') return { fromDate: yesterdayYMD(), toDate: yesterdayYMD() }
    if (filter === 'custom') return { fromDate: customFrom, toDate: customTo }
    // 'all' — last 90 days
    const d = new Date(); d.setDate(d.getDate() - 90)
    return { fromDate: toYMD(d), toDate: todayYMD() }
  }, [filter, customFrom, customTo])

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: user } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const snap = await getDoc(doc(db, 'users', id!))
      if (!snap.exists()) throw new Error('Not found')
      return { id: snap.id, ...snap.data() } as UserData
    },
    enabled: !!id,
  })

  const { data: activePlan } = useQuery({
    queryKey: ['activePlan', id],
    queryFn: async () => {
      const q = fsQuery(collection(db, 'users', id!, 'dietPlans'), orderBy('assignedAt', 'desc'))
      const snap = await getDocs(q)
      const plans = snap.docs.map(d => ({ id: d.id, ...d.data() })) as DietPlan[]
      return plans.find(p => p.status === 'active') ?? plans[0] ?? null
    },
    enabled: !!id,
  })

  const { data: mealLogs = [], isLoading: mealLoading } = useQuery({
    queryKey: ['mealLogs', id, fromDate, toDate],
    queryFn: async () => {
      const q = fsQuery(
        collection(db, 'users', id!, 'mealLogs'),
        where('date', '>=', fromDate),
        where('date', '<=', toDate),
        orderBy('date', 'asc'),
      )
      return (await getDocs(q)).docs.map(d => d.data()) as MealLog[]
    },
    enabled: !!id,
  })

  const { data: waterLogs = [], isLoading: waterLoading } = useQuery({
    queryKey: ['waterLogs', id, fromDate, toDate],
    queryFn: async () => {
      const q = fsQuery(
        collection(db, 'users', id!, 'waterLogs'),
        where('date', '>=', fromDate),
        where('date', '<=', toDate),
        orderBy('date', 'asc'),
      )
      return (await getDocs(q)).docs.map(d => d.data()) as WaterLog[]
    },
    enabled: !!id,
  })

  const isLoading = mealLoading || waterLoading
  const waterTarget = activePlan?.waterIntakeMl ?? 2000

  // ── Derived data ───────────────────────────────────────────────────────────
  const allDates = useMemo(() => {
    const dates = new Set([...mealLogs.map(l => l.date), ...waterLogs.map(l => l.date)])
    return Array.from(dates).sort((a, b) => b.localeCompare(a)) // newest first
  }, [mealLogs, waterLogs])

  const statsByDate = useMemo(() => allDates.map(date => {
    const meals = mealLogs.filter(l => l.date === date)
    const water = waterLogs.filter(l => l.date === date)
    const mealsCompleted = meals.filter(l => l.completed).length
    const waterConsumed = water.filter(l => l.completed).reduce((s, l) => s + l.amountMl, 0)
    return {
      date, meals, water,
      mealsTotal: meals.length, mealsCompleted,
      mealPct: meals.length > 0 ? Math.round((mealsCompleted / meals.length) * 100) : null,
      waterConsumed,
      waterPct: waterTarget > 0 ? Math.min(100, Math.round((waterConsumed / waterTarget) * 100)) : null,
    }
  }), [allDates, mealLogs, waterLogs, waterTarget])

  const summary = useMemo(() => {
    const completedMeals = mealLogs.filter(l => l.completed).length
    const totalWater = waterLogs.filter(l => l.completed).reduce((s, l) => s + l.amountMl, 0)
    return {
      completedMeals,
      totalMeals: mealLogs.length,
      avgMealPct: mealLogs.length > 0 ? Math.round((completedMeals / mealLogs.length) * 100) : null,
      totalWater,
    }
  }, [mealLogs, waterLogs])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const toggleDate = (date: string) => {
    setExpandedDates(prev => {
      const next = new Set(prev)
      next.has(date) ? next.delete(date) : next.add(date)
      return next
    })
  }

  const mealPctColor = (pct: number | null) =>
    pct === null ? '#b0bdd8' : pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444'

  const FILTERS: { key: FilterMode; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'all', label: 'All (90 days)' },
    { key: 'custom', label: 'Custom' },
  ]

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <PageWrapper title="Daily Reports">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px', margin: '0 auto' }}>

        {/* ── Back + title ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(`/users/${id}`)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '12px', background: 'white', border: '1px solid #e8eef8', color: '#4a5568', fontSize: '13px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0d1b3e', lineHeight: 1.2 }}>
              Daily Reports{user ? ` — ${user.name}` : ''}
            </div>
            <div style={{ fontSize: '13px', color: '#b0bdd8', fontWeight: 500, marginTop: '3px' }}>
              Meal adherence & water intake tracking
            </div>
          </div>
        </div>

        {/* ── Filter pills ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: '8px 18px', borderRadius: '40px', cursor: 'pointer',
                  border: filter === f.key ? '2px solid #1a73e8' : '2px solid #e8eef8',
                  background: filter === f.key ? '#eef3ff' : 'white',
                  color: filter === f.key ? '#1a73e8' : '#4a5568',
                  fontSize: '13px', fontWeight: 700, transition: 'all 0.15s',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filter === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', padding: '14px 16px', borderRadius: '16px', background: 'white', border: '1px solid #e8eef8' }}>
              <Calendar size={14} color="#1a73e8" />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={labelS}>From</span>
                <input
                  type="date" value={customFrom} max={customTo}
                  onChange={e => setCustomFrom(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '10px', border: '2px solid #e8eef8', background: '#f8fafd', fontSize: '13px', fontWeight: 500, color: '#0d1b3e', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={labelS}>To</span>
                <input
                  type="date" value={customTo} min={customFrom} max={todayYMD()}
                  onChange={e => setCustomTo(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '10px', border: '2px solid #e8eef8', background: '#f8fafd', fontSize: '13px', fontWeight: 500, color: '#0d1b3e', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Summary cards ────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px' }}>
          {/* Meal adherence */}
          <div className="rounded-[20px] p-5" style={cardS}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UtensilsCrossed size={18} color="#3b82f6" />
              </div>
              <span style={labelS}>Meal Adherence</span>
            </div>
            {isLoading
              ? <div style={{ height: '36px', borderRadius: '8px', background: '#f0f4ff' }} />
              : <>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: mealPctColor(summary.avgMealPct) }}>
                    {summary.avgMealPct !== null ? `${summary.avgMealPct}%` : '—'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#b0bdd8', fontWeight: 500, marginTop: '4px' }}>
                    {summary.completedMeals}/{summary.totalMeals} meals completed
                  </div>
                </>
            }
          </div>

          {/* Water consumed */}
          <div className="rounded-[20px] p-5" style={cardS}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Droplets size={18} color="#10b981" />
              </div>
              <span style={labelS}>Total Water</span>
            </div>
            {isLoading
              ? <div style={{ height: '36px', borderRadius: '8px', background: '#f0f4ff' }} />
              : <>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: '#10b981' }}>
                    {summary.totalWater >= 1000
                      ? `${(summary.totalWater / 1000).toFixed(1)}L`
                      : `${summary.totalWater}ml`}
                  </div>
                  <div style={{ fontSize: '12px', color: '#b0bdd8', fontWeight: 500, marginTop: '4px' }}>
                    {activePlan ? `Target: ${(waterTarget / 1000).toFixed(1)}L/day` : 'consumed in period'}
                  </div>
                </>
            }
          </div>

          {/* Days tracked */}
          <div className="rounded-[20px] p-5" style={cardS}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#fdf4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={18} color="#a855f7" />
              </div>
              <span style={labelS}>Days Tracked</span>
            </div>
            {isLoading
              ? <div style={{ height: '36px', borderRadius: '8px', background: '#f0f4ff' }} />
              : <>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: '#a855f7' }}>{allDates.length}</div>
                  <div style={{ fontSize: '12px', color: '#b0bdd8', fontWeight: 500, marginTop: '4px' }}>days with logged activity</div>
                </>
            }
          </div>
        </div>

        {/* ── Daily breakdown ──────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="rounded-[20px] p-6" style={cardS}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: '64px', borderRadius: '14px', background: '#f0f4ff', marginBottom: '12px' }} />
            ))}
          </div>
        ) : allDates.length === 0 ? (
          <div className="rounded-[20px] p-10" style={{ ...cardS, textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#f8fafd', border: '1px solid #e8eef8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Activity size={28} color="#d0d8f0" />
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#4a5568', marginBottom: '8px' }}>No data for this period</div>
            <div style={{ fontSize: '13px', color: '#b0bdd8', fontWeight: 500 }}>
              Patient hasn't logged any meals or water intake yet.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {statsByDate.map(day => {
              const isExpanded = expandedDates.has(day.date)
              const pctColor = mealPctColor(day.mealPct)
              const isToday = day.date === todayYMD()
              const isYesterday = day.date === yesterdayYMD()
              const dateLabel = isToday ? 'Today' : isYesterday ? 'Yesterday' : ''

              return (
                <div key={day.date} className="rounded-[20px]" style={cardS}>
                  {/* Date row header */}
                  <div
                    onClick={() => toggleDate(day.date)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', cursor: 'pointer', gap: '12px' }}
                  >
                    {/* Left: date info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '13px', background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Calendar size={17} color="#1a73e8" />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#0d1b3e' }}>
                          {dateLabel && <span style={{ color: '#1a73e8', marginRight: '6px' }}>{dateLabel}</span>}
                          {formatDate(day.date)}
                        </div>
                        <div style={{ fontSize: '11px', color: '#b0bdd8', fontWeight: 500, marginTop: '2px' }}>
                          {day.mealsTotal} meal{day.mealsTotal !== 1 ? 's' : ''} · {day.water.length} water slot{day.water.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>

                    {/* Right: quick stats + chevron */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                      {/* Meal % pill */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ ...labelS, marginBottom: '2px' }}>Meals</div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: pctColor }}>
                          {day.mealPct !== null ? `${day.mealPct}%` : '—'}
                        </div>
                      </div>
                      {/* Water pill */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ ...labelS, marginBottom: '2px' }}>Water</div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#10b981' }}>
                          {day.waterConsumed >= 1000
                            ? `${(day.waterConsumed / 1000).toFixed(1)}L`
                            : `${day.waterConsumed}ml`}
                        </div>
                      </div>
                      {isExpanded
                        ? <ChevronUp size={16} color="#b0bdd8" />
                        : <ChevronDown size={16} color="#b0bdd8" />
                      }
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid #f0f4ff', padding: '20px', display: 'flex', flexDirection: 'column', gap: '22px' }}>

                      {/* Meal logs */}
                      {day.meals.length > 0 && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <UtensilsCrossed size={13} color="#3b82f6" />
                            <span style={{ ...labelS, color: '#0d1b3e' }}>Meal Log</span>
                            <span style={{ fontSize: '11px', color: '#b0bdd8', fontWeight: 500 }}>
                              {day.mealsCompleted}/{day.mealsTotal} completed
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {day.meals.map((meal, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '12px 16px', borderRadius: '14px', gap: '10px',
                                  background: meal.completed ? '#f0fdf4' : '#fff8f8',
                                  border: `1px solid ${meal.completed ? '#bbf7d0' : '#fecaca'}`,
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                  {meal.completed
                                    ? <CheckCircle size={16} color="#22c55e" style={{ flexShrink: 0 }} />
                                    : <XCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                                  }
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0d1b3e' }}>{meal.mealName}</div>
                                    <div style={{ fontSize: '11px', color: '#b0bdd8', fontWeight: 500, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <Clock size={10} />
                                      Scheduled {formatTime12h(meal.scheduledTime)}
                                    </div>
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                  {meal.completed && meal.completedAt ? (
                                    <div style={{ fontSize: '11px', color: '#22c55e', fontWeight: 600 }}>
                                      ✓ Done at {new Date(meal.completedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  ) : (
                                    <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>Missed</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Water logs */}
                      {day.water.length > 0 && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                            <Droplets size={13} color="#10b981" />
                            <span style={{ ...labelS, color: '#0d1b3e' }}>Water Log</span>
                            <span style={{ fontSize: '11px', color: '#b0bdd8', fontWeight: 500 }}>
                              {day.waterConsumed}ml / {waterTarget}ml target
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div style={{ height: '6px', borderRadius: '99px', background: '#ecfdf5', marginBottom: '12px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', borderRadius: '99px',
                              background: 'linear-gradient(90deg,#10b981,#34d399)',
                              width: `${day.waterPct ?? 0}%`,
                              transition: 'width 0.4s ease',
                            }} />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: '8px' }}>
                            {day.water.map((slot, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '8px',
                                  padding: '10px 12px', borderRadius: '12px',
                                  background: slot.completed ? '#f0fdf4' : '#f8fafd',
                                  border: `1px solid ${slot.completed ? '#bbf7d0' : '#e8eef8'}`,
                                }}
                              >
                                <Droplets size={13} color={slot.completed ? '#10b981' : '#d0d8f0'} />
                                <div>
                                  <div style={{ fontSize: '12px', fontWeight: 700, color: slot.completed ? '#0d1b3e' : '#b0bdd8' }}>
                                    {slot.amountMl}ml
                                  </div>
                                  <div style={{ fontSize: '10px', color: '#b0bdd8', fontWeight: 500 }}>
                                    {formatTime12h(slot.scheduledTime)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
