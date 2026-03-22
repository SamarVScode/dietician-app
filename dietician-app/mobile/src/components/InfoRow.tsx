import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
  showDivider?: boolean;
}

export function InfoRow({ icon, label, value, showDivider = true }: InfoRowProps) {
  return (
    <>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name={icon as never} size={16} color={colors.primary} />
        </View>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value} numberOfLines={1}>{value}</Text>
      </View>
      {showDivider && <View style={styles.divider} />}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(179,255,243,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.onSurfaceVariant,
    width: 100,
  },
  value: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: colors.rowDivider,
  },
});
