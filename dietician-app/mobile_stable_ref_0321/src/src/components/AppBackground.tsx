import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { colors } from '../theme/colors';

export function AppBackground({ children }: { children: React.ReactNode }) {
  return (
    <LinearGradient
      colors={[colors.background, colors.background, '#F1F5F9', colors.background]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.base}
    >
      {/* Six organic pastel blobs for airy luminous depth */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobTopLeft} />
      <View style={styles.blobCenter} />
      <View style={styles.blobBottomRight} />
      <View style={styles.blobMidRight} />
      <View style={styles.blobBottomCenter} />

      {/* Ultra-light atmospheric blur to soften blobs */}
      {/* High-intensity atmospheric blur (40-60 radius equivalent) */}
      <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />

      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1 },

  blobTopRight: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: colors.blobPrimary,
  },
  blobTopLeft: {
    position: 'absolute',
    top: -40,
    left: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.blobAccent,
  },
  blobCenter: {
    position: 'absolute',
    top: '28%',
    left: -90,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.blobTeal,
  },
  blobBottomRight: {
    position: 'absolute',
    bottom: -60,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.blobSecondary,
  },
  blobMidRight: {
    position: 'absolute',
    top: '52%',
    right: '10%',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.blobTeal,
  },
  blobBottomCenter: {
    position: 'absolute',
    bottom: '10%',
    left: '20%',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.blobPrimary,
  },
});
