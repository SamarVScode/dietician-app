import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../theme/colors';
import { radius } from '../theme/spacing';

export function FoodRow({
  name,
  qty,
  kcal,
}: {
  name: string;
  qty?: string;
  kcal?: number;
}) {
  return (
    <View style={styles.outer}>
      <View style={styles.clip}>
        <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.overlay} />
        <View style={styles.row}>
          <View style={styles.dot} />
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          {!!qty && <Text style={styles.qty}>{qty}</Text>}
          {kcal != null && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{kcal} kcal</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: radius.foodRow,
    marginBottom: 6,
  },
  clip: {
    borderRadius: radius.foodRow,
    borderWidth: 1,
    borderColor: colors.foodRowBorder,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.foodRowBg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5588cc',
    marginRight: 10,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.blackText,
    flex: 1,
    letterSpacing: -0.2,
  },
  qty: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(0,0,0,0.45)',
    marginRight: 8,
  },
  badge: {
    backgroundColor: colors.kcalBadgeBg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: radius.kcalBadge,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.blackText,
  },
});
