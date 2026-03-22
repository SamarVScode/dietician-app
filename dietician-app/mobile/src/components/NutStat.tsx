import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

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
    backgroundColor: colors.nutTileBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.nutTileBorder,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 2,
    // bioluminescent shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  accentBar: {
    width: 22,
    height: 3,
    borderRadius: 2,
    marginBottom: 6,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  val: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.onSurface,
    letterSpacing: -0.5,
  },
  unit: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
});
