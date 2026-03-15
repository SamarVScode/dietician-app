import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  doc, getDoc, collection, addDoc,
  updateDoc, getDocs, orderBy, query,
} from 'firebase/firestore'
import { db } from '../services/firebase'
import PageWrapper from '../components/layout/PageWrapper'
import {
  ArrowLeft, Check, ChevronDown, ChevronUp,
  AlertTriangle, Utensils, BookOpen, Clock, Flame, Plus,
} from 'lucide-react'

interface UserData {
  id: string
  name: string
  goal: string
  preference: string
  allergies: string[]
  conditions: string[]
  bmi: number
  bmiCategory: string
  userId: string
  status: string
}

interface FoodItem { name: string }

interface Meal {
  id: string
  name: string
  time: string
  items: FoodItem[]
  calories: number
  protein: number
  carbs: number
  fats: number
  notes: string
}

interface DayOverride {
  dayIndex: number
  meals: Meal[]
}

interface Template {
  id: string
  name: string
  description: string
  targetGoal: string
  baseMeals: Meal[]
  dayOverrides: DayOverride[]
  createdAt: string
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const goalColors: Record<string, { bg: string; color: string; border: string }> = {
  'Weight Loss': { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  'Muscle Gain': { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  'Maintain Weight': { bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd' },
  'General Health': { bg: '#f0fdfa', color: '#0d9488', border: '#99f6e4' },
}

export default function AssignDietPlan() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)
  const [expandedDay, setExpandedDay] = useState<number | null>(null)
  const [isAssigning, setIsAssigning] = useState(false)
  const [assigned, setAssigned] = useState(false)

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const snap = await getDoc(doc(db, 'users', id!))
      return { id: snap.id, ...snap.data() } as UserData
    },
  })

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const q = query(collection(db, 'templates'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Template[]
    },
  })

  const selectedPlan = templates.find((t) => t.id === selectedTemplate)

  const allergenWarnings = selectedPlan && user
    ? selectedPlan.baseMeals
        .flatMap((m) => m.items)
        .filter((item) =>
          user.allergies.some((a) =>
            item.name.toLowerCase().includes(a.toLowerCase())
          )
        )
    : []

  const buildDays = (template: Template) =>
    DAYS.map((dayName, idx) => {
      const override = template.dayOverrides.find((o) => o.dayIndex === idx)
      return {
        day: idx + 1,
        dayName,
        meals: override ? override.meals : template.baseMeals,
        isOverride: !!override,
      }
    })

  const handleAssign = async () => {
    if (!selectedPlan || !user) return
    setIsAssigning(true)
    try {
      const days = buildDays(selectedPlan)

      // ✅ Fixed: correct collection name + status field
      await addDoc(collection(db, 'users', id!, 'dietPlans'), {
        templateId: selectedPlan.id,
        templateName: selectedPlan.name,
        days,
        assignedAt: new Date().toISOString(),
        assignedBy: 'admin',
        status: 'active',
      })

      await updateDoc(doc(db, 'users', id!), {
        status: 'active',
        updatedAt: new Date().toISOString(),
      })

      setAssigned(true)
    } catch (e) {
      console.error(e)
    } finally {
      setIsAssigning(false)
    }
  }

  const isLoading = userLoading || templatesLoading

  if (isLoading) {
    return (
      <PageWrapper title="Assign Diet Plan">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', flexDirection: 'column', gap: '16px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #dbe8ff', borderTopColor: '#1a73e8', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: '13px', color: '#b0bdd8', fontWeight: '500' }}>Loading...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </PageWrapper>
    )
  }

  if (assigned) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,62,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div style={{ background: 'white', borderRadius: '28px', padding: '48px 40px', width: '420px', textAlign: 'center', boxShadow: '0 24px 80px rgba(13,27,62,0.2)' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '28px', background: 'linear-gradient(135deg, #1a73e8, #0d47a1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(26,115,232,0.35)' }}>
            <Check size={40} color="white" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#0d1b3e', marginBottom: '8px' }}>Plan Assigned!</div>
          <div style={{ fontSize: '14px', color: '#8a9bc4', fontWeight: '500', marginBottom: '8px' }}>
            <strong style={{ color: '#1a73e8' }}>{selectedPlan?.name}</strong> has been assigned to {user?.name}
          </div>
          <div style={{ fontSize: '13px', color: '#b0bdd8', marginBottom: '32px' }}>Patient will be notified on their app</div>
          <button
            onClick={() => navigate(`/users/${id}`)}
            style={{ width: '100%', padding: '14px', borderRadius: '14px', background: 'linear-gradient(135deg, #1a73e8, #1557b0)', border: 'none', color: 'white', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(26,115,232,0.35)' }}
          >
            Back to Patient Profile
          </button>
        </div>
      </div>
    )
  }

  return (
    <PageWrapper title="Assign Diet Plan">
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <button
          onClick={() => navigate(`/users/${id}`)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#8a9bc4', fontWeight: '600', fontSize: '13px', cursor: 'pointer', width: 'fit-content' }}
        >
          <ArrowLeft size={15} /> Back to Profile
        </button>

        {user && (
          <div style={{ background: 'white', borderRadius: '20px', padding: '20px 24px', border: '1px solid #e8eef8', boxShadow: '0 2px 12px rgba(26,115,232,0.04)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg, #1a73e8, #0d47a1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '800', color: 'white', flexShrink: 0 }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#0d1b3e', marginBottom: '4px' }}>{user.name}</div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' as const }}>
                {[
                  { label: 'Goal', value: user.goal },
                  { label: 'Preference', value: user.preference },
                  { label: 'BMI', value: `${user.bmi} (${user.bmiCategory})` },
                  { label: 'Conditions', value: user.conditions.join(', ') || 'None' },
                ].map((item) => (
                  <div key={item.label} style={{ fontSize: '12px', color: '#8a9bc4' }}>
                    <span style={{ fontWeight: '600' }}>{item.label}:</span>{' '}
                    <span style={{ color: '#4a5568', fontWeight: '600' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            {user.allergies.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '12px', background: '#fff5f5', border: '1px solid #fed7d7', flexShrink: 0 }}>
                <AlertTriangle size={14} color="#e53e3e" />
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#c53030' }}>
                  Allergies: {user.allergies.join(', ')}
                </span>
              </div>
            )}
          </div>
        )}

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#0d1b3e' }}>Choose a Template</div>
            <button
              onClick={() => navigate('/templates')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', background: '#eef3ff', border: '1px solid #dbe8ff', color: '#1a73e8', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
            >
              <Plus size={13} /> Create New Template
            </button>
          </div>
          <div style={{ fontSize: '13px', color: '#8a9bc4', fontWeight: '500', marginBottom: '16px' }}>
            Select a saved template to assign to this patient
          </div>

          {templates.length === 0 && (
            <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8eef8', padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#4a5568', marginBottom: '8px' }}>No templates yet</div>
              <div style={{ fontSize: '13px', color: '#b0bdd8', fontWeight: '500', marginBottom: '20px' }}>
                Create diet templates first before assigning them to patients
              </div>
              <button
                onClick={() => navigate('/templates')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '14px', background: 'linear-gradient(135deg, #1a73e8, #1557b0)', border: 'none', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(26,115,232,0.3)' }}
              >
                <BookOpen size={16} /> Go to Templates
              </button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {templates.map((template) => {
              const isSelected = selectedTemplate === template.id
              const isExpanded = expandedTemplate === template.id
              const isRecommended = user && template.targetGoal === user.goal
              const gc = goalColors[template.targetGoal] ?? goalColors['General Health']
              const totalCals = template.baseMeals.reduce((s, m) => s + (m.calories || 0), 0)
              const days = buildDays(template)

              return (
                <div
                  key={template.id}
                  style={{ background: 'white', borderRadius: '18px', border: isSelected ? '2px solid #1a73e8' : '1px solid #e8eef8', overflow: 'hidden', boxShadow: isSelected ? '0 4px 20px rgba(26,115,232,0.12)' : '0 2px 8px rgba(26,115,232,0.04)', transition: 'all 0.15s', position: 'relative' as const }}
                >
                  {isRecommended && (
                    <div style={{ position: 'absolute', top: '-1px', right: '16px', padding: '3px 10px', borderRadius: '0 0 10px 10px', background: 'linear-gradient(135deg, #1a73e8, #0d47a1)', color: 'white', fontSize: '10px', fontWeight: '700' }}>
                      ✨ RECOMMENDED
                    </div>
                  )}

                  <div
                    onClick={() => setSelectedTemplate(isSelected ? null : template.id)}
                    style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
                  >
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: isSelected ? '2px solid #1a73e8' : '2px solid #e8eef8', background: isSelected ? '#1a73e8' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                      {isSelected && <Check size={12} color="white" />}
                    </div>

                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: gc.bg, border: `1px solid ${gc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <BookOpen size={19} color={gc.color} />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#0d1b3e', marginBottom: '4px' }}>{template.name}</div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const, alignItems: 'center' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '40px', background: gc.bg, border: `1px solid ${gc.border}`, fontSize: '11px', fontWeight: '700', color: gc.color }}>
                          {template.targetGoal}
                        </span>
                        <span style={{ fontSize: '12px', color: '#8a9bc4', fontWeight: '500' }}>
                          {template.baseMeals.length} meals/day
                        </span>
                        {totalCals > 0 && (
                          <span style={{ fontSize: '12px', color: '#8a9bc4', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Flame size={11} /> {totalCals} kcal/day
                          </span>
                        )}
                        {template.dayOverrides.length > 0 && (
                          <span style={{ fontSize: '11px', color: '#b45309', fontWeight: '600', background: '#fffbeb', padding: '2px 8px', borderRadius: '40px', border: '1px solid #fde68a' }}>
                            {template.dayOverrides.length} day override{template.dayOverrides.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); setExpandedTemplate(isExpanded ? null : template.id); setExpandedDay(null) }}
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '10px', background: '#f8fafd', border: '1px solid #e8eef8', color: '#4a5568', fontSize: '12px', fontWeight: '600', cursor: 'pointer', flexShrink: 0 }}
                    >
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      {isExpanded ? 'Hide' : 'Preview'}
                    </button>
                  </div>

                  {template.description && (
                    <div style={{ padding: '0 20px 14px 76px', fontSize: '13px', color: '#8a9bc4', fontWeight: '500', lineHeight: 1.5 }}>
                      {template.description}
                    </div>
                  )}

                  {isSelected && allergenWarnings.length > 0 && (
                    <div style={{ margin: '0 20px 14px', padding: '10px 14px', borderRadius: '12px', background: '#fff5f5', border: '1px solid #fed7d7', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={15} color="#e53e3e" />
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#c53030' }}>
                        ⚠️ This plan may contain allergens: {user?.allergies.join(', ')}
                      </span>
                    </div>
                  )}

                  {isExpanded && (
                    <div style={{ borderTop: '1px solid #f0f4ff', background: '#fafcff' }}>
                      <div style={{ padding: '14px 20px', display: 'flex', gap: '6px', overflowX: 'auto' as const }}>
                        {days.map((day) => (
                          <button
                            key={day.day}
                            onClick={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
                            style={{ flexShrink: 0, padding: '7px 14px', borderRadius: '40px', border: expandedDay === day.day ? '2px solid #1a73e8' : '1.5px solid #e8eef8', background: expandedDay === day.day ? '#eef3ff' : 'white', color: expandedDay === day.day ? '#1a73e8' : '#4a5568', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                          >
                            {day.dayName.slice(0, 3)}
                            {day.isOverride && (
                              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#f59e0b' }} />
                            )}
                          </button>
                        ))}
                      </div>

                      {expandedDay !== null && (
                        <div style={{ padding: '0 20px 20px' }}>
                          {(() => {
                            const day = days.find((d) => d.day === expandedDay)
                            if (!day) return null
                            return (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                                {day.meals.map((meal, idx) => (
                                  <div key={meal.id ?? idx} style={{ background: 'white', borderRadius: '14px', padding: '14px', border: '1px solid #e8eef8' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#0d1b3e' }}>{meal.name || `Meal ${idx + 1}`}</div>
                                      <span style={{ fontSize: '11px', color: '#8a9bc4', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                        <Clock size={10} /> {meal.time}
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '10px' }}>
                                      {meal.items.filter((i) => i.name).map((item, i) => (
                                        <div key={i} style={{ fontSize: '12px', color: '#4a5568', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#1a73e8', flexShrink: 0 }} />
                                          {item.name}
                                        </div>
                                      ))}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px' }}>
                                      {[
                                        { label: 'Cal', value: meal.calories, unit: 'kcal', color: '#c2410c' },
                                        { label: 'Pro', value: meal.protein, unit: 'g', color: '#1d4ed8' },
                                        { label: 'Carb', value: meal.carbs, unit: 'g', color: '#15803d' },
                                        { label: 'Fat', value: meal.fats, unit: 'g', color: '#7c3aed' },
                                      ].map((m) => (
                                        <div key={m.label} style={{ textAlign: 'center', padding: '4px', borderRadius: '6px', background: '#f8fafd' }}>
                                          <div style={{ fontSize: '10px', fontWeight: '700', color: m.color }}>{m.label}</div>
                                          <div style={{ fontSize: '12px', fontWeight: '800', color: '#0d1b3e' }}>{m.value || '—'}</div>
                                          <div style={{ fontSize: '9px', color: '#b0bdd8' }}>{m.unit}</div>
                                        </div>
                                      ))}
                                    </div>
                                    {meal.notes && (
                                      <div style={{ marginTop: '8px', fontSize: '11px', color: '#8a9bc4', fontStyle: 'italic', lineHeight: 1.4 }}>
                                        📝 {meal.notes}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Action Bar */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '20px 28px', border: '1px solid #e8eef8', boxShadow: '0 2px 12px rgba(26,115,232,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            {selectedPlan ? (
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#0d1b3e' }}>
                Selected: <span style={{ color: '#1a73e8' }}>{selectedPlan.name}</span>
              </div>
            ) : (
              <div style={{ fontSize: '14px', color: '#b0bdd8', fontWeight: '500' }}>No template selected</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => navigate(`/users/${id}`)}
              style={{ padding: '12px 22px', borderRadius: '14px', background: '#f8fafd', border: '2px solid #e8eef8', color: '#4a5568', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f4ff'; e.currentTarget.style.borderColor = '#dbe8ff' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafd'; e.currentTarget.style.borderColor = '#e8eef8' }}
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={!selectedTemplate || isAssigning}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', borderRadius: '14px', background: !selectedTemplate ? '#e8eef8' : 'linear-gradient(135deg, #1a73e8, #1557b0)', border: 'none', color: !selectedTemplate ? '#b0bdd8' : 'white', fontSize: '14px', fontWeight: '700', cursor: !selectedTemplate ? 'not-allowed' : 'pointer', boxShadow: !selectedTemplate ? 'none' : '0 4px 16px rgba(26,115,232,0.35)', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { if (selectedTemplate && !isAssigning) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(26,115,232,0.45)' } }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = !selectedTemplate ? 'none' : '0 4px 16px rgba(26,115,232,0.35)' }}
            >
              {isAssigning ? (
                <><div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} /> Assigning...</>
              ) : (
                <><Utensils size={16} /> Assign Plan</>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </PageWrapper>
  )
}