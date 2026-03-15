import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, query } from 'firebase/firestore'
import { db } from '../services/firebase'
import PageWrapper from '../components/layout/PageWrapper'
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, BookOpen, Clock, Flame } from 'lucide-react'
import { DAYS } from '../components/dietplan/mealUtils'
import type { TemplateFormData } from '../components/dietplan/mealUtils'
import { emptyTemplateForm } from '../components/dietplan/mealUtils'
import { TemplateForm } from '../components/dietplan/TemplateForm'
import type { Meal, DayOverride } from '../components/dietplan/mealUtils'

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

export default function Templates() {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list')
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

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
      await addDoc(collection(db, 'templates'), { ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['templates'] }); setMode('list') },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TemplateFormData }) => {
      await updateDoc(doc(db, 'templates', id), { ...data, updatedAt: new Date().toISOString() })
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['templates'] }); setMode('list'); setEditingTemplate(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await deleteDoc(doc(db, 'templates', id)) },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['templates'] }); setDeleteConfirm(null) },
  })

  const handleSave = (data: TemplateFormData) => {
    if (mode === 'edit' && editingTemplate) updateMutation.mutate({ id: editingTemplate.id, data })
    else createMutation.mutate(data)
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  if (mode === 'create' || mode === 'edit') {
    const initial = editingTemplate
      ? { name: editingTemplate.name, description: editingTemplate.description, targetGoal: editingTemplate.targetGoal, baseMeals: editingTemplate.baseMeals, dayOverrides: editingTemplate.dayOverrides }
      : emptyTemplateForm()

    return (
      <PageWrapper title={mode === 'edit' ? 'Edit Template' : 'Create Template'}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <TemplateForm initial={initial} onSave={handleSave} onCancel={() => { setMode('list'); setEditingTemplate(null) }} isSaving={isSaving} />
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
          <button onClick={() => { setEditingTemplate(null); setMode('create') }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '14px', background: 'linear-gradient(135deg, #1a73e8, #1557b0)', border: 'none', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(26,115,232,0.35)' }}>
            <Plus size={17} /> Create Template
          </button>
        </div>

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', flexDirection: 'column', gap: '16px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #dbe8ff', borderTopColor: '#1a73e8', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: '13px', color: '#b0bdd8', fontWeight: '500' }}>Loading templates...</span>
          </div>
        )}

        {!isLoading && templates.length === 0 && (
          <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8eef8', padding: '80px 40px', textAlign: 'center', boxShadow: '0 2px 12px rgba(26,115,232,0.04)' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '22px', background: '#f8fafd', border: '1px solid #e8eef8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <BookOpen size={30} color="#d0d8f0" />
            </div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#4a5568', marginBottom: '8px' }}>No templates yet</div>
            <div style={{ fontSize: '13px', color: '#b0bdd8', fontWeight: '500', marginBottom: '24px' }}>Create your first diet template</div>
            <button onClick={() => setMode('create')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 28px', borderRadius: '14px', background: 'linear-gradient(135deg, #1a73e8, #1557b0)', border: 'none', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(26,115,232,0.35)' }}>
              <Plus size={16} /> Create First Template
            </button>
          </div>
        )}

        {!isLoading && templates.map((template) => {
          const isExpanded = expandedTemplate === template.id
          const totalCals = template.baseMeals.reduce((s: number, m: Meal) => s + (m.calories || 0), 0)
          const gc = goalColors[template.targetGoal] ?? goalColors['General Health']

          return (
            <div key={template.id} style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8eef8', overflow: 'hidden', boxShadow: '0 2px 12px rgba(26,115,232,0.04)' }}>
              <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: gc.bg, border: `1px solid ${gc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <BookOpen size={22} color={gc.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#0d1b3e', marginBottom: '4px' }}>{template.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' as const }}>
                      <span style={{ padding: '2px 10px', borderRadius: '40px', background: gc.bg, border: `1px solid ${gc.border}`, fontSize: '11px', fontWeight: '700', color: gc.color }}>{template.targetGoal}</span>
                      <span style={{ fontSize: '12px', color: '#8a9bc4', fontWeight: '500' }}>{template.baseMeals.length} meals/day</span>
                      {totalCals > 0 && <span style={{ fontSize: '12px', color: '#8a9bc4', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '3px' }}><Flame size={11} /> {totalCals} kcal/day</span>}
                      {template.dayOverrides.length > 0 && (
                        <span style={{ fontSize: '12px', color: '#b45309', fontWeight: '600', background: '#fffbeb', padding: '2px 8px', borderRadius: '40px', border: '1px solid #fde68a' }}>
                          {template.dayOverrides.length} day override{template.dayOverrides.length !== 1 ? 's' : ''}
                        </span>
                      )}
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
                <div style={{ borderTop: '1px solid #f0f4ff', padding: '20px 24px', background: '#fafcff' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#b0bdd8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>Base Meals</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                    {template.baseMeals.map((meal: Meal, idx: number) => (
                      <div key={meal.id} style={{ background: 'white', borderRadius: '14px', padding: '14px', border: '1px solid #e8eef8' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#0d1b3e' }}>{meal.name || `Meal ${idx + 1}`}</div>
                          <span style={{ fontSize: '11px', color: '#8a9bc4', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={10} /> {meal.time}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '10px' }}>
                          {meal.items.filter((i) => i.name).map((item, i: number) => (
                            <div key={i} style={{ fontSize: '12px', color: '#4a5568', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#1a73e8', flexShrink: 0 }} />{item.name}
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px' }}>
                          {([{ label: 'Cal', value: meal.calories, color: '#c2410c' }, { label: 'Pro', value: meal.protein, color: '#1d4ed8' }, { label: 'Carb', value: meal.carbs, color: '#15803d' }, { label: 'Fat', value: meal.fats, color: '#7c3aed' }] as { label: string; value: number; color: string }[]).map((m) => (
                            <div key={m.label} style={{ textAlign: 'center', padding: '4px', borderRadius: '6px', background: '#f8fafd' }}>
                              <div style={{ fontSize: '10px', fontWeight: '700', color: m.color }}>{m.label}</div>
                              <div style={{ fontSize: '12px', fontWeight: '800', color: '#0d1b3e' }}>{m.value || '—'}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {template.dayOverrides.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#b0bdd8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>Day Overrides</div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                        {template.dayOverrides.map((o: DayOverride) => (
                          <span key={o.dayIndex} style={{ padding: '5px 12px', borderRadius: '40px', background: '#fffbeb', border: '1px solid #fde68a', fontSize: '12px', fontWeight: '600', color: '#b45309' }}>
                            {DAYS[o.dayIndex]} — {o.meals.length} meals
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {deleteConfirm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,62,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', borderRadius: '24px', padding: '36px', width: '380px', textAlign: 'center', boxShadow: '0 24px 80px rgba(13,27,62,0.2)' }}>
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