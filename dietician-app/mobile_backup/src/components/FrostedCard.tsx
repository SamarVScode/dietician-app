import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';

interface FrostedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
  overlayColor?: string;
  borderColor?: string;
  blurIntensity?: number;
}

export function FrostedCard({
  children,
  style,
  noPadding,
  overlayColor = 'rgba(255,255,255,0.65)',
  borderColor,
  blurIntensity = 85,
}: FrostedCardProps) {
  return (
    <View style={[styles.wrap, borderColor ? { borderColor } : null, style]}>
      {/* Frosted glass blur layer */}
      <BlurView
        intensity={blurIntensity}
        tint="light"
        style={[StyleSheet.absoluteFill, { borderRadius: radius.card }]}
      />
      {/* Content */}
      <View style={[styles.inner, noPadding && styles.noPadding]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    marginBottom: spacing.medium,
    backgroundColor: 'transparent',
    // SHADOW REMOVED: avoiding "box" artifact on Android/iOS glass layers
  },
  inner: {
    padding: spacing.cardPadding,
  },
  noPadding: {
    padding: 0,
  },
});