import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Shadows } from '../theme/theme';

type ShadowKey = 'sm' | 'md' | 'lg';

export function Card({
  children,
  shadow = 'sm',
  style,
  padding = 16,
}: {
  children: React.ReactNode;
  shadow?: ShadowKey;
  style?: ViewStyle;
  padding?: number;
}) {
  return (
    <View style={[styles.card, Shadows[shadow], { padding }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
  },
});
