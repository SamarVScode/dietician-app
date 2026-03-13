export interface Meal {
  breakfast: string
  lunch: string
  dinner: string
  snacks: string
}

export interface DietPlan {
  id: string
  userId: string
  planName: string
  planType: 'template' | 'ai' | 'custom'
  assignedAt: string
  meals: {
    day1: Meal
    day2: Meal
    day3: Meal
    day4: Meal
    day5: Meal
    day6: Meal
    day7: Meal
  }
}

export interface DietTemplate {
  id: string
  name: string
  description: string
  suitableFor: string[]
  meals: DietPlan['meals']
}