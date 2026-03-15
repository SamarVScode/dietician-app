import { useState } from 'react'
import { Plus, X, Clock, Flame, ChevronDown, ChevronUp } from 'lucide-react'
import { DAYS, emptyMeal, mealInputStyle, mealLabelStyle } from './mealUtils'
import type { Meal, FoodItem, DayOverride } from './mealUtils'

export function MealBuilder({
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

  const updateMeal = (id: string, field: keyof Meal, value: string | number | FoodItem[]) =>
    onChange(meals.map((m) => (m.id === id ? { ...m, [field]: value } : m)))

  const addFoodItem = (mealId: string) =>
    onChange(meals.map((m) => m.id === mealId ? { ...m, items: [...m.items, { name: '' }] } : m))

  const updateFoodItem = (mealId: string, idx: number, value: string) =>
    onChange(meals.map((m) => m.id === mealId
      ? { ...m, items: m.items.map((item, i) => (i === idx ? { name: value } : item)) }
      : m))

  const removeFoodItem = (mealId: string, idx: number) =>
    onChange(meals.map((m) => m.id === mealId
      ? { ...m, items: m.items.filter((_, i) => i !== idx) }
      : m))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {meals.map((meal, mealIdx) => (
        <div key={meal.id} style={{ borderRadius: '16px', border: expandedMeal === meal.id ? '2px solid #1a73e8' : '1.5px solid #e8eef8', background: 'white', overflow: 'hidden', transition: 'border 0.15s' }}>
          <div onClick={() => setExpandedMeal(expandedMeal === meal.id ? null : meal.id)}
            style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: expandedMeal === meal.id ? '#fafcff' : 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#eef3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800', color: '#1a73e8', flexShrink: 0 }}>{mealIdx + 1}</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: meal.name ? '#0d1b3e' : '#b0bdd8' }}>{meal.name || 'Untitled Meal'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                  {meal.time && <span style={{ fontSize: '11px', color: '#8a9bc4', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={10} /> {meal.time}</span>}
                  <span style={{ fontSize: '11px', color: '#8a9bc4', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '3px' }}><Flame size={10} /> {meal.calories || 0} kcal</span>
                  <span style={{ fontSize: '11px', color: '#8a9bc4', fontWeight: '500' }}>{meal.items.filter((i) => i.name).length} items</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {meals.length > 1 && (
                <button onClick={(e) => { e.stopPropagation(); removeMeal(meal.id) }}
                  style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#fff5f5', border: '1px solid #fed7d7', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={12} color="#e53e3e" />
                </button>
              )}
              {expandedMeal === meal.id ? <ChevronUp size={16} color="#8a9bc4" /> : <ChevronDown size={16} color="#8a9bc4" />}
            </div>
          </div>

          {expandedMeal === meal.id && (
            <div style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={mealLabelStyle}>Meal Name</label>
                  <input style={mealInputStyle} value={meal.name} placeholder="e.g. Breakfast"
                    onChange={(e) => updateMeal(meal.id, 'name', e.target.value)}
                    onFocus={(e) => { e.target.style.border = '1.5px solid #1a73e8'; e.target.style.background = '#fafcff' }}
                    onBlur={(e) => { e.target.style.border = '1.5px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
                  />
                </div>
                <div>
                  <label style={mealLabelStyle}>Meal Time</label>
                  <input style={mealInputStyle} value={meal.time} placeholder="e.g. 8:00 AM"
                    onChange={(e) => updateMeal(meal.id, 'time', e.target.value)}
                    onFocus={(e) => { e.target.style.border = '1.5px solid #1a73e8'; e.target.style.background = '#fafcff' }}
                    onBlur={(e) => { e.target.style.border = '1.5px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
                  />
                </div>
              </div>

              <div>
                <label style={mealLabelStyle}>Food Items</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {meal.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#8a9bc4', flexShrink: 0 }}>{idx + 1}</div>
                      <input style={{ ...mealInputStyle, flex: 1 }} value={item.name} placeholder={`Food item ${idx + 1}`}
                        onChange={(e) => updateFoodItem(meal.id, idx, e.target.value)}
                        onFocus={(e) => { e.target.style.border = '1.5px solid #1a73e8'; e.target.style.background = '#fafcff' }}
                        onBlur={(e) => { e.target.style.border = '1.5px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
                      />
                      {meal.items.length > 1 && (
                        <button onClick={() => removeFoodItem(meal.id, idx)}
                          style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#fff5f5', border: '1px solid #fed7d7', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                          <X size={11} color="#e53e3e" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => addFoodItem(meal.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', background: '#f8fafd', border: '1.5px dashed #dbe8ff', color: '#1a73e8', fontSize: '12px', fontWeight: '600', cursor: 'pointer', width: 'fit-content', marginTop: '2px' }}>
                    <Plus size={13} /> Add Food Item
                  </button>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ ...mealLabelStyle, marginBottom: 0 }}>Macros & Calories</label>
                  <span style={{ fontSize: '10px', fontWeight: '600', color: '#b0bdd8', padding: '2px 8px', borderRadius: '40px', background: '#f8fafd', border: '1px solid #e8eef8' }}>🤖 AI auto-fill coming soon</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                  {[
                    { field: 'calories' as const, label: 'Calories', unit: 'kcal', color: '#c2410c', bg: '#fff7ed' },
                    { field: 'protein' as const,  label: 'Protein',  unit: 'g',    color: '#1d4ed8', bg: '#eff6ff' },
                    { field: 'carbs' as const,    label: 'Carbs',    unit: 'g',    color: '#15803d', bg: '#f0fdf4' },
                    { field: 'fats' as const,     label: 'Fats',     unit: 'g',    color: '#7c3aed', bg: '#f5f3ff' },
                  ].map((macro) => (
                    <div key={macro.field} style={{ padding: '10px 12px', borderRadius: '10px', background: macro.bg, textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: macro.color, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{macro.label}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <input type="number" min={0} value={meal[macro.field] || ''} placeholder="00"
                          onChange={(e) => updateMeal(meal.id, macro.field, parseFloat(e.target.value) || 0)}
                          style={{ width: '52px', padding: '6px 4px', borderRadius: '8px', border: '1.5px solid rgba(0,0,0,0.08)', background: 'white', fontSize: '16px', fontWeight: '800', color: macro.color, outline: 'none', textAlign: 'center', fontFamily: 'inherit' }}
                        />
                        <span style={{ fontSize: '11px', fontWeight: '600', color: macro.color }}>{macro.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={mealLabelStyle}>Special Instructions / Notes</label>
                <textarea style={{ ...mealInputStyle, minHeight: '60px', resize: 'vertical' as const }} value={meal.notes}
                  placeholder="e.g. Take 30 mins before workout..."
                  onChange={(e) => updateMeal(meal.id, 'notes', e.target.value)}
                  onFocus={(e) => { e.target.style.border = '1.5px solid #1a73e8'; e.target.style.background = '#fafcff' }}
                  onBlur={(e) => { e.target.style.border = '1.5px solid #e8eef8'; e.target.style.background = '#f8fafd' }}
                />
              </div>
            </div>
          )}
        </div>
      ))}

      <button onClick={addMeal}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px', borderRadius: '14px', background: '#f8fafd', border: '2px dashed #dbe8ff', color: '#1a73e8', fontSize: '13px', fontWeight: '700', cursor: 'pointer', width: '100%' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#eef3ff'; e.currentTarget.style.borderColor = '#1a73e8' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafd'; e.currentTarget.style.borderColor = '#dbe8ff' }}>
        <Plus size={16} /> Add Another Meal
      </button>
    </div>
  )
}

export function DayOverridePanel({
  baseMeals,
  dayOverrides,
  onChange,
}: {
  baseMeals: Meal[]
  dayOverrides: DayOverride[]
  onChange: (overrides: DayOverride[]) => void
}) {
  const [activeDay, setActiveDay] = useState<number | null>(null)

  const getOverride = (dayIndex: number) => dayOverrides.find((o) => o.dayIndex === dayIndex)

  const setOverride = (dayIndex: number, meals: Meal[]) => {
    const exists = dayOverrides.find((o) => o.dayIndex === dayIndex)
    if (exists) onChange(dayOverrides.map((o) => o.dayIndex === dayIndex ? { ...o, meals } : o))
    else onChange([...dayOverrides, { dayIndex, meals }])
  }

  const removeOverride = (dayIndex: number) => {
    onChange(dayOverrides.filter((o) => o.dayIndex !== dayIndex))
    if (activeDay === dayIndex) setActiveDay(null)
  }

  const copyBaseMeals = (dayIndex: number) => {
    const copied = baseMeals.map((m) => ({ ...m, id: Math.random().toString(36).slice(2), items: m.items.map((i) => ({ ...i })) }))
    setOverride(dayIndex, copied)
  }

  return (
    <div>
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#0d1b3e' }}>Day Overrides</div>
        <div style={{ fontSize: '12px', color: '#8a9bc4', fontWeight: '500', marginTop: '2px' }}>By default all days use the base meals. Override specific days here.</div>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const, marginBottom: '16px' }}>
        {DAYS.map((day, idx) => {
          const hasOverride = !!getOverride(idx)
          const isActive = activeDay === idx
          return (
            <button key={day}
              onClick={() => { if (isActive) { setActiveDay(null) } else { setActiveDay(idx); if (!hasOverride) copyBaseMeals(idx) } }}
              style={{ padding: '8px 16px', borderRadius: '40px', border: isActive ? '2px solid #1a73e8' : hasOverride ? '2px solid #f59e0b' : '1.5px solid #e8eef8', background: isActive ? '#eef3ff' : hasOverride ? '#fffbeb' : '#f8fafd', color: isActive ? '#1a73e8' : hasOverride ? '#b45309' : '#4a5568', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {day.slice(0, 3)}
              {hasOverride && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />}
            </button>
          )
        })}
      </div>
      {activeDay !== null && (
        <div style={{ borderRadius: '16px', border: '1.5px solid #e8eef8', background: '#fafcff', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#0d1b3e' }}>{DAYS[activeDay]} — Custom Meals</div>
              <div style={{ fontSize: '12px', color: '#8a9bc4', fontWeight: '500' }}>Editing override for {DAYS[activeDay]}</div>
            </div>
            <button onClick={() => removeOverride(activeDay)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '10px', background: '#fff5f5', border: '1px solid #fed7d7', color: '#c53030', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
              <X size={12} /> Reset to Base
            </button>
          </div>
          <MealBuilder meals={getOverride(activeDay)?.meals ?? baseMeals} onChange={(meals) => setOverride(activeDay, meals)} />
        </div>
      )}
    </div>
  )
}