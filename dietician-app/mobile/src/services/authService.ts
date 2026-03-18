import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { UserProfile } from '../types';

async function resolveEmailByUserId(userId: string): Promise<string | null> {
  const q = query(collection(db, 'users'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data().userEmail as string;
}

export async function signIn(emailOrUserId: string, password: string): Promise<void> {
  let email = emailOrUserId;
  if (!emailOrUserId.includes('@')) {
    const resolved = await resolveEmailByUserId(emailOrUserId);
    if (!resolved) throw { code: 'auth/user-not-found' };
    email = resolved;
  }
  await signInWithEmailAndPassword(auth, email, password);
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function fetchUserProfile(
  email: string,
): Promise<UserProfile | null> {
  const q = query(
    collection(db, 'users'),
    where('userEmail', '==', email),
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as UserProfile;
}
