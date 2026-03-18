import React, { useEffect, useRef, useCallback } from 'react';
import {
  View, ActivityIndicator, TouchableOpacity,
  StyleSheet, Text, LayoutAnimation, Platform, UIManager,
  Animated, Easing,
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
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

/* ─── Fixed-width tab item ───────────────────────────── */
const ITEM_W = 82;

function TabItem({
  route, focused, onPress,
}: {
  route: { key: string; name: string };
  focused: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={tab.itemOuter}
    >
      {focused && <View style={tab.itemBg} />}

      <MaterialCommunityIcons
        name={TAB_ICON[route.name] as never}
        size={22}
        color={focused ? Colors.primary : Colors.textSecondary}
      />

      {focused && (
        <Text style={tab.label} numberOfLines={1}>
          {TAB_LABEL[route.name]}
        </Text>
      )}
    </TouchableOpacity>
  );
}

/* ─── Glass pill tab bar (CSS-only frosted glass) ────── */
function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const handlePress = (routeName: string) => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(180, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity),
    );
    navigation.navigate(routeName);
  };

  return (
    <View
      style={[tab.wrapper, { paddingBottom: Math.max(insets.bottom, 8) + 12 }]}
      pointerEvents="box-none"
    >
      {/* Shadow wrapper — separate from overflow:hidden clip */}
      <View style={tab.shadow}>
        {/* Clip wrapper for border-radius */}
        <View style={tab.pillClip}>
          <View style={tab.glass}>
            {state.routes.map((route, index) => (
              <TabItem
                key={route.key}
                route={route}
                focused={state.index === index}
                onPress={() => handlePress(route.name)}
              />
            ))}
          </View>
        </View>
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
  shadow: {
    borderRadius: 40,
    shadowColor: '#3730A3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 20,
  },
  pillClip: {
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.92)',
  },
  glass: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: 'rgba(237, 233, 254, 0.88)',
  },
  itemOuter: {
    width: ITEM_W,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  },
});

/* ─── Fade wrapper (timing + useNativeDriver:false — no _tracking risk) ─── */
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
      tabBar={props => <GlassTabBar {...props} />}
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
