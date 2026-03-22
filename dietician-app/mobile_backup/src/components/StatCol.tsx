import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface StatColProps {
  accent: string;
  val: string | undefined;
  unit: string;
  label: string;
}

export function StatCol({ accent, val, unit, label }: StatColProps) {
  return (
    <View style={styles.col}>
      <View style={[styles.accentBar, { backgroundColor: accent }]} />
      <Text style={styles.val}>{val ?? '—'}</Text>
      <Text style={[styles.unit, { color: accent }]}>{unit}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  col: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    gap: 2,
  },
  accentBar: {
    width: 24,
    height: 3,
    borderRadius: 2,
    marginBottom: 6,
    opacity: 0.85,
  },
  val: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.onSurface,
    letterSpacing: -0.5,
  },
  unit: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.onSurfaceVariant,
    marginTop: 2,
    letterSpacing: 0.2,
  },
});
