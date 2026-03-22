import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';

interface FrostedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
  overlayColor?: string; // Legacy prop, ignored in solid design
  borderColor?: string;
  blurIntensity?: number; // Legacy prop, ignored
}

export function FrostedCard({
  children,
  style,
  noPadding,
  borderColor,
}: FrostedCardProps) {
  return (
    <View style={[styles.card, borderColor ? { borderColor } : null, style, noPadding ? styles.noPadding : null]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginBottom: spacing.medium,
    padding: spacing.cardPadding,
    
    // Exact user shadow specifications
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  noPadding: {
    padding: 0,
  },
});