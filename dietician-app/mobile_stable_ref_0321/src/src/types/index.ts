export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone?: string;
  weight: number;
  height: number;
  bmi: number;
  bmiCategory: string;
  bodyType: string;
  bodyFatPercent: number | null;
  muscleMass: number | null;
  boneMass: number | null;
  bodyWaterPercent: number | null;
  visceralFat: number | null;
  bmr: number | null;
  metabolicAge: number | null;
  goal: string;
  preference: string;
  allergies: string[];
  conditions: string[];
  medications: string;
  notes: string;
  userId: string;
  userEmail: string;
  status: 'active' | 'no-plan' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface FoodItem {
  name: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
}

export interface Meal {
  id: string;
  name: string;
  time: string;
  items: FoodItem[];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  notes: string;
}

export interface DayPlan {
  day: number;
  dayName: string;
  isOverride: boolean;
  meals: Meal[];
}

export interface WaterSlot {
  time: string;      // "HH:MM"
  amountMl: number;
}

export interface DietPlan {
  id: string;
  templateId: string | null;
  templateName: string;
  days: DayPlan[];
  wakeUpTime?: string;
  sleepTime?: string;
  waterIntakeMl?: number;
  waterSchedule?: WaterSlot[];
  tips?: string;
  assignedAt: string;
  assignedBy: string;
  status: string;
}

export interface MealLog {
  planId: string;
  date: string;          // "YYYY-MM-DD"
  dayIndex: number;
  mealId: string;
  mealName: string;
  scheduledTime: string; // "HH:MM"
  completed: boolean;
  completedAt: string | null;
}

export interface WaterLog {
  planId: string;
  date: string;          // "YYYY-MM-DD"
  scheduledTime: string; // "HH:MM"
  amountMl: number;
  completed: boolean;
  completedAt: string | null;
}
