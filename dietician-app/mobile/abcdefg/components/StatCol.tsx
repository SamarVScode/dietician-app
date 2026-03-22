import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export function StatCol({
  accent,
  val,
  unit,
  label,
}: {
  accent: string;
  val: string;
  unit: string;
  label: string;
}) {
  return (
    <View style={styles.col}>
      <View style={[styles.bar, { backgroundColor: accent }]} />
      <Text style={styles.val}>{val}</Text>
      <Text style={styles.unit}>{unit}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  col: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  bar: {
    width: 20,
    height: 3,
    borderRadius: 2,
    marginBottom: 8,
  },
  val: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.white,
    textAlign: 'center',
  },
  unit: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
    marginTop: 2,
    textAlign: 'center',
  },
  label: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.mutedText,
    textTransform: 'uppercase',
    marginTop: 3,
    textAlign: 'center',
  },
});
