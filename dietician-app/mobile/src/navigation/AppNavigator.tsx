import React, { useEffect, useRef, useCallback } from 'react';
import {
  View, ActivityIndicator,
  StyleSheet, Animated, Easing,
  LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from '../services/firebase';
import { fetchUserProfile } from '../services/authService';
import { fetchActiveDietPlan } from '../services/dietPlanService';
import {
  setupAndroidChannel,
  setupNotificationCategories,
  scheduleAllNotifications,
  cancelAllNotifications,
  handleNotificationResponse,
} from '../services/notificationService';
import { useAuthStore } from '../store/authStore';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import DietScreen from '../screens/DietScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { NavBar } from '../components/NavBar';
import { colors } from '../theme/colors';
import { AppBackground } from '../components/AppBackground';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export type RootStackParamList = { Login: undefined; Main: undefined };
export type MainTabParamList  = { Home: undefined; Diet: undefined; Profile: undefined };

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab   = createBottomTabNavigator<MainTabParamList>();

/* ─── Custom tab bar using NavBar component ─────────── */
function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const handlePress = (routeName: string) => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(180, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity),
    );
    navigation.navigate(routeName);
  };

  const activeRoute = state.routes[state.index].name;

  return (
    <NavBar
      activeTab={activeRoute}
      onTabPress={handlePress}
    />
  );
}

/* ─── Fade wrapper ─────────────────────────────────────── */
function FadeScreen({ children }: { children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
      return () => {
        opacity.setValue(0);
      };
    }, []),
  );

  return (
    <Animated.View style={[{ flex: 1 }, { opacity }]}>
      {children}
    </Animated.View>
  );
}

/* ─── Wrapped screens ────────────────────────────────── */
const HomeWrapped    = () => <FadeScreen><HomeScreen /></FadeScreen>;
const DietWrapped    = () => <FadeScreen><DietScreen /></FadeScreen>;
const ProfileWrapped = () => <FadeScreen><ProfileScreen /></FadeScreen>;

/* ─── Main tabs ──────────────────────────────────────── */
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"    component={HomeWrapped} />
      <Tab.Screen name="Diet"    component={DietWrapped} />
      <Tab.Screen name="Profile" component={ProfileWrapped} />
    </Tab.Navigator>
  );
}

/* ─── Root navigator ─────────────────────────────────── */
export function AppNavigator() {
  const { isLoading, isAuthenticated, setFirebaseUser, setUserProfile, setLoading } =
    useAuthStore();

  useEffect(() => {
    // One-time notification setup
    setupAndroidChannel();
    setupNotificationCategories();

    // Handle response when app was killed and user tapped action button
    Notifications.getLastNotificationResponseAsync().then(r => {
      if (r) handleNotificationResponse(r);
    });

    // Handle responses while app is in foreground or background
    const notifSub = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse,
    );

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user?.email) {
        try {
          const profile = await fetchUserProfile(user.email);
          setUserProfile(profile);
          if (profile?.id) {
            fetchActiveDietPlan(profile.id)
              .then(plan => {
                if (plan) scheduleAllNotifications(plan, profile.id).catch(console.error);
              })
              .catch(console.error);
          }
        } catch (e) {
          console.error('Failed to fetch user profile:', e);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
        cancelAllNotifications().catch(console.error);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      notifSub.remove();
    };
  }, []);

  if (isLoading) {
    return (
      <AppBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.white} />
        </View>
      </AppBackground>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
