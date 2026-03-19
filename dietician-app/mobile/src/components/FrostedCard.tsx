import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';

export function FrostedCard({
  children,
  style,
  noPadding,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
}) {
  return (
    <View style={[styles.outer, style]}>
      <View style={styles.clip}>
        <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.overlay} />
        {noPadding ? (
          <>{children}</>
        ) : (
          <View style={styles.content}>{children}</View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: radius.card,
    // Shadow outside the clip
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  clip: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.cardBg,
  },
  content: {
    paddingHorizontal: spacing.cardPadding,
    paddingVertical: 16,
  },
});
