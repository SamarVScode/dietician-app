import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Radius } from '../theme/theme';

export function MacroPill({
  label,
  value,
  unit = 'g',
  color,
}: {
  label: string;
  value: number;
  unit?: string;
  color: string;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: color + '18', borderColor: color + '44' }]}>
      <Text style={[styles.text, { color }]}>
        {label} {Math.round(value)}{unit}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});
