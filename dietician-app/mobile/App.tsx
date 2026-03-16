import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/services/firebase';
import { useAuthStore } from './src/store/authStore';
import { fetchUserByEmail } from './src/services/userService';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const { setFirebaseUser, setUserProfile, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (user?.email) {
        try {
          const profile = await fetchUserByEmail(user.email);
          setUserProfile(profile);
        } catch {
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return <AppNavigator />;
}
