import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface HeaderProps {
  name: string;
  avatarInitial: string;
  onBellPress?: () => void;
}

export function Header({ name, avatarInitial, onBellPress }: HeaderProps) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <View style={styles.container}>
      {/* Left: avatar + greeting */}
      <View style={styles.left}>
        {/* Avatar with luminous gradient ring */}
        <View style={styles.avatarRing}>
          <View style={styles.avatarInner}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.avatarOverlay} />
            <Text style={styles.avatarText}>{avatarInitial}</Text>
          </View>
        </View>

        <View style={styles.greetingBlock}>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.name}>{name} 👋</Text>
        </View>
      </View>

      {/* Right: bell button */}
      <TouchableOpacity
        style={styles.bellClip}
        onPress={onBellPress}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.bellOverlay} />
        <MaterialCommunityIcons name="bell-outline" size={20} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: 14,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  // Gradient ring around avatar
  avatarRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 2.5,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.accentIndigo,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  greetingBlock: {
    flex: 1,
  },
  greeting: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.onSurfaceVariant,
    letterSpacing: 0.2,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.onSurface,
    letterSpacing: -0.4,
  },
  bellClip: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surfaceContainerHigh,
  },
});
