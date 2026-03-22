import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { colors } from '../theme/colors';

export function AppBackground({ children }: { children: React.ReactNode }) {
  return (
    <LinearGradient
      colors={['#DAE9FF', '#F1F7FF', '#C6E2FF', '#F1F7FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.base}
    >
      {/* Organic pastel blobs — visible, soft, bioluminescent */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobTopLeft} />
      <View style={styles.blobCenter} />
      <View style={styles.blobBottomRight} />
      <View style={styles.blobMidRight} />
      <View style={styles.blobBottomCenter} />

      {/* Subtle atmospheric softening — Balanced at 55 for "Luminous Aura" haze */}
      <BlurView intensity={55} tint="light" style={StyleSheet.absoluteFill} />

      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1 },

  // Indigo blob — top right
  blobTopRight: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.blobPrimary,
  },
  // Light blue blob — top left
  blobTopLeft: {
    position: 'absolute',
    top: -30,
    left: -50,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.blobAccent,
  },
  // Teal blob — left center (matches screenshots mid-screen teal glow)
  blobCenter: {
    position: 'absolute',
    top: '28%',
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.blobTeal,
  },
  // Soft purple blob — bottom right
  blobBottomRight: {
    position: 'absolute',
    bottom: -50,
    right: -40,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.blobSecondary,
  },
  // Teal blob — mid right
  blobMidRight: {
    position: 'absolute',
    top: '50%',
    right: '8%',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.blobTeal,
  },
  // Indigo blob — bottom center
  blobBottomCenter: {
    position: 'absolute',
    bottom: '8%',
    left: '18%',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.blobPrimary,
  },
});
