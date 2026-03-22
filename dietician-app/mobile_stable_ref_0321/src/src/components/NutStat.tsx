import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

interface NutStatProps {
  val: string;
  unit: string;
  label: string;
  accent: string;
}

export function NutStat({ val, unit, label, accent }: NutStatProps) {
  return (
    <View style={styles.tile}>
      <View style={[styles.accentBar, { backgroundColor: accent }]} />
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
    backgroundColor: '#FFFFFF',
    borderRadius: radius.nutTile,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    padding: spacing.medium, // exactly 16px
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04, // slightly softer shadow for inner tiles
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  accentBar: {
    width: 20,
    height: 3,
    borderRadius: 2,
    marginBottom: 8,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  val: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  unit: {
    fontSize: 12,
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 4,
  },
});
