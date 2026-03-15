import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export interface DietPlan {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  meals: Meal[];
  totalCalories: number;
  createdAt?: any;
  updatedAt?: any;
  status: 'active' | 'inactive' | 'completed';
}

export interface Meal {
  id: string;
  name: string;
  time: string;
  calories: number;
  items: FoodItem[];
}

export interface FoodItem {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Assign / Save a diet plan to a user
export const assignDietPlan = async (
  userId: string,
  plan: Omit<DietPlan, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const planRef = doc(collection(db, 'users', userId, 'dietPlans'));
  const planId = planRef.id;

  await setDoc(planRef, {
    ...plan,
    id: planId,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return planId;
};

// Get a single diet plan
export const getDietPlan = async (
  userId: string,
  planId: string
): Promise<DietPlan | null> => {
  const planRef = doc(db, 'users', userId, 'dietPlans', planId);
  const snap = await getDoc(planRef);
  return snap.exists() ? (snap.data() as DietPlan) : null;
};

// Get all diet plans for a user
export const getUserDietPlans = async (
  userId: string
): Promise<DietPlan[]> => {
  const plansRef = collection(db, 'users', userId, 'dietPlans');
  const snap = await getDocs(plansRef);
  return snap.docs.map((d) => d.data() as DietPlan);
};

// Get active diet plan for a user
export const getActiveDietPlan = async (
  userId: string
): Promise<DietPlan | null> => {
  const plans = await getUserDietPlans(userId);
  return plans.find((p) => p.status === 'active') || null;
};

// Update a diet plan
export const updateDietPlan = async (
  userId: string,
  planId: string,
  updates: Partial<DietPlan>
): Promise<void> => {
  const planRef = doc(db, 'users', userId, 'dietPlans', planId);
  await updateDoc(planRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

// Delete a diet plan
export const deleteDietPlan = async (
  userId: string,
  planId: string
): Promise<void> => {
  const planRef = doc(db, 'users', userId, 'dietPlans', planId);
  await deleteDoc(planRef);
};