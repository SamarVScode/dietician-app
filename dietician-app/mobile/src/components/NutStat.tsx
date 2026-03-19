import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../theme/colors';

/**
 * NutStat — rectangular frosted tile (used in DietScreen)
 */
export function NutStat({
  val,
  unit,
  label,
  accent,
}: {
  val: string;
  unit: string;
  label: string;
  accent: string;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.clip}>
        <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.overlay} />
        <View style={styles.inner}>
          <View style={[styles.bar, { backgroundColor: accent }]} />
          <Text style={styles.val}>{val}</Text>
          <Text style={styles.unit}>{unit}</Text>
          <Text style={styles.label}>{label}</Text>
        </View>
      </View>
    </View>
  );
}

/**
 * NutCircle — circular stat bubble (used in HomeScreen)
 * Shows: "333" then "Calories" underneath — no unit line.
 * For non-calorie stats: "8g" then "Protein".
 */
export function NutCircle({
  val,
  label,
  accent,
  bgTint,
}: {
  val: string;
  label: string;
  accent: string;
  bgTint: string;
}) {
  return (
    <View style={[circleStyles.shadow, { shadowColor: accent }]}>
      <View style={[circleStyles.outer, { backgroundColor: bgTint }]}>
        <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
        <View style={circleStyles.overlayTint} />
        <View style={circleStyles.inner}>
          <Text style={circleStyles.val}>{val}</Text>
          <Text style={circleStyles.label}>{label}</Text>
        </View>
      </View>
    </View>
  );
}

/* ─── Rectangular tile styles ─────────────────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  clip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.cardBg,
  },
  inner: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
  },
  bar: {
    width: 20, height: 3, borderRadius: 2, marginBottom: 8,
  },
  val: {
    fontSize: 17, fontWeight: '900', color: colors.white,
  },
  unit: {
    fontSize: 9, fontWeight: '700', color: colors.white, marginTop: 1,
  },
  label: {
    fontSize: 9, fontWeight: '700', color: colors.mutedText,
    textTransform: 'uppercase', marginTop: 3,
  },
});

/* ─── Circle styles ───────────────────────────────────── */
const CIRCLE_SIZE = 76;

const circleStyles = StyleSheet.create({
  shadow: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  outer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  val: {
    fontSize: 17, fontWeight: '900', color: colors.white,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 8, fontWeight: '700', color: colors.white,
    textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2,
  },
});
