import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';

export function FrostedCard({
  children,
  style,
  noPadding,
  overlayColor,
  borderColor,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
  overlayColor?: string;
  borderColor?: string;
}) {
  return (
    <View
      style={[
        styles.card,
        borderColor && { borderColor },
        style,
      ]}
    >
      <BlurView
        intensity={30}
        tint="light"
        style={StyleSheet.absoluteFillObject}
      />

      <View
        style={[
          styles.overlay,
          overlayColor && { backgroundColor: overlayColor },
        ]}
      />

      {noPadding ? (
        children
      ) : (
        <View style={styles.content}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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