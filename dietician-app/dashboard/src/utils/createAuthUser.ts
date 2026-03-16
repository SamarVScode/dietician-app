// utils/createAuthUser.ts
//
// WHY THIS EXISTS:
// Firebase's createUserWithEmailAndPassword() on the PRIMARY app auto-signs-in
// as the newly created user, which triggers onAuthStateChanged and overwrites
// the admin session in authStore. Using a temporary secondary app instance
// isolates the creation entirely — the admin stays logged in throughout.

import { initializeApp, deleteApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, setPersistence, inMemoryPersistence } from 'firebase/auth'
import { firebaseConfig } from '../services/firebase' // export your config object from firebase.ts

export async function createAuthUser(email: string, password: string): Promise<void> {
  // Spin up a temporary secondary Firebase app with a unique name
  const secondaryApp = initializeApp(firebaseConfig, `user-creation-${Date.now()}`)
  const secondaryAuth = getAuth(secondaryApp)

  // Use in-memory persistence so the secondary auth never writes to
  // localStorage/IndexedDB, preventing any cross-contamination with
  // the primary app's auth state.
  await setPersistence(secondaryAuth, inMemoryPersistence)

  try {
    await createUserWithEmailAndPassword(secondaryAuth, email, password)
  } finally {
    // Always clean up the secondary app — even if creation fails
    await deleteApp(secondaryApp)
  }
}   