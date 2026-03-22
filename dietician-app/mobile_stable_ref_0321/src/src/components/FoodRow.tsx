import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface FoodRowProps {
  name: string;
  kcal: number;
}

export function FoodRow({ name, kcal }: FoodRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.dot} />
      <Text style={styles.name} numberOfLines={1}>{name}</Text>
      <View style={styles.badge}>
        <Text style={styles.kcal}>{Math.round(kcal)} kcal</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.rowDivider,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primaryDim,
    flexShrink: 0,
  },
  name: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: colors.onSurface,
    letterSpacing: 0.1,
  },
  badge: {
    backgroundColor: colors.kcalBadgeBg,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  kcal: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mealKcal,
  },
});
