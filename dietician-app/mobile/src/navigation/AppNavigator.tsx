import React, { useEffect } from 'react';
import {
  View, ActivityIndicator, TouchableOpacity,
  StyleSheet, Text, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from '../services/firebase';
import { fetchUserProfile } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import DietScreen from '../screens/DietScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { Colors } from '../theme/theme';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export type RootStackParamList = { Login: undefined; Main: undefined };
export type MainTabParamList  = { Home: undefined; Diet: undefined; Profile: undefined };

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab   = createBottomTabNavigator<MainTabParamList>();

/* ─── Tab meta ───────────────────────────────────────── */
const TAB_ICON: Record<string, string> = {
  Home:    'home-variant',
  Diet:    'food-apple-outline',
  Profile: 'account-circle-outline',
};
const TAB_LABEL: Record<string, string> = {
  Home:    'Home',
  Diet:    'Diet',
  Profile: 'Profile',
};

/* ─── Tab item (no Animated.Value — uses LayoutAnimation) */
function TabItem({
  route, focused, onPress,
}: {
  route: { key: string; name: string };
  focused: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={() => {
        LayoutAnimation.configureNext(
          LayoutAnimation.create(200, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity),
        );
        onPress();
      }}
      activeOpacity={0.8}
      style={tab.itemOuter}
    >
      {/* Background pill */}
      {focused && <View style={tab.itemBg} />}

      {/* Icon */}
      <MaterialCommunityIcons
        name={TAB_ICON[route.name] as never}
        size={22}
        color={focused ? Colors.primary : Colors.textSecondary}
      />

      {/* Label — visible only when focused */}
      {focused && (
        <Text style={tab.label} numberOfLines={1}>
          {TAB_LABEL[route.name]}
        </Text>
      )}
    </TouchableOpacity>
  );
}

/* ─── Glass pill tab bar ─────────────────────────────── */
function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[tab.wrapper, { paddingBottom: Math.max(insets.bottom, 8) + 12 }]}
      pointerEvents="box-none"
    >
      <View style={tab.pill}>
        {state.routes.map((route, index) => (
          <TabItem
            key={route.key}
            route={route}
            focused={state.index === index}
            onPress={() => navigation.navigate(route.name)}
          />
        ))}
      </View>
    </View>
  );
}

/* ─── Tab styles ─────────────────────────────────────── */
const tab = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.98)',
    shadowColor: '#0D47A1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 24,
  },
  itemOuter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 32,
    overflow: 'hidden',
    gap: 5,
  },
  itemBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.primaryLight,
    borderRadius: 32,
  },
  label: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
    paddingLeft: 2,
  },
});

/* ─── Main tabs ──────────────────────────────────────── */
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <GlassTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"    component={HomeScreen} />
      <Tab.Screen name="Diet"    component={DietScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

/* ─── Root navigator ─────────────────────────────────── */
export function AppNavigator() {
  const { isLoading, isAuthenticated, setFirebaseUser, setUserProfile, setLoading } =
    useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user?.email) {
        try {
          const profile = await fetchUserProfile(user.email);
          setUserProfile(profile);
        } catch (e) {
          console.error('Failed to fetch user profile:', e);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primaryDark }}>
        <ActivityIndicator size="large" color={Colors.white} />
      </View>
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
