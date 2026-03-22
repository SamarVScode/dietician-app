import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import type { DietPlan, DayPlan } from '../types';

export async function fetchActiveDietPlan(
  userId: string,
): Promise<DietPlan | null> {
  const plansRef = collection(db, 'users', userId, 'dietPlans');
  const q = query(plansRef, orderBy('assignedAt', 'desc'), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as DietPlan;
}

export function getTodaysDayPlan(plan: DietPlan): DayPlan {
  const assignedAt = new Date(plan.assignedAt).getTime();
  const now = Date.now();
  const daysElapsed = Math.floor((now - assignedAt) / (1000 * 60 * 60 * 24));
  const dayIndex = daysElapsed % plan.days.length;
  return plan.days[dayIndex] ?? plan.days[0];
}

export function getDayPlanForDate(plan: DietPlan, date: Date): DayPlan {
  const assignedAt = new Date(plan.assignedAt);
  assignedAt.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const daysElapsed = Math.floor(
    (target.getTime() - assignedAt.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysElapsed < 0) return plan.days[0];
  return plan.days[daysElapsed % plan.days.length] ?? plan.days[0];
}

export function getTodayDayIndex(plan: DietPlan): number {
  const assignedAt = new Date(plan.assignedAt).getTime();
  const now = Date.now();
  const daysElapsed = Math.floor((now - assignedAt) / (1000 * 60 * 60 * 24));
  return daysElapsed % plan.days.length;
}

export function getTotalMacros(dayPlan: DayPlan) {
  return dayPlan.meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + (meal.calories || 0),
      protein: acc.protein + (meal.protein || 0),
      carbs: acc.carbs + (meal.carbs || 0),
      fats: acc.fats + (meal.fats || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 },
  );
}

export function formatTime12h(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}
