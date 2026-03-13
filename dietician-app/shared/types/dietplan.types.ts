// Type: DietPlan
// Represents a diet plan assigned to a user
// Shared across Dashboard, Mobile, and Functions

export type PlanType = 'template' | 'ai' | 'custom';

export interface MealPlan {
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string;
}

export interface DietPlan {
    id: string;
    userId: string;
    planName: string;
    planType: PlanType;
    assignedAt: string; // ISO date
    meals: {
        day1: MealPlan;
        day2: MealPlan;
        day3: MealPlan;
        day4: MealPlan;
        day5: MealPlan;
        day6: MealPlan;
        day7: MealPlan;
    };
}
