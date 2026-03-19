import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../theme/colors';
import { radius } from '../theme/spacing';

export function DayPill({
  day,
  active,
  onPress,
}: {
  day: string;
  active: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => { Animated.spring(scale, { toValue: 0.93, tension: 200, friction: 8, useNativeDriver: true }).start(); };
  const pressOut = () => { Animated.spring(scale, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }).start(); };

  return (
    <TouchableOpacity onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={1} style={styles.outer}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <View style={[styles.clip, active ? styles.clipActive : styles.clipInactive]}>
          <BlurView
            intensity={active ? 80 : 60}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.overlay, active ? styles.overlayActive : styles.overlayInactive]} />
          <View style={styles.inner}>
            <Text style={[styles.text, active ? styles.textActive : styles.textInactive]}>
              {day}
            </Text>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outer: { marginRight: 8 },
  clip: {
    borderRadius: radius.activePill,
    overflow: 'hidden',
    borderWidth: 1,
  },
  clipActive: {
    borderColor: colors.activePillBorder,
  },
  clipInactive: {
    borderColor: 'rgba(255,255,255,0.2)',
  },
  overlay: { ...StyleSheet.absoluteFillObject },
  overlayActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  overlayInactive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  inner: {
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  text: { fontSize: 14, fontWeight: '700' },
  textActive:   { color: colors.blackText },
  textInactive: { color: colors.white },
});
