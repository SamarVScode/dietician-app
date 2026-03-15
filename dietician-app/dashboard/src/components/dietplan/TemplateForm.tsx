import { useState } from 'react'
import { Save } from 'lucide-react'
import { MealBuilder, DayOverridePanel } from './MealBuilder'
import { mealInputStyle, mealLabelStyle } from './mealUtils'
import type { TemplateFormData } from './mealUtils'

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
  const [activeSection, setActiveSection] = useState<'info' | 'meals' | 'overrides'>('info')

  const sections = [
    { key: 'info' as const,      label: 'Template Info', num: '1' },
    { key: 'meals' as const,     label: 'Base Meals',    num: '2' },
    { key: 'overrides' as const, label: 'Day Overrides', num: '3' },
  ]

  const chipStyle = (selected: boolean) => ({
    padding: '7px 14px', borderRadius: '40px',
    border: selected ? '2px solid #1a73e8' : '2px solid #e8eef8',
    background: selected ? '#eef3ff' : '#f8fafd',
    color: selected ? '#1a73e8' : '#4a5568',
    fontSize: '13px', fontWeight: '600' as const, cursor: 'pointer', transition: 'all 0.15s',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Section Tabs */}
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
            <button onClick={() => setActiveSection('meals')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '14px', background: 'linear-gradient(135deg, #1a73e8, #1557b0)', border: 'none', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(26,115,232,0.3)', marginTop: '4px' }}>
              Next: Set Base Meals →
            </button>
          </div>
        </div>
      )}

      {activeSection === 'meals' && (
        <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e8eef8', boxShadow: '0 2px 12px rgba(26,115,232,0.04)' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#0d1b3e', marginBottom: '4px' }}>Base Meals</div>
            <div style={{ fontSize: '13px', color: '#8a9bc4', fontWeight: '500' }}>These meals apply to all 7 days by default.</div>
          </div>
          <MealBuilder meals={form.baseMeals} onChange={(baseMeals) => setForm({ ...form, baseMeals })} />
          <button onClick={() => setActiveSection('overrides')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '14px', background: 'linear-gradient(135deg, #1a73e8, #1557b0)', border: 'none', color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(26,115,232,0.3)', marginTop: '16px', width: '100%' }}>
            Next: Set Day Overrides →
          </button>
        </div>
      )}

      {activeSection === 'overrides' && (
        <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e8eef8', boxShadow: '0 2px 12px rgba(26,115,232,0.04)' }}>
          <DayOverridePanel baseMeals={form.baseMeals} dayOverrides={form.dayOverrides} onChange={(dayOverrides) => setForm({ ...form, dayOverrides })} />
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '20px', padding: '18px 24px', border: '1px solid #e8eef8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 12px rgba(26,115,232,0.04)' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#0d1b3e' }}>{form.name || 'Untitled Template'}</div>
          <div style={{ fontSize: '12px', color: '#8a9bc4', fontWeight: '500' }}>
            {form.baseMeals.length} base meal{form.baseMeals.length !== 1 ? 's' : ''} · {form.dayOverrides.length} override{form.dayOverrides.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onCancel} style={{ padding: '11px 22px', borderRadius: '14px', background: '#f8fafd', border: '2px solid #e8eef8', color: '#4a5568', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => onSave(form)} disabled={isSaving || !form.name.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 24px', borderRadius: '14px', background: !form.name.trim() ? '#e8eef8' : 'linear-gradient(135deg, #1a73e8, #1557b0)', border: 'none', color: !form.name.trim() ? '#b0bdd8' : 'white', fontSize: '14px', fontWeight: '700', cursor: !form.name.trim() ? 'not-allowed' : 'pointer', boxShadow: !form.name.trim() ? 'none' : '0 4px 16px rgba(26,115,232,0.3)' }}>
            {isSaving ? <><div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} /> Saving...</> : <><Save size={15} /> {saveLabel}</>}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}