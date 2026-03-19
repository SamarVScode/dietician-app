import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { radius } from '../theme/spacing';

/* Entry animation hook — slide up + fade in */
function useEntryAnimation() {
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 80,
          friction: 14,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  return { translateY, opacity };
}

const TABS = [
  { key: 'Home', icon: 'home-variant', label: 'HOME' },
  { key: 'Diet', icon: 'grid', label: 'PLAN' },
  { key: 'Profile', icon: 'account', label: 'PROFILE' },
] as const;

const NAV_W = 300;
const NAV_PAD = 8;
const INNER_W = NAV_W - NAV_PAD * 2;   // 284
const TAB_ZONE = INNER_W / 3;           // ~94.67
const PILL_W = 94;
const PILL_OFFSET = (TAB_ZONE - PILL_W) / 2;

function getTabIndex(key: string) {
  return TABS.findIndex(t => t.key === key);
}

export function NavBar({
  activeTab,
  onTabPress,
}: {
  activeTab: string;
  onTabPress: (tab: string) => void;
}) {
  const activeIdx = getTabIndex(activeTab);
  const pillX = useRef(new Animated.Value(activeIdx * TAB_ZONE + PILL_OFFSET)).current;
  const { translateY: entryY, opacity: entryOpacity } = useEntryAnimation();

  /* Icon scale animation on tab change */
  const iconScales = useRef(TABS.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    const idx = getTabIndex(activeTab);
    Animated.spring(pillX, {
      toValue: idx * TAB_ZONE + PILL_OFFSET,
      tension: 180,
      friction: 12,
      useNativeDriver: true,
    }).start();

    // Bounce the active icon
    iconScales[idx].setValue(0.8);
    Animated.spring(iconScales[idx], {
      toValue: 1,
      tension: 200,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  return (
    <Animated.View
      style={[styles.wrapper, { transform: [{ translateY: entryY }], opacity: entryOpacity }]}
      pointerEvents="box-none"
    >
      <View style={styles.shadow}>
        <View style={styles.pillClip}>
          <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.overlay} />

          {/* Animated active pill indicator */}
          <Animated.View
            style={[
              styles.activePill,
              { transform: [{ translateX: pillX }] },
            ]}
          >
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
            <View style={styles.activePillOverlay} />
          </Animated.View>

          {/* Tab items */}
          <View style={styles.inner}>
            {TABS.map((tab, tabIdx) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => onTabPress(tab.key)}
                  activeOpacity={0.8}
                  style={styles.tabItem}
                >
                  <Animated.View style={{ transform: [{ scale: iconScales[tabIdx] }], flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialCommunityIcons
                      name={tab.icon as never}
                      size={isActive ? 20 : 22}
                      color={isActive ? colors.blackText : 'rgba(40,40,80,0.6)'}
                    />
                    {isActive && (
                      <Text style={styles.activeLabel}>{tab.label}</Text>
                    )}
                  </Animated.View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  shadow: {
    borderRadius: 33,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 20,
  },
  pillClip: {
    width: NAV_W,
    height: 66,
    borderRadius: 33,
    borderWidth: 1,
    borderColor: colors.navBorder,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.navBg,
  },

  /* Animated sliding pill */
  activePill: {
    position: 'absolute',
    top: NAV_PAD,
    left: NAV_PAD,
    width: PILL_W,
    height: 66 - NAV_PAD * 2,       // 50
    borderRadius: radius.activePill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.activePillBorder,
  },
  activePillOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.activePillBg,
  },

  /* Tab items */
  inner: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: NAV_PAD,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 6,
  },
  activeLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.blackText,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
