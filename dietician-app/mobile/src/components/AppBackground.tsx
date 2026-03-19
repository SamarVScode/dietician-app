import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

export function AppBackground({ children }: { children: React.ReactNode }) {
  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientMid1, colors.gradientMid2, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.base}
    >
      <View style={styles.blobTeal} />
      <View style={styles.blobGreen} />
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1 },
  blobTeal: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.blobTeal,
  },
  blobGreen: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.blobGreen,
  },
});
