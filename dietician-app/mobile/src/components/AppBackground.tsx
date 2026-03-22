import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { colors } from '../theme/colors';

export function AppBackground({ children }: { children: React.ReactNode }) {
  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientMid1, colors.gradientMid2, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.base}
    >
      {/* Four organic blobs for deep bioluminescent depth */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobCenter} />
      <View style={styles.blobBottomLeft} />
      <View style={styles.blobMidRight} />

      {/* Subtle atmospheric blur over the blobs */}
      <BlurView intensity={3} tint="dark" style={StyleSheet.absoluteFill} />

      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1 },

  // Top-right indigo energy blob
  blobTopRight: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.blobPrimary,
  },
  // Center-left teal glow
  blobCenter: {
    position: 'absolute',
    top: '30%',
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.blobTeal,
  },
  // Bottom-right secondary blob
  blobBottomLeft: {
    position: 'absolute',
    bottom: -40,
    right: -40,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.blobSecondary,
  },
  // Mid-screen floating accent
  blobMidRight: {
    position: 'absolute',
    top: '55%',
    right: '15%',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.blobAccent,
  },
});
