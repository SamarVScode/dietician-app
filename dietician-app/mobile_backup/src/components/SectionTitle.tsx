import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.title}>{title}</Text>;
}

const styles = StyleSheet.create({
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
});
