import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile } from '../types';

/**
 * Find the patient Firestore document that matches the Firebase Auth email.
 * The `users` collection stores the generated email in the `userEmail` field.
 */
export const fetchUserByEmail = async (email: string): Promise<UserProfile | null> => {
  const q = query(collection(db, 'users'), where('userEmail', '==', email));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...(doc.data() as Omit<UserProfile, 'id'>) };
};
