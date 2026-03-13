import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection, getDocs, addDoc, updateDoc,
  deleteDoc, doc, orderBy, query,
} from 'firebase/firestore'
import { db } from '../services/firebase'
import PageWrapper from '../components/layout/PageWrapper'
import {
  Plus, Edit2, Trash2, ChevronDown, ChevronUp,
   X, BookOpen, Clock, Flame, Save,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────

interface FoodItem {
  name: string
}

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
  updatedAt: string
}

// ── Constants ────────────────────────────────────────────

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const GOALS = ['Weight Loss', 'Muscle Gain', 'Maintain Weight', 'General Health']


const emptyMeal = (): Meal => ({
  id: Math.random().toString(36).slice(2),
  name: '',
  time: '8:00 AM',
  items: [{ name: '' }],
  calories: 0,
  protein: 0,
  carbs: 0,
  fats: 0,
  notes: '',
})

// ── Shared Styles ────────────────────────────────────────

const inputStyle = {
  width: '100%',
  padding: '10px 13px',
  borderRadius: '10px',
  border: '1.5px solid #e8eef8',
  background: '#f8fafd',
  fontSize: '13px',
  fontWeight: '500' as const,
  color: '#0d1b3e',
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'all 0.15s',
  boxSizing: 'border-box' as const,
}

const labelStyle = {
  fontSize: '11px',
  fontWeight: '700' as const,
  color: '#b0bdd8',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.8px',
  marginBottom: '6px',
  display: 'block' as const,
}

const macroBoxStyle = {
  flex: 1,
  padding: '10px 12px',
  borderRadius: '10px',
  border: '1.5px solid #e8eef8',
  background: '#f8fafd',
  textAlign: 'center' as const,
}

// ── Meal Builder ─────────────────────────────────────────

function MealBuilder({
  meals,
  onChange,
}: {
  meals: Meal[]
  onChange: (meals: Meal[]) => void
}) {
  const [expandedMeal, setExpandedMeal] = useState<string | null>(meals[0]?.id ?? null)

  const addMeal = () => {
    const m = emptyMeal()
    onChange([...meals, m])
    setExpandedMeal(m.id)
  }

  const removeMeal = (id: string) => {
    if (meals.length === 1) return
    onChange(meals.filter((m) => m.id !== id))
  }

  const updateMeal = (
    id: string,
    field: keyof Meal,
    value: string | number | FoodItem[]
  ) => {
    onChange(meals.map((m) => (m.id === id ? { ...m, [field]: value } : m)))
  }

  const addFoodItem = (mealId: string) => {
    onChange(
      meals.map((m) =>
        m.id === mealId ? { ...m, items: [...m.items, { name: '' }] } : m
      )
    )
  }

  const updateFoodItem = (mealId: string, idx: number, value: string) => {
    onChange(
      meals.map((m) =>
        m.id === mealId
          ? { ...m, items: m.items.map((item, i) => (i === idx ? { name: value } : item)) }
          : m
      )
    )
  }

  const removeFoodItem = (mealId: string, idx: number) => {
    onChange(
      meals.map((m) =>
        m.id === mealId
          ? { ...m, items: m.items.filter((_, i) => i !== idx) }
          : m
      )
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {meals.map((meal, mealIdx) => (
        <div
          key={meal.id}
          style={{
            borderRadius: '16px',
            border: expandedMeal === meal.id ? '2px solid #1a73e8' : '1.5px solid #e8eef8',
            background: 'white',
            overflow: 'hidden',
            transition: 'border 0.15s',
          }}
        >
          {/* Meal Row Header */}
          <div
            onClick={() => setExpandedMeal(expandedMeal === meal.id ? null : meal.id)}
            style={{
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              background: expandedMeal === meal.id ? '#fafcff' : 'white',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#eef3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800', color: '#1a73e8', flexShrink: 0 }}>
                {mealIdx + 1}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: meal.name ? '#0d1b3e' : '#b0bdd8' }}>
                  {meal.name || 'Untitled Meal'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                  {meal.time && (
                    <span style={{ fontSize: '11px', color: '#8a9bc4', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={10} /> {meal.time}
                    </span>
                  )}
                  <span style={{ fontSize: '11px', color: '#8a9bc4', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Flame size={10} /> {meal.calories || 0} kcal
                  </span>
                  <span style={{ fontSize: '11px', color: '#8a9bc4', fontWeight: '500' }}>
                    {meal.items.filter((i) => i.name).length} items
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {meals.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); removeMeal(meal.id) }}
                  style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#fff5f5', border: '1px solid #fed7d7', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X size={12} color="#e53e3e" />
                </button>
              )}
              {expandedMeal === meal.id
                ? <ChevronUp size={16} color="#8a9bc4" />
                : <ChevronDown size={16} color="#8a9bc4" />
              }
            </div>
          </div>

          {/* Meal Body */}
          {expandedMeal === meal.id && (
            <div style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Row 1: Meal Name + Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Meal Name</label>
                  <input
                    style={inputStyle}
                    value={meal.name}
                    placeholder="e.g. Breakfast"
                    onChange={(e) => updateMeal(meal.id, 'name', e.target.value)}
                    onFocus={(e) => { e.target.style.border = '1.5px solid #1a73e8'; e.target.style.background = '#fafcff' }}
                    onBlur={(e) => { e.target.style.border = '1.5px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
                  />
                </div>
                <div>
  <label style={labelStyle}>Meal Time</label>
  <input
    style={inputStyle}
    value={meal.time}
    placeholder="e.g. 8:00 AM, After workout..."
    onChange={(e) => updateMeal(meal.id, 'time', e.target.value)}
    onFocus={(e) => {
      e.target.style.border = '1.5px solid #1a73e8'
      e.target.style.background = '#fafcff'
    }}
    onBlur={(e) => {
      e.target.style.border = '1.5px solid #e8eef8'
      e.target.style.background = '#f8fafd'
    }}
  />
</div>
              </div>

              {/* Row 2: Food Items */}
              <div>
                <label style={labelStyle}>Food Items</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {meal.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#8a9bc4', flexShrink: 0 }}>
                        {idx + 1}
                      </div>
                      <input
                        style={{ ...inputStyle, flex: 1 }}
                        value={item.name}
                        placeholder={`Food item ${idx + 1}`}
                        onChange={(e) => updateFoodItem(meal.id, idx, e.target.value)}
                        onFocus={(e) => { e.target.style.border = '1.5px solid #1a73e8'; e.target.style.background = '#fafcff' }}
                        onBlur={(e) => { e.target.style.border = '1.5px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
                      />
                      {meal.items.length > 1 && (
                        <button
                          onClick={() => removeFoodItem(meal.id, idx)}
                          style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#fff5f5', border: '1px solid #fed7d7', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                        >
                          <X size={11} color="#e53e3e" />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={() => addFoodItem(meal.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', background: '#f8fafd', border: '1.5px dashed #dbe8ff', color: '#1a73e8', fontSize: '12px', fontWeight: '600', cursor: 'pointer', width: 'fit-content', marginTop: '2px' }}
                  >
                    <Plus size={13} /> Add Food Item
                  </button>
                </div>
              </div>

              {/* Row 3: Macros (AI placeholder) */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Macros & Calories</label>
                  <span style={{ fontSize: '10px', fontWeight: '600', color: '#b0bdd8', padding: '2px 8px', borderRadius: '40px', background: '#f8fafd', border: '1px solid #e8eef8' }}>
                    🤖 AI auto-fill coming soon
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                  {[
                    { field: 'calories' as const, label: 'Calories', unit: 'kcal', color: '#c2410c', bg: '#fff7ed' },
                    { field: 'protein' as const, label: 'Protein', unit: 'g', color: '#1d4ed8', bg: '#eff6ff' },
                    { field: 'carbs' as const, label: 'Carbs', unit: 'g', color: '#15803d', bg: '#f0fdf4' },
                    { field: 'fats' as const, label: 'Fats', unit: 'g', color: '#7c3aed', bg: '#f5f3ff' },
                  ].map((macro) => (
                    <div key={macro.field} style={{ ...macroBoxStyle, background: macro.bg, border: 'none' }}>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: macro.color, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                        {macro.label}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          min={0}
                          value={meal[macro.field] || ''}
                          placeholder="00"
                          onChange={(e) => updateMeal(meal.id, macro.field, parseFloat(e.target.value) || 0)}
                          style={{
                            width: '52px',
                            padding: '6px 4px',
                            borderRadius: '8px',
                            border: '1.5px solid rgba(0,0,0,0.08)',
                            background: 'white',
                            fontSize: '16px',
                            fontWeight: '800',
                            color: macro.color,
                            outline: 'none',
                            textAlign: 'center',
                            fontFamily: 'inherit',
                          }}
                        />
                        <span style={{ fontSize: '11px', fontWeight: '600', color: macro.color }}>{macro.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 4: Notes */}
              <div>
                <label style={labelStyle}>Special Instructions / Notes</label>
                <textarea
                  style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' as const }}
                  value={meal.notes}
                  placeholder="e.g. Take 30 mins before workout, avoid sugar..."
                  onChange={(e) => updateMeal(meal.id, 'notes', e.target.value)}
                  onFocus={(e) => { e.target.style.border = '1.5px solid #1a73e8'; e.target.style.background = '#fafcff' }}
                  onBlur={(e) => { e.target.style.border = '1.5px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
                />
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add Meal Button */}
      <button
        onClick={addMeal}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px', borderRadius: '14px', background: '#f8fafd', border: '2px dashed #dbe8ff', color: '#1a73e8', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s', width: '100%' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#eef3ff'; e.currentTarget.style.borderColor = '#1a73e8' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafd'; e.currentTarget.style.borderColor = '#dbe8ff' }}
      >
        <Plus size={16} /> Add Another Meal
      </button>
    </div>
  )
}

// ── Day Override Panel ───────────────────────────────────

function DayOverridePanel({
  baseMeals,
  dayOverrides,
  onChange,
}: {
  baseMeals: Meal[]
  dayOverrides: DayOverride[]
  onChange: (overrides: DayOverride[]) => void
}) {
  const [activeDay, setActiveDay] = useState<number | null>(null)

  const getOverride = (dayIndex: number) =>
    dayOverrides.find((o) => o.dayIndex === dayIndex)

  const setOverride = (dayIndex: number, meals: Meal[]) => {
    const exists = dayOverrides.find((o) => o.dayIndex === dayIndex)
    if (exists) {
      onChange(dayOverrides.map((o) => o.dayIndex === dayIndex ? { ...o, meals } : o))
    } else {
      onChange([...dayOverrides, { dayIndex, meals }])
    }
  }

  const removeOverride = (dayIndex: number) => {
    onChange(dayOverrides.filter((o) => o.dayIndex !== dayIndex))
    if (activeDay === dayIndex) setActiveDay(null)
  }

  const copyBaseMeals = (dayIndex: number) => {
    const copied = baseMeals.map((m) => ({
      ...m,
      id: Math.random().toString(36).slice(2),
      items: m.items.map((i) => ({ ...i })),
    }))
    setOverride(dayIndex, copied)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#0d1b3e' }}>Day Overrides</div>
          <div style={{ fontSize: '12px', color: '#8a9bc4', fontWeight: '500', marginTop: '2px' }}>
            By default all days use the base meals. Override specific days here.
          </div>
        </div>
      </div>

      {/* Day Pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const, marginBottom: '16px' }}>
        {DAYS.map((day, idx) => {
          const hasOverride = !!getOverride(idx)
          const isActive = activeDay === idx
          return (
            <button
              key={day}
              onClick={() => {
                if (isActive) {
                  setActiveDay(null)
                } else {
                  setActiveDay(idx)
                  if (!hasOverride) copyBaseMeals(idx)
                }
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '40px',
                border: isActive
                  ? '2px solid #1a73e8'
                  : hasOverride
                  ? '2px solid #f59e0b'
                  : '1.5px solid #e8eef8',
                background: isActive
                  ? '#eef3ff'
                  : hasOverride
                  ? '#fffbeb'
                  : '#f8fafd',
                color: isActive
                  ? '#1a73e8'
                  : hasOverride
                  ? '#b45309'
                  : '#4a5568',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {day.slice(0, 3)}
              {hasOverride && (
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Active Day Editor */}
      {activeDay !== null && (
        <div style={{ borderRadius: '16px', border: '1.5px solid #e8eef8', background: '#fafcff', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#0d1b3e' }}>
                {DAYS[activeDay]} — Custom Meals
              </div>
              <div style={{ fontSize: '12px', color: '#8a9bc4', fontWeight: '500' }}>
                Editing override for {DAYS[activeDay]}
              </div>
            </div>
            <button
              onClick={() => removeOverride(activeDay)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '10px', background: '#fff5f5', border: '1px solid #fed7d7', color: '#c53030', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
            >
              <X size={12} /> Reset to Base
            </button>
          </div>
          <MealBuilder
            meals={getOverride(activeDay)?.meals ?? baseMeals}
            onChange={(meals) => setOverride(activeDay, meals)}
          />
        </div>
      )}
    </div>
  )
}

// ── Template Form ────────────────────────────────────────

function TemplateForm({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>
  onSave: (data: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
  isSaving: boolean
}) {
  const [form, setForm] = useState(initial)
  const [activeSection, setActiveSection] = useState<'info' | 'meals' | 'overrides'>('info')

  const sections = [
    { key: 'info' as const, label: 'Template Info', num: '1' },
    { key: 'meals' as const, label: 'Base Meals', num: '2' },
    { key: 'overrides' as const, label: 'Day Overrides', num: '3' },
  ]

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Section Tabs */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '8px', border: '1px solid #e8eef8', display: 'flex', gap: '4px' }}>
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px',
              borderRadius: '12px',
              border: 'none',
              background: activeSection === s.key ? '#1a73e8' : 'transparent',
              color: activeSection === s.key ? 'white' : '#8a9bc4',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: activeSection === s.key ? 'rgba(255,255,255,0.2)' : '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: activeSection === s.key ? 'white' : '#8a9bc4' }}>
              {s.num}
            </div>
            {s.label}
          </button>
        ))}
      </div>

      {/* Section 1: Template Info */}
      {activeSection === 'info' && (
        <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e8eef8', boxShadow: '0 2px 12px rgba(26,115,232,0.04)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div>
              <label style={labelStyle}>Template Name *</label>
              <input
                style={inputStyle}
                value={form.name}
                placeholder="e.g. Weight Loss — Week 1"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onFocus={(e) => { e.target.style.border = '1.5px solid #1a73e8'; e.target.style.background = '#fafcff' }}
                onBlur={(e) => { e.target.style.border = '1.5px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
              />
            </div>

            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' as const }}
                value={form.description}
                placeholder="Describe what this plan is for, who it suits..."
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                onFocus={(e) => { e.target.style.border = '1.5px solid #1a73e8'; e.target.style.background = '#fafcff' }}
                onBlur={(e) => { e.target.style.border = '1.5px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
              />
            </div>

            <div>
              <label style={labelStyle}>Target Goal *</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
                {GOALS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setForm({ ...form, targetGoal: g })}
                    style={chipStyle(form.targetGoal === g)}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setActiveSection('meals')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '14px', background: 'linear-gradient(135deg, #1a73e8, #1557b0)', border: 'none', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(26,115,232,0.3)', marginTop: '4px' }}
            >
              Next: Set Base Meals →
            </button>
          </div>
        </div>
      )}

      {/* Section 2: Base Meals */}
      {activeSection === 'meals' && (
        <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e8eef8', boxShadow: '0 2px 12px rgba(26,115,232,0.04)' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#0d1b3e', marginBottom: '4px' }}>Base Meals</div>
            <div style={{ fontSize: '13px', color: '#8a9bc4', fontWeight: '500' }}>
              These meals apply to all 7 days by default. You can override specific days in the next step.
            </div>
          </div>
          <MealBuilder
            meals={form.baseMeals}
            onChange={(baseMeals) => setForm({ ...form, baseMeals })}
          />
          <button
            onClick={() => setActiveSection('overrides')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '14px', background: 'linear-gradient(135deg, #1a73e8, #1557b0)', border: 'none', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(26,115,232,0.3)', marginTop: '16px', width: '100%' }}
          >
            Next: Set Day Overrides →
          </button>
        </div>
      )}

      {/* Section 3: Day Overrides */}
      {activeSection === 'overrides' && (
        <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e8eef8', boxShadow: '0 2px 12px rgba(26,115,232,0.04)' }}>
          <DayOverridePanel
            baseMeals={form.baseMeals}
            dayOverrides={form.dayOverrides}
            onChange={(dayOverrides) => setForm({ ...form, dayOverrides })}
          />
        </div>
      )}

      {/* Action Bar */}
      <div style={{ background: 'white', borderRadius: '20px', padding: '18px 24px', border: '1px solid #e8eef8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 12px rgba(26,115,232,0.04)' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#0d1b3e' }}>
            {form.name || 'Untitled Template'}
          </div>
          <div style={{ fontSize: '12px', color: '#8a9bc4', fontWeight: '500' }}>
            {form.baseMeals.length} base meal{form.baseMeals.length !== 1 ? 's' : ''} · {form.dayOverrides.length} day override{form.dayOverrides.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onCancel}
            style={{ padding: '11px 22px', borderRadius: '14px', background: '#f8fafd', border: '2px solid #e8eef8', color: '#4a5568', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={isSaving || !form.name.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 24px', borderRadius: '14px', background: !form.name.trim() ? '#e8eef8' : 'linear-gradient(135deg, #1a73e8, #1557b0)', border: 'none', color: !form.name.trim() ? '#b0bdd8' : 'white', fontSize: '14px', fontWeight: '700', cursor: !form.name.trim() ? 'not-allowed' : 'pointer', boxShadow: !form.name.trim() ? 'none' : '0 4px 16px rgba(26,115,232,0.3)' }}
          >
            {isSaving
              ? <><div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} /> Saving...</>
              : <><Save size={15} /> Save Template</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────

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
    mutationFn: async (data: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => {
      await addDoc(collection(db, 'templates'), {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      setMode('list')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Omit<Template, 'id' | 'createdAt' | 'updatedAt'> }) => {
      await updateDoc(doc(db, 'templates', id), {
        ...data,
        updatedAt: new Date().toISOString(),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      setMode('list')
      setEditingTemplate(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, 'templates', id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      setDeleteConfirm(null)
    },
  })

  const handleSave = (data: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (mode === 'edit' && editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleEdit = (template: Template) => {
    setEditingTemplate(template)
    setMode('edit')
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  // ── Create / Edit View ───────────────────────────────

  if (mode === 'create' || mode === 'edit') {
    const initial = editingTemplate
      ? {
          name: editingTemplate.name,
          description: editingTemplate.description,
          targetGoal: editingTemplate.targetGoal,
          baseMeals: editingTemplate.baseMeals,
          dayOverrides: editingTemplate.dayOverrides,
        }
      : {
          name: '',
          description: '',
          targetGoal: 'Weight Loss',
          baseMeals: [emptyMeal()],
          dayOverrides: [],
        }

    return (
      <PageWrapper title={mode === 'edit' ? 'Edit Template' : 'Create Template'}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <TemplateForm
            initial={initial}
            onSave={handleSave}
            onCancel={() => { setMode('list'); setEditingTemplate(null) }}
            isSaving={isSaving}
          />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </PageWrapper>
    )
  }

  // ── List View ────────────────────────────────────────

  return (
    <PageWrapper title="Diet Templates">
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#0d1b3e', marginBottom: '2px' }}>
              Saved Templates
            </div>
            <div style={{ fontSize: '13px', color: '#8a9bc4', fontWeight: '500' }}>
              {templates.length} template{templates.length !== 1 ? 's' : ''} · Reuse when assigning plans
            </div>
          </div>
          <button
            onClick={() => { setEditingTemplate(null); setMode('create') }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '14px', background: 'linear-gradient(135deg, #1a73e8, #1557b0)', border: 'none', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(26,115,232,0.35)' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(26,115,232,0.45)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,115,232,0.35)' }}
          >
            <Plus size={17} /> Create Template
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', flexDirection: 'column', gap: '16px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #dbe8ff', borderTopColor: '#1a73e8', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: '13px', color: '#b0bdd8', fontWeight: '500' }}>Loading templates...</span>
          </div>
        )}

        {/* Empty */}
        {!isLoading && templates.length === 0 && (
          <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8eef8', padding: '80px 40px', textAlign: 'center', boxShadow: '0 2px 12px rgba(26,115,232,0.04)' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '22px', background: '#f8fafd', border: '1px solid #e8eef8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <BookOpen size={30} color="#d0d8f0" />
            </div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#4a5568', marginBottom: '8px' }}>No templates yet</div>
            <div style={{ fontSize: '13px', color: '#b0bdd8', fontWeight: '500', marginBottom: '24px' }}>
              Create your first diet template to reuse when assigning plans
            </div>
            <button
              onClick={() => setMode('create')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 28px', borderRadius: '14px', background: 'linear-gradient(135deg, #1a73e8, #1557b0)', border: 'none', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(26,115,232,0.35)' }}
            >
              <Plus size={16} /> Create First Template
            </button>
          </div>
        )}

        {/* Template Cards */}
        {!isLoading && templates.map((template) => {
          const isExpanded = expandedTemplate === template.id
          const totalCals = template.baseMeals.reduce((s, m) => s + (m.calories || 0), 0)
          const goalColors: Record<string, { bg: string; color: string; border: string }> = {
            'Weight Loss': { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
            'Muscle Gain': { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
            'Maintain Weight': { bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd' },
            'General Health': { bg: '#f0fdfa', color: '#0d9488', border: '#99f6e4' },
          }
          const gc = goalColors[template.targetGoal] ?? goalColors['General Health']

          return (
            <div
              key={template.id}
              style={{ background: 'white', borderRadius: '20px', border: '1px solid #e8eef8', overflow: 'hidden', boxShadow: '0 2px 12px rgba(26,115,232,0.04)' }}
            >
              {/* Card Header */}
              <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: gc.bg, border: `1px solid ${gc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <BookOpen size={22} color={gc.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#0d1b3e', marginBottom: '4px' }}>
                      {template.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' as const }}>
                      <span style={{ padding: '2px 10px', borderRadius: '40px', background: gc.bg, border: `1px solid ${gc.border}`, fontSize: '11px', fontWeight: '700', color: gc.color }}>
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
                        <span style={{ fontSize: '12px', color: '#b45309', fontWeight: '600', background: '#fffbeb', padding: '2px 8px', borderRadius: '40px', border: '1px solid #fde68a' }}>
                          {template.dayOverrides.length} day override{template.dayOverrides.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={() => setExpandedTemplate(isExpanded ? null : template.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', background: '#f8fafd', border: '1px solid #e8eef8', color: '#4a5568', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {isExpanded ? 'Hide' : 'Preview'}
                  </button>
                  <button
                    onClick={() => handleEdit(template)}
                    style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eef3ff', border: '1px solid #dbe8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <Edit2 size={15} color="#1a73e8" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(template.id)}
                    style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fff5f5', border: '1px solid #fed7d7', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <Trash2 size={15} color="#e53e3e" />
                  </button>
                </div>
              </div>

              {/* Description */}
              {template.description && (
                <div style={{ padding: '0 24px 16px', fontSize: '13px', color: '#8a9bc4', fontWeight: '500', lineHeight: 1.6 }}>
                  {template.description}
                </div>
              )}

              {/* Expanded Preview */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid #f0f4ff', padding: '20px 24px', background: '#fafcff' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#b0bdd8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
                    Base Meals (applied to all days)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                    {template.baseMeals.map((meal, idx) => (
                      <div key={meal.id} style={{ background: 'white', borderRadius: '14px', padding: '14px', border: '1px solid #e8eef8' }}>
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
                      </div>
                    ))}
                  </div>

                  {template.dayOverrides.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#b0bdd8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
                        Day Overrides
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                        {template.dayOverrides.map((o) => (
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

        {/* Delete Confirm Modal */}
        {deleteConfirm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,62,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', borderRadius: '24px', padding: '36px', width: '380px', textAlign: 'center', boxShadow: '0 24px 80px rgba(13,27,62,0.2)' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: '#fff5f5', border: '1px solid #fed7d7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Trash2 size={28} color="#e53e3e" />
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#0d1b3e', marginBottom: '8px' }}>Delete Template?</div>
              <div style={{ fontSize: '13px', color: '#8a9bc4', fontWeight: '500', marginBottom: '28px' }}>
                This action cannot be undone. The template will be permanently deleted.
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  style={{ flex: 1, padding: '12px', borderRadius: '14px', background: '#f8fafd', border: '2px solid #e8eef8', color: '#4a5568', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteMutation.mutate(deleteConfirm)}
                  disabled={deleteMutation.isPending}
                  style={{ flex: 1, padding: '12px', borderRadius: '14px', background: 'linear-gradient(135deg, #e53e3e, #c53030)', border: 'none', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(229,62,62,0.35)' }}
                >
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