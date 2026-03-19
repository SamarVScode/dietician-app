import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { radius } from '../theme/spacing';
import { typography } from '../theme/typography';

export function InfoRow({
  icon,
  label,
  value,
  showDivider = true,
}: {
  icon: string;
  label: string;
  value: string;
  showDivider?: boolean;
}) {
  return (
    <>
      <View style={styles.row}>
        <View style={styles.iconBox}>
          <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.iconBoxOverlay} />
          <MaterialCommunityIcons name={icon as never} size={16} color={colors.white} />
        </View>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      {showDivider && <View style={styles.divider} />}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 4,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.iconBox,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  iconBoxOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  label: {
    ...typography.infoLabel,
    color: colors.mutedText,
    flex: 1,
  },
  value: {
    ...typography.infoValue,
    color: colors.white,
    maxWidth: '50%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: colors.rowDivider,
  },
});
