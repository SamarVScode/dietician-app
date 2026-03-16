import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from './firebase';

/**
 * Sign in a patient.
 * Accepts either a raw userId (e.g. "priya2026abc") or a full email.
 */
export const signIn = async (userIdOrEmail: string, password: string) => {
  const email = userIdOrEmail.includes('@')
    ? userIdOrEmail.trim()
    : `${userIdOrEmail.trim()}@dietapp.com`;

  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
};

export const signOut = () => firebaseSignOut(auth);
