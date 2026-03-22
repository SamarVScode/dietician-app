import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { radius } from '../theme/spacing';

interface NutStatProps {
  val: string;
  unit: string;
  label: string;
  accent: string;
}

/**
 * NutStat — Clean Tile Variant
 * Used inside a FrostedCard container. Provides a subtle side/top accent
 * without its own shadow/heavy background to avoid layering artifacts.
 */
export function NutStat({ val, unit, label, accent }: NutStatProps) {
  return (
    <View style={styles.tile}>
      <View style={[styles.accentBar, { backgroundColor: accent, shadowColor: accent }]} />
      <View style={styles.valueRow}>
        <Text style={styles.val}>{val}</Text>
        <Text style={[styles.unit, { color: accent }]}>{unit}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.nutTile,
    // NO BACKGROUND - avoiding "box" artifact inside frosted cards
    // NO SHADOW OR BORDER HERE - provided by container
  },
  accentBar: {
    width: 30,
    height: 4,
    borderRadius: 999,
    marginBottom: 10,
    // Soft glow matching the accent color
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  val: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.onSurface,
    letterSpacing: -0.5,
  },
  unit: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 1,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 3,
  },
});
