import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

export function Header({
  name,
  avatarInitial,
}: {
  name: string;
  avatarInitial: string;
}) {
  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatar}>
        <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.avatarOverlay} />
        <Text style={styles.avatarText}>{avatarInitial}</Text>
        <View style={styles.onlineDot} />
      </View>

      {/* Greeting column */}
      <View style={styles.greetingCol}>
        <Text style={styles.eyebrow}>Welcome back</Text>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
      </View>

      {/* Bell button */}
      <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7}>
        <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.bellOverlay} />
        <MaterialCommunityIcons name="bell-outline" size={20} color={colors.bellIcon} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: 12,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.onlineDot,
    borderWidth: 2,
    borderColor: colors.white,
  },
  greetingCol: {
    flex: 1,
  },
  eyebrow: {
    ...typography.greetingEyebrow,
    color: colors.gold,
    marginBottom: 2,
  },
  name: {
    ...typography.userName,
    color: colors.nameText,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bellOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bellBg,
  },
});
