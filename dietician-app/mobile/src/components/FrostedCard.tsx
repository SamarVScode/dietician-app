import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../theme/colors';

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
  overlayColor,
  borderColor,
  blurIntensity = 28,
}: FrostedCardProps) {
  return (
    <View style={[styles.clip, borderColor ? { borderColor } : null, style]}>
      <BlurView intensity={blurIntensity} tint="dark" style={StyleSheet.absoluteFill} />
      <View
        style={[
          styles.overlay,
          overlayColor ? { backgroundColor: overlayColor } : null,
        ]}
      />
      <View style={noPadding ? null : styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    // bioluminescent shadow
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 12,
    marginBottom: 12,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.cardBg,
  },
  inner: {
    padding: 18,
  },
});