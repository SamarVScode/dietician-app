import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, query } from 'firebase/firestore'
import { db } from '../services/firebase'
import { fetchFoodMacros } from '../services/aiService'
import PageWrapper from '../components/layout/PageWrapper'
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, BookOpen, Clock, Flame } from 'lucide-react'
import type { TemplateFormData, DayPlan, FoodItem } from '../components/dietplan/mealUtils'
import { emptyTemplateForm, formatTime12h } from '../components/dietplan/mealUtils'
import { TemplateForm } from '../components/dietplan/TemplateForm'
import type { Meal } from '../components/dietplan/mealUtils'

interface Template extends TemplateFormData {
  id: string
  createdAt: string
  updatedAt: string
}

const goalColors: Record<string, { bg: string; color: string; border: string }> = {
  'Weight Loss':     { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  'Muscle Gain':     { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  'Maintain Weight': { bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd' },
  'General Health':  { bg: '#f0fdfa', color: '#0d9488', border: '#99f6e4' },
}

const DURATION_OPTIONS = [
  { value: 7, label: 'Weekly', subtitle: '7-day plan', icon: '7', color: '#1a73e8', bg: '#eef3ff', border: '#dbe8ff' },
  { value: 15, label: '15 Days', subtitle: '15-day plan', icon: '15', color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' },
  { value: 30, label: 'Monthly', subtitle: '30-day plan', icon: '30', color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd' },
]

async function enrichWithMacros(data: TemplateFormData): Promise<TemplateFormData> {
  const enriched = { ...data, days: [...data.days] }
  for (let di = 0; di < enriched.days.length; di++) {
    const day = { ...enriched.days[di], meals: [...enriched.days[di].meals] }
    for (let mi = 0; mi < day.meals.length; mi++) {
      const meal = { ...day.meals[mi], items: [...day.meals[mi].items] }
      let mealCals = 0, mealPro = 0, mealCarbs = 0, mealFats = 0
      for (let fi = 0; fi < meal.items.length; fi++) {
        const item = meal.items[fi]
        if (item.name.trim() && item.calories == null) {
          const macros = await fetchFoodMacros(item.name)
          if (macros) {
            meal.items[fi] = { ...item, ...macros }
            mealCals += macros.calories
            mealPro += macros.protein
            mealCarbs += macros.carbs
            mealFats += macros.fats
          }
        } else {
          mealCals += item.calories ?? 0
          mealPro += item.protein ?? 0
          mealCarbs += item.carbs ?? 0
          mealFats += item.fats ?? 0
        }
      }
      meal.calories = mealCals
      meal.protein = mealPro
      meal.carbs = mealCarbs
      meal.fats = mealFats
      day.meals[mi] = meal
    }
    enriched.days[di] = day
  }
  return enriched
}

export default function Templates() {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<'list' | 'pick-duration' | 'create' | 'edit'>('list')
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)
  const [previewDay, setPreviewDay] = useState<Record<string, number>>({})
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [fetchingMacros, setFetchingMacros] = useState(false)

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const q = query(collection(db, 'templates'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Template[]
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      setFetchingMacros(true)
      const enriched = await enrichWithMacros(data)
      setFetchingMacros(false)
      await addDoc(collection(db, 'templates'), { ...enriched, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['templates'] }); setMode('list') },
    onError: () => setFetchingMacros(false),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TemplateFormData }) => {
      setFetchingMacros(true)
      const enriched = await enrichWithMacros(data)
      setFetchingMacros(false)
      await updateDoc(doc(db, 'templates', id), { ...enriched, updatedAt: new Date().toISOString() })
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['templates'] }); setMode('list'); setEditingTemplate(null) },
    onError: () => setFetchingMacros(false),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await deleteDoc(doc(db, 'templates', id)) },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['templates'] }); setDeleteConfirm(null) },
  })

  const handleSave = (data: TemplateFormData) => {
    if (mode === 'edit' && editingTemplate) updateMutation.mutate({ id: editingTemplate.id, data })
    else createMutation.mutate(data)
  }

  const isSaving = createMutation.isPending || updateMutation.isPending || fetchingMacros

  // Duration picker screen
  if (mode === 'pick-duration') {
    return (
      <PageWrapper title="Choose Plan Duration">
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="text-[15px] sm:text-lg" style={{ fontWeight: '800', color: '#0d1b3e', marginBottom: '6px' }}>Select Plan Duration</div>
            <div className="text-[11px] sm:text-[13px]" style={{ color: '#8a9bc4', fontWeight: '500' }}>Choose how long this diet plan will be</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedDuration(opt.value)}
                className="gap-3 p-3.5 sm:gap-4 sm:p-5 sm:px-6 rounded-[14px] sm:rounded-[18px]"
                style={{
                  display: 'flex', alignItems: 'center',
                  background: 'white',
                  border: selectedDuration === opt.value ? `2px solid ${opt.color}` : '1.5px solid #e8eef8',
                  boxShadow: selectedDuration === opt.value ? `0 4px 20px ${opt.color}20` : '0 2px 8px rgba(26,115,232,0.04)',
                  cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                }}
              >
                <div className="w-10 h-10 rounded-[12px] sm:w-[52px] sm:h-[52px] sm:rounded-[16px] text-sm sm:text-lg"
                  style={{ background: opt.bg, border: `1px solid ${opt.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: opt.color, flexShrink: 0 }}>
                  {opt.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="text-[13px] sm:text-base" style={{ fontWeight: '700', color: '#0d1b3e', marginBottom: '2px' }}>{opt.label}</div>
                  <div className="text-[11px] sm:text-[13px]" style={{ color: '#8a9bc4', fontWeight: '500' }}>{opt.subtitle}</div>
                </div>
                <div className="w-5 h-5 sm:w-[22px] sm:h-[22px]" style={{ borderRadius: '50%', border: selectedDuration === opt.value ? `2px solid ${opt.color}` : '2px solid #e8eef8', background: selectedDuration === opt.value ? opt.color : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {selectedDuration === opt.value && (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />
                  )}
                </div>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => { setMode('list'); setSelectedDuration(null) }}
              className="text-[12px] sm:text-sm"
              style={{ flex: 1, padding: '13px', borderRadius: '14px', background: '#f8fafd', border: '2px solid #e8eef8', color: '#4a5568', fontWeight: '700', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={() => { if (selectedDuration) setMode('create') }}
              disabled={!selectedDuration}
              className="text-[12px] sm:text-sm"
              style={{
                flex: 1, padding: '13px', borderRadius: '14px',
                background: !selectedDuration ? '#e8eef8' : 'linear-gradient(135deg, #1a73e8, #1557b0)',
                border: 'none', color: !selectedDuration ? '#b0bdd8' : 'white',
                fontWeight: '700',
                cursor: !selectedDuration ? 'not-allowed' : 'pointer',
                boxShadow: !selectedDuration ? 'none' : '0 4px 16px rgba(26,115,232,0.35)',
              }}
            >
              Continue
            </button>
          </div>
        </div>
      </PageWrapper>
    )
  }

  if (mode === 'create' || mode === 'edit') {
    const initial = editingTemplate
      ? { name: editingTemplate.name, description: editingTemplate.description, targetGoal: editingTemplate.targetGoal, duration: editingTemplate.duration ?? editingTemplate.days?.length ?? 7, days: editingTemplate.days }
      : emptyTemplateForm(selectedDuration ?? 7)

    return (
      <PageWrapper title={mode === 'edit' ? 'Edit Template' : 'Create Template'}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <TemplateForm
            initial={initial}
            onSave={handleSave}
            onCancel={() => { setMode('list'); setEditingTemplate(null); setSelectedDuration(null) }}
            isSaving={isSaving}
            saveLabel={fetchingMacros ? 'Fetching Macros...' : 'Save Template'}
          />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper title="Diet Templates">
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#0d1b3e', marginBottom: '2px' }}>Saved Templates</div>
            <div style={{ fontSize: '13px', color: '#8a9bc4', fontWeight: '500' }}>{templates.length} template{templates.length !== 1 ? 's' : ''}</div>
          </div>
          <button onClick={() => { setEditingTemplate(null); setSelectedDuration(null); setMode('pick-duration') }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '14px', background: 'linear-gradient(135deg, #1a73e8, #1557b0)', border: 'none', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(26,115,232,0.35)' }}>
            <Plus size={17} /> Create Template
          </button>
        </div>

        {isLoading && (
          <div className="p-8 sm:p-20" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #dbe8ff', borderTopColor: '#1a73e8', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: '13px', color: '#b0bdd8', fontWeight: '500' }}>Loading templates...</span>
          </div>
        )}

        {!isLoading && templates.length === 0 && (
          <div className="p-10 sm:px-10 rounded-[14px] sm:rounded-[20px]" style={{ background: 'white', border: '1px solid #e8eef8', textAlign: 'center', boxShadow: '0 2px 12px rgba(26,115,232,0.04)' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '22px', background: '#f8fafd', border: '1px solid #e8eef8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <BookOpen size={30} color="#d0d8f0" />
            </div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#4a5568', marginBottom: '8px' }}>No templates yet</div>
            <div style={{ fontSize: '13px', color: '#b0bdd8', fontWeight: '500', marginBottom: '24px' }}>Create your first diet template</div>
            <button onClick={() => { setSelectedDuration(null); setMode('pick-duration') }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 28px', borderRadius: '14px', background: 'linear-gradient(135deg, #1a73e8, #1557b0)', border: 'none', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(26,115,232,0.35)' }}>
              <Plus size={16} /> Create First Template
            </button>
          </div>
        )}

        {!isLoading && templates.map((template) => {
          const isExpanded = expandedTemplate === template.id
          const gc = goalColors[template.targetGoal] ?? goalColors['General Health']
          const days: DayPlan[] = template.days ?? []
          const templateDuration = template.duration ?? (days.length || 7)
          const selectedDayIdx = previewDay[template.id] ?? 0
          const selectedDay = days[selectedDayIdx]
          const mealsPerDay = days[0]?.meals?.length ?? 0
          const dailyCals = days[0]?.meals?.reduce((s, m) => s + (m.calories ?? 0), 0) ?? 0

          return (
            <div key={template.id} className="rounded-[14px] sm:rounded-[20px] overflow-hidden" style={{ background: 'white', border: '1px solid #e8eef8', boxShadow: '0 2px 12px rgba(26,115,232,0.04)', padding: 0 }}>
              <div className="flex items-center justify-between flex-wrap gap-2.5 p-3 sm:p-5 sm:px-6">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: gc.bg, border: `1px solid ${gc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <BookOpen size={22} color={gc.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#0d1b3e', marginBottom: '4px' }}>{template.name}</div>
                    <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
                      <span style={{ padding: '2px 10px', borderRadius: '40px', background: gc.bg, border: `1px solid ${gc.border}`, fontSize: '11px', fontWeight: '700', color: gc.color }}>{template.targetGoal}</span>
                      <span style={{ fontSize: '12px', color: '#8a9bc4', fontWeight: '500' }}>{templateDuration} days</span>
                      <span style={{ fontSize: '12px', color: '#8a9bc4', fontWeight: '500' }}>{mealsPerDay} meals/day</span>
                      {dailyCals > 0 && <span style={{ fontSize: '12px', color: '#8a9bc4', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '3px' }}><Flame size={11} /> {dailyCals} kcal/day</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <button onClick={() => setExpandedTemplate(isExpanded ? null : template.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', background: '#f8fafd', border: '1px solid #e8eef8', color: '#4a5568', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}{isExpanded ? 'Hide' : 'Preview'}
                  </button>
                  <button onClick={() => { setEditingTemplate(template); setMode('edit') }}
                    style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eef3ff', border: '1px solid #dbe8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Edit2 size={15} color="#1a73e8" />
                  </button>
                  <button onClick={() => setDeleteConfirm(template.id)}
                    style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fff5f5', border: '1px solid #fed7d7', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Trash2 size={15} color="#e53e3e" />
                  </button>
                </div>
              </div>

              {template.description && (
                <div style={{ padding: '0 24px 16px', fontSize: '13px', color: '#8a9bc4', fontWeight: '500', lineHeight: 1.6 }}>{template.description}</div>
              )}

              {isExpanded && (
                <div style={{ borderTop: '1px solid #f0f4ff', background: '#fafcff' }}>
                  {/* Day tabs */}
                  <div style={{ padding: '14px 24px 0', display: 'flex', gap: '6px', overflowX: 'auto' as const }}>
                    {days.map((day, idx) => (
                      <button key={idx}
                        onClick={() => setPreviewDay((prev) => ({ ...prev, [template.id]: idx }))}
                        style={{ flexShrink: 0, padding: '7px 14px', borderRadius: '40px', border: selectedDayIdx === idx ? '2px solid #1a73e8' : '1.5px solid #e8eef8', background: selectedDayIdx === idx ? '#eef3ff' : 'white', color: selectedDayIdx === idx ? '#1a73e8' : '#4a5568', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                        {day.dayName.length > 5 ? day.dayName.replace('Day ', 'D') : day.dayName.slice(0, 3)}
                        <span style={{ marginLeft: '5px', fontSize: '10px', color: selectedDayIdx === idx ? '#1a73e8' : '#b0bdd8' }}>
                          {day.meals.length}m
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Meals for selected day */}
                  <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2.5 p-3 sm:p-4 sm:px-6 sm:pb-5">
                    {(selectedDay?.meals ?? []).map((meal: Meal, idx: number) => (
                      <div key={meal.id ?? idx} style={{ background: 'white', borderRadius: '14px', padding: '14px', border: '1px solid #e8eef8' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#0d1b3e' }}>{meal.name || `Meal ${idx + 1}`}</div>
                          <span style={{ fontSize: '11px', color: '#8a9bc4', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={10} /> {formatTime12h(meal.time)}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '10px' }}>
                          {meal.items.filter((i: FoodItem) => i.name).map((item: FoodItem, i: number) => (
                            <div key={i} style={{ fontSize: '12px', color: '#4a5568', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#1a73e8', flexShrink: 0 }} />{item.name}
                              {item.calories != null && item.calories > 0 && (
                                <span style={{ fontSize: '10px', color: '#b0bdd8', marginLeft: 'auto' }}>{item.calories}kcal</span>
                              )}
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px' }}>
                          {([{ label: 'Cal', value: meal.calories, color: '#c2410c' }, { label: 'Pro', value: meal.protein, color: '#1d4ed8' }, { label: 'Carb', value: meal.carbs, color: '#15803d' }, { label: 'Fat', value: meal.fats, color: '#7c3aed' }] as { label: string; value: number; color: string }[]).map((m) => (
                            <div key={m.label} style={{ textAlign: 'center', padding: '4px', borderRadius: '6px', background: '#f8fafd' }}>
                              <div style={{ fontSize: '10px', fontWeight: '700', color: m.color }}>{m.label}</div>
                              <div style={{ fontSize: '12px', fontWeight: '800', color: '#0d1b3e' }}>{m.value != null && m.value > 0 ? m.value : '—'}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {deleteConfirm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,62,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="w-[calc(100vw-24px)] sm:w-95 p-5 sm:p-9" style={{ background: 'white', borderRadius: '24px', textAlign: 'center', boxShadow: '0 24px 80px rgba(13,27,62,0.2)' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: '#fff5f5', border: '1px solid #fed7d7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Trash2 size={28} color="#e53e3e" />
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#0d1b3e', marginBottom: '8px' }}>Delete Template?</div>
              <div style={{ fontSize: '13px', color: '#8a9bc4', fontWeight: '500', marginBottom: '28px' }}>This action cannot be undone.</div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '12px', borderRadius: '14px', background: '#f8fafd', border: '2px solid #e8eef8', color: '#4a5568', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => deleteMutation.mutate(deleteConfirm)} disabled={deleteMutation.isPending}
                  style={{ flex: 1, padding: '12px', borderRadius: '14px', background: 'linear-gradient(135deg, #e53e3e, #c53030)', border: 'none', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(229,62,62,0.35)' }}>
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </PageWrapper>
  )
}
