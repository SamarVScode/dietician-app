import { useState } from 'react'
import { Save, Copy, ChevronDown } from 'lucide-react'
import { MealBuilder } from './MealBuilder'
import { mealInputStyle, mealLabelStyle, DAYS, cloneMeals } from './mealUtils'
import type { TemplateFormData, Meal } from './mealUtils'

const GOALS = ['Weight Loss', 'Muscle Gain', 'Maintain Weight', 'General Health']

export function TemplateForm({
  initial,
  onSave,
  onCancel,
  isSaving,
  saveLabel = 'Save Template',
}: {
  initial: TemplateFormData
  onSave: (data: TemplateFormData) => void
  onCancel: () => void
  isSaving: boolean
  saveLabel?: string
}) {
  const [form, setForm] = useState<TemplateFormData>(initial)
  const [activeSection, setActiveSection] = useState<'info' | 'plan'>('info')
  const [activeDay, setActiveDay] = useState(0)
  const [showCopyFrom, setShowCopyFrom] = useState(false)

  const chipStyle = (selected: boolean) => ({
    padding: '7px 14px',
    borderRadius: '40px',
    border: selected ? '2px solid #1a73e8' : '2px solid #e8eef8',
    background: selected ? '#eef3ff' : '#f8fafd',
    color: selected ? '#1a73e8' : '#4a5568',
    fontSize: '13px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    transition: 'all 0.15s',
  })

  const updateDayMeals = (dayIndex: number, meals: Meal[]) =>
    setForm((prev) => ({
      ...prev,
      days: prev.days.map((d) => d.dayIndex === dayIndex ? { ...d, meals } : d),
    }))

  const applyToAllDays = () => {
    const meals = form.days[activeDay].meals
    setForm((prev) => ({
      ...prev,
      days: prev.days.map((d) => ({ ...d, meals: cloneMeals(meals) })),
    }))
  }

  const copyFromDay = (fromDayIndex: number) => {
    updateDayMeals(activeDay, cloneMeals(form.days[fromDayIndex].meals))
    setShowCopyFrom(false)
  }

  const currentDay = form.days[activeDay]
  const totalMeals = form.days.reduce((sum, d) => sum + d.meals.length, 0)

  const sections = [
    { key: 'info' as const, label: 'Template Info', num: '1' },
    { key: 'plan' as const, label: 'Weekly Plan',   num: '2' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Section tabs */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '8px', border: '1px solid #e8eef8', display: 'flex', gap: '4px' }}>
        {sections.map((s) => (
          <button key={s.key} onClick={() => setActiveSection(s.key)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '12px', border: 'none', background: activeSection === s.key ? '#1a73e8' : 'transparent', color: activeSection === s.key ? 'white' : '#8a9bc4', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: activeSection === s.key ? 'rgba(255,255,255,0.2)' : '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: activeSection === s.key ? 'white' : '#8a9bc4' }}>
              {s.num}
            </div>
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Section 1: Info ── */}
      {activeSection === 'info' && (
        <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e8eef8', boxShadow: '0 2px 12px rgba(26,115,232,0.04)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={mealLabelStyle}>Template Name *</label>
              <input style={mealInputStyle} value={form.name} placeholder="e.g. Weight Loss — Week 1"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onFocus={(e) => { e.target.style.border = '1.5px solid #1a73e8'; e.target.style.background = '#fafcff' }}
                onBlur={(e) => { e.target.style.border = '1.5px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
              />
            </div>
            <div>
              <label style={mealLabelStyle}>Description</label>
              <textarea style={{ ...mealInputStyle, minHeight: '80px', resize: 'vertical' as const }} value={form.description}
                placeholder="Describe what this plan is for..."
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                onFocus={(e) => { e.target.style.border = '1.5px solid #1a73e8'; e.target.style.background = '#fafcff' }}
                onBlur={(e) => { e.target.style.border = '1.5px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
              />
            </div>
            <div>
              <label style={mealLabelStyle}>Target Goal *</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
                {GOALS.map((g) => (
                  <button key={g} type="button" onClick={() => setForm({ ...form, targetGoal: g })} style={chipStyle(form.targetGoal === g)}>{g}</button>
                ))}
              </div>
            </div>
            <button onClick={() => setActiveSection('plan')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '14px', background: 'linear-gradient(135deg, #1a73e8, #1557b0)', border: 'none', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(26,115,232,0.3)', marginTop: '4px' }}>
              Next: Set Weekly Plan →
            </button>
          </div>
        </div>
      )}

      {/* ── Section 2: Weekly Plan ── */}
      {activeSection === 'plan' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Day tabs */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '8px', border: '1px solid #e8eef8', display: 'flex', gap: '4px' }}>
            {DAYS.map((day, idx) => {
              const isActive = activeDay === idx
              const mealCount = form.days[idx]?.meals.length ?? 0
              return (
                <button key={day}
                  onClick={() => { setActiveDay(idx); setShowCopyFrom(false) }}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '10px 4px', borderRadius: '12px', border: 'none', background: isActive ? '#1a73e8' : 'transparent', color: isActive ? 'white' : '#8a9bc4', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <span>{day.slice(0, 3)}</span>
                  <span style={{ fontSize: '10px', fontWeight: '600', opacity: 0.75 }}>{mealCount}m</span>
                </button>
              )
            })}
          </div>

          {/* Actions bar */}
          <div style={{ background: 'white', borderRadius: '14px', padding: '12px 16px', border: '1px solid #e8eef8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#0d1b3e' }}>
              {DAYS[activeDay]}
              <span style={{ fontSize: '12px', color: '#8a9bc4', fontWeight: '500', marginLeft: '8px' }}>
                {currentDay.meals.length} meal{currentDay.meals.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {/* Apply to all days */}
              <button onClick={applyToAllDays}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', background: '#eef3ff', border: '1px solid #dbe8ff', color: '#1a73e8', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' as const }}
                title="Copy this day's meals to every day">
                <Copy size={12} /> Apply to all days
              </button>

              {/* Copy from another day */}
              <div style={{ position: 'relative' as const }}>
                <button onClick={() => setShowCopyFrom(!showCopyFrom)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', background: '#f8fafd', border: '1px solid #e8eef8', color: '#4a5568', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                  Copy from <ChevronDown size={12} />
                </button>

                {showCopyFrom && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '6px', background: 'white', border: '1px solid #e8eef8', borderRadius: '12px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '2px', zIndex: 20, boxShadow: '0 8px 24px rgba(26,115,232,0.12)', minWidth: '150px' }}>
                    {DAYS.map((day, idx) => idx !== activeDay && (
                      <button key={day} onClick={() => copyFromDay(idx)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#0d1b3e', fontSize: '13px', fontWeight: '600', cursor: 'pointer', width: '100%', textAlign: 'left' as const }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f4ff' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
                        <span>{day}</span>
                        <span style={{ fontSize: '11px', color: '#8a9bc4', fontWeight: '500' }}>{form.days[idx]?.meals.length}m</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* MealBuilder for the active day */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '20px', border: '1px solid #e8eef8', boxShadow: '0 2px 12px rgba(26,115,232,0.04)' }}>
            <MealBuilder
              key={activeDay}
              meals={currentDay.meals}
              onChange={(meals) => updateDayMeals(activeDay, meals)}
              dayNames={DAYS}
              currentDayIndex={activeDay}
              onCopyMealToDays={(meal, dayIndices) => {
                dayIndices.forEach((idx) => {
                  setForm((prev) => ({
                    ...prev,
                    days: prev.days.map((d) =>
                      d.dayIndex === idx
                        ? { ...d, meals: [...d.meals, { ...meal, id: Math.random().toString(36).slice(2), items: meal.items.map((i) => ({ ...i })) }] }
                        : d
                    ),
                  }))
                })
              }}
            />
          </div>
        </div>
      )}

      {/* Bottom save bar — always visible */}
      <div style={{ background: 'white', borderRadius: '20px', padding: '18px 24px', border: '1px solid #e8eef8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 12px rgba(26,115,232,0.04)' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#0d1b3e' }}>{form.name || 'Untitled Template'}</div>
          <div style={{ fontSize: '12px', color: '#8a9bc4', fontWeight: '500' }}>
            7 days · {totalMeals} total meals
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onCancel}
            style={{ padding: '11px 22px', borderRadius: '14px', background: '#f8fafd', border: '2px solid #e8eef8', color: '#4a5568', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={() => onSave(form)} disabled={isSaving || !form.name.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 24px', borderRadius: '14px', background: !form.name.trim() ? '#e8eef8' : 'linear-gradient(135deg, #1a73e8, #1557b0)', border: 'none', color: !form.name.trim() ? '#b0bdd8' : 'white', fontSize: '14px', fontWeight: '700', cursor: !form.name.trim() ? 'not-allowed' : 'pointer', boxShadow: !form.name.trim() ? 'none' : '0 4px 16px rgba(26,115,232,0.3)' }}>
            {isSaving
              ? <><div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} /> Saving...</>
              : <><Save size={15} /> {saveLabel}</>}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
