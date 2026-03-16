import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { DietPlan } from '../types';

/**
 * Fetch the most recently assigned diet plan for a patient.
 * @param firestoreDocId  The `id` field on the UserProfile (Firestore document ID)
 */
export const fetchActiveDietPlan = async (firestoreDocId: string): Promise<DietPlan | null> => {
  const q = query(
    collection(db, 'users', firestoreDocId, 'dietPlans'),
    orderBy('assignedAt', 'desc'),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...(snap.docs[0].data() as Omit<DietPlan, 'id'>) };
};
