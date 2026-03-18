import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors, Typography, Spacing } from '../theme/theme';

export function ScreenHeader({
  title,
  subtitle,
  right,
  style,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.header, style]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 14,
    backgroundColor: Colors.background,
  },
  title: {
    ...Typography.displaySm,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
