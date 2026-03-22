import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import type { MealLog, WaterLog } from '../types';

export async function logMealCompletion(
  userId: string,
  data: MealLog,
): Promise<void> {
  const logId = `${data.date}__${data.mealId}`;
  await setDoc(
    doc(db, 'users', userId, 'mealLogs', logId),
    data,
    { merge: true },
  );
}

export async function fetchTodayWaterLogs(userId: string): Promise<WaterLog[]> {
  const todayStr = new Date().toISOString().split('T')[0];
  const snap = await getDocs(
    query(collection(db, 'users', userId, 'waterLogs'), where('date', '==', todayStr)),
  );
  return snap.docs.map(d => d.data() as WaterLog);
}

export async function fetchTodayMealLogs(userId: string): Promise<MealLog[]> {
  const todayStr = new Date().toISOString().split('T')[0];
  const snap = await getDocs(
    query(collection(db, 'users', userId, 'mealLogs'), where('date', '==', todayStr)),
  );
  return snap.docs.map(d => d.data() as MealLog);
}

export async function logWaterCompletion(
  userId: string,
  data: WaterLog,
): Promise<void> {
  const timeSlug = data.scheduledTime.replace(':', '-');
  const logId = `${data.date}__${timeSlug}`;
  await setDoc(
    doc(db, 'users', userId, 'waterLogs', logId),
    data,
    { merge: true },
  );
}
