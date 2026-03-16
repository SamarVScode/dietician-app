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
  bodyFatPercent?: number | null;
  muscleMass?: number | null;
  boneMass?: number | null;
  bodyWaterPercent?: number | null;
  visceralFat?: number | null;
  bmr?: number | null;
  metabolicAge?: number | null;
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

export interface MealItem {
  name: string;
}

export interface Meal {
  id: string;
  name: string;
  time: string;
  items: MealItem[];
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

export interface DietPlan {
  id: string;
  templateId: string | null;
  templateName: string;
  days: DayPlan[];
  assignedAt: string;
  assignedBy: string;
  status: string;
}

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
};
