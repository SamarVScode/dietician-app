// src/components/dietplan/mealUtils.ts
// All non-component exports live here — types, constants, styles, helpers.
// This keeps MealBuilder.tsx and TemplateForm.tsx components-only
// so Vite Fast Refresh works without warnings.

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FoodItem {
  name: string
}

export interface Meal {
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

export interface DayOverride {
  dayIndex: number
  meals: Meal[]
}

export interface TemplateFormData {
  name: string
  description: string
  targetGoal: string
  baseMeals: Meal[]
  dayOverrides: DayOverride[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
]

// ── Helpers ───────────────────────────────────────────────────────────────────

export const emptyMeal = (): Meal => ({
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

export const emptyTemplateForm = (): TemplateFormData => ({
  name: '',
  description: '',
  targetGoal: 'Weight Loss',
  baseMeals: [emptyMeal()],
  dayOverrides: [],
})

// ── Shared Styles ─────────────────────────────────────────────────────────────

export const mealInputStyle = {
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

export const mealLabelStyle = {
  fontSize: '11px',
  fontWeight: '700' as const,
  color: '#b0bdd8',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.8px',
  marginBottom: '6px',
  display: 'block' as const,
}